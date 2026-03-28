// ============================================================
// ui.js — 所有UI渲染、弹窗、Toast
// ============================================================

const { ITEM_DEFS, CAVE_LEVELS, BUILDINGS, LOCATIONS, REALM_LEVELS, REALM_ORDER } = window.GAME_CONSTANTS;

// ============================================================
// 工具函数
// ============================================================

function fmt(n) {
  n = Math.floor(n);
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

// ============================================================
// 渲染函数
// ============================================================

function renderResources() {
  document.getElementById('res-stone').textContent  = fmt(window.gState.resources.stone);
  document.getElementById('res-herb').textContent   = fmt(window.gState.resources.herb);
  document.getElementById('res-elixir').textContent = fmt(window.gState.resources.elixir);
}

function renderPlayer() {
  const { realm, realmLevel } = window.gState.player;
  const maxRealmLevel = REALM_LEVELS[realm] || 1;

  let realmName;
  if (realm === '炼气') {
    realmName = `炼气 ${realmLevel}层`;
  } else if (realm === '筑基' || realm === '结丹' || realm === '元婴') {
    const suffix = ['初期', '中期', '后期'][realmLevel - 1] || '';
    realmName = `${realm}${suffix}`;
  } else {
    realmName = realm;
  }

  document.getElementById('realm-badge').textContent = realmName;
  document.getElementById('player-level').textContent = realmName;
  document.getElementById('hp-text').textContent = `${Math.floor(window.gState.player.hp)}/${window.gState.player.maxHp}`;
  document.getElementById('mp-text').textContent = `${Math.floor(window.gState.player.mp)}/${window.gState.player.maxMp}`;
  document.getElementById('hp-bar').style.width = (window.gState.player.hp / window.gState.player.maxHp * 100) + '%';
  document.getElementById('mp-bar').style.width = (window.gState.player.mp / window.gState.player.maxMp * 100) + '%';
}

function renderCultivation() {
  const { CULTIVATION_CYCLE_MS } = window.GAME_CONSTANTS;

  // 修炼地点信息
  const loc = LOCATIONS.find(l => l.id === window.gState.cultivation.currentLocation) || LOCATIONS[0];
  const locEff = window.CULTIVATION.getLocationEfficiency(window.gState.cultivation.currentLocation);
  document.getElementById('cur-loc-name').textContent = loc.name;
  document.getElementById('cur-loc-eff').textContent = `效率：${locEff}x`;

  // 进度条
  const pct = window.gState.cultivation.progress || 0;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
  const txt = document.getElementById('progress-text');
  if (txt) txt.textContent = Math.floor(pct) + '%';

  // 收益预览
  const earnings = window.CULTIVATION.calcEarningsPerCycle();
  const doubleStr = window.gState.cultivation.doubleTimeLeft > 0 ? '<span class="ep-item" style="color:#f59e0b">⚡双倍修炼中</span>' : '';
  const preview = document.getElementById('earnings-preview');
  if (preview) {
    preview.innerHTML = `
      <span class="ep-item">💎 <span class="ep-val">${fmt(earnings.stone)}</span>/次</span>
      <span class="ep-item">🌿 <span class="ep-val">${fmt(earnings.herb)}</span>/次</span>
      <span class="ep-item">⭐ <span class="ep-val">${fmt(earnings.exp)}</span>经验/次</span>
      ${doubleStr}
    `;
  }

  // 离线收益弹窗
  const oe = window.gState.cultivation.offlineEarnings;
  const oeEl = document.getElementById('offline-earnings');
  if (oeEl) {
    if (oe) {
      oeEl.classList.add('show');
      const oeItems = document.getElementById('oe-items');
      if (oeItems) oeItems.innerHTML = `离线${oe.hours}小时：💎${fmt(oe.stone)} 🌿${fmt(oe.herb)} ⭐${fmt(oe.exp)}`;
    } else {
      oeEl.classList.remove('show');
    }
  }
}

function renderCultivationProgress() {
  // 仅更新进度条（高频率调用）
  const { CULTIVATION_CYCLE_MS } = window.GAME_CONSTANTS;
  const elapsed = Date.now() - window.gState.cultivation.lastTick;
  const progress = Math.min(100, (elapsed / CULTIVATION_CYCLE_MS) * 100);
  window.gState.cultivation.progress = progress;

  const fill = document.getElementById('progress-fill');
  const txt = document.getElementById('progress-text');
  if (fill) fill.style.width = progress + '%';
  if (txt) txt.textContent = Math.floor(progress) + '%';

  // 离线收益检测
  if (!window.gState.cultivation.offlineEarnings) {
    window.CULTIVATION.checkOfflineEarnings();
  }
}

// ============================================================
// 洞府面板
// ============================================================

function renderCavePanel() {
  const caveLevel = CAVE_LEVELS[window.gState.cave.level];
  const nextLevel = CAVE_LEVELS[window.gState.cave.level + 1];
  const caveEff = window.CULTIVATION.getCaveEfficiency();

  let html = `
    <div class="cave-level-card">
      <div class="cave-level-header">
        <span class="cave-name">${caveLevel.name}</span>
        <span class="cave-eff">灵气效率：${caveEff.toFixed(1)}x</span>
      </div>
  `;

  if (nextLevel) {
    const cost = nextLevel.upgradeCost;
    const costStr = cost ? Object.entries(cost).map(([r, a]) => `${ITEM_DEFS[r]?.icon || ''}${fmt(a)}${ITEM_DEFS[r]?.name || r}`).join(' ') : '';
    const reqStr = nextLevel.unlockRealm ? `（需${nextLevel.unlockRealm}）` : '';
    const canUp = window.CAVE.canUpgradeCave();
    html += `
      <div class="cave-upgrade-req">升级条件：${costStr} ${reqStr}</div>
      <button class="btn cave-upgrade-btn" ${canUp ? '' : 'disabled'} onclick="CAVE.upgradeCave()">
        升级为「${nextLevel.name}」（${nextLevel.eff}x）
      </button>
    `;
  } else {
    html += `
      <div class="cave-upgrade-req">已升至最高等级：天宫</div>
      <button class="btn cave-upgrade-btn" disabled>洞府已满级</button>
    `;
  }
  html += '</div>';

  // 附属建筑
  html += '<div class="cave-buildings"><div class="section-title">附属建筑</div>';
  for (const bld of BUILDINGS) {
    const curLv = window.CAVE.getBuildingLevel(bld.id);
    const isMax = curLv >= bld.maxLevel;
    const cost = window.CAVE.getBuildingCost(bld.id);
    const costStr = cost
      ? Object.entries(cost).map(([r, a]) => `${ITEM_DEFS[r]?.icon || ''}${fmt(a)}${ITEM_DEFS[r]?.name || r}`).join(' ')
      : '已满级';
    const canUp = window.CAVE.canUpgradeBuilding(bld.id);
    const nextEff = bld.id === 'spirit-array' ? `+${(curLv + 1) * 10}%` : '';

    html += `
      <div class="cave-building-item">
        <div>
          <div class="bld-name">${bld.name} ${curLv > 0 ? 'Lv.' + curLv : ''}</div>
          <div class="bld-desc">${bld.desc}</div>
          ${curLv > 0 && !isMax ? `<div class="bld-status">下一级：${nextEff || ''}</div>` : ''}
          ${isMax ? `<div class="bld-status" style="color:#d4a017">已满级</div>` : ''}
        </div>
        <button class="btn btn-secondary btn-small bld-btn"
          ${isMax || !canUp ? 'disabled' : ''}
          onclick="CAVE.upgradeBuilding('${bld.id}')">
          ${isMax ? '已满级' : '升级 ' + costStr}
        </button>
      </div>
    `;
  }
  html += '</div>';
  document.getElementById('panel-cave').innerHTML = html;
}

// ============================================================
// 修炼地点面板
// ============================================================

function renderLocationsPanel() {
  const { realm, realmLevel } = window.gState.player;
  const playerRealmOrder = REALM_ORDER.indexOf(realm);

  let html = '<div class="section-title" style="margin-bottom:14px;">修炼地点</div><div class="location-list">';

  for (const loc of LOCATIONS) {
    const isActive = loc.id === window.gState.cultivation.currentLocation;
    const unlocked = window.LOCATIONS_MODULE.isLocationUnlocked(loc);
    const canUse = window.LOCATIONS_MODULE.canAffordLocation(loc);

    const costStr = loc.cost > 0
      ? (loc.costType === 'stone' ? `💎${fmt(loc.cost)}`
        : loc.costType === 'contrib' ? `🏅${loc.cost}`
        : loc.costType === 'token' ? `🩸${loc.cost}`
        : loc.costType === 'elixir' ? `⚗️${loc.cost}`
        : `【${loc.cost}】`)
      : '免费';

    let statusLabel;
    if (isActive) statusLabel = '当前';
    else if (!unlocked) statusLabel = '未解锁';
    else if (!canUse) statusLabel = '资源不足';
    else statusLabel = '前往';

    html += `
      <div class="location-card" style="${isActive ? 'border-color:var(--accent-gold);background:#2a2a4e;' : ''}">
        <div class="loc-info">
          <div class="loc-name">${loc.name} <span class="loc-eff">${loc.eff}x</span> ${isActive ? '✅' : ''}</div>
          <div class="loc-meta">${loc.desc} · 消耗：${costStr}${loc.costType ? '/次' : ''}</div>
          ${!unlocked ? `<div class="loc-locked">🔒 ${loc.unlock || '境界不足'}</div>` : ''}
        </div>
        <button class="btn btn-small ${isActive ? 'btn-secondary' : ''} loc-btn"
          ${isActive || !unlocked || !canUse ? 'disabled' : ''}
          onclick="LOCATIONS_MODULE.switchLocation('${loc.id}')">
          ${statusLabel}
        </button>
      </div>
    `;
  }
  html += '</div>';
  document.getElementById('panel-locations').innerHTML = html;
}

// ============================================================
// 背包面板
// ============================================================

function renderInventory() {
  const allItems = [];

  // 收集所有非零资源
  for (const [id, count] of Object.entries(window.gState.resources)) {
    if (count > 0 && ITEM_DEFS[id]) {
      allItems.push({ id, ...ITEM_DEFS[id], count });
    }
  }
  // 加入背包物品
  for (const inv of window.gState.inventory) {
    const def = ITEM_DEFS[inv.id] || { name: inv.id, icon: '📦', color: '#888' };
    allItems.push({ id: inv.id, ...def, count: inv.count });
  }

  if (allItems.length === 0) {
    document.getElementById('panel-inventory').innerHTML = `
      <div class="section-title" style="margin-bottom:14px;">背包</div>
      <div style="text-align:center;color:var(--text-secondary);padding:40px 0;">背包空空如也</div>
    `;
    return;
  }

  let html = '<div class="section-title" style="margin-bottom:14px;">背包</div><div class="inventory-grid">';
  for (const item of allItems) {
    html += `
      <div class="inv-item" onclick="UI.showItemDetail('${item.id}', ${item.count})">
        <div class="item-icon">${item.icon}</div>
        <div class="item-count">x${fmt(item.count)}</div>
        <div class="item-name">${item.name}</div>
      </div>
    `;
  }
  html += '</div>';
  document.getElementById('panel-inventory').innerHTML = html;
}

function showItemDetail(itemId, count) {
  const def = ITEM_DEFS[itemId] || { name: itemId, icon: '📦' };
  showModal(def.name, `${def.icon} 数量：${fmt(count)}`, [
    { text: '确定', onClick: hideModal },
  ]);
}

// ============================================================
// 设置面板
// ============================================================

function renderSettings() {
  document.getElementById('panel-settings').innerHTML = `
    <div class="section-title" style="margin-bottom:14px;">设置</div>
    <div class="settings-list">
      <div class="settings-item">
        <div>
          <div class="si-label">存档管理</div>
          <div class="si-desc">当前存档自动保存在浏览器本地</div>
        </div>
        <button class="btn btn-secondary btn-small" onclick="UI.exportSave()">导出存档</button>
      </div>
      <div class="settings-item">
        <div>
          <div class="si-label">导入存档</div>
          <div class="si-desc">从之前导出的字符串恢复存档</div>
        </div>
        <button class="btn btn-secondary btn-small" onclick="UI.promptImport()">导入</button>
      </div>
      <div class="settings-item">
        <div>
          <div class="si-label">重置游戏</div>
          <div class="si-desc">删除所有数据，重新开始</div>
        </div>
        <button class="btn btn-secondary btn-small" onclick="UI.confirmReset()">重置</button>
      </div>
    </div>
  `;
}

// ============================================================
// 完整渲染
// ============================================================

function renderAll() {
  renderResources();
  renderPlayer();
  renderCultivation();
  renderCavePanel();
  renderLocationsPanel();
  renderInventory();
  renderSettings();
}

// 完整render别名
function render() {
  renderResources();
  renderPlayer();
  renderCultivation();
}

// ============================================================
// Tab 切换
// ============================================================

let currentTab = 'home';

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    const map = ['home', 'cave', 'locations', 'inventory', 'settings'];
    btn.classList.toggle('active', map[i] === tab);
  });

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  if (tab === 'home') return;

  const panelMap = {
    cave: 'panel-cave',
    locations: 'panel-locations',
    inventory: 'panel-inventory',
    settings: 'panel-settings',
  };
  if (panelMap[tab]) {
    document.getElementById(panelMap[tab]).classList.add('active');
  }

  if (tab === 'cave') renderCavePanel();
  if (tab === 'locations') renderLocationsPanel();
  if (tab === 'inventory') renderInventory();
  if (tab === 'settings') renderSettings();
}

// ============================================================
// 弹窗
// ============================================================

function showModal(title, body, buttons) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  const btnsEl = document.getElementById('modal-btns');
  btnsEl.innerHTML = '';
  for (const btn of buttons) {
    const el = document.createElement('button');
    el.className = 'btn';
    el.textContent = btn.text;
    el.onclick = () => { btn.onClick(); };
    btnsEl.appendChild(el);
  }
  document.getElementById('modal-overlay').classList.add('show');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

// ============================================================
// Toast
// ============================================================

let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ============================================================
// 存档管理UI
// ============================================================

function exportSave() {
  const encoded = window.STATE.exportState(window.gState);
  showModal('导出存档', '复制以下字符串备份存档：<br>' +
    '<textarea id="export-ta" readonly style="width:100%;height:80px;margin:10px 0;' +
    'background:#2a2a4e;color:#e8d5b7;border:1px solid var(--border-gold);' +
    'border-radius:8px;padding:8px;font-size:11px;">' + encoded + '</textarea>', [
    { text: '复制', onClick: () => {
      navigator.clipboard.writeText(encoded).then(() => showToast('已复制！'));
    }},
    { text: '关闭', onClick: hideModal },
  ]);
  setTimeout(() => {
    const ta = document.getElementById('export-ta');
    if (ta) ta.select();
  }, 100);
}

function promptImport() {
  showModal('导入存档', '粘贴之前导出的存档字符串：<br>' +
    '<textarea id="import-ta" style="width:100%;height:80px;margin:10px 0;' +
    'background:#2a2a4e;color:#e8d5b7;border:1px solid var(--border-gold);' +
    'border-radius:8px;padding:8px;font-size:11px;" placeholder="粘贴存档字符串..."></textarea>', [
    {
      text: '确认导入',
      onClick: () => {
        const ta = document.getElementById('import-ta');
        if (!ta || !ta.value.trim()) { showToast('请先粘贴存档！'); return; }
        const imported = window.STATE.importState(ta.value);
        if (!imported) { showToast('导入失败：格式错误！'); return; }
        window.gState = imported;
        window.STATE.saveState(window.gState);
        hideModal();
        renderAll();
        showToast('导入成功！');
      },
    },
    { text: '取消', onClick: hideModal },
  ]);
}

function confirmReset() {
  showModal('重置游戏', '确定要删除所有数据重新开始吗？此操作不可撤销！', [
    {
      text: '确认重置',
      onClick: () => {
        window.gState = window.STATE.resetState();
        window.gState = window.STATE.getState(); // 重新读取默认状态
        renderAll();
        hideModal();
        showToast('游戏已重置！');
      },
    },
    { text: '取消', onClick: hideModal },
  ]);
}

// ============================================================
// 导出UI模块
// ============================================================
window.UI = {
  fmt,
  render,
  renderAll,
  renderResources,
  renderPlayer,
  renderCultivation,
  renderCultivationProgress,
  renderCavePanel,
  renderLocationsPanel,
  renderInventory,
  renderSettings,
  showItemDetail,
  switchTab,
  showModal,
  hideModal,
  showToast,
  exportSave,
  promptImport,
  confirmReset,
};
