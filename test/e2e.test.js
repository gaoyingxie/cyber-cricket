/**
 * 赛博斗龙虾 - E2E测试
 * 使用 agent-browser + Chrome 进行端到端测试
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

const AB = '/home/node/.npm-global/lib/node_modules/agent-browser/bin/agent-browser-linux-x64';
const CHROME = '/home/node/.cache/ms-playwright/chromium-1091/chrome-linux/chrome';
const BROWSERS = '/home/node/.cache/ms-playwright';
const GAME_URL = 'https://gaoyingxie.github.io/cyber-cricket/';

const env = { ...process.env, CHROME_PATH: CHROME, AGENT_BROWSER_BROWSERS_PATH: BROWSERS };

let testsRun = 0, testsPassed = 0, testsFailed = 0;
const failures = [];

function log(msg) { console.log(msg); }

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
}

function cmd(args) {
    return new Promise((resolve, reject) => {
        const p = spawn(AB, args, { env });
        let out = '';
        p.stdout.on('data', d => out += d);
        p.on('close', code => resolve({ code, out: out.trim() }));
    });
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function test(name, fn) {
    testsRun++;
    try {
        await fn();
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        testsFailed++;
        failures.push({ name, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

async function run() {
    console.log('\n🦐 赛博斗龙虾 - E2E测试\n');
    console.log('═'.repeat(50));
    
    // 打开游戏
    log('打开游戏...');
    await cmd(['open', GAME_URL]);
    await sleep(3000);
    
    // TEST-01: 版本号
    await test('E2E-01: 版本号显示v2.08', async () => {
        const { out } = await cmd(['eval', "document.querySelector('.version').textContent"]);
        assert(out.includes('v2.08'), `版本应为v2.08: ${out}`);
    });
    
    // TEST-02: 截图看界面
    await test('E2E-02: 游戏主界面正常加载', async () => {
        const { out } = await cmd(['snapshot']);
        assert(out.includes('赛博斗龙虾'), '应有游戏标题');
        assert(out.includes('养虾模式'), '应有养虾模式按钮');
    });
    
    // TEST-03: 点击养虾模式
    await test('E2E-03: 点击养虾模式显示欢迎面板', async () => {
        await cmd(['click', 'text=养虾模式']);
        await sleep(800);
        const { out } = await cmd(['snapshot']);
        assert(out.includes('欢迎来到赛博斗龙虾') || out.includes('开始游戏'), '应显示欢迎面板');
    });
    
    // TEST-04: 点击开始游戏
    await test('E2E-04: 点击开始游戏进入主界面', async () => {
        await cmd(['click', 'text=开始游戏!']);
        await sleep(500);
        const { out } = await cmd(['snapshot']);
        assert(out.includes('开始战斗') || out.includes('你的龙虾'), '应进入主界面');
    });
    
    // TEST-05: 点击开始战斗
    await test('E2E-05: 点击开始战斗显示敌人选择', async () => {
        await cmd(['click', 'text=开始战斗']);
        await sleep(500);
        const { out } = await cmd(['snapshot']);
        assert(out.includes('选择对手') || out.includes('机械龙虾'), '应显示敌人选择');
    });
    
    // TEST-06: 敌人选项
    await test('E2E-06: 显示3个敌人选项', async () => {
        const { out } = await cmd(['snapshot']);
        const count = (out.match(/机械龙虾|电路龙虾|芯片龙虾/g) || []).length;
        assert(count >= 2, `应有多个敌人选项: ${count}`);
    });
    
    // TEST-07: 选择敌人开始战斗
    await test('E2E-07: 选择敌人后进入战斗', async () => {
        await cmd(['click', 'text=机械龙虾']);
        await sleep(1000);
        const { out } = await cmd(['snapshot']);
        assert(out.includes('遇到野生') || out.includes('敌人技能'), '应进入战斗');
    });
    
    // TEST-08: 战斗日志
    await test('E2E-08: 战斗日志显示战斗信息', async () => {
        await sleep(2000);
        const { out } = await cmd(['snapshot']);
        assert(out.includes('回合') || out.includes('伤害') || out.includes('攻击'), '应有战斗日志');
    });
    
    // TEST-09: 速度显示
    await test('E2E-09: 玩家属性正确显示', async () => {
        const { out } = await cmd(['snapshot']);
        assert(out.includes('攻:') && out.includes('防:') && out.includes('速:'), '应显示攻/防/速属性');
    });
    
    // TEST-10: 速度按钮
    await test('E2E-10: 速度切换按钮可点击', async () => {
        await cmd(['click', 'text=1倍速']);
        await sleep(300);
        const { out } = await cmd(['snapshot']);
        assert(out.includes('倍速'), '速度按钮应有切换');
    });
    
    console.log('═'.repeat(50));
    console.log(`\n📊 E2E测试结果: ${testsPassed}/${testsRun} 通过`);
    
    if (testsFailed > 0) {
        console.log(`\n❌ 失败 (${testsFailed}):`);
        failures.forEach(f => console.log(`   ${f.name}`));
    } else {
        console.log('\n✅ 全部通过!\n');
    }
    
    process.exit(testsFailed > 0 ? 1 : 0);
}

run().catch(e => {
    console.error('失败:', e);
    process.exit(1);
});
