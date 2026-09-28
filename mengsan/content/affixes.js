// Shared mode-owned affix registry; adding a new entry also exposes it in GM.
export const AFFIX_INFO = Object.freeze({
    void: Object.freeze({ name: "虚无", description: "弃牌阶段开始时移除此牌，退出此次战斗；即使同时具有保留也会移除。" }),
    retain: Object.freeze({ name: "保留", description: "弃牌阶段开始时，此牌不计入手牌上限；若同时具有虚无，仍会被移除。" }),
    unplayable: Object.freeze({ name: "不能被打出", description: "此牌不能使用或打出，但可以被弃置。" }),
    ingenious: Object.freeze({ name: "奇巧", description: "不因弃牌阶段进入弃牌堆时，若可以使用，则使用此牌。" }),
    eternal: Object.freeze({ name: "永恒", description: "此牌不能从你的牌组移除或变化。" }),
    innate: Object.freeze({ name: "固有", description: "战斗开始时移至手牌；若已在手牌中则不移动。" }),
    exhaust: Object.freeze({ name: "消耗", description: "使用或打出后移出此次战斗，并可在消耗牌堆查看；消耗牌堆不参与洗牌。" }),
});
