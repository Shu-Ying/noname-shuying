const difficultyOrder = ["normal", "hard", "nightmare"];

const stages = [
    {
        id: "stage1",
        name: "第一关",
        // bosses: ["zishu_boss_shuying", "yanluowang_boss_shuying"],
        bosses: ["zishu_boss_shuying", "chouniu_boss_shuying", "yinhu_boss_shuying", "maotu_boss_shuying", "chenlong_boss_shuying", "sishe_boss_shuying", "wuma_boss_shuying", "weiyang_boss_shuying", "shenhou_boss_shuying", "youji_boss_shuying", "xvgou_boss_shuying", "haizhu_boss_shuying"],
    },
    {
        id: "stage2",
        name: "第二关",
        bosses: ["mengpo_boss_shuying", "baowei_boss_shuying", "niaozui_boss_shuying", "heibaiwuchang_boss_shuying", "niutoumamian_boss_shuying", "yvsai_boss_shuying", "huangfeng_boss_shuying", "riyeyoushen_boss_shuying", "guiwang_boss_shuying", "yanluowang_boss_shuying"],
    },
    {
        id: "stage3",
        name: "第三关",
        bosses: ["caocao_boss_shuying", "simayi_boss_shuying", "lvbu_boss_shuying", "dongzhuo_boss_shuying", "zhangjiao_boss_shuying", "yuanshu_boss_shuying"],
    },
    {
        id: "stage4",
        name: "第四关",
        bosses: ["shuishengonggong_boss_shuying", "huoshenzhurong_boss_shuying", "baiqi_boss_shuying", "kuafu_boss_shuying", "shaohao_boss_shuying", "xuannv_boss_shuying", "hanba_boss_shuying"],
    },
];

const bossList = Object.fromEntries(stages.map(stage => [stage.id, stage.bosses]));

const virtualIdols = {
    Xiaotao: "vtb_xiaotao",
    Xiaosha: "vtb_xiaosha",
    Xiaoshan: "vtb_xiaoshan",
    Xiaole: "vtb_xiaole",
    Xiaojiu: "vtb_xiaojiu",
};
const virtualIdolList = Object.values(virtualIdols);

// Boss 的体力与体力上限始终使用相同加成
const createDifficultyConfig = (startCards, hpBonus = 0) => ({
    startCards,
    hpBonus,
    maxHpBonus: hpBonus,
});

const bossDifficultyTemplates = {
    shiershengxiao: {
        normal: createDifficultyConfig(4),
        hard: createDifficultyConfig(6, 1),
        nightmare: createDifficultyConfig(8, 4),
    },
    zhuoguiquxie: {
        normal: createDifficultyConfig(4, 2),
        hard: createDifficultyConfig(6, 4),
        nightmare: createDifficultyConfig(8, 8),
    },
    qingqingzijin: {
        normal: createDifficultyConfig(6, 6),
        hard: createDifficultyConfig(8, 16),
        nightmare: createDifficultyConfig(10, 26),
    },
    tianshuluandou: {
        normal: createDifficultyConfig(6, 6),
        hard: createDifficultyConfig(8, 11),
        nightmare: createDifficultyConfig(12, 21),
    },
};

// 为单个 Boss 复制模板，并按难度覆盖其补充技能。
const createBossConfig = (template, skills = {}) => ({
    normal: { ...template.normal, ...(skills.normal?.length ? { skills: skills.normal } : {}) },
    hard: { ...template.hard, ...(skills.hard?.length ? { skills: skills.hard } : {}) },
    nightmare: { ...template.nightmare, ...(skills.nightmare?.length ? { skills: skills.nightmare } : {}) },
});

// 同组 Boss 使用相同模板，但生成彼此独立的配置对象。
const createBossGroup = (bosses, template) => Object.fromEntries(
    bosses.map(boss => [boss, createBossConfig(template)])
);

const addSkillFromHard = skill => ({ hard: [skill], nightmare: [skill] });

const bossDifficulty = {
    default: {
        normal: createDifficultyConfig(4),
        hard: createDifficultyConfig(5, 2),
        nightmare: createDifficultyConfig(6, 4),
    },
    bosses: {
        ...createBossGroup(stages[0].bosses, bossDifficultyTemplates.shiershengxiao),

        ...createBossGroup(["yvsai_boss_shuying", "huangfeng_boss_shuying"], bossDifficultyTemplates.zhuoguiquxie),
        mengpo_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            nightmare: ["guimei_shuying"],
        }),
        baowei_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, addSkillFromHard("yinsha_shuying")),
        niaozui_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, addSkillFromHard("bingyi_shuying")),
        heibaiwuchang_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            hard: ["xixing_shuying"],
            nightmare: ["xixing_shuying", "taiping_shuying"],
        }),
        riyeyoushen_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            nightmare: ["duane_shuying"],
        }),
        niutoumamian_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            hard: ["xiaoshou_shuying"],
            nightmare: ["xiaoshou_shuying", "guizhao_shuying"],
        }),
        guiwang_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            nightmare: ["chihu_shuying"],
        }),
        yanluowang_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            hard: ["zhennu_shuying"],
            nightmare: ["zhennu_shuying", "xuanpan_shuying"],
        }),

        caocao_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard("yishen_shuying")),
        simayi_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard("yuanlv_shuying")),
        lvbu_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard("zhanjia_shuying")),
        dongzhuo_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard("qubu_shuying")),
        yuanshu_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard("duoxi_shuying")),
        zhangjiao_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard("yinlei_shuying")),

        ...createBossGroup(["shaohao_boss_shuying", "xuannv_boss_shuying", "hanba_boss_shuying"], bossDifficultyTemplates.tianshuluandou),
        shuishengonggong_boss_shuying: createBossConfig(bossDifficultyTemplates.tianshuluandou, {
            nightmare: ["shuishen_shuying"],
        }),
        huoshenzhurong_boss_shuying: createBossConfig(bossDifficultyTemplates.tianshuluandou, {
            nightmare: ["huoshen_shuying"],
        }),
        baiqi_boss_shuying: createBossConfig(bossDifficultyTemplates.tianshuluandou, {
            normal: ["changsheng_shuying"],
            hard: ["shashen_shuying"],
            nightmare: ["changsheng_shuying", "shashen_shuying"],
        }),
        kuafu_boss_shuying: createBossConfig(bossDifficultyTemplates.tianshuluandou, {
            nightmare: ["shenqu_shuying"],
        }),
    },
};


const tianshuConfig = {
    bossList,
    stages,
    difficulties: {
        normal: {
            name: "普通",
            tag: "初入天书",
            description: "较低的起始手牌与体力加成，适合熟悉四关流程与奖励机制。",
        },
        hard: {
            name: "困难",
            tag: "渐入险境",
            description: "Boss拥有更多起始手牌、额外体力，部分Boss会取得追加技能。",
        },
        nightmare: {
            name: "阴间",
            tag: "九死一生",
            description: "Boss获得最高体力和手牌强化，并启用当前配置中的完整追加技能。",
        },
    },
    difficultyOrder,
    bossDifficulty,
    virtualIdolList,
    virtualIdols: {
        random: virtualIdolList,
        ...virtualIdols,
    },
    reward: {
        killRecover: 1,
        killDrawIfFullHp: 2,
        stageRecover: 1,
        stageDraw: 2,
        skillChoiceCount: 6,
    },
    settings: {
        virtualIdolConfigKey: "extension_术樱包_tianShu_Xvni",
        virtualIdolRandomPoolConfigKey: "extension_术樱包_tianShu_XvniRandomPool",
        virtualIdolReviveConfigKey: "extension_术樱包_tianShu_dead",
        addBossConfigKey: "extension_术樱包_tianShu_addBoss",
        revivePlayersConfigKey: "extension_术樱包_tianShu_revivePlayers",
        difficultyStatusKey: "shuYing_tianshuDifficulty",
    },
    skillPool: {
        additional: [
            "reguanxing", "rehuoji", "kongcheng",                                                       //蜀中无大将
            "rezhiheng", "sbjiang", "sbyingzi", "kurou", "repojun",                                     //江东基业
            "xinshenxing", "rezhijian", "pothaoshi", "xinzhiyan",                                       //舌战群儒
            "sbwushuang", "sbliyu",                                                                     //天下无双
            "ollongdan", "xinliegong", "new_rewusheng", "new_repaoxiao", "new_yajiao", "sbtieji",       //五虎上将
            "relieren", "decadezhennan", "gzjili", "spjiedao", "rezhiman", "mansi", "spxizhan",         //南蛮入侵
            "olchengxiang", "sbjizhi", "sbyiji", "zhiyu",                                               //奇策智囊
            "rejieming", "kaikang", "new_rejianxiong", "repindi", "xinwangxi",                          //天下归心
            "shencai", "wuling", "reshuishi", "mbtiantao", "mbxinghun", "qiexie", "yuli", "tingwei",    //神武再世
            "nzry_shicai", "remingce", "mizhao", "xinfu_tushe", "rejigong",                             //群雄逐鹿
            "xiaoji", "liangzhu", "mozhi", "olzhenlie", "zhiren",                                       //乱世佳人

        ],
        banned: ["huoxin", "jueqing", "qinqing", "beige", "huashen", "drlt_zhiti", "olzhiti", "xinfu_pdgyingshi", "rebeige"],
    },
    bonds: [
        {
            id: "shafa",
            name: "杀伐",
            keyword: "杀",
            levels: [
                {
                    level: 1,
                    count: 2,
                    condition: { type: "keyword", keyword: "杀", count: 2 },
                    skills: ["shuYing_Tianshu_BondSha1"],
                    text: "使用【杀】的次数上限+1",
                },
                {
                    level: 2,
                    count: 3,
                    condition: { type: "keyword", keyword: "杀", count: 3 },
                    skills: ["shuYing_Tianshu_BondSha2"],
                    text: "使用【杀】的次数上限+2",
                },
            ],
        },
        {
            id: "skill_01",
            name: "蜀中无大将",
            condition: {
                type: "skillNames",
                any: ["观星", "火计", "空城"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["dcjincui", "dcqingshi"],
                    text: "你获得“尽瘁”和“情势”",
                },
                {
                    level: 2,
                    count: 3,
                    skills: ["dcjincui", "dcqingshi", "dczhizhe", "shuYing_Tianshu_Skill_01"],
                    text: "你获得“尽瘁”、“情势”和“智哲”，防止你受到的所有无属性伤害，你造成的伤害增加你体力值点",
                },
            ],
        },
        {
            id: "skill_02",
            name: "江东基业",
            condition: {
                type: "skillNames",
                any: ["制衡", "激昂", "英姿", "锐军", "英魂", "反间", "诈降", "弓骑", "苦肉", "旋风", "破军", "奇袭"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_02_Skill1"],
                    text: "你的摸牌阶段额外已损失体力值张牌",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_02_Skill2"],
                    text: "你的摸牌阶段额外已损失体力值张牌，你弃置敌方牌时对其造成1点伤害",
                },
                {
                    level: 3,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_02_Skill3"],
                    text: "你的摸牌阶段额外已损失体力值张牌，你弃置敌方牌时对其造成等量点伤害，敌方获得你的牌时对其造成等量点伤害",
                },
            ],
        },
        {
            id: "skill_03",
            name: "舌战群儒",
            condition: {
                type: "skillNames",
                any: ["慎行", "直谏", "好施", "直言"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_03_Skill1"],
                    text: "你使用牌指定敌方时，随机弃置其1张牌",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_03_Skill2"],
                    text: "你使用牌指定敌方时，随机弃置其2张牌；你使用牌指定友方时其摸1张牌",
                }
            ],
        },
        {
            id: "skill_04",
            name: "天下无双",
            condition: {
                type: "skillNames",
                any: ["无双", "利驭"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_04_Skill1"],
                    text: "你使用的【决斗】伤害增加你体力值点",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_04_Skill2"],
                    text: "你使用的【杀】和【决斗】伤害增加你体力值点",
                }
            ],
        },
        {
            id: "skill_05",
            name: "五虎上将",
            condition: {
                type: "skillNames",
                any: ["龙胆", "烈弓", "武圣", "咆哮", "涯角", "铁骑"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_05_Skill1"],
                    text: "你使用【杀】伤害+1",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_05_Skill2"],
                    text: "你使用【杀】伤害+1且不限距离和次数",
                },
                {
                    level: 3,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_05_Skill3"],
                    text: "你使用【杀】伤害+1且不限距离和次数，你的手牌均视为【杀】",
                },
            ],
        },
        {
            id: "skill_06",
            name: "南蛮入侵",
            condition: {
                type: "skillNames",
                any: ["烈刃", "镇南", "蒺藜", "截刀", "制蛮", "蛮嗣", "嬉战"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_06_Skill1"],
                    text: "你使用【南蛮入侵】伤害增加你已损失的体力值点且对友方无效",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_06_Skill2"],
                    text: "你使用【南蛮入侵】伤害增加你已损失的体力值点且对友方无效，你的锦囊牌均视为【南蛮入侵】",
                },
                {
                    level: 3,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_06_Skill3"],
                    text: "你使用【南蛮入侵】伤害增加你已损失的体力值点且对友方无效，你的手牌牌均视为【南蛮入侵】",
                },
            ],
        },
        {
            id: "skill_07",
            name: "奇策智囊",
            condition: {
                type: "skillNames",
                any: ["驱虎", "连环", "奇策", "称象", "集智", "鬼才", "遗计", "智愚"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_07_Skill1"],
                    text: "你的锦囊牌无法被响应",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_07_Skill2"],
                    text: "你的锦囊牌无法被响应，且伤害值+1",
                },
                {
                    level: 3,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_07_Skill3"],
                    text: "你的锦囊牌无法被响应，且伤害值+1，你使用的锦囊牌造成伤害后你摸1张牌。",
                },
            ],
        },
        {
            id: "skill_08",
            name: "天下归心",
            condition: {
                type: "skillNames",
                any: ["节命", "慷忾", "贲育", "归心", "据守", "解围", "奸雄", "刚烈", "品第", "忘隙"],
            },
            levels: [
                {
                    level: 1,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_08_Skill1"],
                    text: "你受到敌方造成伤害后，随机获得所有敌方1张手牌，然后重置你的武将牌",
                },
                {
                    level: 2,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_08_Skill2"],
                    text: "你受到敌方造成的伤害后，随机获得所有敌方伤害值张手牌并对伤害来源造成2点伤害，然后重置你的武将牌",
                },
            ],
        },
        {
            id: "skill_09",
            name: "神武再世",
            condition: {
                type: "skillNames",
                any: ["魄袭", "涉猎", "攻心", "龙魂", "连破", "横骛", "神裁", "三首", "斩决", "凤燎", "武神", "五灵", "慧识", "天涛", "星魂", "挈挟", "驭雳", "霆威"],
            },
            levels: [
                {
                    level: 1,
                    count: 1,
                    skills: ["shuYing_Tianshu_Skill_09_Skill1"],
                    text: "你对敌方造成伤害后其流失1点体力",
                },
                {
                    level: 2,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_09_Skill2"],
                    text: "你对敌方造成伤害后其流失等量点体力",
                },
                {
                    level: 3,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_09_Skill3"],
                    text: "你对敌方造成伤害后其流失等量点体力，若有敌方一回合内流失的体力值大于你的体力值，其失去所有体力",
                },
            ],
        },
        {
            id: "skill_10",
            name: "群雄逐鹿",
            condition: {
                type: "skillNames",
                any: ["乱击", "酒池", "恃才", "从谏", "庸肆", "明策", "天命", "密诏", "饰非", "绝策", "图射", "狼袭", "自守", "宗室", "急攻", "矢北"],
            },
            levels: [
                {
                    level: 1,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_10_Skill1"],
                    text: "你的锦囊牌均视为【万箭齐发】且对友方无效",
                },
                {
                    level: 2,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_10_Skill2"],
                    text: "你的锦囊牌均视为【万箭齐发】且对友方无效，你使用【万箭齐发】时随机获得每名敌方目标的各1张手牌",
                },
            ],
        },
        {
            id: "skill_11",
            name: "乱世佳人",
            condition: {
                type: "skillNames",
                any: ["枭姬", "倾国", "流离", "离间", "悲歌", "良助", "陈情", "默识", "贞烈", "秘计", "结姻", "闭月", "怠宴", "织纴", "己诫"],
            },
            levels: [
                {
                    level: 1,
                    count: 2,
                    skills: ["shuYing_Tianshu_Skill_11_Skill1"],
                    text: "你每回合首次使用牌指定异性敌方时，其不能响应此牌；你每回合首对异性敌方造成的伤害+1",
                },
                {
                    level: 2,
                    count: 3,
                    skills: ["shuYing_Tianshu_Skill_11_Skill2"],
                    text: "你使用牌指定异性敌方时，其不能响应此牌；你对异性敌方造成的伤害+1",
                },
            ],
        },
    ],
};

// // 羁绊配置模板，仅供复制参考，不会被系统加载。
// // 所有 condition 都只检查玩家过关选择且当前仍持有的技能。
// const bondTemplates = {
//     // 技能描述关键词计数，并以最高等级覆盖低等级。
//     keywordLevels: {
//         id: "keyword_levels_example",
//         name: "关键词多等级模板",
//         keyword: "杀",
//         levels: [
//             {
//                 level: 1,
//                 count: 2,
//                 condition: { type: "keyword", keyword: "杀", count: 2 },
//                 skills: ["reward_skill_level1"],
//                 text: "两个包含【杀】的过关技能时获得一级效果",
//             },
//             {
//                 level: 2,
//                 count: 3,
//                 condition: { type: "keyword", keyword: "杀", count: 3 },
//                 skills: ["reward_skill_level2"],
//                 text: "三个包含【杀】的过关技能时以二级效果替换一级效果",
//             },
//         ],
//     },
//     // 选择一个指定技能后，发放一个羁绊奖励技能。
//     singleSkill: {
//         id: "single_skill_example",
//         name: "单技能模板",
//         levels: [{
//             level: 1,
//             condition: { type: "skill", skill: "guanxing" },
//             skill: "reward_skill",
//             text: "选择【观星】后获得一个奖励技能",
//         }],
//     },
//     // 按技能译名匹配：guanxing、reguanxing、sbguanxing 等译名均为“观星”时都会满足。
//     translatedSkillName: {
//         id: "translated_skill_name_example",
//         name: "同名技能模板",
//         levels: [{
//             level: 1,
//             condition: { type: "skillName", name: "观星" },
//             skill: "reward_skill",
//             text: "选择任意版本的【观星】后获得奖励技能",
//         }],
//     },
//     // 多个译名组合：各名称只需命中任意一个同名技能 ID。
//     translatedSkillNames: {
//         id: "translated_skill_names_example",
//         name: "同名技能组合模板",
//         levels: [{
//             level: 1,
//             condition: { type: "skillNames", all: ["观星", "空城"] },
//             skills: ["reward_skill_a", "reward_skill_b"],
//             text: "选择任意版本的【观星】和【空城】后获得奖励",
//         }],
//     },
//     // 按不同译名计数：观星、界观星等同译名版本合计只算一种，不能重复推进等级。
//     translatedSkillNameLevels: {
//         id: "translated_skill_name_levels_example",
//         name: "蜀中无大将",
//         condition: { type: "skillNames", any: ["观星", "火计", "空城"] },
//         levels: [
//             { level: 1, count: 1, skill: "reward_skill_level1", text: "具有其中一种不同译名时获得一级效果" },
//             { level: 2, count: 3, skill: "reward_skill_level2", text: "集齐观星、火计、空城时以二级效果覆盖一级效果" },
//         ],
//     },
//     // 按武将译名关键词检索：配置“甘宁”可匹配☆甘宁、界甘宁、谋甘宁、极·甘宁等名称。
//     translatedCharacterSingleSkill: {
//         id: "translated_character_single_skill_example",
//         name: "武将名称检索单技能模板",
//         levels: [{
//             level: 1,
//             condition: { type: "characterSkillNames", character: "甘宁", all: ["奇袭"] },
//             skill: "reward_skill",
//             text: "武将译名包含“甘宁”且取得任意版本的【奇袭】后获得奖励技能",
//         }],
//     },
//     // 名称匹配武将取得多个指定译名技能；双将时主将、副将任一名称命中即可。
//     translatedCharacterMultipleSkills: {
//         id: "translated_character_multiple_skills_example",
//         name: "武将名称检索多技能模板",
//         levels: [{
//             level: 1,
//             condition: { type: "characterSkillNames", character: "甘宁", all: ["奇袭", "奋威"] },
//             skills: ["reward_skill_a", "reward_skill_b"],
//             text: "任意名称包含“甘宁”的武将取得【奇袭】和【奋威】后获得两个奖励技能",
//         }],
//     },
//     // characters 可填写多个名称关键词；any 表示取得列出的任意一个技能即可触发。
//     translatedCharacterAnySkill: {
//         id: "translated_character_any_skill_example",
//         name: "多武将关键词任选技能模板",
//         levels: [{
//             level: 1,
//             condition: { type: "characterSkillNames", characters: ["甘宁", "吕蒙"], any: ["奇袭", "克己"] },
//             skill: "reward_skill",
//             text: "武将名称包含“甘宁”或“吕蒙”，并取得【奇袭】或【克己】后获得奖励技能",
//         }],
//     },
//     // 必须同时选择全部指定技能；可一次发放多个羁绊奖励技能。
//     allSkills: {
//         id: "all_skills_example",
//         name: "诸葛亮羁绊模板",
//         levels: [{
//             level: 1,
//             condition: { type: "skills", all: ["guanxing", "kongcheng"] },
//             skills: ["reward_skill_a", "reward_skill_b"],
//             text: "同时拥有过关选择的【观星】和【空城】时获得两个奖励技能",
//         }],
//     },
//     // 任意选择一个指定技能即可满足，适合原版/界限突破等同类技能。
//     anySkill: {
//         id: "any_skill_example",
//         name: "任一技能模板",
//         levels: [{
//             level: 1,
//             condition: { type: "skills", any: ["guanxing", "reguanxing"] },
//             skills: ["reward_skill"],
//             text: "选择【观星】或【界观星】中的任意一个时获得奖励技能",
//         }],
//     },
//     // all/any 可以嵌套，适合多个技能组共同组成羁绊。
//     nestedCombination: {
//         id: "nested_combination_example",
//         name: "嵌套组合模板",
//         levels: [{
//             level: 1,
//             condition: {
//                 all: [
//                     { any: [{ type: "skill", skill: "guanxing" }, { type: "skill", skill: "reguanxing" }] },
//                     { type: "skill", skill: "kongcheng" },
//                     { type: "keyword", keyword: "锦囊", count: 2 },
//                 ],
//             },
//             skills: ["reward_skill"],
//             text: "满足任一观星、空城和两个【锦囊】关键词技能时获得奖励",
//         }],
//     },
//     // not 用于排除指定技能；需要与其他条件组合时将其放进 all 数组。
//     excludedSkill: {
//         id: "excluded_skill_example",
//         name: "排除条件模板",
//         levels: [{
//             level: 1,
//             condition: {
//                 all: [
//                     { type: "keyword", keyword: "桃", count: 2 },
//                     { not: { type: "skill", skill: "forbidden_skill" } },
//                 ],
//             },
//             skills: ["reward_skill"],
//             text: "有两个【桃】关键词技能且未选择排除技能时获得奖励",
//         }],
//     },
// };

export default tianshuConfig;
