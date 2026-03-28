// ============================================================
// constants.js — 游戏常量定义
// ============================================================

// 境界顺序
const REALM_ORDER = ['炼气', '筑基', '结丹', '元婴', '化神', '飞升'];

// 境界对应最大层数
const REALM_LEVELS = { '炼气': 13, '筑基': 3, '结丹': 3, '元婴': 3, '化神': 1, '飞升': 1 };

// 境界对应产出倍率（决定挂机收益基准）
const REALM_MULT = { '炼气': 1, '筑基': 2.5, '结丹': 6, '元婴': 15, '化神': 40, '飞升': 100 };

// 境界颜色（用于UI标识）
const REALM_COLORS = { '炼气': '#9ca3af', '筑基': '#60a5fa', '结丹': '#f59e0b', '元婴': '#a855f7', '化神': '#3b82f6', '飞升': '#d4a017' };

// 物品定义
const ITEM_DEFS = {
  stone:  { name: '灵石',       icon: '💎', color: '#d4a017' },
  herb:   { name: '灵草',       icon: '🌿', color: '#4ade80' },
  elixir: { name: '筑基丹',     icon: '⚗️', color: '#60a5fa' },
  core:   { name: '内丹',       icon: '🔴', color: '#f97316' },
  ore:    { name: '灵矿',       icon: '🪨', color: '#94a3b8' },
  contrib:{ name: '宗门贡献',   icon: '🏅', color: '#fbbf24' },
  token:  { name: '血色令牌',  icon: '🩸', color: '#dc2626' },
  sElixir:{ name: '结金丹',     icon: '🟡', color: '#f59e0b' },
  yElixir:{ name: '元婴丹',    icon: '🟣', color: '#a855f7' },
  hElixir:{ name: '化神丹',    icon: '🔵', color: '#3b82f6' },
};

// 洞府等级
const CAVE_LEVELS = [
  { name: '简陋茅屋', eff: 1.0,  unlockRealm: '炼气', upgradeCost: null },
  { name: '普通洞府', eff: 1.3,  unlockRealm: '筑基', upgradeCost: { stone: 5000 } },
  { name: '灵气洞府', eff: 1.6,  unlockRealm: '结丹', upgradeCost: { stone: 50000 } },
  { name: '仙府',     eff: 2.0,  unlockRealm: '元婴', upgradeCost: { stone: 500000 } },
  { name: '天宫',     eff: 2.5,  unlockRealm: '化神', upgradeCost: { stone: 5000000 } },
];

// 附属建筑
const BUILDINGS = [
  { id: 'spirit-array',    name: '聚灵阵',   desc: '额外+10%挂机收益（可叠加3层）', maxLevel: 3, baseCost: { stone: 1000, herb: 10 } },
  { id: 'alchemy-furnace', name: '炼丹炉',   desc: '每日自动产出低阶丹药',           maxLevel: 1, baseCost: { stone: 3000, herb: 30 } },
  { id: 'refining-altar',  name: '炼器台',   desc: '每日自动产出低阶装备',           maxLevel: 1, baseCost: { stone: 3000, ore: 20 } },
  { id: 'beast-garden',    name: '灵兽园',   desc: '灵兽经验+20%',                  maxLevel: 1, baseCost: { stone: 5000, core: 5 } },
  { id: 'library',          name: '藏书阁',   desc: '挂机时概率发现功法残页',         maxLevel: 1, baseCost: { stone: 2000, herb: 20 } },
];

// 修炼地点
const LOCATIONS = [
  { id: 'cave',           name: '洞府',      eff: 1.0,  cost: 0,    costType: null,     unlock: null,          desc: '自己的地盘，稳定可靠' },
  { id: 'spirit-mountain', name: '灵脉山',    eff: 1.5,  cost: 500,  costType: 'stone',  unlock: null,          desc: '野外灵脉，灵气充沛' },
  { id: 'huangfeng',       name: '黄枫谷',    eff: 2.0,  cost: 10,   costType: 'contrib',unlock: '七玄门通关',  desc: '越国七大宗门之一' },
  { id: 'lingshan',        name: '灵兽山',    eff: 2.5,  cost: 20,   costType: 'contrib',unlock: '黄枫谷通关',  desc: '以灵兽闻名的宗门' },
  { id: 'anyue',            name: '掩月宗',    eff: 3.0,  cost: 30,   costType: 'contrib',unlock: '筑基',        desc: '功法神秘莫测' },
  { id: 'blood-land',      name: '血色禁地', eff: 5.0,  cost: 1,    costType: 'token',  unlock: '筑基后期',    desc: '危险禁地，机缘与风险并存' },
  { id: 'xiaolingtian',    name: '小灵天',    eff: 8.0,  cost: 1,    costType: 'special',unlock: '化神',        desc: '化神专属修炼圣地' },
  { id: 'fly-platform',     name: '飞升台',    eff: 10.0, cost: 1,    costType: 'elixir', unlock: '飞升',        desc: '冲击飞升的最后一步' },
];

// 挂机周期（毫秒）
const CULTIVATION_CYCLE_MS = 5 * 60 * 1000; // 5分钟

// 游戏Tick间隔（毫秒）
const TICK_MS = 1000;

// 导出供其他模块使用
window.GAME_CONSTANTS = {
  REALM_ORDER, REALM_LEVELS, REALM_MULT, REALM_COLORS,
  ITEM_DEFS, CAVE_LEVELS, BUILDINGS, LOCATIONS,
  CULTIVATION_CYCLE_MS, TICK_MS,
};
