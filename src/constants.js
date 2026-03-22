// ===== constants.js =====
const VERSION = 'v2.25';
const PHASES=['虾苗','幼虾','战斗虾','铁甲虾','究极虾'];
const PHASE_SPRITES=['🦐','🦞','⚡','🔱','👑'];
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
    // ===== 主动技能 (22个) =====
    // 纯伤害型 - 高伤害/无额外效果
    {id:'heavy',name:'重击',desc:'[主动] CD:0 效果 造成1.5倍伤害',minDmg:1.5,icon:'💪',cd:0},
    {id:'emp',name:'电磁脉冲',desc:'[主动] CD:0 效果 造成0.8倍伤害+40%眩晕1回合',minDmg:0.8,stunRate:0.4,icon:'⚡',cd:0},

    // DOT+伤害型
    {id:'poison',name:'剧毒',desc:'[主动] CD:0 效果 造成0.7倍伤害+敌人每回合损失8%HP',minDmg:0.7,poisonDmg:0.08,icon:'☠️',cd:0},
    {id:'bleed',name:'撕裂',desc:'[主动] CD:0 效果 造成0.5倍伤害+敌人持续流血',minDmg:0.5,bleedDmg:0.08,icon:'🩸',cd:0},
    {id:'virus',name:'病毒注入',desc:'[主动] CD:0 效果 造成0.5倍伤害+敌人每回合损失6%HP+降属性',minDmg:0.5,poisonDmg:0.06,reduceStat:0.15,icon:'🦠',cd:0},

    // 偷取型
    {id:'hack',name:'数据入侵',desc:'[主动] CD:0 效果 造成0.5倍伤害+偷取敌人15%当前HP',minDmg:0.5,drain:0.15,icon:'💻',cd:0},
    {id:'drain',name:'灵魂吸取',desc:'[主动] CD:0 效果 造成0.7倍伤害+偷取敌人12%最大HP',minDmg:0.7,drain:0.12,icon:'👻',cd:0},

    // 护盾/防御无视型
    {id:'shield_break',name:'护盾击破',desc:'[主动] CD:0 效果 无视护盾+造成1.5倍伤害',minDmg:1.5,ignoreDef:true,icon:'💎',cd:0},

    // 条件型
    {id:'execute',name:'处决',desc:'[主动] CD:0 效果 敌人HP<40%时伤害×2，否则×0.5',minDmg:0,critRate:1,critMult:2,icon:'☠️',cd:0,execute:true},

    // 控制型（纯控制/进攻控制）
    {id:'confuse',name:'混乱',desc:'[主动] CD:2 效果 35%概率使敌人眩晕1回合',stunRate:0.35,icon:'🌪️',cd:2},
    {id:'seal',name:'封印',desc:'[主动] CD:2 效果 30%概率封印敌人1回合',sealRate:0.3,icon:'🔮',cd:2},
    {id:'freeze',name:'冰冻',desc:'[主动] CD:1 效果 造成0.5倍伤害+40%概率冻结敌人1回合',minDmg:0.5,stunRate:0.4,icon:'❄️',cd:1},
    {id:'silence',name:'沉默',desc:'[主动] CD:2 效果 50%概率沉默敌人1回合',silenceRate:0.5,icon:'🔇',cd:2},
    {id:'chaos_mark',name:'混乱印记',desc:'[主动] CD:2 效果 造成0.8倍伤害+35%眩晕+30%封印',minDmg:0.8,stunRate:0.35,sealRate:0.3,icon:'🔮',cd:2},

    // 防御/生存型
    {id:'defend',name:'防御',desc:'[主动] CD:1 效果 本回合受伤降低60%',reduceDmg:0.6,icon:'🛡️',cd:1},
    {id:'shield',name:'能量护盾',desc:'[主动] CD:2 效果 获得15层护盾',shield:15,icon:'🔰',cd:2},
    {id:'heal',name:'自我修复',desc:'[主动] CD:2 效果 恢复50%最大HP',healRate:0.5,icon:'💚',cd:2},
    {id:'mirror',name:'镜反',desc:'[主动] CD:2 效果 50%概率反弹33%伤害',mirrorRate:0.5,mirrorDmg:0.33,icon:'🪞',cd:2},

    // 新增技能
    {id:'armor_break',name:'破甲',desc:'[主动] CD:1 效果 造成1.2倍伤害+使敌人防御降低30%持续2回合',minDmg:1.2,armorBreakRate:0.3,armorBreakDuration:2,icon:'🔪',cd:1},
    {id:'regen',name:'再生',desc:'[主动] CD:2 效果 立即恢复20%HP+每回合恢复8%HP持续3回合',healRate:0.2,regenRate:0.08,regenDuration:3,icon:'🌱',cd:2},
    {id:'vulnerability',name:'易伤',desc:'[主动] CD:2 效果 使敌人受到伤害增加40%持续2回合',vulnerabilityRate:0.4,vulnerabilityDuration:2,icon:'☢️',cd:2},

    // ===== 被动技能 (13个) =====
    {id:'combo',name:'连击',passive:true,desc:'[被动] 普通攻击50%概率再攻击一次',icon:'👊',cd:0},
    {id:'crit',name:'必杀',passive:true,desc:'[被动] 普通攻击50%概率暴击造成2倍伤害',icon:'💥'},
    {id:'lifesteal',name:'吸血',passive:true,desc:'[被动] 造成伤害的25%转为自己HP',lifesteal:0.25,icon:'🩸'},
    {id:'counter',name:'反击',passive:true,desc:'[被动] 受到攻击时35%概率反击',counterRate:0.35,icon:'⚡'},
    {id:'resurrect',name:'神佑',passive:true,desc:'[被动] 死亡时15%概率复活并恢复50%HP',resurrectRate:0.15,icon:'✨'},
    {id:'armor',name:'护甲',passive:true,desc:'[被动] 受到伤害降低15%',armorRate:0.15,icon:'🛎️'},
    {id:'thorns',name:'荆棘',passive:true,desc:'[被动] 受到攻击时40%概率反弹20%伤害',thornsRate:0.4,icon:'🌹'},
    {id:'rage',name:'狂暴',passive:true,desc:'[被动] HP<50%时伤害×1.5',rageRate:0.5,icon:'😈'},
    {id:'karma',name:'善恶有报',passive:true,desc:'[被动] 80%概率双倍伤害/20%概率治疗敌人',karmaRate:0.8,icon:'⚖️'},
    {id:'anger',name:'愤怒',passive:true,desc:'[被动] HP越低伤害越高（最低+50%，最高+150%）',angerRate:0.5,icon:'😤'},
    // 新增被动
    {id:'dodge',name:'闪避',passive:true,desc:'[被动] 30%概率完全躲避受到的攻击',dodgeRate:0.3,icon:'💨'},
    {id:'reflect',name:'反射',passive:true,desc:'[被动] 30%概率反弹33%受到伤害',reflectRate:0.3,reflectDmg:0.33,icon:'🪞'},
    {id:'regenerate',name:'再生',passive:true,desc:'[被动] 每回合自动恢复3%最大HP',regenRate:0.03,icon:'🌿'},
    {id:'shield_boost',name:'护盾强化',passive:true,desc:'[被动] 护盾效果提升50%（15层→22层）',shieldBoostRate:0.5,icon:'🔰'},
];
const ENEMY_NAMES=['机械龙虾','电路龙虾','芯片龙虾','程序龙虾','数据龙虾','比特龙虾','代码龙虾','网络龙虾','云端龙虾','量子龙虾','深渊机甲龙虾','泰坦机械龙虾','风暴电子龙虾','雷霆硅基龙虾','混沌编程龙虾'];
const AUTO_BATTLE_DELAY = 750;
