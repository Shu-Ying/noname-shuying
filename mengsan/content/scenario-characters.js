// 梦三私有武将：不改动原版界刘备，也不导入整套国战技能。
export function createScenarioCharacters(Character) {
    return {
        mengsan_liubei_shuying: new Character({ sex: "male", group: "han", hp: 50, maxHp: 50,
            skills: [], img: "image/character/re_liubei.jpg" }),
        // 国战男性普通小兵使用原生 shibing1 立绘；实际战斗生命由怪物类或关卡配置决定。
        mengsan_soldier_shuying: new Character({ sex: "male", group: "qun", hp: 4, maxHp: 4,
            skills: [], img: "image/character/shibing1.jpg" }),
        mengsan_flyconid_shuying: new Character({ sex: "none", group: "qun", hp: 48, maxHp: 48,
            skills: [], img: "extension/术樱包/mengsan/assets/flyconid-portrait.png" }),
        mengsan_sushuang_zhangshiping_shuying: new Character({ sex: "male", group: "shu", hp: 4, maxHp: 4,
            skills: [], img: "extension/术樱包/mengsan/assets/sushuang-zhangshiping.png", names: "苏|双-张|世平" }),
    };
}
export const scenarioTranslations = {
    mengsan_liubei_shuying: "界刘备", mengsan_liubei_shuying_title: "50/50生命 · 无初始技能",
    mengsan_soldier_shuying: "士兵",
    mengsan_flyconid_shuying: "飞蝇菌子",
    mengsan_sushuang_zhangshiping_shuying: "苏双&张世平",
};
