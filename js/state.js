// ============================================================
// state.js — 存档管理与全局状态
// ============================================================

// 默认存档模板
const DEFAULT_STATE = {
  player: {
    name: '韩立',
    realm: '炼气',
    realmLevel: 1,
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    attack: 10, defense: 5, speed: 8,
    exp: 0,
  },
  resources: {
    stone: 50, herb: 10, elixir: 0, core: 0,
    ore: 0, contrib: 0, token: 0,
    sElixir: 0, yElixir: 0, hElixir: 0,
  },
  cave: {
    level: 0,
    buildings: {
      'spirit-array': 0,
      'alchemy-furnace': 0,
      'refining-altar': 0,
      'beast-garden': 0,
      'library': 0,
    },
  },
  cultivation: {
    currentLocation: 'cave',
    progress: 0,          // 0-100 百分比
    lastTick: Date.now(), // 上次tick时间戳
    lastOnline: Date.now(),// 上次在线时间戳
    offlineEarnings: null, // 离线收益数据
    doubleTimeLeft: 0,     // 双倍修炼剩余分钟数
    doubleTimePurchased: 0,
  },
  stats: {
    totalDamage: 0, monstersKilled: 0,
    playTime: 0, cultivationSessions: 0,
    caveUpgrades: 0, buildingUpgrades: 0,
  },
  achievements: [],
  clearedDungeons: [],
  inventory: [],
};

// 深度克隆（用于避免引用问题）
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 从localStorage读取存档，不存在则返回默认
function getState() {
  try {
    const s = localStorage.getItem('xiuxian_state');
    return s ? JSON.parse(s) : deepClone(DEFAULT_STATE);
  } catch {
    console.warn('[State] 存档读取失败，使用默认状态');
    return deepClone(DEFAULT_STATE);
  }
}

// 保存存档到localStorage
function saveState(state) {
  try {
    localStorage.setItem('xiuxian_state', JSON.stringify(state));
  } catch (e) {
    console.error('[State] 存档保存失败:', e);
  }
}

// 重置存档
function resetState() {
  localStorage.removeItem('xiuxian_state');
  return deepClone(DEFAULT_STATE);
}

// 导出存档（Base64编码）
function exportState(state) {
  const json = JSON.stringify(state);
  return btoa(encodeURIComponent(json));
}

// 导入存档（返回新state或null）
function importState(base64Str) {
  try {
    const json = decodeURIComponent(atob(base64Str.trim()));
    const parsed = JSON.parse(json);
    // 基本校验：必须有 player 和 resources 字段
    if (!parsed.player || !parsed.resources) {
      throw new Error('存档格式不完整');
    }
    parsed.cultivation = parsed.cultivation || {};
    parsed.cultivation.lastTick = Date.now();
    parsed.cultivation.lastOnline = Date.now();
    return parsed;
  } catch (e) {
    console.error('[State] 导入失败:', e);
    return null;
  }
}

// 全局状态（立即初始化，放 window 上保证所有模块共享同一引用）
window.gState = getState();

window.STATE = {
  get DEFAULT() { return deepClone(DEFAULT_STATE); },
  getState,
  saveState,
  resetState,
  exportState,
  importState,
};
