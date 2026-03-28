// ============================================================
// main.js — 游戏入口 + 主循环
// ============================================================

const { TICK_MS } = window.GAME_CONSTANTS;

// 初始化全局状态
function init() {
  // 读取或创建存档
  gState = window.STATE.getState();

  // 上线时记录时间戳
  gState.cultivation.lastOnline = Date.now();
  gState.cultivation.lastTick = gState.cultivation.lastTick || Date.now();
  window.STATE.saveState(gState);

  // 检查离线收益
  window.CULTIVATION.checkOfflineEarnings();

  // 渲染全量UI
  window.UI.renderAll();

  // 启动主循环
  startGameLoop();
}

// ============================================================
// 主循环
// ============================================================

let loopIntervalId = null;

function startGameLoop() {
  if (loopIntervalId) clearInterval(loopIntervalId);
  loopIntervalId = setInterval(gameLoop, TICK_MS);
}

function stopGameLoop() {
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }
}

function gameLoop() {
  // 1. 处理挂机tick（判断是否完成一个周期）
  window.CULTIVATION.doCultivationTick();

  // 2. 更新进度条（每秒调用）
  window.UI.renderCultivationProgress();

  // 3. 检测离线收益是否出现
  if (!gState.cultivation.offlineEarnings) {
    window.CULTIVATION.checkOfflineEarnings();
  }
  // 4. 更新离线收益UI（如果有）
  const oeEl = document.getElementById('offline-earnings');
  if (oeEl && gState.cultivation.offlineEarnings) {
    oeEl.classList.add('show');
    const oe = gState.cultivation.offlineEarnings;
    const oeItems = document.getElementById('oe-items');
    if (oeItems) {
      oeItems.innerHTML = `离线${oe.hours}小时：💎${window.UI.fmt(oe.stone)} 🌿${window.UI.fmt(oe.herb)} ⭐${window.UI.fmt(oe.exp)}`;
    }
  }
}

// ============================================================
// 页面可见性
// ============================================================

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.CULTIVATION.onPageHidden();
    stopGameLoop();
  } else {
    window.CULTIVATION.onPageVisible();
    startGameLoop();
  }
});

// ============================================================
// 启动
// ============================================================

// 等DOM加载完毕再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
