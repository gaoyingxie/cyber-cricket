// ============================================================
// cave.js — 洞府升级与附属建筑
// ============================================================

const { CAVE_LEVELS, BUILDINGS } = window.GAME_CONSTANTS;
const { REALM_ORDER } = window.GAME_CONSTANTS;

// ============================================================
// 洞府升级
// ============================================================

// 获取当前洞府等级信息
function getCurrentCaveLevel() {
  return CAVE_LEVELS[window.gState.cave.level] || CAVE_LEVELS[0];
}

// 获取下一级升级费用（null表示没有下一级）
function getCaveUpgradeCost() {
  const nextLevel = CAVE_LEVELS[window.gState.cave.level + 1];
  if (!nextLevel || !nextLevel.upgradeCost) return null;
  return nextLevel.upgradeCost;
}

// 能否升级洞府（资源足够 + 境界达标）
function canUpgradeCave() {
  const cost = getCaveUpgradeCost();
  if (!cost) return false;

  const nextLevel = CAVE_LEVELS[window.gState.cave.level + 1];

  // 境界限制
  if (nextLevel.unlockRealm) {
    const playerRealmOrder = REALM_ORDER.indexOf(window.gState.player.realm);
    const reqRealmOrder = REALM_ORDER.indexOf(nextLevel.unlockRealm);
    if (playerRealmOrder < reqRealmOrder) return false;
  }

  // 资源检查
  for (const [res, amt] of Object.entries(cost)) {
    if ((window.gState.resources[res] || 0) < amt) return false;
  }
  return true;
}

// 执行洞府升级
function upgradeCave() {
  if (!canUpgradeCave()) {
    const cost = getCaveUpgradeCost();
    if (!cost) {
      window.UI && window.UI.showToast && window.UI.showToast('已是最高洞府等级！');
    } else {
      window.UI && window.UI.showToast && window.UI.showToast('资源不足或境界未达标！');
    }
    return;
  }

  const cost = getCaveUpgradeCost();
  for (const [res, amt] of Object.entries(cost)) {
    window.gState.resources[res] -= amt;
  }

  window.gState.cave.level++;
  window.gState.stats.caveUpgrades++;

  window.STATE.saveState(window.gState);
  window.UI && window.UI.renderCavePanel && window.UI.renderCavePanel();
  window.UI && window.UI.render && window.UI.render();
  window.UI && window.UI.showToast && window.UI.showToast(`洞府升级为「${CAVE_LEVELS[window.gState.cave.level].name}」！🏯`);
}

// ============================================================
// 附属建筑
// ============================================================

// 获取建筑当前等级
function getBuildingLevel(bldId) {
  return window.gState.cave.buildings[bldId] || 0;
}

// 获取建筑下一级升级费用（null表示满级）
function getBuildingCost(bldId) {
  const bld = BUILDINGS.find(b => b.id === bldId);
  if (!bld) return null;
  const currentLevel = getBuildingLevel(bldId);
  if (currentLevel >= bld.maxLevel) return null;
  const multiplier = currentLevel + 1;
  const cost = {};
  for (const [res, base] of Object.entries(bld.baseCost)) {
    cost[res] = base * multiplier;
  }
  return cost;
}

// 能否升级建筑（资源足够 + 未满级）
function canUpgradeBuilding(bldId) {
  const cost = getBuildingCost(bldId);
  if (!cost) return false;
  for (const [res, amt] of Object.entries(cost)) {
    if ((window.gState.resources[res] || 0) < amt) return false;
  }
  return true;
}

// 执行建筑升级
function upgradeBuilding(bldId) {
  if (!canUpgradeBuilding(bldId)) {
    const cost = getBuildingCost(bldId);
    if (!cost) {
      window.UI && window.UI.showToast && window.UI.showToast('该建筑已满级！');
    } else {
      window.UI && window.UI.showToast && window.UI.showToast('资源不足！');
    }
    return;
  }

  const cost = getBuildingCost(bldId);
  for (const [res, amt] of Object.entries(cost)) {
    window.gState.resources[res] -= amt;
  }

  window.gState.cave.buildings[bldId] = (window.gState.cave.buildings[bldId] || 0) + 1;
  window.gState.stats.buildingUpgrades++;

  const bld = BUILDINGS.find(b => b.id === bldId);
  window.STATE.saveState(window.gState);
  window.UI && window.UI.renderCavePanel && window.UI.renderCavePanel();
  window.UI && window.UI.render && window.UI.render();
  window.UI && window.UI.showToast && window.UI.showToast(`${bld.name}升到Lv.${window.gState.cave.buildings[bldId]}！`);
}

window.CAVE = {
  getCurrentCaveLevel,
  getCaveUpgradeCost,
  canUpgradeCave,
  upgradeCave,
  getBuildingLevel,
  getBuildingCost,
  canUpgradeBuilding,
  upgradeBuilding,
};
