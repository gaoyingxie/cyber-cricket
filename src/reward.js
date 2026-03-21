// ===== reward.js =====

function enemyDefeated() {
    if(S.inBattle===false) return; // 防止重复调用
    S.inBattle=false;
    S.battleResult='win';

    // PVP模式：一局定胜负，显示结果后直接结束
    if(S.lobsterMode==='pvp') {
        addLog('<span class="log-system">🎉 PVP胜利! 恭喜你击败了对手!</span>');
        document.getElementById('reward-title').textContent='🏆 PVP胜利!';
        document.getElementById('reward-evolution-container').style.display='none';
        document.getElementById('reward-skill-container').style.display='none';
        document.getElementById('reward-equip-container').style.display='none';
        document.getElementById('reward-panel').classList.add('show');
        document.getElementById('btn-start').disabled=true;
        S.waitingForExport=true; // 复用这个flag让closeReward处理结束
        updateUI();
        return;
    }

    // 升级（无尽模式不升级）
    if(!S.noGrowth) {
        S.player.level++;
        calcPlayerStats();
        S.player.hp=S.player.maxHp;
        addLog('<span class="log-system">🎉 胜利! 升级到 Lv.'+S.player.level+'!</span>');

        // 进化检查（Lv3→幼虾，Lv5→战斗虾）
        let evolved=false, evolvedSkill=null;
        if(S.player.level===3&&S.phase===0) {
            S.phase=1; evolved=true;
        } else if(S.player.level===5&&S.phase===1) {
            S.phase=2; evolved=true;
        }
        if(evolved) {
            calcPlayerStats();
            S.player.hp=S.player.maxHp;
            addLog('<span class="log-player">🌀 进化为 '+PHASES[S.phase]+'! 获得随机技能!</span>');
            const avail=ALL_SKILLS.filter(s=>!S.player.skills.find(p=>p.id===s.id));
            if(avail.length>0) {
                evolvedSkill=cloneSkill(avail[Math.floor(Math.random()*avail.length)]);
                S.player.skills.push(evolvedSkill);
                addLog('<span class="log-player">🌟 进化奖励: 获得 【'+evolvedSkill.icon+evolvedSkill.name+'】!</span>');
            }
        }
        if(evolved) {
            let evoText='🌀 进化为 <strong>'+PHASES[S.phase]+'</strong>！';
            if(evolvedSkill) evoText+='<br>🌟 领悟 '+evolvedSkill.icon+evolvedSkill.name;
            document.getElementById('reward-evolution-container').innerHTML=evoText;
            document.getElementById('reward-evolution-container').style.display='block';
            document.getElementById('reward-title').textContent='🎉 进化成功!';
        } else {
            document.getElementById('reward-evolution-container').style.display='none';
            document.getElementById('reward-title').textContent='🎉 战斗胜利!';
        }
    } else {
        // 无尽模式不成长
        S.player.hp=S.player.maxHp;
        addLog('<span class="log-system">🎉 无尽模式第 '+S.round+' 轮胜利!</span>');
        document.getElementById('reward-evolution-container').style.display='none';
        document.getElementById('reward-title').textContent='🎉 继续挑战!';
    }

    // 偷学敌人技能（无尽/PVP模式不偷学）
    if(!S.noSkillSteal&&S.enemy&&S.enemy.skills.length>0) {
        const enemySkillIdx=Math.floor(Math.random()*S.enemy.skills.length);
        const newSkill=cloneSkill(S.enemy.skills[enemySkillIdx]);
        if(!S.player.skills.find(s=>s.id===newSkill.id)) {
            S.player.skills.push(newSkill);
            addLog('<span class="log-player">🌟 偷学到新技能: '+newSkill.icon+newSkill.name+'</span>');
            document.getElementById('reward-skill-name').textContent=newSkill.icon+newSkill.name;
            document.getElementById('reward-skill-container').style.display='block';
        } else {
            document.getElementById('reward-skill-container').style.display='none';
        }
    } else {
        document.getElementById('reward-skill-container').style.display='none';
    }

    // 装备掉落（无尽/PVP模式不掉落）
    if(!S.noEquipDrop&&Math.random()<DROP_CHANCE) {
        const dropEquip=generateEquipment();
        S.player.inventory.push(dropEquip);
        addLog('<span class="log-system">📦 获得掉落装备: '+dropEquip.icon+dropEquip.name+' ['+EQUIP_QUALITY[dropEquip.quality]+']</span>');
        document.getElementById('reward-equip-container').style.display='block';
        document.getElementById('reward-equip-name').innerHTML=dropEquip.icon+dropEquip.name+' ['+EQUIP_QUALITY[dropEquip.quality]+'] +'+getEquipValue(dropEquip)+EQUIP_NAMES[dropEquip.type].desc;
    } else {
        document.getElementById('reward-equip-container').style.display='none';
    }

    document.getElementById('reward-panel').classList.add('show');
    document.getElementById('btn-start').disabled=false;

    // 养虾模式5轮结束：等待导出
    // 无尽模式永远不导出
    if(S.lobsterMode==='raise'&&S.round>=5&&!S.exported) {
        S.waitingForExport=true;
    }
    updateUI();
}

function playerDefeated() {
    if(S.player.resurrectRate>0&&!S.player.resurrectUsed&&Math.random()<S.player.resurrectRate) {
        S.player.hp=Math.floor(S.player.maxHp*0.5);
        S.player.resurrectUsed=true;
        playResurrectAnimation(document.getElementById('player-fighter'));
        addLog('<span class="log-player">✨ 神佑发动! 复活并恢复 50% HP!</span>');
        updateUI();
        return;
    }
    S.inBattle=false;
    S.battleResult='lose';
    addLog('<span class="log-system">💀 败北...</span>');
    document.getElementById('game-over-title').textContent='游戏结束';
    
    // PVP模式和无尽模式显示不同消息
    if(S.lobsterMode==='pvp') {
        document.getElementById('game-over-msg').textContent='你输掉了PVP对战...';
        document.getElementById('final-round').textContent='PVP';
    } else if(S.lobsterMode==='endless') {
        document.getElementById('game-over-msg').textContent='无尽模式第 '+S.round+' 轮挑战失败...';
        document.getElementById('final-round').textContent=S.round;
    } else {
        document.getElementById('game-over-msg').textContent='你的龙虾在第 '+S.round+' 轮倒下了...';
        document.getElementById('final-round').textContent=S.round;
    }
    document.getElementById('btn-start').disabled=true;
    setTimeout(()=>{
        document.getElementById('game-over').classList.add('show','lose');
    },2000);
}

function closeReward() {
    document.getElementById('reward-panel').classList.remove('show');
    
    // PVP模式：胜利后直接结束，不继续
    if(S.lobsterMode==='pvp'&&S.battleResult==='win') {
        S.waitingForExport=false;
        addLog('<span class="log-system">🦐 PVP对战结束!</span>');
        document.getElementById('game-over-title').textContent='🏆 PVP胜利!';
        document.getElementById('game-over-msg').textContent='你击败了对手!';
        document.getElementById('final-round').textContent='PVP';
        document.getElementById('btn-start').disabled=true;
        setTimeout(()=>{
            document.getElementById('game-over').classList.add('show','win');
        },1000);
        updateUI();
        return;
    }
    
    // 养虾模式5轮结束：显示成虾导出面板
    if(S.waitingForExport) {
        S.waitingForExport=false;
        S.round++;
        S.exported=true;
        showExportPanel();
        updateUI();
        return;
    }
    
    // 无尽模式和养虾模式继续下一轮
    S.round++;
    updateUI();
    document.getElementById('btn-start').disabled=false;
    if(S.player&&S.player.inventory&&S.player.inventory.length>0) {
        addLog('<span class="log-system">📦 背包有 '+S.player.inventory.length+' 件装备，请点击"装备"穿戴！</span>');
    }
}

// ---------- 装备系统 ----------
function openEquipPanel() {
    updateEquipSlots();
    updateInventoryList();
    document.getElementById('equip-panel').classList.add('show');
    document.getElementById('equip-backdrop').classList.add('show');
}
function closeEquipPanel() {
    document.getElementById('equip-panel').classList.remove('show');
    document.getElementById('equip-backdrop').classList.remove('show');
}
function updateEquipSlots() {
    ['atk','def','hp'].forEach(type=>{
        const el=document.getElementById('equip-slot-'+type);
        const e=S.player.equipment[type];
        if(e) {
            el.innerHTML=e.icon+' '+e.name+'<br><small>+'+getEquipValue(e)+'</small>';
            el.style.borderColor=EQUIP_QUALITY_COLOR[e.quality];
            el.style.color=EQUIP_QUALITY_COLOR[e.quality];
        } else {
            el.innerHTML='<small>空</small>';
            el.style.borderColor='#444';
            el.style.color='#888';
        }
    });
}
function updateInventoryList() {
    const list=document.getElementById('equip-inv-list');
    if(!list) return;
    if(S.player.inventory.length===0) {
        list.innerHTML='<div style="color:#888;text-align:center;padding:20px">背包空空</div>';
        return;
    }
    list.innerHTML=S.player.inventory.map((e,i)=>
        '<div class="equip-item" onclick="equipItem('+i+')" style="cursor:pointer;border-left:3px solid '+EQUIP_QUALITY_COLOR[e.quality]+'">'
        +e.icon+' '+e.name+' +'+getEquipValue(e)+'<br><small style="color:#888">'+EQUIP_NAMES[e.type].desc+'</small></div>'
    ).join('');
}
function equipItem(invIndex) {
    const e=S.player.inventory[invIndex];
    if(S.player.equipment[e.type]) {
        S.player.inventory.push(S.player.equipment[e.type]);
    }
    S.player.equipment[e.type]=e;
    S.player.inventory.splice(invIndex,1);
    calcPlayerStats();
    updateEquipSlots();
    updateInventoryList();
    updateUI();
    addLog('<span class="log-system">'+e.icon+' 装备 '+e.name+'!</span>');
}
function unequipItem(type) {
    const e=S.player.equipment[type];
    if(!e) return;
    S.player.inventory.push(e);
    S.player.equipment[type]=null;
    calcPlayerStats();
    updateEquipSlots();
    updateInventoryList();
    updateUI();
    addLog('<span class="log-system">'+e.icon+' 卸下 '+e.name+'</span>');
}
