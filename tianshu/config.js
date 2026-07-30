const bossList = {
    //stage1: ["riyeyoushen_boss_shuying", "dongzhuo_boss_shuying"],
    stage1: ["chenlong_boss_shuying", "weiyang_boss_shuying", "shenhou_boss_shuying", "xvgou_boss_shuying"],
    stage2: ["heibaiwuchang_boss_shuying", "yvsai_boss_shuying", "huangfeng_boss_shuying", "riyeyoushen_boss_shuying"],
    stage3: ["caocao_boss_shuying", "simayi_boss_shuying", "lvbu_boss_shuying", "dongzhuo_boss_shuying"],
    stage4: ["shuishengonggong_boss_shuying", "shaohao_boss_shuying", "xuannv_boss_shuying", "hanba_boss_shuying"],
};

const virtualIdolList = ["vtb_xiaotao", "vtb_xiaosha", "vtb_xiaoshan", "vtb_xiaole", "vtb_xiaojiu"];

const difficultyOrder = ["normal", "hard", "nightmare"];

const bossDifficultyTemplates = {
    shiershengxiao:
    {
        normal: {
            startCards: 4,
        },
        hard: {
            startCards: 6,
            hpBonus: 1,
            maxHpBonus: 1,
        },
        nightmare: {
            startCards: 8,
            hpBonus: 4,
            maxHpBonus: 4,
        },
    },

    zhuoguiquxie: {
        normal: {
            startCards: 4,
            hpBonus: 2,
            maxHpBonus: 2,
        },
        hard: {
            startCards: 6,
            hpBonus: 4,
            maxHpBonus: 4,
        },
        nightmare: {
            startCards: 8,
            hpBonus: 8,
            maxHpBonus: 8,
        },
    },

    qingqingzijin: {
        normal: {
            startCards: 6,
            hpBonus: 6,
            maxHpBonus: 6,
        },
        hard: {
            startCards: 8,
            hpBonus: 16,
            maxHpBonus: 16,
        },
        nightmare: {
            startCards: 10,
            hpBonus: 26,
            maxHpBonus: 26,
        },
    },

    tianshuluandou:
    {
        normal: {
            startCards: 6,
            hpBonus: 6,
            maxHpBonus: 6,
        },
        hard: {
            startCards: 8,
            hpBonus: 11,
            maxHpBonus: 11,
        },
        nightmare: {
            startCards: 12,
            hpBonus: 21,
            maxHpBonus: 21,
        },
    },
};

const bossDifficulty = {
    default: {
        normal: {
            startCards: 4,
            hp: null,
            maxHp: null,
            hpBonus: 0,
            maxHpBonus: 0,
            skills: [],
        },
        hard: {
            startCards: 5,
            hp: null,
            maxHp: null,
            hpBonus: 2,
            maxHpBonus: 2,
            skills: [],
        },
        nightmare: {
            startCards: 6,
            hp: null,
            maxHp: null,
            hpBonus: 4,
            maxHpBonus: 4,
            skills: [],
        },
    },
    bosses: {
        chenlong_boss_shuying: { ...bossDifficultyTemplates.shiershengxiao, },
        weiyang_boss_shuying: { ...bossDifficultyTemplates.shiershengxiao, },
        shenhou_boss_shuying: { ...bossDifficultyTemplates.shiershengxiao, },
        xvgou_boss_shuying: { ...bossDifficultyTemplates.shiershengxiao, },

        heibaiwuchang_boss_shuying: {
            ...bossDifficultyTemplates.zhuoguiquxie,
            hard: {
                ...bossDifficultyTemplates.zhuoguiquxie.hard,
                skill: ["xixing_shuying"],
            },
            nightmare: {
                ...bossDifficultyTemplates.zhuoguiquxie.nightmare,
                skill: ["xixing_shuying", "taiping_shuying"],
            },
        },
        yvsai_boss_shuying: {
            ...bossDifficultyTemplates.zhuoguiquxie,
        },
        huangfeng_boss_shuying:
        {
            ...bossDifficultyTemplates.zhuoguiquxie,
        },
        riyeyoushen_boss_shuying: {
            ...bossDifficultyTemplates.zhuoguiquxie,
            nightmare: {
                ...bossDifficultyTemplates.zhuoguiquxie.nightmare,
                skill: ["duane_shuying"],
            },
        },

        caocao_boss_shuying:
        {
            ...bossDifficultyTemplates.qingqingzijin,
            hard: {
                ...bossDifficultyTemplates.qingqingzijin.hard,
                skills: ["yishen_shuying"],
            },
            nightmare: {
                ...bossDifficultyTemplates.qingqingzijin.nightmare,
                skills: ["yishen_shuying"],
            },
        },
        simayi_boss_shuying:
        {
            ...bossDifficultyTemplates.qingqingzijin,
            hard: {
                ...bossDifficultyTemplates.qingqingzijin.hard,
                skills: ["yuanlv_shuying"],
            },
            nightmare: {
                ...bossDifficultyTemplates.qingqingzijin.nightmare,
                skills: ["yuanlv_shuying"],
            },
        },
        lvbu_boss_shuying: {
            ...bossDifficultyTemplates.qingqingzijin,
            hard: {
                ...bossDifficultyTemplates.qingqingzijin.hard,
                skills: ["zhanjia_shuying"],
            },
            nightmare: {
                ...bossDifficultyTemplates.qingqingzijin.nightmare,
                skills: ["zhanjia_shuying"],
            },
        },
        dongzhuo_boss_shuying: {
            ...bossDifficultyTemplates.qingqingzijin,
            hard: {
                ...bossDifficultyTemplates.qingqingzijin.hard,
                skills: ["qubu_shuying"],
            },
            nightmare: {
                ...bossDifficultyTemplates.qingqingzijin.nightmare,
                skills: ["qubu_shuying"],
            },
        },

        shuishengonggong_boss_shuying: {
            ...bossDifficultyTemplates.tianshuluandou,
            hard: {
                ...bossDifficultyTemplates.tianshuluandou.hard,
                skill: ["shuishen_shuying"],
            },
            nightmare: {
                ...bossDifficultyTemplates.tianshuluandou.nightmare,
                skill: ["shuishen_shuying"],
            },
        },
        shaohao_boss_shuying: { ...bossDifficultyTemplates.tianshuluandou, },
        xuannv_boss_shuying: { ...bossDifficultyTemplates.tianshuluandou, },
        hanba_boss_shuying: { ...bossDifficultyTemplates.tianshuluandou, },


        baiqi_boss_shuying: {},
        pangu_boss_shuying: {},
    },
};

const tianshuConfig = {
    bossList,
    stages: [
        {
            id: "stage1",
            name: "第一关",
            bosses: bossList.stage1,
        },
        {
            id: "stage2",
            name: "第二关",
            bosses: bossList.stage2,
        },
        {
            id: "stage3",
            name: "第三关",
            bosses: bossList.stage3,
        },
        {
            id: "stage4",
            name: "第四关",
            bosses: bossList.stage4,
        },
    ],
    difficulties: {
        normal: {
            name: "普通",
        },
        hard: {
            name: "困难",
        },
        nightmare: {
            name: "阴间",
        },
    },
    difficultyOrder,
    bossDifficulty,
    virtualIdolList,
    virtualIdols: {
        random: virtualIdolList,
        Xiaojiu: "vtb_xiaojiu",
        Xiaosha: "vtb_xiaosha",
        Xiaoshan: "vtb_xiaoshan",
        Xiaole: "vtb_xiaole",
        Xiaotao: "vtb_xiaotao",
    },
    reward: {
        killRecover: 1,
        killDrawIfFullHp: 2,
        stageRecover: 1,
        stageDraw: 2,
        skillChoiceCount: 5,
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
        banned: ["huoxin", "jueqing", "qinqing", "beige", "huashen", "drlt_zhiti", "olzhiti", "xinfu_pdgyingshi", "rebeige"],
    },
    keywordBuffs: [
        {
            keyword: "杀",
            levels: [
                { count: 2, damageBonus: 1 },
                { count: 3, damageBonus: 2 },
            ],
        },
        {
            keyword: "闪",
            levels: [
                { count: 2, drawAfterShan: 1 },
            ],
        },
        {
            keyword: "桃",
            levels: [
                { count: 2, recoverBonus: 1 },
            ],
        },
    ],
};

export default tianshuConfig;
