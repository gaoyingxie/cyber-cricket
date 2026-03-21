// ===== state.js =====
// 全局游戏状态（由 initState() 初始化）
let S = {
    round:1, phase:0, turn:0, inBattle:false, battleResult:null,
    player:null, enemy:null, pendingEnemySkill:null, turnOrder:null,
    battleSpeed:1, playerCooldowns:{}, enemyCooldowns:{},
    battleQueue:[], isProcessing:false,
    lobsterMode:null, exported:false, waitingForExport:false,
    // 成虾模式专属
    noGrowth:false, noSkillSteal:false, noEquipDrop:false,
    pvpOpponent:null, pvpReady:false
};

function initState() {
    const oldSpeed = S.battleSpeed || 1;
    const oldMode = S.lobsterMode;
    const oldExported = S.exported || false;
    S = {
        round:1, phase:0, turn:0, inBattle:false, battleResult:null,
        pendingEnemySkill:null, turnOrder:null,
        battleSpeed:oldSpeed,
        playerCooldowns:{}, enemyCooldowns:{}, battleQueue:[],
        isProcessing:false,
        lobsterMode:oldMode, exported:oldExported, waitingForExport:false,
        player:(()=>{
            const bhp=Math.floor(110+Math.random()*20);
            const batk=Math.floor(9+Math.random()*3);
            const bdef=Math.floor(4+Math.random()*3);
            const bspd=Math.floor(5+Math.random()*8);
            const cnt=Math.random()<0.9?2:3;
            const s=[];
            while(s.length<cnt){
                const r=ALL_SKILLS[Math.floor(Math.random()*ALL_SKILLS.length)];
                if(!s.find(x=>x.id===r.id)) s.push(cloneSkill(r));
            }
            return {
                name:'我的龙虾', level:1, hp:bhp, maxHp:bhp, atk:batk, def:bdef, spd:bspd,
                phase:0, skills:s, equipment:{atk:null,def:null,hp:null},
                inventory:[], buffs:[],
                shields:0, poisonDmg:0, bleedDmg:0, alive:true, resurrectUsed:false,
                stunned:false, sealed:false, speedBoosted:false, defReduced:false,
                resurrectRate:0, counterRate:0, reduceDmgRate:0, lifesteal:0,
                baseHp:bhp, baseAtk:batk, baseDef:bdef, baseSpd:bspd,
                hpM:1, atkM:1
            };
        })()
    };
    // 刷新被动
    S.player.skills.forEach(s=>{
        if(s.passive){
            if(s.id==='lifesteal') S.player.lifesteal=s.lifesteal;
            if(s.id==='counter') S.player.counterRate=s.counterRate;
            if(s.id==='resurrect') S.player.resurrectRate=s.resurrectRate;
            if(s.id==='speedBoost'||s.id==='overclock') S.player.speedBoosted=true;
        }
    });
}

function cloneSkill(s) {
    return JSON.parse(JSON.stringify(s));
}

function getPhaseMult() {
    return PHASE_STAT_MULT[S.phase];
}

function calcPlayerStats() {
    const p=S.player;
    const m=getPhaseMult();
    const lvl=p.level-1;
    const hpM=p.hpM||1, atkM=p.atkM||1;
    p.maxHp=Math.floor((p.baseHp+lvl*15)*m*hpM);
    p.atk=Math.floor((p.baseAtk+lvl*2)*m*atkM);
    p.def=Math.floor((p.baseDef+lvl*1)*m*(p.defReduced?0.9:1));
    p.spd=Math.floor((p.baseSpd+lvl*1)*m*(p.speedBoosted?1.5:1));
    // 装备加成
    if(p.equipment.atk) p.atk+=getEquipValue(p.equipment.atk);
    if(p.equipment.def) p.def+=getEquipValue(p.equipment.def);
    if(p.equipment.hp) p.maxHp+=getEquipValue(p.equipment.hp)*5;
    p.maxHp=Math.max(1,p.maxHp);
    p.hp=Math.min(p.hp,p.maxHp);
}

function getBattleDelay() {
    return Math.floor(AUTO_BATTLE_DELAY / S.battleSpeed);
}

function getEquipValue(e) {
    return Math.floor(EQUIP_BASE_VALUES[e.type]*EQUIP_QUALITY_MULT[e.quality]*e.level);
}

function generateEquipment() {
    const type=EQUIP_TYPES[Math.floor(Math.random()*EQUIP_TYPES.length)];
    const quality=Math.floor(Math.random()*Math.min(3+S.round*0.3,5));
    const level=1+Math.min(Math.floor(S.round/2),10);
    const name=EQUIP_NAMES[type].name+' Lv.'+level;
    return {type,quality,level,name,icon:EQUIP_NAMES[type].icon};
}
