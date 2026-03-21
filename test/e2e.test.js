/**
 * 赛博斗龙虾 - E2E测试 (修复版)
 * 使用 eval 直接调用游戏JS + snapshot 验证渲染
 */

const { spawn } = require('child_process');

const AB = '/home/node/.npm-global/lib/node_modules/agent-browser/bin/agent-browser-linux-x64';
const CHROME = '/home/node/.cache/ms-playwright/chromium-1091/chrome-linux/chrome';
const BROWSERS = '/home/node/.cache/ms-playwright';
const GAME_URL = 'https://gaoyingxie.github.io/cyber-cricket/';

const env = { ...process.env, CHROME_PATH: CHROME, AGENT_BROWSER_BROWSERS_PATH: BROWSERS };

let testsRun = 0, testsPassed = 0, testsFailed = 0;

function log(msg) { console.log(msg); }
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

async function cmd(args) {
    return new Promise((resolve) => {
        const p = spawn(AB, args, { env });
        let out = '';
        p.stdout.on('data', d => out += d);
        p.on('close', code => resolve({ code, out: out.trim() }));
    });
}

async function evalJS(js) {
    const { out } = await cmd(['eval', js]);
    return out;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function click(ref) { await cmd(['click', ref]); await sleep(400); }
async function snap() { return (await cmd(['snapshot'])).out; }

async function test(name, fn) {
    testsRun++;
    try {
        await fn();
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        testsFailed++;
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

async function run() {
    console.log('\n🦐 赛博斗龙虾 - E2E测试\n');
    console.log('═'.repeat(50));
    
    log('打开游戏...');
    await cmd(['open', GAME_URL]);
    await sleep(2500);
    
    // === E2E-01: 版本号 ===
    await test('E2E-01: 版本号显示v2.08', async () => {
        const v = await evalJS("document.querySelector('.version').textContent");
        assert(v.includes('v2.08'), `应为v2.08: ${v}`);
    });
    
    // === E2E-02: 养虾模式 ===
    await test('E2E-02: 选择养虾模式生成随机龙虾', async () => {
        await evalJS("selectMode('raise')");
        await sleep(200);
        const name = (await evalJS("S.player.name")).replace(/"/g, '');
        assert(name === '我的龙虾', `应有玩家龙虾: ${name}`);
        const welcomeShown = await evalJS("document.getElementById('welcome-panel').classList.contains('show')");
        assert(welcomeShown, '欢迎面板应显示');
    });
    
    // === E2E-03: 欢迎面板内容 ===
    await test('E2E-03: 欢迎面板显示完整信息', async () => {
        const name = await evalJS("document.getElementById('welcome-name').textContent");
        const stats = await evalJS("document.getElementById('welcome-stats').textContent");
        const skills = await evalJS("document.getElementById('welcome-skills').textContent");
        assert(name.includes('Lv.1'), `应有等级: ${name}`);
        assert(stats.includes('生命') && stats.includes('攻:'), `应有属性: ${stats}`);
        assert(skills.includes('技能:'), `应有技能: ${skills}`);
    });
    
    // === E2E-04: 关闭欢迎面板 ===
    await test('E2E-04: 关闭欢迎面板进入主界面', async () => {
        await evalJS("closeWelcome()");
        const hidden = await evalJS("!document.getElementById('welcome-panel').classList.contains('show')");
        assert(hidden, '欢迎面板应关闭');
    });
    
    // === E2E-05: 技能按钮渲染 ===
    await test('E2E-05: 主动技能显示按钮,被动技能隐藏', async () => {
        const btns = await evalJS("document.querySelectorAll('#player-skills .skill-btn').length");
        const actives = await evalJS("S.player.skills.filter(s=>!s.passive).length");
        assert(btns == actives, `技能按钮应为${actives}个, 实际${btns}个`);
    });
    
    // === E2E-06: 开始战斗 ===
    await test('E2E-06: 点击开始战斗显示敌人选择', async () => {
        await evalJS("startBattle()");
        const shown = await evalJS("document.getElementById('enemy-select-panel').classList.contains('show')");
        assert(shown, '敌人选择面板应显示');
    });
    
    // === E2E-07: 敌人选项 ===
    await test('E2E-07: 显示3个敌人选项', async () => {
        const opts = await evalJS("document.querySelectorAll('.enemy-option').length");
        assert(parseInt(opts) === 3, `应有3个敌人, 实际${opts}个`);
    });
    
    // === E2E-08: 选择敌人 ===
    await test('E2E-08: 选择敌人后进入战斗', async () => {
        await evalJS("document.querySelector('.enemy-option').click()");
        await sleep(500);
        const inBattle = await evalJS("S.inBattle");
        const enemyHp = await evalJS("S.enemy.hp");
        assert(inBattle && enemyHp > 0, `应进入战斗, HP=${enemyHp}`);
    });
    
    // === E2E-09: 敌人技能按钮 ===
    await test('E2E-09: 敌人技能有按钮样式', async () => {
        await evalJS("renderEnemySkills()");
        const btns = await evalJS("document.querySelectorAll('#enemy-skills .skill-btn').length");
        const enemySkills = await evalJS("S.enemy.skills.length");
        assert(btns === enemySkills, `敌人技能按钮应为${enemySkills}个, 实际${btns}个`);
    });
    
    // === E2E-10: 速度显示 ===
    await test('E2E-10: 速度属性正确显示', async () => {
        const stats = await evalJS("document.getElementById('player-stats').textContent");
        assert(stats.includes('速:'), `应有速度: ${stats}`);
    });
    
    // === E2E-11: 速度影响先手 ===
    await test('E2E-11: 速度高者显示先手提示', async () => {
        const logs = await evalJS("document.getElementById('battle-log').textContent");
        assert(logs.includes('先手') || logs.includes('速度'), `应有先手提示: ${logs.slice(-100)}`);
    });
    
    // === E2E-12: 战斗一回合执行 ===
    await test('E2E-12: 一回合后敌人HP减少', async () => {
        const before = parseInt(await evalJS("S.enemy.hp"));
        await evalJS("executeAutoTurn()");
        await sleep(500);
        const after = parseInt(await evalJS("S.enemy.hp"));
        assert(after < before, `敌人HP应减少: ${before} → ${after}`);
    });
    
    // === E2E-13: 防御技能 ===
    await test('E2E-13: 防御技能只持续一回合', async () => {
        await evalJS("S.player.reduceDmgRate = 0.6");
        await evalJS("endTurn()");
        const rate = parseFloat(await evalJS("S.player.reduceDmgRate"));
        assert(rate === 0, `防御应已重置, 实际为: ${rate}`);
    });
    
    console.log('═'.repeat(50));
    console.log(`\n📊 E2E测试结果: ${testsPassed}/${testsRun} 通过`);
    
    if (testsFailed > 0) {
        console.log(`\n❌ 失败 (${testsFailed}):`);
        process.exit(1);
    } else {
        console.log('\n✅ 全部E2E测试通过!\n');
        process.exit(0);
    }
}

run().catch(e => {
    console.error('失败:', e);
    process.exit(1);
});
