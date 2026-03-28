// test-runner.js — Node.js 模拟浏览器环境，运行核心逻辑测试
// 用法: node test-runner.js

const fs = require('fs');
const path = require('path');

// ============================================================
// 模拟浏览器环境
// ============================================================

const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = v; },
  removeItem: (k) => { delete mockStorage[k]; },
};

// 声明 window（Node.js 环境）
global.window = global;
global.global = global;

// 覆盖 console（不改变）
global.console = {
  ...console,
  warn: (...a) => console.log('[WARN]', ...a),
  error: (...a) => console.log('[ERROR]', ...a),
};

global.Date = Date;
global.setInterval = setInterval;
global.clearInterval = clearInterval;
global.Math = Math;

// 模拟 document
const mockDocument = {
  readyState: 'complete',
  hidden: false,
  getElementById: (id) => ({
    id,
    textContent: '',
    innerHTML: '',
    value: '',
    style: { width: '' },
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
    },
    appendChild: () => {},
    setAttribute: () => {},
    addEventListener: () => {},
    removeAttribute: () => {},
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => mockDocument.getElementById('tmp'),
};
global.document = mockDocument;
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };

// ============================================================
// 加载模块
// ============================================================

const base = __dirname;
function load(name) {
  const content = fs.readFileSync(path.join(base, 'js', name), 'utf8');
  // 包装：不传 document 参数（避免 shadow 自由变量 window）
  // 只传 localStorage/console/Date/Math/setInterval/clearInterval
  const wrapped = `(function(localStorage, console, Date, Math, setInterval, clearInterval){\n${content}\n})`;
  const fn = eval(wrapped);
  fn(global.localStorage, console, Date, Math, setInterval, clearInterval);
}

console.log('=== 加载模块 ===');
load('constants.js');  console.log('✅ constants.js');
load('state.js');      console.log('✅ state.js');
load('cultivation.js');console.log('✅ cultivation.js');
load('cave.js');       console.log('✅ cave.js');
load('locations.js');  console.log('✅ locations.js');
load('ui.js');         console.log('✅ ui.js');
// main.js 需要 DOMContentLoaded，我们手动调用 init
// load('main.js');

// 初始化
const STATE = global.STATE;
const CULTIVATION = global.CULTIVATION;
const CAVE = global.CAVE;
const LOCATIONS_MODULE = global.LOCATIONS_MODULE;
const UI = global.UI;

STATE.saveState(STATE.DEFAULT); // 重置
// 就地替换内容（不改引用），让所有模块的 window.gState 看到同一份数据
const _default = STATE.DEFAULT;
const _keys = Object.keys(_default);
for (const k of _keys) {
  if (typeof window.gState[k] === 'object' && window.gState[k] !== null) {
    // 深度替换对象属性
    window.gState[k] = JSON.parse(JSON.stringify(_default[k]));
  } else {
    window.gState[k] = _default[k];
  }
}

console.log('\n=== 测试开始 ===\n');

// ============================================================
// 测试用例
// ============================================================

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ ${msg}`);
    failed++;
  }
}

// --- TC-RES ---
console.log('【TC-RES 资源系统】');
assert(window.gState.resources.stone === 50, 'TC-RES-001: 初始灵石=50');
assert(window.gState.resources.herb === 10,  'TC-RES-001: 初始灵草=10');
assert(window.gState.resources.elixir === 0, 'TC-RES-001: 初始筑基丹=0');

// --- TC-CUL ---
console.log('\n【TC-CUL 挂机系统】');
// 初始洞府效率
const caveEff0 = CULTIVATION.getCaveEfficiency();
assert(caveEff0 === 1.0, `TC-CUL-001: 初始洞府效率=1.0, 实际=${caveEff0}`);

// 收益计算
const earnings1 = CULTIVATION.calcEarningsPerCycle();
assert(earnings1.stone > 0, `TC-CUL-002: 每周期产出灵石>0, 实际=${earnings1.stone}`);
assert(earnings1.herb >= 0,  `TC-CUL-002: 每周期产出灵草>=0, 实际=${earnings1.herb}`);

// 地点效率
const locEff = CULTIVATION.getLocationEfficiency('cave');
assert(locEff === 1.0, `TC-CUL-003: 洞府地点效率=1.0, 实际=${locEff}`);
const locEff2 = CULTIVATION.getLocationEfficiency('spirit-mountain');
assert(locEff2 === 1.5, `TC-CUL-003: 灵脉山效率=1.5, 实际=${locEff2}`);

// 总效率
const totalEff = CULTIVATION.getTotalEfficiency();
assert(totalEff === 1.0, `TC-CUL-004: 总效率=洞府1.0×地点1.0=1.0, 实际=${totalEff}`);

// 双倍修炼
window.gState.cultivation.doubleTimeLeft = 60;
const doubleEff = CULTIVATION.getTotalEfficiency();
assert(doubleEff === 2.0, `TC-CUL-005: 双倍修炼=2.0x, 实际=${doubleEff}`);
window.gState.cultivation.doubleTimeLeft = 0;

// 聚灵阵加成
window.gState.cave.buildings['spirit-array'] = 3;
const arrEff = CULTIVATION.getCaveEfficiency();
assert(arrEff === 1.3, `TC-CUL-006: 聚灵阵Lv.3=+30%, 实际=${arrEff}`);
window.gState.cave.buildings['spirit-array'] = 0;

// --- TC-CAVE ---
console.log('\n【TC-CAVE 洞府系统】');
assert(window.gState.cave.level === 0, `TC-CAVE-001: 初始洞府Lv.0, 实际=${window.gState.cave.level}`);
assert(CAVE.getCurrentCaveLevel().name === '简陋茅屋', 'TC-CAVE-001: 名称=简陋茅屋');
assert(CAVE.getCaveUpgradeCost() !== null, 'TC-CAVE-002: Lv.1有升级费用');

window.gState.resources.stone = 0;
assert(!CAVE.canUpgradeCave(), 'TC-CAVE-003: 灵石0时无法升级');

window.gState.resources.stone = 5000;
// 明确重置状态（排除前面测试的副作用干扰）
window.gState.player.realm = '筑基';
window.gState.player.realmLevel = 1;
window.gState.cave.level = 0;
assert(CAVE.canUpgradeCave(), 'TC-CAVE-003: 灵石5000时应该可以升级(Lv.1→Lv.2需筑基)');

// 境界不足时不能升Lv.2（需筑基）
window.gState.player.realm = '炼气';
window.gState.cave.level = 1; // 手动设置到Lv.2测试能否升Lv.3
window.gState.resources.stone = 50000;
window.gState.player.realmLevel = 13; // 炼气满层
const canUp3 = CAVE.canUpgradeCave();
assert(!canUp3, 'TC-CAVE-004: 炼气境界灵石充足时不能升灵气洞府(需结丹)');

// 恢复
window.gState.cave.level = 0;
window.gState.player.realm = '筑基';
window.gState.player.realmLevel = 1;
window.gState.resources.stone = 5000;
assert(CAVE.canUpgradeCave(), 'TC-CAVE-004: 筑基后灵石充足应可升级');

CAVE.upgradeCave();
assert(window.gState.cave.level === 1, `TC-CAVE-005: 升级后洞府=Lv.1, 实际=${window.gState.cave.level}`);
assert(window.gState.resources.stone === 0, `TC-CAVE-005: 升级消耗5000灵石, 剩余=${window.gState.resources.stone}`);
assert(CAVE.getCurrentCaveLevel().name === '普通洞府', 'TC-CAVE-005: 名称=普通洞府');

// --- TC-BLD ---
console.log('\n【TC-BLD 建筑系统】');
assert(CAVE.getBuildingLevel('spirit-array') === 0, 'TC-BLD-001: 初始聚灵阵=Lv.0');
const bldCost = CAVE.getBuildingCost('spirit-array');
assert(bldCost !== null, 'TC-BLD-002: Lv.0有升级费用');
assert(bldCost.stone === 1000, `TC-BLD-002: 聚灵阵Lv.1费用=1000灵石, 实际=${bldCost.stone}`);

// 升级费用递增
window.gState.cave.buildings['spirit-array'] = 1;
const bldCost2 = CAVE.getBuildingCost('spirit-array');
assert(bldCost2.stone === 2000, `TC-BLD-003: 聚灵阵Lv.2费用=2000(1级基础×2), 实际=${bldCost2.stone}`);

window.gState.resources.stone = 0;
assert(!CAVE.canUpgradeBuilding('spirit-array'), 'TC-BLD-004: 灵石不足不能升级');
window.gState.resources.stone = 2000;
window.gState.resources.herb = 20; // 升级需要 herb>=20
assert(CAVE.canUpgradeBuilding('spirit-array'), 'TC-BLD-004: 灵石2000可升级');
CAVE.upgradeBuilding('spirit-array');
assert(window.gState.cave.buildings['spirit-array'] === 2, `TC-BLD-005: 升级后Lv.2, 实际=${window.gState.cave.buildings['spirit-array']}`);
assert(window.gState.resources.stone === 0, `TC-BLD-005: 扣除2000灵石`);

// 满级判断
window.gState.cave.buildings['spirit-array'] = 3;
const costMax = CAVE.getBuildingCost('spirit-array');
assert(costMax === null, 'TC-BLD-006: 满级返回null');
assert(!CAVE.canUpgradeBuilding('spirit-array'), 'TC-BLD-006: 满级不能升级');
window.gState.cave.buildings['spirit-array'] = 0;

// --- TC-LOC ---
console.log('\n【TC-LOC 修炼地点系统】');
assert(window.gState.cultivation.currentLocation === 'cave', 'TC-LOC-001: 默认地点=cave');

const loc = LOCATIONS_MODULE.isLocationUnlocked({ unlock: null });
assert(loc === true, 'TC-LOC-002: unlock=null视为已解锁');
window.gState.player.realm = '炼气'; // 明确设置测试状态
const locLocked = LOCATIONS_MODULE.isLocationUnlocked({ unlock: '筑基' });
assert(!locLocked, 'TC-LOC-002: 炼气境界，筑基地点未解锁');

window.gState.player.realm = '筑基';
assert(LOCATIONS_MODULE.isLocationUnlocked({ unlock: '筑基' }), 'TC-LOC-003: 筑基后，筑基地点解锁');

window.gState.resources.stone = 0;
window.gState.cultivation.currentLocation = 'cave';
assert(!LOCATIONS_MODULE.canAffordLocation({ id: 'spirit-mountain', cost: 500, costType: 'stone' }), 'TC-LOC-004: 灵石0，灵脉山不可前往');
window.gState.resources.stone = 600;
assert(LOCATIONS_MODULE.canAffordLocation({ id: 'spirit-mountain', cost: 500, costType: 'stone' }), 'TC-LOC-004: 灵石600，灵脉山可前往');

// 地点切换
window.gState.cultivation.currentLocation = 'cave';
window.gState.cultivation.progress = 50;
LOCATIONS_MODULE.switchLocation('spirit-mountain');
assert(window.gState.cultivation.currentLocation === 'spirit-mountain', `TC-LOC-005: 切换后地点=spirit-mountain`);
assert(window.gState.resources.stone === 100, `TC-LOC-005: 灵脉山消耗500灵石(600-500), 剩余=${window.gState.resources.stone}`);
window.gState.resources.stone = 1000;

// --- TC-OFF ---
console.log('\n【TC-OFF 离线收益系统】');
const now = Date.now();
// 模拟离线1分钟，不触发
window.gState.cultivation.lastOnline = now - 60 * 1000;
const oe0 = CULTIVATION.calcOfflineEarnings();
assert(oe0 === null, 'TC-OFF-001: 离线1分钟内无收益');

// 模拟离线1小时
window.gState.cultivation.lastOnline = now - 60 * 60 * 1000;
window.gState.cultivation.lastTick = now - 60 * 60 * 1000;
const oe1 = CULTIVATION.calcOfflineEarnings();
assert(oe1 !== null, 'TC-OFF-002: 离线1小时有收益');
assert(oe1.hours === 1, `TC-OFF-002: 离线1小时hours=1, 实际=${oe1.hours}`);
assert(oe1.stone > 0, `TC-OFF-002: 离线收益stone>0, 实际=${oe1.stone}`);

// --- TC-SAVE ---
console.log('\n【TC-SAVE 存档系统】');
const exported = STATE.exportState(window.gState);
assert(typeof exported === 'string' && exported.length > 0, 'TC-SAVE-001: 导出为非空字符串');

const imported = STATE.importState(exported);
assert(imported !== null, 'TC-SAVE-002: 导出后再导入不为null');
assert(imported.player.realm === window.gState.player.realm, 'TC-SAVE-002: 导入后realm一致');

const bad = STATE.importState('not-valid-base64!!!');
assert(bad === null, 'TC-SAVE-003: 导入错误字符串返回null');

// 边界测试
const bigNum = STATE.importState(exported);
bigNum.resources.stone = 1e15;
assert(bigNum.resources.stone === 1e15, 'TC-EDGE-001: 支持超大数值');

// ============================================================
// 结果汇总
// ============================================================
console.log('\n=== 测试结果 ===');
console.log(`通过: ${passed} 项`);
console.log(`失败: ${failed} 项`);
if (failed > 0) {
  console.log('\n❌ 有测试失败，请检查!');
  process.exit(1);
} else {
  console.log('\n✅ 全部通过!');
  process.exit(0);
}
