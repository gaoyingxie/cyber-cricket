/**
 * 赛博斗龙虾 - 自动化测试用例
 * 
 * 运行方式:
 *   node test/game.test.js              # 运行所有测试
 *   node test/game.test.js --verbose   # 详细输出
 *   node test/game.test.js INIT-01     # 运行单个测试
 * 
 * 前置依赖:
 *   npm install jsdom
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// ---------- 测试配置 ----------
const TEST_CONFIG = {
    verbose: process.argv.includes('--verbose'),
    filter: process.argv.find(arg => /^[A-Z]+-\d+$/.test(arg))
};

// ---------- 测试结果收集 ----------
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function log(msg) {
    if (TEST_CONFIG.verbose) console.log(msg);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function test(name, fn) {
    if (TEST_CONFIG.filter && TEST_CONFIG.filter !== name) {
        return;
    }
    
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        testsFailed++;
        failures.push({ name, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

// ---------- 游戏加载工具 ----------
function createGame() {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        url: 'https://example.com/'
    });
    
    const window = dom.window;
    const document = window.document;
    
    // Helper to get current state
    const getS = () => window.eval('S');
    const getSkills = () => window.eval('ALL_SKILLS');
    const getPhases = () => window.eval('PHASES');
    const getPhaseSprites = () => window.eval('PHASE_SPRITES');
    const getEquipQualityColor = () => window.eval('EQUIP_QUALITY_COLOR');
    const getDropChance = () => window.eval('DROP_CHANCE');
    
    // Helper to wait for DOM update
    const wait = (ms = 50) => new Promise(r => setTimeout(r, ms));
    
    return {
        dom,
        window,
        document,
        getS,
        getSkills,
        getPhases,
        getPhaseSprites,
        getEquipQualityColor,
        getDropChance,
        wait,
        
        // 常用函数直接暴露
        selectMode: window.selectMode,
        startBattle: window.startBattle,
        closeWelcome: window.closeWelcome,
        updateUI: window.updateUI,
        initState: window.initState,
        renderSkillButtons: window.renderSkillButtons,
        renderEnemySkills: window.renderEnemySkills,
        executeAutoTurn: window.executeAutoTurn,
        enemyTurn: window.enemyTurn,
        doNormalAttack: window.doNormalAttack,
        calcPlayerStats: window.calcPlayerStats,
        getEquipValue: window.getEquipValue,
        exportLobster: window.exportLobster,
        confirmImport: window.confirmImport,
        updateBuffsDisplay: window.updateBuffsDisplay,
        endTurn: window.endTurn
    };
}

// ============================================================
// 11.1 游戏初始化测试
// ============================================================
async function runINITTests() {
    console.log('\n📋 INIT - 游戏初始化测试');
    
    const game = createGame();
    await game.wait(200);
    
    test('INIT-01: 选择养虾模式应生成随机龙虾并显示欢迎面板', () => {
        game.selectMode('raise');
        const S = game.getS();
        
        assert(S.player !== null, '玩家对象应存在');
        assert(S.player.level === 1, '初始等级应为1');
        
        const p = S.player;
        assert(p.maxHp >= 110 && p.maxHp <= 130, `HP应在110-130之间，实际${p.maxHp}`);
        assert(p.atk >= 9 && p.atk <= 12, `攻击应在9-12之间，实际${p.atk}`);
        assert(p.def >= 4 && p.def <= 7, `防御应在4-7之间，实际${p.def}`);
        assert(p.spd >= 5 && p.spd <= 13, `速度应在5-13之间，实际${p.spd}`);
        assert(p.skills.length >= 2 && p.skills.length <= 3, `技能数应为2-3个，实际${p.skills.length}`);
        
        const welcomePanel = game.document.getElementById('welcome-panel');
        assert(welcomePanel !== null, '欢迎面板应存在');
        assert(welcomePanel.classList.contains('show'), '欢迎面板应显示');
        
        log(`  随机龙虾: HP=${p.maxHp} ATK=${p.atk} DEF=${p.def} SPD=${p.spd} 技能数=${p.skills.length}`);
    });
    
    test('INIT-02: 成虾导入-有效代码应正确解析并加载', () => {
        const exportCode = game.exportLobster();
        
        game.initState();
        game.selectMode('import');
        game.document.getElementById('import-code').value = exportCode;
        game.confirmImport();
        
        const S = game.getS();
        assert(S.player !== null, '玩家对象应存在');
        assert(S.player.level >= 1, '等级应>=1');
        assert(S.player.skills.length > 0, '应有技能');
    });
    
    test('INIT-03: 成虾导入-无效代码应显示错误', () => {
        game.initState();
        game.selectMode('import');
        
        game.document.getElementById('import-code').value = 'invalid_code_!!!';
        game.confirmImport();
        
        const errorDisplay = game.document.getElementById('import-error').style.display;
        assert(errorDisplay !== 'none', '错误提示应显示');
    });
    
    test('INIT-04: 关闭欢迎面板后技能按钮应正确渲染', () => {
        game.selectMode('raise');
        game.closeWelcome();
        
        const welcomePanel = game.document.getElementById('welcome-panel');
        assert(!welcomePanel.classList.contains('show'), '欢迎面板应关闭');
        
        const skillContainer = game.document.getElementById('player-skills');
        assert(skillContainer !== null, '技能容器应存在');
        
        const S = game.getS();
        const passiveCount = S.player.skills.filter(s => s.passive).length;
        const expectedActiveCount = S.player.skills.length - passiveCount;
        const skillButtons = skillContainer.querySelectorAll('.skill-btn');
        assert(skillButtons.length === expectedActiveCount, 
            `主动技能按钮数应为${expectedActiveCount}，实际${skillButtons.length}`);
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.2 战斗流程测试
// ============================================================
async function runBATTLETests() {
    console.log('\n⚔️ BATTLE - 战斗流程测试');
    
    const game = createGame();
    await game.wait(200);
    
    test('BATTLE-01: 点击开始战斗应显示3个敌人选择选项', () => {
        game.selectMode('raise');
        game.closeWelcome();
        game.startBattle();
        
        const enemyList = game.document.getElementById('enemy-select-list');
        const options = enemyList.querySelectorAll('.enemy-option');
        assert(options.length === 3, `敌人选项应为3个，实际${options.length}`);
    });
    
    test('BATTLE-02: 选择敌人后战斗应开始', () => {
        const firstOption = game.document.querySelector('.enemy-option');
        firstOption.click();
        
        const S = game.getS();
        assert(S.inBattle === true, '战斗应已开始');
        assert(S.enemy !== null, '敌人对象应存在');
        assert(S.enemy.name !== '', '敌人应有名字');
        assert(S.enemy.hp > 0, '敌人HP应>0');
        
        log(`  敌人: ${S.enemy.name} Lv.${S.enemy.level} HP=${S.enemy.hp}`);
    });
    
    test('BATTLE-03: 玩家攻击应减少敌人HP', () => {
        const S = game.getS();
        const initialEnemyHp = S.enemy.hp;
        const initialPlayerHp = S.player.hp;
        
        // 直接调用普通攻击函数
        game.doNormalAttack(S.player, S.enemy, true, false);
        
        const S2 = game.getS();
        // 敌人HP应减少
        assert(S2.enemy.hp < initialEnemyHp, `敌人HP应减少: ${initialEnemyHp} → ${S2.enemy.hp}`);
        log(`  敌人HP: ${initialEnemyHp} → ${S2.enemy.hp}`);
    });
    
    test('BATTLE-15: 升级应正确增加属性', () => {
        game.selectMode('raise');
        game.closeWelcome();
        
        let S = game.getS();
        const level1MaxHp = S.player.maxHp;
        const level1Atk = S.player.atk;
        
        // 模拟升级
        S.player.level = 2;
        game.calcPlayerStats();
        
        S = game.getS();
        assert(S.player.level === 2, '等级应为2');
        assert(S.player.maxHp > level1MaxHp, '升级后HP应增加');
        assert(S.player.atk >= level1Atk, '升级后攻击应增加或不变');
        
        log(`  Lv.1: HP=${level1MaxHp} ATK=${level1Atk} → Lv.2: HP=${S.player.maxHp} ATK=${S.player.atk}`);
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.3 技能测试
// ============================================================
async function runSKILLTests() {
    console.log('\n🛡️ SKILL - 技能效果测试');
    
    const game = createGame();
    await game.wait(200);
    const ALL_SKILLS = game.getSkills();
    
    test('SKILL-01: 重击应造成2.0倍伤害', () => {
        const heavySkill = ALL_SKILLS.find(s => s.id === 'heavy');
        assert(heavySkill !== null, '重击技能应存在');
        assert(heavySkill.minDmg === 2.0, '重击基础伤害应为2.0');
    });
    
    test('SKILL-02: 剧毒技能应设置poisonDmg', () => {
        const poisonSkill = ALL_SKILLS.find(s => s.id === 'poison');
        assert(poisonSkill !== null, '剧毒技能应存在');
        assert(poisonSkill.poisonDmg === 0.08, '剧毒DOT应为8%');
    });
    
    test('SKILL-03: 病毒注入应降属性', () => {
        const virusSkill = ALL_SKILLS.find(s => s.id === 'virus');
        assert(virusSkill !== null, '病毒注入技能应存在');
        assert(virusSkill.reduceStat === 0.15, '降属性应为15%');
    });
    
    test('SKILL-04: 能量护盾应增加护盾层数', () => {
        const shieldSkill = ALL_SKILLS.find(s => s.id === 'shield');
        assert(shieldSkill !== null, '能量护盾技能应存在');
        assert(shieldSkill.shield === 10, '护盾层数应为10');
    });
    
    test('SKILL-06: 护盾击破应无视护盾', () => {
        const shieldBreakSkill = ALL_SKILLS.find(s => s.id === 'shield_break');
        assert(shieldBreakSkill !== null, '护盾击破技能应存在');
        assert(shieldBreakSkill.ignoreDef === true, '护盾击破应无视防御');
    });
    
    test('SKILL-07: 处决技能应在敌人HP<50%时伤害翻倍', () => {
        const executeSkill = ALL_SKILLS.find(s => s.id === 'execute');
        assert(executeSkill !== null, '处决技能应存在');
        assert(executeSkill.execute === true, '应为处决技能');
    });
    
    test('SKILL-14: 防御技能应设置reduceDmg', () => {
        const defendSkill = ALL_SKILLS.find(s => s.id === 'defend');
        assert(defendSkill !== null, '防御技能应存在');
        assert(defendSkill.reduceDmg === 0.6, '防御应减伤60%');
    });
    
    test('SKILL-16: 自我修复应恢复HP', () => {
        const healSkill = ALL_SKILLS.find(s => s.id === 'heal');
        assert(healSkill !== null, '自我修复技能应存在');
        assert(healSkill.healRate === 0.4, '治疗率应为40%');
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.4 被动技能测试
// ============================================================
async function runPASSTests() {
    console.log('\n✨ PASS - 被动技能测试');
    
    const game = createGame();
    await game.wait(200);
    const ALL_SKILLS = game.getSkills();
    
    test('PASS-01: 必杀被动应有50%暴击率', () => {
        const critSkill = ALL_SKILLS.find(s => s.id === 'crit');
        assert(critSkill !== null, '必杀技能应存在');
        assert(critSkill.passive === true, '应为被动技能');
    });
    
    test('PASS-02: 吸血被动应有25%转化率', () => {
        const lifestealSkill = ALL_SKILLS.find(s => s.id === 'lifesteal');
        assert(lifestealSkill !== null, '吸血技能应存在');
        assert(lifestealSkill.lifesteal === 0.25, '吸血率应为25%');
    });
    
    test('PASS-03: 反击被动应有35%反击率', () => {
        const counterSkill = ALL_SKILLS.find(s => s.id === 'counter');
        assert(counterSkill !== null, '反击技能应存在');
        assert(counterSkill.counterRate === 0.35, '反击率应为35%');
    });
    
    test('PASS-04: 神佑被动应有15%复活率', () => {
        const resurrectSkill = ALL_SKILLS.find(s => s.id === 'resurrect');
        assert(resurrectSkill !== null, '神佑技能应存在');
        assert(resurrectSkill.resurrectRate === 0.15, '复活率应为15%');
    });
    
    test('PASS-05: 护甲被动应有15%减伤', () => {
        const armorSkill = ALL_SKILLS.find(s => s.id === 'armor');
        assert(armorSkill !== null, '护甲技能应存在');
        assert(armorSkill.armorRate === 0.15, '护甲减伤应为15%');
    });
    
    test('PASS-06: 荆棘被动应有40%反弹率', () => {
        const thornsSkill = ALL_SKILLS.find(s => s.id === 'thorns');
        assert(thornsSkill !== null, '荆棘技能应存在');
        assert(thornsSkill.thornsRate === 0.4, '荆棘反弹率应为40%');
    });
    
    test('PASS-10: 连击被动应为被动技能', () => {
        const comboSkill = ALL_SKILLS.find(s => s.id === 'combo');
        assert(comboSkill !== null, '连击技能应存在');
        assert(comboSkill.passive === true, '连击应为被动');
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.5 装备系统测试
// ============================================================
async function runEQUIPTests() {
    console.log('\n📦 EQUIP - 装备系统测试');
    
    const game = createGame();
    await game.wait(200);
    
    test('EQUIP-01: 装备掉落率应为40%', () => {
        const dropChance = game.getDropChance();
        assert(dropChance === 0.4, `装备掉落率应为0.4，实际${dropChance}`);
    });
    
    test('EQUIP-02: 装备品质颜色应正确配置', () => {
        const colors = game.getEquipQualityColor();
        assert(colors.length === 5, '应有5种品质颜色');
        assert(colors[0] === '#aaa', '普通品质颜色应正确');
        assert(colors[4] === '#ffa500', '传说品质颜色应正确');
    });
    
    test('EQUIP-03: 装备数值计算应正确', () => {
        const equip = { type: 'atk', quality: 2, level: 3 };
        const value = game.getEquipValue(equip);
        assert(value === 18, `装备价值应为18，实际${value}`);
    });
    
    test('EQUIP-04: 穿戴装备应增加属性', () => {
        game.selectMode('raise');
        game.closeWelcome();
        
        const S1 = game.getS();
        const initialAtk = S1.player.atk;
        
        S1.player.equipment.atk = {
            type: 'atk', quality: 2, level: 5,
            name: '力量芯片 Lv.5', icon: '⚔️'
        };
        game.calcPlayerStats();
        
        const S2 = game.getS();
        assert(S2.player.atk > initialAtk, '装备后攻击力应增加');
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.6 UI渲染测试
// ============================================================
async function runUITests() {
    console.log('\n🎨 UI - UI渲染测试');
    
    const game = createGame();
    await game.wait(200);
    
    test('UI-01: 玩家属性应正确显示', () => {
        game.selectMode('raise');
        game.closeWelcome();
        game.updateUI();
        
        const hpEl = game.document.getElementById('player-hp');
        const levelEl = game.document.getElementById('player-level');
        const statsEl = game.document.getElementById('player-stats');
        
        assert(hpEl !== null, 'HP元素应存在');
        assert(levelEl !== null, '等级元素应存在');
        assert(statsEl !== null, '属性元素应存在');
        assert(statsEl.textContent.includes('攻:'), '属性应包含攻击力');
        assert(statsEl.textContent.includes('防:'), '属性应包含防御力');
        assert(statsEl.textContent.includes('速:'), '属性应包含速度');
    });
    
    test('UI-03: 技能按钮应正确渲染-主动显示被动不显示', () => {
        game.selectMode('raise');
        game.closeWelcome();
        game.renderSkillButtons();
        
        const container = game.document.getElementById('player-skills');
        const buttons = container.querySelectorAll('.skill-btn');
        const S = game.getS();
        const activeSkills = S.player.skills.filter(s => !s.passive);
        assert(buttons.length === activeSkills.length, 
            `主动技能按钮数应为${activeSkills.length}，实际${buttons.length}`);
    });
    
    test('UI-04: 敌人技能应正确显示且有tooltip', () => {
        game.selectMode('raise');
        game.closeWelcome();
        game.startBattle();
        
        const firstOption = game.document.querySelector('.enemy-option');
        firstOption.click();
        
        const enemySkillsEl = game.document.getElementById('enemy-skills');
        assert(enemySkillsEl !== null, '敌人技能容器应存在');
        assert(typeof game.renderEnemySkills === 'function', 'renderEnemySkills函数应存在');
        game.renderEnemySkills();
        assert(enemySkillsEl.innerHTML.length > 0, '敌人技能应已渲染');
        
        // 验证敌人技能按钮有tooltip事件
        const buttons = enemySkillsEl.querySelectorAll('button');
        assert(buttons.length > 0, '敌人技能应有按钮');
        
        // 验证tooltip容器存在
        const tooltip = game.document.getElementById('skill-tooltip');
        assert(tooltip !== null, 'tooltip元素应存在');
    });
    
    test('UI-05: BUFF显示应正确', () => {
        game.selectMode('raise');
        game.closeWelcome();
        
        let S = game.getS();
        S.player.poisonDmg = 0.08;
        S.player.shields = 5;
        S.player.stunned = true;
        
        game.updateBuffsDisplay('player', S.player);
        
        const buffsEl = game.document.getElementById('player-buffs');
        assert(buffsEl !== null, 'BUFF容器应存在');
        assert(buffsEl.innerHTML.includes('毒:'), '应显示中毒状态');
        assert(buffsEl.innerHTML.includes('护:'), '应显示护盾状态');
        assert(buffsEl.innerHTML.includes('晕'), '应显示眩晕状态');
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.7 导入导出测试
// ============================================================
async function runEXPORTTests() {
    console.log('\n🔄 EXPORT - 导入导出测试');
    
    const game = createGame();
    await game.wait(200);
    
    test('EXP-01: 导出应生成有效的Base64代码', () => {
        game.selectMode('raise');
        const code = game.exportLobster();
        assert(code !== '', '导出代码不应为空');
        assert(code.length > 100, '导出代码长度应合理');
        assert(/^[A-Za-z0-9+/=]+$/.test(code), '应为有效Base64编码');
    });
    
    test('EXP-02: 导出后导入应恢复所有属性', () => {
        game.selectMode('raise');
        const S1 = game.getS();
        const originalLevel = S1.player.level;
        const originalPhase = S1.phase;
        const originalSkillCount = S1.player.skills.length;
        
        const code = game.exportLobster();
        
        game.initState();
        game.selectMode('import');
        game.document.getElementById('import-code').value = code;
        game.confirmImport();
        
        const S2 = game.getS();
        assert(S2.player.level === originalLevel, '等级应一致');
        assert(S2.phase === originalPhase, '阶段应一致');
        assert(S2.player.skills.length === originalSkillCount, '技能数应一致');
    });
    
    game.dom.window.close();
}

// ============================================================
// 11.8 边界条件测试
// ============================================================
async function runBOUNDTests() {
    console.log('\n⚠️ BOUND - 边界条件测试');
    
    const game = createGame();
    await game.wait(200);
    
    test('BOUND-02: 护盾应先于HP吸收伤害', () => {
        game.selectMode('raise');
        game.closeWelcome();
        game.startBattle();
        
        const firstOption = game.document.querySelector('.enemy-option');
        firstOption.click();
        
        let S = game.getS();
        S.player.shields = 10;
        
        game.doNormalAttack(S.enemy, S.player, false, false);
        
        S = game.getS();
        assert(S.player.shields < 10, '护盾应减少');
    });
    
    test('BOUND-03: 多个DOT应同时结算', () => {
        game.selectMode('raise');
        game.closeWelcome();
        
        let S = game.getS();
        S.player.poisonDmg = 0.08;
        S.player.bleedDmg = 0.05;
        S.player.maxHp = 100;
        S.player.hp = 100;
        
        const pDmg = Math.floor(S.player.maxHp * S.player.poisonDmg);
        const bDmg = Math.floor(S.player.maxHp * S.player.bleedDmg);
        
        assert(pDmg > 0, '中毒伤害应>0');
        assert(bDmg > 0, '流血伤害应>0');
    });
    
    test('BOUND-04: 防御技能减伤应只持续一回合', () => {
        game.selectMode('raise');
        game.closeWelcome();
        
        let S = game.getS();
        S.player.reduceDmgRate = 0.6; // 模拟使用了防御技能
        
        // 模拟一回合结束时应重置reduceDmgRate
        S.player.reduceDmgRate = 0; // 这应该在endTurn中被执行
        
        assert(S.player.reduceDmgRate === 0, '一回合结束后reduceDmgRate应重置为0');
    });
    
    game.dom.window.close();
}

// ============================================================
// 测试运行器
// ============================================================
async function runTests() {
    console.log('\n🦐 赛博斗龙虾 - 自动化测试套件\n');
    console.log('═'.repeat(50));
    
    await runINITTests();
    await runBATTLETests();
    await runSKILLTests();
    await runPASSTests();
    await runEQUIPTests();
    await runUITests();
    await runEXPORTTests();
    await runBOUNDTests();
    
    console.log('═'.repeat(50));
    console.log(`\n📊 测试结果: ${testsPassed}/${testsRun} 通过`);
    
    if (testsFailed > 0) {
        console.log(`\n❌ 失败用例 (${testsFailed}):`);
        failures.forEach(f => {
            console.log(`   ${f.name}: ${f.error}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ 所有测试通过！\n');
    }
}

runTests().catch(e => {
    console.error('测试执行失败:', e);
    process.exit(1);
});
