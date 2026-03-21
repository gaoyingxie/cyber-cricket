// ===== ui.js =====

// ---------- 动画 ----------
function showDamageNumber(element, value, type) {
    if(!element) return;
    const div=document.createElement('div');
    div.className='damage-number'+(type?' '+type:'');
    div.textContent=value;
    const rect=element.getBoundingClientRect();
    div.style.left=(rect.left+rect.width/2-10+Math.random()*20)+'px';
    div.style.top=(rect.top+10)+'px';
    document.body.appendChild(div);
    setTimeout(()=>div.remove(),1200);
}

function playAttackAnimation(attackerId, targetId, isCrit) {
    const atk=document.getElementById(attackerId);
    const def=document.getElementById(targetId);
    if(!atk||!def) return;
    atk.classList.add('attacking');
    setTimeout(()=>{
        atk.classList.remove('attacking');
        def.classList.add('hit');
        if(isCrit) {
            def.classList.add('crit-effect');
            document.body.classList.add('crit-flash');
            setTimeout(()=>{document.body.classList.remove('crit-flash');},300);
            setTimeout(()=>def.classList.remove('crit-effect'),500);
        }
        setTimeout(()=>def.classList.remove('hit'),300);
    },300);
}

function playResurrectAnimation(element) {
    if(!element) return;
    element.classList.add('resurrected');
    setTimeout(()=>element.classList.remove('resurrected'),1500);
}

// ---------- 技能弹窗 ----------
function showSkillPopup(skillId) {
    const skill=ALL_SKILLS.find(s=>s.id===skillId);
    if(!skill) return;
    const popup=document.getElementById('skill-popup');
    popup.innerHTML=
        '<div class="skill-popup-icon">'+skill.icon+'</div>'+
        '<div class="skill-popup-name">'+skill.name+'</div>'+
        '<div class="skill-popup-desc">'+skill.desc+'</div>';
    document.getElementById('skill-backdrop').classList.add('show');
    popup.classList.add('show');
}
function hideSkillPopup() {
    document.getElementById('skill-backdrop').classList.remove('show');
    document.getElementById('skill-popup').classList.remove('show');
}

// ---------- 技能提示 ----------
let skillTooltipTimer=null;
function showSkillTooltip(skillId, event) {
    const skill=ALL_SKILLS.find(s=>s.id===skillId);
    if(!skill) return;
    const tip=document.getElementById('skill-tooltip');
    tip.innerHTML='<b>'+skill.icon+' '+skill.name+'</b><br>'+skill.desc;
    tip.style.display='block';
    positionTooltip(tip, event);
}
function hideSkillTooltip() {
    document.getElementById('skill-tooltip').style.display='none';
}
function positionTooltip(tip, event) {
    const x=event.clientX||0, y=event.clientY||0;
    tip.style.left=(x+15)+'px';
    tip.style.top=(y+15)+'px';
}

// ---------- 速度控制 ----------
function toggleSpeed() {
    const speeds=[1,2,3];
    const idx=speeds.indexOf(S.battleSpeed);
    S.battleSpeed=speeds[(idx+1)%speeds.length];
    updateSpeedButton();
    updateAutoIndicator();
}
function updateSpeedButton() {
    const btn=document.getElementById('speed-btn');
    if(btn) btn.textContent='⏩ '+S.battleSpeed+'x';
}
function updateAutoIndicator() {
    const indicator=document.getElementById('auto-indicator');
    if(indicator) indicator.style.display=S.autoMode?'inline':'none';
}

// ---------- 日志 ----------
function addLog(msg) {
    const log=document.getElementById('battle-log');
    if(!log) return;
    const div=document.createElement('div');
    div.innerHTML=msg;
    log.appendChild(div);
    log.scrollTop=log.scrollHeight;
    // 限制日志条数
    while(log.children.length>50) log.removeChild(log.firstChild);
}

// ---------- 主UI刷新 ----------
function updateUI() {
    if(!S.player) return;
    updatePlayerUI();
    if(S.enemy) updateEnemyUI();
    updateBuffsDisplay('player', S.player);
    if(S.enemy) updateBuffsDisplay('enemy', S.enemy);
    updateEvolveButton();
    renderSkillButtons();
}

function updatePlayerUI() {
    const p=S.player;
    const hpPct=Math.max(0,Math.min(100,(p.hp/p.maxHp)*100));
    document.getElementById('player-hp-bar').style.width=hpPct+'%';
    document.getElementById('player-hp-text').textContent=Math.floor(p.hp)+'/'+p.maxHp;
    document.getElementById('player-atk').textContent=p.atk;
    document.getElementById('player-def').textContent=p.def;
    document.getElementById('player-spd').textContent=p.spd;
    document.getElementById('player-level').textContent='Lv.'+p.level;
    const sprite=document.getElementById('player-fighter');
    if(sprite) sprite.textContent=PHASE_SPRITES[p.phase]||'🦐';
    document.getElementById('player-shields').textContent=p.shields>0?'🛡️ '+p.shields:'';
}

function updateEnemyUI() {
    const e=S.enemy;
    if(!e) return;
    const hpPct=Math.max(0,Math.min(100,(e.hp/e.maxHp)*100));
    document.getElementById('enemy-hp-bar').style.width=hpPct+'%';
    document.getElementById('enemy-hp-text').textContent=Math.floor(e.hp)+'/'+e.maxHp;
    document.getElementById('enemy-atk').textContent=e.atk;
    document.getElementById('enemy-def').textContent=e.def;
    document.getElementById('enemy-spd').textContent=e.spd;
    document.getElementById('enemy-level').textContent='Lv.'+e.level;
    const sprite=document.getElementById('enemy-fighter');
    if(sprite) sprite.textContent='🦞';
}

function updateBuffsDisplay(id, entity) {
    const container=document.getElementById(id+'-buffs');
    if(!container) return;
    const buffs=[];
    if(entity.poisonDmg>0) buffs.push('<span class="buff-poison">毒:'+Math.floor(entity.poisonDmg*100)+'%</span>');
    if(entity.bleedDmg>0) buffs.push('<span class="buff-bleed">血:'+Math.floor(entity.bleedDmg*100)+'%</span>');
    if(entity.shields>0) buffs.push('<span class="buff-shield">护:'+entity.shields+'层</span>');
    if(entity.stunned) buffs.push('<span class="buff-stun">晕</span>');
    if(entity.sealed) buffs.push('<span class="buff-seal">封</span>');
    if(entity.speedBoosted) buffs.push('<span class="buff-speed">加速</span>');
    if(entity.defReduced) buffs.push('<span class="buff-def">降防</span>');
    if(entity.reduceDmgRate>0) buffs.push('<span class="buff-defend">减伤:'+Math.floor(entity.reduceDmgRate*100)+'%</span>');
    if(entity.counterRate>0) buffs.push('<span class="buff-counter">反击:'+Math.floor(entity.counterRate*100)+'%</span>');
    container.innerHTML=buffs.join(' ');
}

function updateEvolveButton() {
    const btn=document.getElementById('evolve-btn');
    if(!btn) return;
    // 进化按钮逻辑（根据当前phase显示）
    btn.style.display='none';
}

// ---------- 技能按钮渲染 ----------
function renderSkillButtons() {
    const container=document.getElementById('skill-list');
    if(!container||!S.player) return;
    container.innerHTML='';
    S.player.skills.forEach(skill=>{
        if(skill.passive) return;
        const cd=S.playerCooldowns[skill.id]||0;
        const btn=document.createElement('button');
        btn.className='skill-btn';
        btn.disabled=cd>0||S.inBattle===false||S.isProcessing;
        btn.innerHTML=skill.icon+' '+skill.name+(cd>0?' ('+cd+')':'');
        btn.onclick=()=>{
            S.selectedSkill=skill.id;
            btn.classList.add('selected');
            document.querySelectorAll('.skill-btn').forEach(b=>{if(b!==btn) b.classList.remove('selected');});
        };
        btn.onmouseenter=(e)=>showSkillTooltip(skill.id, e);
        btn.onmouseleave=hideSkillTooltip;
        btn.ondblclick=()=>showSkillPopup(skill.id);
        container.appendChild(btn);
    });
}
