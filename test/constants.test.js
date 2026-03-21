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

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.com/' });
const win = dom.window;
setTimeout(() => {
    console.log('\n📋 常量验证测试\n');
    
    // 版本
    test('VERSION v2.13', () => {
        if (win.VERSION !== 'v2.13') throw new Error('VERSION应为v2.13: ' + win.VERSION);
    });
    
    // 技能数量
    test('主动技能17个', () => {
        const active = win.ALL_SKILLS.filter(s => !s.passive);
        if (active.length !== 17) throw new Error('应为17个: ' + active.length);
    });
    
    test('被动技能10个', () => {
        const passive = win.ALL_SKILLS.filter(s => s.passive);
        if (passive.length !== 10) throw new Error('应为10个: ' + passive.length);
    });
    
    // 敌人
    test('敌人类型15种', () => {
        if (win.ENEMY_NAMES.length !== 15) throw new Error('应为15种');
    });
    
    // 阶段
    test('进化阶段5个', () => {
        if (win.PHASES.length !== 5) throw new Error('应为5个');
    });
    
    // 装备
    test('装备掉落率40%', () => {
        if (win.DROP_CHANCE !== 0.4) throw new Error('应为0.4');
    });
    
    test('装备品质5种', () => {
        if (win.EQUIP_QUALITY_COLOR.length !== 5) throw new Error('应为5种');
    });
    
    // 速度
    test('战斗速度3档', () => {
        if (win.BATTLE_SPEEDS.length !== 3) throw new Error('应为3档');
    });
    
    console.log(`\n📊 常量测试: ${testsPassed}/${testsRun} 通过`);
    
    if (testsFailed > 0) {
        process.exit(1);
    } else {
        console.log('\n✅ 全部通过!\n');
        process.exit(0);
    }
}, 300);
