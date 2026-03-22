// ===== battle.js =====

// ---------- 玩家行动 ----------
function startBattle() {
    if(S.inBattle) return;
    
    // PVP模式：直接使用已导入的对手
    if(S.lobsterMode==='pvp'&&S.pvpOpponent) {
        const opp=S.pvpOpponent;
        opp.hp=opp.maxHp;
        opp.poisonDmg=0;opp.bleedDmg=0;opp.shields=0;
        opp.stunned=false;opp.sealed=false;
        opp.buffs=[];opp.reduceDmgRate=0;opp.defReduced=false;
        opp.resurrected=false;
        opp.vulnerable=0;opp.armorBroken=0;opp.regenLeft=0;
        S.enemy=opp;
        S.player.hp=S.player.maxHp;
        S.player.poisonDmg=0;S.player.bleedDmg=0;S.player.shields=0;
        S.player.stunned=false;S.player.sealed=false;
        S.player.reduceDmgRate=0;S.player.defReduced=false;
        S.player.buffs=[];
        S.player.vulnerable=0;S.player.armorBroken=0;S.player.regenLeft=0;
        S.playerCooldowns={};S.enemyCooldowns={};
        S.round=1;S.turn=0;
        S.inBattle=true;S.battleResult=null;
        document.getElementById('btn-start').disabled=true;
        addLog('<span class="log-enemy">⚔️ 对战: '+S.player.name+' vs '+opp.name+'!</span>');
        updateUI();
        setTimeout(()=>executeAutoTurn(),500);
        return;
    }
    
    showEnemySelect();
}

function showEnemySelect() {
    const list=document.getElementById('enemy-select-list');
    list.innerHTML='';
    
    // 无尽模式难度：round 6起
    const effectiveRound=S.lobsterMode==='endless'?S.round+5:S.round;
    
    for(let i=0;i<3;i++) {
        const r=effectiveRound+(i*0.5);
        // 难度曲线：round1 40% → round5 100%，逐轮递增，无尽模式从110%起
        const baseMod=S.lobsterMode==='endless'?1.1:Math.min(1, 0.4+(effectiveRound-1)*0.15);
        const m=(1+(r-1)*0.15)*baseMod;
        // 敌人等级：敌人1/2=Lv.round，敌人3=Lv.round+1
        const dispLvl=i<2?effectiveRound:effectiveRound+1;
        const nameOpt=ENEMY_NAMES[Math.min(dispLvl-1,ENEMY_NAMES.length-1)]||'强化龙虾#'+dispLvl;
        const hp=Math.floor((100+r*15)*m);
        const atk=Math.floor((7+r*1.3)*m);
        const def=Math.floor((3+r*0.8)*m);
        const spd=Math.floor((5+r*0.6)*m);
        const cnt=effectiveRound+(i===2?1:0);
        const avail=ALL_SKILLS.filter(x=>x.id!=='resurrect'||Math.random()<0.2);
        const skills=[...avail].sort(()=>Math.random()-0.5).slice(0,Math.min(cnt,avail.length));
        const div=document.createElement('div');
        div.className='enemy-option';
        div.innerHTML='<div class="enemy-option-name">🦞 '+nameOpt+' (Lv.'+dispLvl+')</div>'+
            '<div class="enemy-option-stats">生命:'+hp+' 攻:'+atk+' 防:'+def+' 速:'+spd+'</div>'+
            '<div class="enemy-option-skills">技能: '+skills.map(s=>s.icon+s.name).join(' ')+'</div>';
        div.onclick=()=>selectEnemy(nameOpt,dispLvl,hp,atk,def,spd,skills);
        list.appendChild(div);
    }
    document.getElementById('enemy-select-panel').classList.add('show');
}

function closeEnemySelect() {
    document.getElementById('enemy-select-panel').classList.remove('show');
}

function selectEnemy(name,level,hp,atk,def,spd,skills) {
    closeEnemySelect();
    S.player.hp=S.player.maxHp;
    S.player.poisonDmg=0;S.player.bleedDmg=0;S.player.shields=0;
    S.player.stunned=false;S.player.sealed=false;
    S.player.vulnerable=0;S.player.armorBroken=0;S.player.regenLeft=0;
    S.enemy={name,level,hp,maxHp:hp,atk,def,spd,
        skills:skills.map(s=>cloneSkill(s)),
        buffs:[],shields:0,poisonDmg:0,bleedDmg:0,alive:true,resurrected:false,
        stunned:false,sealed:false,resurrectRate:0,counterRate:0,reduceDmgRate:0,
        speedBoosted:false,defReduced:false,lifesteal:0,
        vulnerable:0,armorBroken:0,regenLeft:0};
    refreshPassiveSkills(S.enemy);
    S.playerCooldowns={};S.enemyCooldowns={};
    refreshPassiveSkills(S.player);
    S.inBattle=true;S.turn=0;
    document.getElementById('btn-start').disabled=true;
    updateUI();
    addLog('<span class="log-system">⚔️ 第 '+S.round+' 轮战斗开始!</span>');
    addLog('<span class="log-enemy">⚔️ 遇到野生 '+S.enemy.name+' (Lv.'+S.enemy.level+')</span>');
    addLog('<span class="log-system">📋 敌人技能: '+S.enemy.skills.map(s=>s.icon+s.name).join(' ')+'</span>');
    // 速度高的先手
    if(S.player.spd>=S.enemy.spd) {
        addLog('<span class="log-system">⚡ 我方速度更高，先手!</span>');
        S.turn=1;
        addLog('<span class="log-turn">━━━ 第 1 回合 ━━━</span>');
        setTimeout(()=>executeAutoTurn(),getBattleDelay());
    } else {
        addLog('<span class="log-system">⚡ 敌人速度更高，先手!</span>');
        S.turn=1;
        addLog('<span class="log-turn">━━━ 第 1 回合 ━━━</span>');
        setTimeout(()=>enemyTurn(),getBattleDelay());
    }
}

// 刷新被动技能加成
function refreshPassiveSkills(entity) {
    if(!entity) return;
    entity.lifesteal=0;entity.counterRate=0;entity.resurrectRate=0;
    entity.speedBoosted=false;entity.dodgeRate=0;entity.reflectRate=0;
    entity.reflectDmg=0;entity.shieldBoostRate=0;entity.regenRate=0;
    entity.skills.forEach(s=>{
        if(s.passive){
            if(s.id==='lifesteal') entity.lifesteal=s.lifesteal;
            if(s.id==='counter') entity.counterRate=s.counterRate;
            if(s.id==='resurrect') entity.resurrectRate=s.resurrectRate;
            if(s.id==='speedBoost'||s.id==='overclock') entity.speedBoosted=true;
            if(s.id==='dodge') entity.dodgeRate=s.dodgeRate||0.3;
            if(s.id==='reflect') { entity.reflectRate=s.reflectRate||0.3; entity.reflectDmg=s.reflectDmg||0.33; }
            if(s.id==='shield_boost') entity.shieldBoostRate=s.shieldBoostRate||0.5;
            if(s.id==='regenerate') entity.regenRate=s.regenRate||0.03;
        }
    });
}

// ---------- 玩家回合 ----------
function executeAutoTurn() {
    if(!S.inBattle) return;
    if(S.player.stunned) {
        addLog('<span class="log-player">😵 被晕了，无法行动!</span>');
        updateUI();
        setTimeout(()=>enemyTurn(),getBattleDelay());
        return;
    }
    if(S.player.sealed) {
        addLog('<span class="log-player">🔒 被封印了，无法行动!</span>');
        S.player.sealed=false;
        updateUI();
        setTimeout(()=>enemyTurn(),getBattleDelay());
        return;
    }
    const availSkills=S.player.skills.filter(s=>{
        if(s.passive) return false;
        const cd=S.playerCooldowns[s.id]||0;
        if(cd>0) return false;
        return true;
    });
    S.battleQueue=[];
    // 释放所有可用主动技能
    availSkills.forEach(skill=>S.battleQueue.push({type:'skill',skill}));
    // 技能释放完毕后进行一次普通攻击
    S.battleQueue.push({type:'attack'});
    S.isProcessing=true;
    processBattleQueue();
}

function processBattleQueue() {
    if(!S.inBattle||S.battleQueue.length===0) {
        S.isProcessing=false;
        if(S.enemy) S.enemy.hp=Math.max(0,S.enemy.hp);
        S.player.hp=Math.min(S.player.maxHp,S.player.hp);
        updateUI();
        if(S.enemy&&S.enemy.hp<=0) { enemyDefeated(); }
        else if(S.player.hp<=0) { playerDefeated(); }
        else if(S.inBattle) { setTimeout(()=>enemyTurn(),getBattleDelay()); }
        return;
    }
    const action=S.battleQueue.shift();
    const delay=getBattleDelay();
    if(action.type==='skill') {
        const skill=action.skill;
        if(skill.cd>0) S.playerCooldowns[skill.id]=skill.cd;
        addLog('<span class="log-player">🎯 '+S.player.name+' 使用 【'+skill.icon+skill.name+'】</span>');
        processSkillEffect(skill,S.player,S.enemy,true);
        updateUI();
        setTimeout(processBattleQueue,delay);
    } else if(action.type==='attack') {
        doNormalAttack(S.player,S.enemy,true,false);
        updateUI();
        setTimeout(processBattleQueue,delay);
    }
}

// ---------- 普通攻击 ----------
function doNormalAttack(attacker, defender, isPlayer, isSecondHit) {
    let atkDmg=Math.max(1,Math.floor((attacker.atk||0)*1.0));
    if(isSecondHit) atkDmg=Math.floor(atkDmg*0.5);
    const karmaSkill=attacker.skills.find(s=>s.id==='karma'&&s.passive);
    if(karmaSkill&&atkDmg>0) {
        if(Math.random()<0.2) {
            const healAmt=Math.floor(defender.maxHp*0.1);
            defender.hp=Math.min(defender.maxHp,defender.hp+healAmt);
            addLog('<span class="log-system">⚖️ 【善恶有报】触发! 治疗敌人 '+healAmt+' HP</span>');
            playAttackAnimation(isPlayer?'player-fighter':'enemy-fighter',isPlayer?'enemy-fighter':'player-fighter',false);
            return;
        } else { atkDmg*=2; }
    }
    const angerSkill=attacker.skills.find(s=>s.id==='anger'&&s.passive);
    if(angerSkill&&atkDmg>0) {
        const hpPct=attacker.hp/attacker.maxHp;
        if(hpPct<0.5) {
            const angerBoost=1+(0.5-hpPct)*2;
            atkDmg=Math.floor(atkDmg*angerBoost);
            addLog('<span class="log-system">😤 【愤怒】激活! 伤害×'+angerBoost.toFixed(1)+'</span>');
        }
    }
    const critSkill=attacker.skills.find(s=>s.id==='crit'&&s.passive);
    if(critSkill&&atkDmg>0&&Math.random()<0.5) {
        atkDmg*=2;
        addLog('<span class="log-system">💥 【必杀】暴击! 伤害×2</span>');
    }
    // 闪避判定
    if(defender.dodgeRate>0&&Math.random()<defender.dodgeRate) {
        addLog('<span class="log-system">💨 【闪避】'+(isPlayer?'敌人':'你')+'躲避了攻击!</span>');
        playAttackAnimation(isPlayer?'player-fighter':'enemy-fighter',isPlayer?'enemy-fighter':'player-fighter',false);
        return;
    }
    // 护盾吸收
    if(defender.shields>0) {
        const absorb=Math.min(defender.shields,atkDmg);
        defender.shields-=absorb;atkDmg-=absorb;
        if(absorb>0) addLog('<span class="log-system">🛡️ 护盾吸收了 '+absorb+' 伤害</span>');
    }
    // 易伤增伤
    if(defender.vulnerable>0) {
        atkDmg=Math.floor(atkDmg*1.4);
    }
    // 防御减伤
    let finalAtkDmg=atkDmg;
    if(defender.reduceDmgRate>0) {
        const reduced=Math.floor(atkDmg*defender.reduceDmgRate);
        finalAtkDmg-=reduced;
        if(reduced>0) addLog('<span class="log-system">🛡️ 减伤效果抵消了 '+reduced+' 伤害</span>');
    }
    if(defender.defReduced) {
        finalAtkDmg=Math.max(1,Math.floor(finalAtkDmg*0.7));
    } else if(defender.armorBroken>0) {
        const def=defender.def||0;
        finalAtkDmg=Math.max(1,Math.floor(finalAtkDmg*(1-def/(finalAtkDmg+100)*0.7)));
    } else {
        const def=defender.def||0;
        finalAtkDmg=Math.max(1,Math.floor(finalAtkDmg*(1-def/(finalAtkDmg+100))));
    }
    defender.hp-=finalAtkDmg;
    const hitType=isSecondHit?'（连击第2次）':'';
    addLog('<span class="log-'+(isPlayer?'player':'enemy')+'">👊 '+(isPlayer?attacker.name:'敌人')+'普通攻击'+hitType+'造成 '+finalAtkDmg+' 伤害</span>');
    showDamageNumber(document.getElementById(isPlayer?'enemy-fighter':'player-fighter'),finalAtkDmg,'');
    playAttackAnimation(isPlayer?'player-fighter':'enemy-fighter',isPlayer?'enemy-fighter':'player-fighter',false);
    // 吸血
    if(attacker.lifesteal>0) {
        const heal=Math.floor(finalAtkDmg*attacker.lifesteal);
        attacker.hp=Math.min(attacker.maxHp,attacker.hp+heal);
        addLog('<span class="log-heal">💉 【吸血】 回复 '+heal+' HP</span>');
    }
    // 反射判定
    if(defender.reflectRate>0&&Math.random()<defender.reflectRate) {
        const reflectDmg=Math.floor(finalAtkDmg*(defender.reflectDmg||0.33));
        attacker.hp-=reflectDmg;
        addLog('<span class="log-system">🪞 【反射】'+(isPlayer?'敌人':'你')+'反弹了 '+reflectDmg+' 伤害</span>');
        showDamageNumber(document.getElementById(isPlayer?'player-fighter':'enemy-fighter'),reflectDmg,'');
    }
    // 连击判定
    const comboSkill=attacker.skills.find(s=>s.id==='combo'&&s.passive);
    if(comboSkill&&!isSecondHit&&defender.hp>0&&Math.random()<0.5) {
        addLog('<span class="log-system">👊 【连击】触发! 再次攻击</span>');
        doNormalAttack(attacker,defender,isPlayer,true);
    }
}

// ---------- 技能效果 ----------
function processSkillEffect(skill, attacker, defender, isPlayer) {
    let totalDmg=0;
    const times=skill.times||1;
    const isCrit=Math.random()<(skill.critRate||0);
    const critMult=isCrit?(skill.critMult||2):1;
    const karmaSkill=attacker.skills.find(s=>s.id==='karma'&&s.passive);
    const karmaHeal=karmaSkill?(Math.random()<0.2):false;
    for(let t=0;t<times;t++) {
        let dmg=0;
        if(skill.minDmg||skill.minDmg===0) {
            if(skill.execute) {
                const hpPct=(defender.hp/defender.maxHp);
                dmg=Math.max(1,Math.floor((attacker.atk||0)*(hpPct<0.4?2:0.5)));
            } else {
                dmg=Math.max(1,Math.floor((attacker.atk||0)*skill.minDmg*critMult));
            }
        }
        if(karmaSkill&&dmg>0) {
            if(karmaHeal) {
                const healAmt=Math.floor(defender.maxHp*0.1);
                defender.hp=Math.min(defender.maxHp,defender.hp+healAmt);
                addLog('<span class="log-system">⚖️ 【善恶有报】触发! 治疗敌人 '+healAmt+' HP</span>');
                continue;
            } else { dmg*=2; }
        }
        const angerSkill=attacker.skills.find(s=>s.id==='anger'&&s.passive);
        if(angerSkill&&dmg>0) {
            const hpPct=attacker.hp/attacker.maxHp;
            if(hpPct<0.5) dmg=Math.floor(dmg*(1+(0.5-hpPct)*2));
        }
        // 偷取
        if(skill.drain) {
            const drainAmt=Math.floor((defender.hp||0)*skill.drain);
            defender.hp-=drainAmt;attacker.hp=Math.min(attacker.maxHp,(attacker.hp||0)+drainAmt);
            addLog('<span class="log-heal">'+(isPlayer?'我':'敌')+' 吸取 '+drainAmt+' HP</span>');
        }
        // 吸血
        if(skill.lifesteal) {
            const healAmt=Math.floor((dmg||0)*skill.lifesteal);
            attacker.hp=Math.min(attacker.maxHp,(attacker.hp||0)+healAmt);
            addLog('<span class="log-heal">'+(isPlayer?'我':'敌')+' 吸血 '+healAmt+' HP</span>');
        }
        // 易伤增伤
        if(defender.vulnerable>0) dmg=Math.floor(dmg*1.4);
        // 伤害计算
        if(skill.ignoreDef) { defender.hp-=dmg;totalDmg+=dmg; }
        else {
            let def=defender.def||0;
            if(defender.defReduced) def=def*0.3;
            else if(defender.armorBroken>0) def=def*0.7;
            const finalDmg=Math.max(1,Math.floor(dmg*(1-def/(dmg+100))));
            defender.hp-=finalDmg;totalDmg+=finalDmg;
        }
        if(isPlayer&&dmg>0) showDamageNumber(document.getElementById('enemy-fighter'),dmg+(isCrit?' 💥':''),isCrit?'crit':'damage');
        if(!isPlayer&&dmg>0) showDamageNumber(document.getElementById('player-fighter'),dmg+(isCrit?' 💥':''),isCrit?'crit':'damage');
    }
    if(isCrit&&totalDmg>0) addLog('<span class="log-crit">💥 暴击! 造成 '+totalDmg+' 伤害</span>');
    else if(totalDmg>0) addLog('<span class="log-damage">'+(isPlayer?'对敌':'对你')+'造成 '+totalDmg+' 伤害</span>');
    // DOT
    if(skill.poisonDmg) {
        defender.poisonDmg=(defender.poisonDmg||0)+skill.poisonDmg;
        addLog('<span class="log-damage">'+(isPlayer?'敌':'我')+' 中了剧毒!</span>');
    }
    if(skill.stunRate&&Math.random()<skill.stunRate) {
        defender.stunned=true;
        addLog('<span class="log-system">'+(isPlayer?'敌':'我')+' 被晕了!</span>');
    }
    if(skill.sealRate&&Math.random()<skill.sealRate) {
        defender.sealed=true;
        addLog('<span class="log-system">'+(isPlayer?'敌':'我')+' 被封印了!</span>');
    }
    // 防御减伤（给自己）
    if(skill.reduceDmg) attacker.reduceDmgRate=(attacker.reduceDmgRate||0)+skill.reduceDmg;
    // 速度提升
    if(skill.speedBoost) { attacker.speedBoosted=true; addLog('<span class="log-system">'+(isPlayer?'我':'敌')+' 速度翻倍!</span>'); }
    // 护盾（含护盾强化被动加成）
    if(skill.shield) {
        let shieldAmt=skill.shield;
        if(attacker.shieldBoostRate>0) shieldAmt=Math.floor(shieldAmt*(1+attacker.shieldBoostRate));
        attacker.shields=(attacker.shields||0)+shieldAmt;
        addLog('<span class="log-system">'+(isPlayer?'我':'敌')+' 获得 '+shieldAmt+' 层护盾!</span>');
    }
    // 反击/复活
    if(skill.counterRate) attacker.counterRate=skill.counterRate;
    if(skill.resurrectRate) attacker.resurrectRate=skill.resurrectRate;
    // 降防
    if(skill.reduceStat) defender.defReduced=true;
    // 破甲
    if(skill.armorBreakRate) {
        defender.armorBroken=(skill.armorBreakDuration||2);
        addLog('<span class="log-system">'+(isPlayer?'敌':'我')+' 护甲被击破! 防御降低30% ('+(skill.armorBreakDuration||2)+'回合)</span>');
    }
    // 再生（主动）
    if(skill.regenRate) {
        attacker.regenLeft=(skill.regenDuration||3);
        addLog('<span class="log-heal">'+(isPlayer?'我':'敌')+' 进入再生状态! 每回合恢复8%HP ('+(skill.regenDuration||3)+'回合)</span>');
    }
    // 易伤
    if(skill.vulnerabilityRate) {
        defender.vulnerable=(skill.vulnerabilityDuration||2);
        addLog('<span class="log-system">'+(isPlayer?'敌':'我')+' 受到易伤影响! 受伤增加40% ('+(skill.vulnerabilityDuration||2)+'回合)</span>');
    }
    // 即时治疗
    if(skill.healRate) {
        const healAmt=Math.floor(attacker.maxHp*skill.healRate);
        attacker.hp=Math.min(attacker.maxHp,attacker.hp+healAmt);
        addLog('<span class="log-heal">'+(isPlayer?'我':'敌')+' 恢复了 '+healAmt+' HP</span>');
    }
    // 镜反
    if(skill.mirrorRate) {
        const mirrorDmg=skill.mirrorDmg||0.33;
        if(Math.random()<skill.mirrorRate) {
            addLog('<span class="log-system">🪞 【镜反】反弹了 '+Math.floor(totalDmg*mirrorDmg)+' 伤害</span>');
            defender.hp-=Math.floor(totalDmg*mirrorDmg);
        }
    }
    if(isPlayer) playAttackAnimation('player-fighter','enemy-fighter',isCrit);
    else playAttackAnimation('enemy-fighter','player-fighter',isCrit);
    attacker.hp=Math.min(attacker.maxHp,attacker.hp);
    defender.hp=Math.max(0,defender.hp);
}

// ---------- 敌人回合 ----------
function enemyTurn() {
    if(!S.inBattle||!S.enemy) return;
    if(S.enemy.hp<=0) { enemyDefeated(); return; }
    if(S.enemy.stunned) {
        addLog('<span class="log-enemy">😵 敌人被晕了，无法行动!</span>');
        S.enemy.stunned=false;
        updateUI();
        setTimeout(()=>endTurn(),getBattleDelay());
        return;
    }
    if(S.enemy.sealed) {
        addLog('<span class="log-enemy">🔒 敌人被封印了，无法行动!</span>');
        S.enemy.sealed=false;
        updateUI();
        setTimeout(()=>endTurn(),getBattleDelay());
        return;
    }
    const availSkills=S.enemy.skills.filter(s=>{
        if(s.passive) return false;
        const cd=S.enemyCooldowns[s.id]||0;
        if(cd>0) return false;
        return true;
    });
    S.battleQueue=[];
    availSkills.forEach(skill=>S.battleQueue.push({type:'skill',skill,isPlayer:false}));
    S.battleQueue.push({type:'attack',isPlayer:false});
    processEnemyQueue();
}

function processEnemyQueue() {
    if(!S.inBattle||S.battleQueue.length===0) {
        S.isProcessing=false;
        if(S.enemy) S.enemy.hp=Math.min(S.enemy.maxHp,S.enemy.hp);
        S.player.hp=Math.max(0,S.player.hp);
        updateUI();
        if(S.player.hp<=0) { playerDefeated(); }
        else if(S.enemy&&S.enemy.hp<=0) { enemyDefeated(); }
        else if(S.inBattle) { setTimeout(()=>endTurn(),getBattleDelay()); }
        return;
    }
    const action=S.battleQueue.shift();
    const delay=getBattleDelay();
    if(action.type==='skill') {
        const skill=action.skill;
        if(skill.cd>0) S.enemyCooldowns[skill.id]=skill.cd;
        addLog('<span class="log-enemy">🎯 '+S.enemy.name+' 使用 【'+skill.icon+skill.name+'】</span>');
        processSkillEffect(skill,S.enemy,S.player,false);
        updateUI();
        setTimeout(processEnemyQueue,delay);
    } else if(action.type==='attack') {
        doNormalAttack(S.enemy,S.player,false,false);
        updateUI();
        setTimeout(processEnemyQueue,delay);
    }
}

function endTurn() {
    // 防御技能效果在回合开始时重置
    S.player.reduceDmgRate=0;
    if(S.enemy) S.enemy.reduceDmgRate=0;
    if(!S.inBattle) return;
    // CD减少
    for(let id in S.playerCooldowns) { if(S.playerCooldowns[id]>0) S.playerCooldowns[id]--; }
    for(let id in S.enemyCooldowns) { if(S.enemyCooldowns[id]>0) S.enemyCooldowns[id]--; }
    // 刷新被动
    refreshPassiveSkills(S.player);
    if(S.enemy) refreshPassiveSkills(S.enemy);
    // DOT伤害
    if(S.player.poisonDmg>0) {
        const pDmg=Math.floor(S.player.maxHp*S.player.poisonDmg);
        S.player.hp-=pDmg;
        addLog('<span class="log-damage">🔥 【中毒】你的龙虾受到 '+pDmg+' 伤害</span>');
        showDamageNumber(document.getElementById('player-fighter'),pDmg,'poison');
    }
    if(S.enemy&&S.enemy.poisonDmg>0) {
        const eDmg=Math.floor(S.enemy.maxHp*S.enemy.poisonDmg);
        S.enemy.hp-=eDmg;
        addLog('<span class="log-damage">🔥 【中毒】敌人受到 '+eDmg+' 伤害</span>');
    }
    if(S.player.bleedDmg>0) {
        const bDmg=Math.floor(S.player.maxHp*S.player.bleedDmg);
        S.player.hp-=bDmg;
        addLog('<span class="log-damage">🩸 【撕裂】你的龙虾受到 '+bDmg+' 伤害</span>');
        showDamageNumber(document.getElementById('player-fighter'),bDmg,'poison');
    }
    if(S.enemy&&S.enemy.bleedDmg>0) {
        const bDmg=Math.floor(S.enemy.maxHp*S.enemy.bleedDmg);
        S.enemy.hp-=bDmg;
        addLog('<span class="log-damage">🩸 【撕裂】敌人受到 '+bDmg+' 伤害</span>');
    }
    // 再生（被动+主动）
    if(S.player.regenLeft>0) {
        const regenAmt=Math.floor(S.player.maxHp*0.08);
        S.player.hp=Math.min(S.player.maxHp,S.player.hp+regenAmt);
        addLog('<span class="log-heal">🌱 【再生】你的龙虾恢复了 '+regenAmt+' HP</span>');
        S.player.regenLeft--;
    }
    if(S.player.regenRate>0) {
        const regenAmt=Math.floor(S.player.maxHp*S.player.regenRate);
        S.player.hp=Math.min(S.player.maxHp,S.player.hp+regenAmt);
        addLog('<span class="log-heal">🌿 【再生】你的龙虾恢复了 '+regenAmt+' HP</span>');
    }
    if(S.enemy&&S.enemy.regenLeft>0) {
        const regenAmt=Math.floor(S.enemy.maxHp*0.08);
        S.enemy.hp=Math.min(S.enemy.maxHp,S.enemy.hp+regenAmt);
        addLog('<span class="log-heal">🌱 【再生】敌人恢复了 '+regenAmt+' HP</span>');
        S.enemy.regenLeft--;
    }
    // 状态持续时间减少
    if(S.player.defReduced&&Math.random()<0.3) S.player.defReduced=false;
    if(S.enemy&&S.enemy.defReduced&&Math.random()<0.3) S.enemy.defReduced=false;
    if(S.player.armorBroken>0) { S.player.armorBroken--; if(S.player.armorBroken===0) addLog('<span class="log-system">你的龙虾护甲恢复了</span>'); }
    if(S.enemy&&S.enemy.armorBroken>0) { S.enemy.armorBroken--; if(S.enemy.armorBroken===0) addLog('<span class="log-system">敌人护甲恢复了</span>'); }
    if(S.player.vulnerable>0) { S.player.vulnerable--; if(S.player.vulnerable===0) addLog('<span class="log-system">你的龙虾易伤消退了</span>'); }
    if(S.enemy&&S.enemy.vulnerable>0) { S.enemy.vulnerable--; if(S.enemy.vulnerable===0) addLog('<span class="log-system">敌人易伤消退了</span>'); }
    S.player.buffs=[];
    if(S.enemy) S.enemy.buffs=[];
    updateUI();
    if(S.player.hp<=0) { playerDefeated(); return; }
    if(S.enemy&&S.enemy.hp<=0) { enemyDefeated(); return; }
    addLog('<span class="log-turn">━━━ 第 '+(S.turn+1)+' 回合 ━━━</span>');
    S.turn++;
    S.player.stunned=false;S.player.sealed=false;
    setTimeout(executeAutoTurn,getBattleDelay());
}
