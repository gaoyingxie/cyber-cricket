// ===== modes.js =====

// ---------- 模式选择 ----------
function selectMode(mode) {
    document.getElementById('mode-select-panel').style.display='none';
    if(mode==='raise') {
        S.lobsterMode='raise';
        initState();
        showWelcomeLobster();
        document.getElementById('welcome-panel').classList.add('show');
        document.getElementById('btn-start').disabled=false;
    } else if(mode==='import') {
        S.lobsterMode='import';
        initState();
        document.getElementById('import-panel').classList.add('show');
        document.getElementById('import-code').value='';
        document.getElementById('import-error').style.display='none';
        document.getElementById('btn-start').disabled=false;
    }
    updateUI();
}

function restartGame() {
    document.getElementById('game-over').classList.remove('show','lose','win');
    document.getElementById('battle-log').innerHTML='';
    initState();
    showWelcomeLobster();
    document.getElementById('btn-start').disabled=false;
    document.getElementById('welcome-panel').classList.add('show');
    updateUI();
}

function closeWelcome() {
    document.getElementById('welcome-panel').classList.remove('show');
    document.getElementById('btn-start').disabled=false;
}

// ---------- 成虾导入/导出 ----------
function confirmImport() {
    const code=document.getElementById('import-code').value.trim();
    if(!code) return;
    const imported=importLobster(code);
    if(!imported) {
        document.getElementById('import-error').style.display='block';
        return;
    }
    document.getElementById('import-panel').classList.remove('show');
    document.getElementById('welcome-panel').classList.remove('show');
    addLog('<span class="log-system">🦐 成虾 【'+imported.name+'】 导入成功!</span>');
    updateUI();
}

function importLobster(code) {
    try {
        const decoded=new TextDecoder().decode(new Uint8Array(atob(code).split('').map(c=>c.charCodeAt(0))));
        const data=JSON.parse(decoded);
        if(!data.skills||!data.level||data.phase===undefined) return null;
        const baseHp=(data.maxHp||100)-(data.level-1)*15;
        const baseAtk=(data.atk||10)-(data.level-1)*2;
        const baseDef=(data.def||4)-(data.level-1)*1;
        const baseSpd=(data.spd||6)-(data.level-1)*1;
        S.player={
            name:data.name||'龙虾',
            level:data.level, phase:data.phase,
            hp:data.hp||data.maxHp, maxHp:data.maxHp||100,
            atk:data.atk||10, def:data.def||4, spd:data.spd||6,
            skills:(data.skills||[]).map(s=>cloneSkill(s)),
            equipment:data.equipment||{atk:null,def:null,hp:null},
            inventory:data.inventory||[],
            buffs:[], shields:0, poisonDmg:0, bleedDmg:0, alive:true,
            resurrected:false, resurrectedUsed:false,
            stunned:false, sealed:false,
            speedBoosted:false, defReduced:false,
            resurrectRate:0, counterRate:0, reduceDmgRate:0, lifesteal:0,
            baseHp, baseAtk, baseDef, baseSpd, hpM:1, atkM:1
        };
        S.player.skills.forEach(s=>{
            if(s.passive){
                if(s.id==='lifesteal') S.player.lifesteal=s.lifesteal;
                if(s.id==='counter') S.player.counterRate=s.counterRate;
                if(s.id==='resurrect') S.player.resurrectRate=s.resurrectRate;
                if(s.id==='speedBoost'||s.id==='overclock') S.player.speedBoosted=true;
            }
        });
        calcPlayerStats();
        return S.player;
    } catch(e) {
        return null;
    }
}

function exportLobster() {
    const data={
        name:S.player.name, level:S.player.level,
        hp:S.player.hp, maxHp:S.player.maxHp,
        atk:S.player.atk, def:S.player.def, spd:S.player.spd,
        phase:S.phase,
        skills:S.player.skills, equipment:S.player.equipment,
        inventory:S.player.inventory,
        baseHp:S.player.baseHp, baseAtk:S.player.baseAtk,
        baseDef:S.player.baseDef, baseSpd:S.player.baseSpd
    };
    const bytes=new TextEncoder().encode(JSON.stringify(data));
    let binary='';
    for(let i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function closeImportPanel() {
    document.getElementById('import-panel').classList.remove('show');
    document.getElementById('mode-select-panel').style.display='flex';
}
function closeExportPanel() {
    document.getElementById('export-panel').classList.remove('show');
    document.getElementById('btn-start').disabled=true;
    addLog('<span class="log-system">🦐 养虾完成！请复制成虾代码保存，或重新开始新游戏。</span>');
}
function showExportPanel() {
    const code=exportLobster();
    document.getElementById('export-code').value=code;
    document.getElementById('reward-panel').style.display='none';
    document.getElementById('export-panel').classList.add('show');
}
function copyExportCode() {
    const code=document.getElementById('export-code').value;
    navigator.clipboard.writeText(code).then(()=>{
        addLog('<span class="log-system">📋 成虾代码已复制到剪贴板!</span>');
    }).catch(()=>{
        document.getElementById('export-code').select();
        document.execCommand('copy');
        addLog('<span class="log-system">📋 成虾代码已复制到剪贴板!</span>');
    });
}
function showWelcomeLobster() {
    if(!S.player||!S.player.skills) return;
    const p=S.player;
    const sprite=PHASE_SPRITES[p.phase]||'🦐';
    const stats='生命:'+p.maxHp+' 攻:'+p.atk+' 防:'+p.def+' 速:'+p.spd;
    document.getElementById('welcome-sprite').textContent=sprite;
    document.getElementById('welcome-name').textContent=p.name+' (Lv.'+p.level+') '+PHASES[p.phase];
    document.getElementById('welcome-stats').textContent=stats;
    document.getElementById('welcome-skills').textContent='技能: '+p.skills.map(s=>s.icon+s.name).join(' ');
}
