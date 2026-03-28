// ============================================================
// cultivation.js — 挂机修炼与离线收益
// ============================================================

// ============================================================
// 效率计算
// ============================================================

// 洞府效率 = 基础效率 × (1 + 聚灵阵等级 × 0.1)
function getCaveEfficiency() {
  const { CAVE_LEVELS } = window.GAME_CONSTANTS;
  const caveLevel = CAVE_LEVELS[window.gState.cave.level];
  if (!caveLevel) return 1.0;
  let eff = caveLevel.eff;
  eff *= (1 + (window.gState.cave.buildings['spirit-array'] || 0) * 0.1);
  return eff;
}

// 地点效率
function getLocationEfficiency(locId) {
  const { LOCATIONS } = window.GAME_CONSTANTS;
  const loc = LOCATIONS.find(l => l.id === locId);
  return loc ? loc.eff : 1.0;
}

// 总效率 = 洞府效率 × 地点效率 × 双倍修炼
function getTotalEfficiency() {
  const caveEff = getCaveEfficiency();
  const locEff = getLocationEfficiency(window.gState.cultivation.currentLocation);
  const doubleEff = window.gState.cultivation.doubleTimeLeft > 0 ? 2.0 : 1.0;
  return caveEff * locEff * doubleEff;
}

// 获取当前修炼地点名称
function getCurrentLocationName() {
  const { LOCATIONS } = window.GAME_CONSTANTS;
  const loc = LOCATIONS.find(l => l.id === window.gState.cultivation.currentLocation);
  return loc ? loc.name : '洞府';
}

// ============================================================
// 收益计算
// ============================================================

// 每个挂机周期的收益（含随机波动 ±10%）
function calcEarningsPerCycle() {
  const { REALM_MULT, CULTIVATION_CYCLE_MS } = window.GAME_CONSTANTS;
  const { realm, realmLevel } = window.gState.player;
  const base = 5 + realmLevel * 3;
  const mult = REALM_MULT[realm] || 1;
  const eff = getTotalEfficiency();
  const variance = 1 + (Math.random() * 0.4 - 0.2); // ±20%

  return {
    stone: Math.floor(base * mult * eff * variance),
    herb:  Math.floor((base * 0.5 + realmLevel * 0.3) * eff * variance),
    exp:   Math.floor(base * mult * eff * 2 * variance),
  };
}

// ============================================================
// 挂机Tick（每次游戏循环调用）
// ============================================================

function doCultivationTick() {
  const { CULTIVATION_CYCLE_MS } = window.GAME_CONSTANTS;
  const now = Date.now();
  const elapsed = now - window.gState.cultivation.lastTick;

  if (elapsed < CULTIVATION_CYCLE_MS) return; // 不到一个周期

  const cycles = Math.floor(elapsed / CULTIVATION_CYCLE_MS);
  const earnings = calcEarningsPerCycle();

  // 累加资源
  window.gState.resources.stone += earnings.stone * cycles;
  window.gState.resources.herb  += earnings.herb  * cycles;
  window.gState.player.exp      += earnings.exp   * cycles;

  // 藏书阁触发（每级5%概率，产出筑基丹残页）
  const libLevel = window.gState.cave.buildings['library'] || 0;
  if (libLevel > 0) {
    for (let i = 0; i < cycles; i++) {
      if (Math.random() < 0.05 * libLevel) {
        window.gState.resources.elixir += 1;
        window.UI && window.UI.showToast('📚 藏书阁触发：发现功法残页！');
        break;
      }
    }
  }

  // 炼丹炉触发（每周期30%概率产低阶丹）
  if (window.gState.cave.buildings['alchemy-furnace'] > 0) {
    for (let i = 0; i < cycles; i++) {
      if (Math.random() < 0.3) {
        window.gState.resources.elixir += 1;
        break;
      }
    }
  }

  // 双倍修炼时间扣减（折算cycles对应的分钟数）
  if (window.gState.cultivation.doubleTimeLeft > 0) {
    const minutesElapsed = (cycles * CULTIVATION_CYCLE_MS) / (60 * 1000);
    window.gState.cultivation.doubleTimeLeft = Math.max(0, window.gState.cultivation.doubleTimeLeft - minutesElapsed);
  }

  // 重置进度条，保留余数时间
  window.gState.cultivation.progress = 0;
  window.gState.cultivation.lastTick = now - (elapsed % CULTIVATION_CYCLE_MS);
  window.gState.stats.cultivationSessions += cycles;

  window.STATE.saveState(window.gState);
  window.UI && window.UI.render && window.UI.render();
}

// ============================================================
// 离线收益
// ============================================================

// 计算离线收益（返回null表示无可计算收益）
function calcOfflineEarnings() {
  const { CULTIVATION_CYCLE_MS } = window.GAME_CONSTANTS;
  const now = Date.now();
  const offlineMs = now - window.gState.cultivation.lastOnline;

  if (offlineMs < 60000) return null; // 不到1分钟

  const maxOfflineMs = 24 * 60 * 60 * 1000;
  const effectiveMs = Math.min(offlineMs, maxOfflineMs);
  const hours = effectiveMs / (60 * 60 * 1000);

  // 衰减：每满1小时衰减10%，最低50%
  const decay = Math.max(0.5, 1 - hours * 0.1);

  const cycles = Math.floor(effectiveMs / CULTIVATION_CYCLE_MS);
  if (cycles <= 0) return null;

  const earnings = calcEarningsPerCycle();

  return {
    stone: Math.floor(earnings.stone * cycles * decay),
    herb:  Math.floor(earnings.herb  * cycles * decay),
    exp:   Math.floor(earnings.exp   * cycles * decay),
    hours: Math.floor(hours),
  };
}

// 收取离线收益
function collectOffline() {
  if (!window.gState.cultivation.offlineEarnings) return;
  const oe = window.gState.cultivation.offlineEarnings;
  window.gState.resources.stone += oe.stone;
  window.gState.resources.herb  += oe.herb;
  window.gState.player.exp      += oe.exp;
  window.gState.cultivation.offlineEarnings = null;
  window.STATE.saveState(window.gState);
  window.UI && window.UI.hideModal && window.UI.hideModal();
  window.UI && window.UI.showToast && window.UI.showToast(`已收取离线${oe.hours}小时收益！💎${window.UI.fmt(oe.stone)} 🌿${window.UI.fmt(oe.herb)}`);
  window.UI && window.UI.render && window.UI.render();
}

// 检查并更新离线收益状态
function checkOfflineEarnings() {
  if (window.gState.cultivation.offlineEarnings) return; // 已计算过
  const oe = calcOfflineEarnings();
  if (oe) {
    window.gState.cultivation.offlineEarnings = oe;
    window.STATE.saveState(window.gState);
  }
}

// ============================================================
// 页面可见性变化处理
// ============================================================

function onPageHidden() {
  window.gState.cultivation.lastTick = Date.now();
  window.gState.cultivation.lastOnline = Date.now();
  window.STATE.saveState(window.gState);
}

function onPageVisible() {
  const oe = calcOfflineEarnings();
  if (oe && !window.gState.cultivation.offlineEarnings) {
    window.gState.cultivation.offlineEarnings = oe;
  }
  window.gState.cultivation.lastTick = Date.now();
  window.STATE.saveState(window.gState);
  window.UI && window.UI.renderAll && window.UI.renderAll();
}

window.CULTIVATION = {
  getCaveEfficiency,
  getLocationEfficiency,
  getTotalEfficiency,
  getCurrentLocationName,
  calcEarningsPerCycle,
  doCultivationTick,
  calcOfflineEarnings,
  collectOffline,
  checkOfflineEarnings,
  onPageHidden,
  onPageVisible,
};
