// ===== constants.js =====
const VERSION = 'v2.00';
const PHASES=['虾苗','幼虾','战斗虾','铁甲虾','究极虾'];
const PHASE_SPRITES=['🦐','🦞','⚡🦞','🔱🦞','👑'];
const PHASE_STAT_MULT=[1,1.15,1.3,1.6,2.0];

const EQUIP_TYPES=['atk','def','hp'];
const EQUIP_NAMES={
    atk:{name:'力量芯片',icon:'⚔️',desc:'攻击+'},
    def:{name:'护甲碎片',icon:'🛡️',desc:'防御+'},
    hp:{name:'生命核心',icon:'❤️',desc:'生命+'}
};
const EQUIP_QUALITY=['普通','精良','稀有','史诗','传说'];
const EQUIP_QUALITY_COLOR=['#aaa','#00ff88','#4488ff','#ff44ff','#ffa500'];
const EQUIP_QUALITY_MULT=[1,1.5,2,3,5];
const EQUIP_BASE_VALUES={atk:3,def:2,hp:20};
const DROP_CHANCE=0.4;

const ALL_SKILLS=[
    // ===== 主动 =====
    {id:'combo',name:'连击',passive:true,desc:'[被动] 普通攻击50%概率再攻击一次',icon:'👊',cd:0},
    {id:'heavy',name:'重击',desc:'[主动] CD:0 效果 造成2.0倍伤害',minDmg:2.0,icon:'💪',cd:0},
    {id:'poison',name:'剧毒',desc:'[主动] CD:0 效果 造成0.6倍伤害+敌人每回合损失8%HP',minDmg:0.6,poisonDmg:0.08,icon:'☠️',cd:0},
    {id:'virus',name:'病毒注入',desc:'[主动] CD:0 效果 造成0.5倍伤害+敌人每回合损失6%HP+降属性',minDmg:0.5,poisonDmg:0.06,reduceStat:0.15,icon:'🦠',cd:0},
    {id:'hack',name:'数据入侵',desc:'[主动] CD:0 效果 造成0.5倍伤害+偷取敌人15%当前HP',minDmg:0.5,drain:0.15,icon:'💻',cd:0},
    {id:'emp',name:'电磁脉冲',desc:'[主动] CD:0 效果 造成0.8倍伤害+40%概率眩晕1回合',minDmg:0.8,stunRate:0.4,icon:'⚡',cd:0},
    {id:'shield_break',name:'护盾击破',desc:'[主动] CD:0 效果 无视护盾+造成2.0倍伤害',minDmg:2.0,ignoreDef:true,icon:'💎',cd:0},
    {id:'execute',name:'处决',desc:'[主动] CD:0 效果 敌人HP<50%时伤害×2，否则0.3×',minDmg:0,critRate:1,critMult:2,icon:'☠️',cd:0,execute:true},
    {id:'drain',name:'灵魂吸取',desc:'[主动] CD:0 效果 造成0.7倍伤害+偷取敌人12%最大HP',minDmg:0.7,drain:0.12,icon:'👻',cd:0},
    {id:'bleed',name:'撕裂',desc:'[主动] CD:0 效果 造成0.5倍伤害+敌人持续流血',minDmg:0.5,bleedDmg:0.08,icon:'🩸',cd:0},
    {id:'confuse',name:'混乱',desc:'[主动] CD:2 效果 35%概率使敌人眩晕1回合',stunRate:0.35,icon:'🌪️',cd:2},
    {id:'seal',name:'封印',desc:'[主动] CD:2 效果 30%概率封印敌人1回合',sealRate:0.3,icon:'🔮',cd:2},
    {id:'freeze',name:'冰冻',desc:'[主动] CD:2 效果 40%概率冻结敌人1回合',stunRate:0.4,icon:'❄️',cd:2},
    {id:'silence',name:'沉默',desc:'[主动] CD:2 效果 50%概率沉默敌人1回合',silenceRate:0.5,icon:'🔇',cd:2},
    {id:'defend',name:'防御',desc:'[主动] CD:1 效果 本回合受伤降低60%',reduceDmg:0.6,icon:'🛡️',cd:1},
    {id:'shield',name:'能量护盾',desc:'[主动] CD:2 效果 获得10层护盾',shield:10,icon:'🔰',cd:2},
    {id:'heal',name:'自我修复',desc:'[主动] CD:2 效果 恢复40%最大HP',healRate:0.4,icon:'💚',cd:2},
    {id:'mirror',name:'镜反',desc:'[主动] CD:2 效果 50%概率反弹50%伤害',mirrorRate:0.5,icon:'🪞',cd:2},
    // ===== 被动 =====
    {id:'crit',name:'必杀',passive:true,desc:'[被动] 普通攻击50%概率暴击造成2倍伤害',icon:'💥'},
    {id:'lifesteal',name:'吸血',passive:true,desc:'[被动] 造成伤害的25%转为自己HP',lifesteal:0.25,icon:'🩸'},
    {id:'counter',name:'反击',passive:true,desc:'[被动] 受到攻击时35%概率反击',counterRate:0.35,icon:'⚡'},
    {id:'resurrect',name:'神佑',passive:true,desc:'[被动] 死亡时15%概率复活并恢复50%HP',resurrectRate:0.15,icon:'✨'},
    {id:'armor',name:'护甲',passive:true,desc:'[被动] 受到伤害降低15%',armorRate:0.15,icon:'🛎️'},
    {id:'thorns',name:'荆棘',passive:true,desc:'[被动] 受到攻击时40%概率反弹20%伤害',thornsRate:0.4,icon:'🌹'},
    {id:'rage',name:'狂暴',passive:true,desc:'[被动] HP<50%时伤害×1.5',rageRate:0.5,icon:'😈'},
    {id:'karma',name:'善恶有报',passive:true,desc:'[被动] 80%概率双倍伤害/20%概率治疗敌人',karmaRate:0.8,icon:'⚖️'},
    {id:'anger',name:'愤怒',passive:true,desc:'[被动] HP越低伤害越高',angerRate:0.5,icon:'😤'},
];
const ENEMY_NAMES=['机械龙虾','电路龙虾','芯片龙虾','程序龙虾','数据龙虾','比特龙虾','代码龙虾','网络龙虾','云端龙虾','量子龙虾','深渊机甲龙虾','泰坦机械龙虾','风暴电子龙虾','雷霆硅基龙虾','混沌编程龙虾'];
const AUTO_BATTLE_DELAY = 750;
