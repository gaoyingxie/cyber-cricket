/**
 * 赛博斗龙虾 - 常量验证测试
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

let testsRun = 0, testsPassed = 0, testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        testsFailed++;
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.com/' });
const win = dom.window;
setTimeout(() => {
    console.log('\n📋 常量验证测试\n');
    
    // 版本
    test('VERSION v2.26', () => {
        const version = win.eval('VERSION');
        if (version !== 'v2.26') throw new Error('VERSION应为v2.26: ' + version);
    });
    
    // 技能数量
    test('主动技能21个', () => {
        const active = win.eval('ALL_SKILLS').filter(s => !s.passive);
        if (active.length !== 21) throw new Error('应为21个: ' + active.length);
    });
    
    test('被动技能14个', () => {
        const passive = win.eval('ALL_SKILLS').filter(s => s.passive);
        if (passive.length !== 14) throw new Error('应为14个: ' + passive.length);
    });
    
    // 敌人
    test('敌人类型15种', () => {
        if (win.eval('ENEMY_NAMES.length') !== 15) throw new Error('应为15种');
    });
    
    // 阶段
    test('进化阶段5个', () => {
        if (win.eval('PHASES.length') !== 5) throw new Error('应为5个');
    });
    
    console.log(`\n📊 常量测试: ${testsPassed}/${testsRun} 通过`);
    
    if (testsFailed > 0) {
        process.exit(1);
    } else {
        console.log('\n✅ 全部通过!\n');
        process.exit(0);
    }
}, 300);
