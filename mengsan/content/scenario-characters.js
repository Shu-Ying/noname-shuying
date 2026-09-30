// 梦三私有武将：不改动原版界刘备，也不导入整套国战技能。
export function createScenarioCharacters(Character) {
    return {
        mengsan_liubei_shuying: new Character({ sex: "male", group: "han", hp: 50, maxHp: 50,
            skills: ["mengsan_taoyuan_bond_shuying"],
            img: "image/character/re_liubei.jpg" }),
        // 国战男性普通小兵使用原生 shibing1 立绘；实际战斗生命由怪物类或关卡配置决定。
        mengsan_soldier_shuying: new Character({ sex: "male", group: "qun", hp: 4, maxHp: 4,
            skills: [], img: "image/character/shibing1.jpg" }),
        mengsan_flyconid_shuying: new Character({ sex: "none", group: "qun", hp: 48, maxHp: 48,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/flyconid-portrait.png" }),
        mengsan_raider_brute_shuying: new Character({ sex: "none", group: "qun", hp: 32, maxHp: 32,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/raider-brute-portrait.png" }),
        mengsan_raider_assassin_shuying: new Character({ sex: "none", group: "qun", hp: 21, maxHp: 21,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/raider-assassin-portrait.png" }),
        mengsan_raider_axe_shuying: new Character({ sex: "none", group: "qun", hp: 21, maxHp: 21,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/raider-axe-portrait.png" }),
        mengsan_raider_crossbow_shuying: new Character({ sex: "none", group: "qun", hp: 20, maxHp: 20,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/raider-crossbow-portrait.png" }),
        mengsan_raider_tracker_shuying: new Character({ sex: "none", group: "qun", hp: 23, maxHp: 23,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/raider-tracker-portrait.png" }),
        mengsan_sushuang_zhangshiping_shuying: new Character({ sex: "male", group: "shu", hp: 4, maxHp: 4,
            skills: [], img: "extension/术樱包/mengsan/assets/portraits/sushuang-zhangshiping.png", names: "苏|双-张|世平" }),
    };
}
export const scenarioTranslations = {
    mengsan_liubei_shuying: "界刘备",
    mengsan_liubei_shuying_title: "50/50生命 · 先天桃园羁绊",
    mengsan_taoyuan_bond_shuying: "桃园羁绊",
    mengsan_taoyuan_bond_shuying_info: "先天：本征程初始结识关羽、张飞，二人羁绊均为8级。可在行军菜单中指定一名助战角色；战斗结束，到场增加50%升级进度，未到场增加25%。",
    mengsan_soldier_shuying: "士兵",
    mengsan_flyconid_shuying: "飞蝇菌子",
    mengsan_raider_brute_shuying: "劫掠者暴徒",
    mengsan_raider_assassin_shuying: "劫掠者刺客",
    mengsan_raider_axe_shuying: "劫掠者斧手",
    mengsan_raider_crossbow_shuying: "劫掠者弩手",
    mengsan_raider_tracker_shuying: "劫掠者追踪手",
    mengsan_sushuang_zhangshiping_shuying: "苏双&张世平",
};
