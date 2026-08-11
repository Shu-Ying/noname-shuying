const difficultyOrder = [normal, hard, nightmare];

const stages = [
    {
        id: stage1,
        name: 第一关,
        // bosses: [caocao_boss_shuying, dongzhuo_boss_shuying],
        bosses: [zishu_boss_shuying, chouniu_boss_shuying, yinhu_boss_shuying, maotu_boss_shuying, chenlong_boss_shuying, sishe_boss_shuying, wuma_boss_shuying, weiyang_boss_shuying, shenhou_boss_shuying, youji_boss_shuying, xvgou_boss_shuying, haizhu_boss_shuying],
    },
    {
        id: stage2,
        name: 第二关,
        bosses: [mengpo_boss_shuying, baowei_boss_shuying, niaozui_boss_shuying, heibaiwuchang_boss_shuying, niutoumamian_boss_shuying, yvsai_boss_shuying, huangfeng_boss_shuying, riyeyoushen_boss_shuying, guiwang_boss_shuying, yanluowang_boss_shuying],
    },
    {
        id: stage3,
        name: 第三关,
        bosses: [caocao_boss_shuying, simayi_boss_shuying, lvbu_boss_shuying, dongzhuo_boss_shuying],
    },
    {
        id: stage4,
        name: 第四关,
        bosses: [shuishengonggong_boss_shuying, shaohao_boss_shuying, xuannv_boss_shuying, hanba_boss_shuying],
    },
];

const bossList = Object.fromEntries(stages.map(stage => [stage.id, stage.bosses]));

const virtualIdols = {
    Xiaotao: vtb_xiaotao,
    Xiaosha: vtb_xiaosha,
    Xiaoshan: vtb_xiaoshan,
    Xiaole: vtb_xiaole,
    Xiaojiu: vtb_xiaojiu,
};
const virtualIdolList = Object.values(virtualIdols);

// Boss 的体力与体力上限始终使用相同加成，只需在配置中填写一次。
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

        ...createBossGroup([yvsai_boss_shuying, huangfeng_boss_shuying], bossDifficultyTemplates.zhuoguiquxie),
        mengpo_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            nightmare: [guimei_shuying],
        }),
        baowei_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, addSkillFromHard(yinsha_shuying)),
        niaozui_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, addSkillFromHard(bingyi_shuying)),
        heibaiwuchang_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            hard: [xixing_shuying],
            nightmare: [xixing_shuying, taiping_shuying],
        }),
        riyeyoushen_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            nightmare: [duane_shuying],
        }),
        niutoumamian_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            hard: [xiaoshou_shuying],
            nightmare: [xiaoshou_shuying, guizhao_shuying],
        }),
        guiwang_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            nightmare: [chihu_shuying],
        }),
        yanluowang_boss_shuying: createBossConfig(bossDifficultyTemplates.zhuoguiquxie, {
            hard: [zhennu_shuying],
            nightmare: [zhennu_shuying, xuanpan_shuying],
        }),

        caocao_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard(yishen_shuying)),
        simayi_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard(yuanlv_shuying)),
        lvbu_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard(zhanjia_shuying)),
        dongzhuo_boss_shuying: createBossConfig(bossDifficultyTemplates.qingqingzijin, addSkillFromHard(qubu_shuying)),

        ...createBossGroup([shaohao_boss_shuying, xuannv_boss_shuying, hanba_boss_shuying], bossDifficultyTemplates.tianshuluandou),
        shuishengonggong_boss_shuying: createBossConfig(bossDifficultyTemplates.tianshuluandou, addSkillFromHard(shuishen_shuying)),

        baiqi_boss_shuying: {},
        pangu_boss_shuying: {},
    },
};

const tianshuConfig = {
    bossList,
    stages,
    difficulties: {
        normal: {
            name: 普通,
        },
        hard: {
            name: 困难,
        },
        nightmare: {
            name: 阴间,
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
        skillChoiceCount: 5,
    },
    settings: {
        virtualIdolConfigKey: extension_术樱包_tianShu_Xvni,
        virtualIdolRandomPoolConfigKey: extension_术樱包_tianShu_XvniRandomPool,
        virtualIdolReviveConfigKey: extension_术樱包_tianShu_dead,
        addBossConfigKey: extension_术樱包_tianShu_addBoss,
        revivePlayersConfigKey: extension_术樱包_tianShu_revivePlayers,
        difficultyStatusKey: shuYing_tianshuDifficulty,
    },
    skillPool: {
        banned: [huoxin, jueqing, qinqing, beige, huashen, drlt_zhiti, olzhiti, xinfu_pdgyingshi, rebeige],
    },
    keywordBuffs: [
        {
            keyword: 杀,
            levels: [
                { count: 2, damageBonus: 1 },
                { count: 3, damageBonus: 2 },
            ],
        },
        {
            keyword: 闪,
            levels: [
                { count: 2, drawAfterShan: 1 },
            ],
        },
        {
            keyword: 桃,
            levels: [
                { count: 2, recoverBonus: 1 },
            ],
        },
    ],
};

export default tianshuConfig;
