// ============================================================
// locations.js — 修炼地点切换
// ============================================================

const { LOCATIONS, REALM_ORDER } = window.GAME_CONSTANTS;

// 地点是否已解锁（通过境界或剧情）
function isLocationUnlocked(loc) {
  if (!loc.unlock) return true;

  const { realm, realmLevel } = window.gState.player;
  const playerRealmOrder = REALM_ORDER.indexOf(realm);

  // 直接境界要求
  if (['筑基', '化神', '飞升'].includes(loc.unlock)) {
    const reqOrder = REALM_ORDER.indexOf(loc.unlock);
    return playerRealmOrder >= reqOrder;
  }

  // 筑基后期
  if (loc.unlock === '筑基后期') {
    return realm === '筑基' && realmLevel >= 3;
  }

  // 剧情解锁（七玄门/黄枫谷通关）
  // 当前简化：筑基后即解锁
  if (loc.unlock === '七玄门通关' || loc.unlock === '黄枫谷通关') {
    return playerRealmOrder >= 1; // 筑基及以上
  }

  return false;
}

// 资源是否足够前往某地点
function canAffordLocation(loc) {
  if (loc.id === 'cave') return true;
  if (loc.cost <= 0) return true;

  if (loc.costType === 'stone')  return (window.gState.resources.stone  || 0) >= loc.cost;
  if (loc.costType === 'contrib') return (window.gState.resources.contrib || 0) >= loc.cost;
  if (loc.costType === 'token')   return (window.gState.resources.token   || 0) >= loc.cost;
  if (loc.costType === 'elixir')  return (window.gState.resources.elixir  || 0) >= loc.cost;
  if (loc.costType === 'special') return true; // 小灵天等特殊条件由解锁控制
  return false;
}

// 能否切换到指定地点（解锁 + 资源）
function canSwitchTo(locId) {
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) return false;
  if (!isLocationUnlocked(loc)) return false;
  if (!canAffordLocation(loc)) return false;
  return true;
}

// 执行地点切换
function switchLocation(locId) {
  const loc = LOCATIONS.find(l => l.id === locId);
  if (!loc) return;
  if (loc.id === window.gState.cultivation.currentLocation) return; // 已在该地点

  // 扣除费用
  if (loc.cost > 0) {
    if (loc.costType === 'stone')  window.gState.resources.stone  -= loc.cost;
    else if (loc.costType === 'contrib') window.gState.resources.contrib -= loc.cost;
    else if (loc.costType === 'token')   window.gState.resources.token   -= loc.cost;
    else if (loc.costType === 'elixir')  window.gState.resources.elixir  -= loc.cost;
  }

  // 保留进度比例（效率变化后，按比例调整进度保证总收益不变）
  const oldProgress = window.gState.cultivation.progress;
  const oldEff = window.CULTIVATION.getLocationEfficiency(window.gState.cultivation.currentLocation);
  const newEff = loc.eff;
  window.gState.cultivation.progress = Math.min(100, oldProgress * oldEff / newEff);
  window.gState.cultivation.currentLocation = locId;
  window.gState.cultivation.lastTick = Date.now();

  window.STATE.saveState(window.gState);
  window.UI && window.UI.renderLocationsPanel && window.UI.renderLocationsPanel();
  window.UI && window.UI.render && window.UI.render();
  window.UI && window.UI.showToast && window.UI.showToast(`切换到「${loc.name}」，效率${newEff}x`);
}

window.LOCATIONS_MODULE = {
  isLocationUnlocked,
  canAffordLocation,
  canSwitchTo,
  switchLocation,
};
