// 与无名引擎的 basic/trick/equip 分类分开，新增职业沿用这些稳定字段。
export const cardTypes = Object.freeze({
    attack: "攻击", skill: "技能", power: "能力", status: "状态", curse: "诅咒", quest: "任务",
    equipment: "装备",
});
export const cardRarityLabels = Object.freeze({
    basic: "初始", common: "普通", uncommon: "罕见", rare: "稀有", event: "事件",
    ancient: "先古之民", token: "衍生", status: "状态", curse: "诅咒", quest: "任务",
});
