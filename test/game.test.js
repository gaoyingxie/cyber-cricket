/**
 * 赛博斗龙虾 - 核心逻辑单元测试
 * 使用 JSDOM 测试游戏常量和状态逻辑
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
let testsRun = 0, testsPassed = 0, testsFailed = 0;
const failures = [];

function log(msg) { if (TEST_CONFIG.verbose) console.log(msg); }

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
}

function test(name, fn) {
    if (TEST_CONFIG.filter && TEST_CONFIG.filter !== name) return;
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

// ---------- 游戏加载 ----------
function loadGame() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.com/' });
    const win = dom.window;
    
    const get = (expr) => win.eval(expr);
    const call = (fn, ...args) => { try { return win[fn](...args); } catch(e) { return undefined; } };
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    
    return { dom, win, get, call, wait };
}

// ============================================================
// 常量验证测试
// ============================================================
async function testConstants() {
    console.log('\n📋 CONST - 常量验证');
    const g = loadGame();
    await g.wait(200);
    
    test('CONST-01: 版本号应为v2.19', () => {
        const v = g.get('VERSION');
        assert(v === 'v2.19', `VERSION应为v2.19: ${v}`);
    });
    
    test('CONST-02: 主动技能数量应为17个', () => {
        const active = g.get('ALL_SKILLS').filter(s => !s.passive);
        assert(active.length === 17, `主动技能应为17个: ${active.length}`);
    });
    
    test('CONST-03: 被动技能数量应为10个', () => {
        const passive = g.get('ALL_SKILLS').filter(s => s.passive);
        assert(passive.length === 10, `被动技能应为10个: ${passive.length}`);
    });
    
    test('CONST-04: 进化阶段应有5个', () => {
        const phases = g.get('PHASES');
        assert(phases.length === 5, `进化阶段应为5个: ${phases.length}`);
    });
    
    test('CONST-05: 敌人类型应有15种', () => {
        const names = g.get('ENEMY_NAMES');
        assert(names.length === 15, `敌人类型应为15种: ${names.length}`);
    });
    
    test('CONST-06: 装备掉落率应为40%', () => {
        assert(g.get('DROP_CHANCE') === 0.4, `DROP_CHANCE应为0.4`);
    });
    
    test('CONST-07: 装备品质应有5种', () => {
        const colors = g.get('EQUIP_QUALITY_COLOR');
        assert(colors.length === 5, `品质颜色应为5种: ${colors.length}`);
    });
    
    test('CONST-08: 速度切换应有3档', () => {
        const speeds = g.get('BATTLE_SPEEDS');
        assert(speeds.length === 3, `速度档位应为3: ${speeds.length}`);
    });
    
    g.dom.window.close();
}

// ============================================================
// 技能测试
// ============================================================
async function testSkills() {
    console.log('\n🛡️ SKILL - 技能验证');
    const g = loadGame();
    await g.wait(200);
    const skills = g.get('ALL_SKILLS');
    
    // 重击 - 2.0倍伤害
    test('SKILL-01: 重击伤害倍率2.0', () => {
        const s = skills.find(x => x.id === 'heavy');
        assert(s && s.minDmg === 2.0, '重击应为2.0倍');
    });
    
    // 剧毒 - 8% DOT
    test('SKILL-02: 剧毒DOT 8%/回合', () => {
        const s = skills.find(x => x.id === 'poison');
        assert(s && s.poisonDmg === 0.08, '剧毒应为8%');
    });
    
    // 病毒注入 - 降15%属性
    test('SKILL-03: 病毒降属性15%', () => {
        const s = skills.find(x => x.id === 'virus');
        assert(s && s.reduceStat === 0.15, '降属性应为15%');
    });
    
    // 能量护盾 - 10层
    test('SKILL-04: 能量护盾10层', () => {
        const s = skills.find(x => x.id === 'shield');
        assert(s && s.shield === 10, '护盾应为10层');
    });
    
    // 护盾击破 - 无视防御
    test('SKILL-05: 护盾击破无视防御', () => {
        const s = skills.find(x => x.id === 'shield_break');
        assert(s && s.ignoreDef === true, '应无视防御');
    });
    
    // 处决 - HP<50%时2倍
    test('SKILL-06: 处决技能HP<50%时2倍', () => {
        const s = skills.find(x => x.id === 'execute');
        assert(s && s.execute === true, '应为处决技能');
    });
    
    // 防御 - 减伤60%
    test('SKILL-07: 防御减伤60%', () => {
        const s = skills.find(x => x.id === 'defend');
        assert(s && s.reduceDmg === 0.6, '防御应减伤60%');
    });
    
    // 自我修复 - 治疗40%
    test('SKILL-08: 自我修复治疗40%', () => {
        const s = skills.find(x => x.id === 'heal');
        assert(s && s.healRate === 0.4, '治疗率应为40%');
    });
    
    // 电磁脉冲 - 40%眩晕
    test('SKILL-09: 电磁脉冲40%眩晕', () => {
        const s = skills.find(x => x.id === 'emp');
        assert(s && s.stunRate === 0.4, '眩晕率应为40%');
    });
    
    // 混乱 - 35%眩晕
    test('SKILL-10: 混乱35%眩晕', () => {
        const s = skills.find(x => x.id === 'confuse');
        assert(s && s.stunRate === 0.35, '眩晕率应为35%');
    });
    
    g.dom.window.close();
}

// ============================================================
// 被动技能测试
// ============================================================
async function testPassives() {
    console.log('\n✨ PASS - 被动技能');
    const g = loadGame();
    await g.wait(200);
    const skills = g.get('ALL_SKILLS');
    
    test('PASS-01: 必杀50%暴击率', () => {
        const s = skills.find(x => x.id === 'crit');
        assert(s && s.passive === true && s.critRate === 0.5, '必杀应为50%暴击');
    });
    
    test('PASS-02: 吸血25%转化', () => {
        const s = skills.find(x => x.id === 'lifesteal');
        assert(s && s.passive === true && s.lifesteal === 0.25, '吸血应为25%');
    });
    
    test('PASS-03: 反击35%概率', () => {
        const s = skills.find(x => x.id === 'counter');
        assert(s && s.passive === true && s.counterRate === 0.35, '反击应为35%');
    });
    
    test('PASS-04: 神佑15%复活', () => {
        const s = skills.find(x => x.id === 'resurrect');
        assert(s && s.passive === true && s.resurrectRate === 0.15, '神佑应为15%');
    });
    
    test('PASS-05: 护甲15%减伤', () => {
        const s = skills.find(x => x.id === 'armor');
        assert(s && s.passive === true && s.armorRate === 0.15, '护甲应为15%');
    });
    
    test('PASS-06: 荆棘40%反弹', () => {
        const s = skills.find(x => x.id === 'thorns');
        assert(s && s.passive === true && s.thornsRate === 0.4, '荆棘应为40%');
    });
    
    test('PASS-07: 狂暴HP<50%时伤害x1.5', () => {
        const s = skills.find(x => x.id === 'rage');
        assert(s && s.passive === true && s.rageMult === 1.5, '狂暴应为1.5倍');
    });
    
    test('PASS-08: 连击50%概率', () => {
        const s = skills.find(x => x.id === 'combo');
        assert(s && s.passive === true && s.comboRate === 0.5, '连击应为50%');
    });
    
    g.dom.window.close();
}

// ============================================================
// 初始化测试
// ============================================================
async function testInit() {
    console.log('\n🎮 INIT - 初始化');
    const g = loadGame();
    await g.wait(200);
    
    test('INIT-01: 选择养虾模式生成Lv.1龙虾', () => {
        g.call('selectMode', 'raise');
        const p = g.get('S.player');
        assert(p !== null && p.level === 1, `应为Lv.1: ${p?.level}`);
    });
    
    test('INIT-02: 欢迎面板应显示', () => {
        const shown = g.get("document.getElementById('welcome-panel').classList.contains('show')");
        assert(shown, '欢迎面板应显示');
    });
    
    test('INIT-03: 欢迎面板显示龙虾信息', () => {
        const name = g.get("document.getElementById('welcome-name').textContent");
        const stats = g.get("document.getElementById('welcome-stats').textContent");
        const skills = g.get("document.getElementById('welcome-skills').textContent");
        assert(name.includes('龙虾'), `应有龙虾名称: ${name}`);
        assert(stats.includes('攻:'), `应有属性: ${stats}`);
        assert(skills.includes('技能:'), `应有技能: ${skills}`);
    });
    
    test('INIT-04: 关闭欢迎面板进入主界面', () => {
        g.call('closeWelcome');
        const hidden = g.get("!document.getElementById('welcome-panel').classList.contains('show')");
        assert(hidden, '欢迎面板应关闭');
    });
    
    test('INIT-05: 玩家属性在有效范围', () => {
        const p = g.get('S.player');
        assert(p.maxHp >= 110 && p.maxHp <= 130, `HP应在110-130: ${p.maxHp}`);
        assert(p.atk >= 9 && p.atk <= 12, `ATK应在9-12: ${p.atk}`);
        assert(p.def >= 4 && p.def <= 7, `DEF应在4-7: ${p.def}`);
        assert(p.spd >= 5 && p.spd <= 13, `SPD应在5-13: ${p.spd}`);
    });
    
    test('INIT-06: 技能数量2-3个', () => {
        const p = g.get('S.player');
        assert(p.skills.length >= 2 && p.skills.length <= 3, `技能应为2-3个: ${p.skills.length}`);
    });
    
    g.dom.window.close();
}

// ============================================================
// 装备系统测试
// ============================================================
async function testEquip() {
    console.log('\n📦 EQUIP - 装备系统');
    const g = loadGame();
    await g.wait(200);
    
    test('EQUIP-01: 装备数值计算正确', () => {
        // 装备价值 = 基础值 × 品质系数 × 等级
        // ATK基础3, 精良(1.5), Lv3 = 3*2*3 = 18
        const value = g.call('getEquipValue', { type: 'atk', quality: 2, level: 3 });
        assert(value === 18, `装备价值应为18: ${value}`);
    });
    
    test('EQUIP-02: 装备品质颜色配置正确', () => {
        const colors = g.get('EQUIP_QUALITY_COLOR');
        assert(colors[0] === '#aaa', '普通#aaa');
        assert(colors[4] === '#ffa500', '传说#ffa500');
    });
    
    test('EQUIP-03: 装备掉落率40%', () => {
        assert(g.get('DROP_CHANCE') === 0.4, '掉落率应为0.4');
    });
    
    g.dom.window.close();
}

// ============================================================
// UI渲染测试
// ============================================================
async function testUI() {
    console.log('\n🎨 UI - UI渲染');
    const g = loadGame();
    await g.wait(200);
    
    test('UI-01: 版本号正确显示', () => {
        const v = g.get("document.querySelector('.version').textContent");
        assert(v.includes('v2.'), `版本号应显示: ${v}`);
    });
    
    test('UI-02: 玩家HP条存在', () => {
        const exists = g.get("document.getElementById('player-hp-bar') !== null");
        assert(exists, 'HP条应存在');
    });
    
    test('UI-03: 玩家技能容器存在', () => {
        const exists = g.get("document.getElementById('player-skills') !== null");
        assert(exists, '技能容器应存在');
    });
    
    test('UI-04: 敌人技能容器存在', () => {
        const exists = g.get("document.getElementById('enemy-skills') !== null");
        assert(exists, '敌人技能容器应存在');
    });
    
    test('UI-05: tooltip容器存在', () => {
        const exists = g.get("document.getElementById('skill-tooltip') !== null");
        assert(exists, 'tooltip应存在');
    });
    
    test('UI-06: 速度切换按钮存在', () => {
        const exists = g.get("document.getElementById('btn-speed') !== null");
        assert(exists, '速度按钮应存在');
    });
    
    test('UI-07: renderSkillButtons函数存在', () => {
        const exists = typeof g.get('renderSkillButtons') === 'function';
        assert(exists, 'renderSkillButtons应为函数');
    });
    
    test('UI-08: renderEnemySkills函数存在', () => {
        const exists = typeof g.get('renderEnemySkills') === 'function';
        assert(exists, 'renderEnemySkills应为函数');
    });
    
    // BUGFIX-2026-03-21: 阶别(phase)UI不更新问题
    // 修复前: updatePlayerUI没有更新#phase元素
    // 修复后: updatePlayerUI调用时会同步更新阶别显示
    test('UI-09: updatePlayerUI会更新阶别(phase)元素', () => {
        // 验证PHASES常量存在
        const phases = g.get('PHASES');
        assert(phases && phases.length === 5, 'PHASES常量应存在且有5个阶段');
        
        // 先初始化游戏状态（initState会创建player）
        g.call('initState');
        
        // 模拟玩家进化到phase=1 (幼虾)
        g.get('S').player.phase = 1;
        g.call('updatePlayerUI');
        
        const phaseText = g.get("document.getElementById('phase').textContent");
        assert(phaseText === '幼虾', `phase=1时应显示"幼虾": ${phaseText}`);
        
        // 模拟玩家进化到phase=2 (战斗虾)
        g.get('S').player.phase = 2;
        g.call('updatePlayerUI');
        
        const phaseText2 = g.get("document.getElementById('phase').textContent");
        assert(phaseText2 === '战斗虾', `phase=2时应显示"战斗虾": ${phaseText2}`);
    });
    
    g.dom.window.close();
}

// ============================================================
// 导入导出测试
// ============================================================
async function testExport() {
    console.log('\n🔄 EXPORT - 导入导出');
    const g = loadGame();
    await g.wait(200);
    
    test('EXPORT-01: 导出生成Base64代码', () => {
        g.call('selectMode', 'raise');
        const code = g.call('exportLobster');
        assert(code && code.length > 100, `导出代码应>100字符: ${code.length}`);
        assert(/^[A-Za-z0-9+/=]+$/.test(code), '应为有效Base64');
    });
    
    test('EXPORT-02: 导出代码可解析', () => {
        g.call('selectMode', 'raise');
        const code = g.call('exportLobster');
        const decoded = Buffer.from(code, 'base64').toString('utf8');
        const data = JSON.parse(decoded);
        assert(data.player && data.player.level === 1, '应包含玩家数据');
    });
    
    g.dom.window.close();
}

// ============================================================
// 战斗流程测试
// ============================================================
async function testBattle() {
    console.log('\n⚔️ BATTLE - 战斗流程');
    const g = loadGame();
    await g.wait(200);
    
    test('BATTLE-01: 开始战斗显示敌人选择', () => {
        g.call('selectMode', 'raise');
        g.call('closeWelcome');
        g.call('startBattle');
        const shown = g.get("document.getElementById('enemy-select-panel').classList.contains('show')");
        assert(shown, '敌人选择应显示');
    });
    
    test('BATTLE-02: 显示3个敌人选项', () => {
        const count = g.get("document.querySelectorAll('.enemy-option').length");
        assert(count === 3, `应为3个敌人: ${count}`);
    });
    
    test('BATTLE-03: 敌人等级与轮数对应', () => {
        // S.round=1, 敌人等级应为1或2
        const options = g.get("Array.from(document.querySelectorAll('.enemy-option')).map(e => e.textContent)");
        const hasRoundEnemy = options.some(o => o.includes('Lv.1')) || options.some(o => o.includes('Lv.2'));
        assert(hasRoundEnemy, `应有本轮敌人: ${options.join(', ')}`);
    });
    
    test('BATTLE-04: 选择敌人后进入战斗', () => {
        g.call('startBattle');
        const enemies = g.get("document.querySelectorAll('.enemy-option')");
        enemies[0].click();
        const inBattle = g.get('S.inBattle');
        assert(inBattle, '应进入战斗');
    });
    
    test('BATTLE-05: 敌人名字不为空', () => {
        const name = g.get("document.getElementById('enemy-name').textContent");
        assert(name !== '' && name !== '???', `敌人名字应正确: ${name}`);
    });
    
    test('BATTLE-06: 战斗日志存在', () => {
        const exists = g.get("document.getElementById('battle-log') !== null");
        assert(exists, '战斗日志应存在');
    });
    
    g.dom.window.close();
}

// ============================================================
// 测试运行器
// ============================================================
async function runTests() {
    console.log('\n🦐 赛博斗龙虾 - 核心单元测试\n');
    console.log('═'.repeat(50));
    
    await testConstants();
    await testSkills();
    await testPassives();
    await testInit();
    await testEquip();
    await testUI();
    await testExport();
    await testBattle();
    
    console.log('═'.repeat(50));
    console.log(`\n📊 测试结果: ${testsPassed}/${testsRun} 通过`);
    
    if (testsFailed > 0) {
        console.log(`\n❌ 失败 (${testsFailed}):`);
        failures.forEach(f => console.log(`   ${f.name}: ${f.error}`));
        process.exit(1);
    } else {
        console.log('\n✅ 全部测试通过!\n');
    }
}

runTests().catch(e => {
    console.error('测试失败:', e);
    process.exit(1);
});
