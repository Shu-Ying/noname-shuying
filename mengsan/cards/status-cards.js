// 战斗生成的状态牌不登记到永久可获得牌表，也不写入征程牌组。
export const DAZED_NAME = "mengsan_dazed_shuying";
export function createDazedData(id) {
    if (typeof id !== "string" || !id) throw new TypeError("晕眩牌缺少ID");
    return { id, name: DAZED_NAME, suit: "spade", number: 1,
        nature: null, affixes: ["unplayable", "void"], upgrade: 0 };
}
export const dazedDefinition = Object.freeze({
    type: "status", fullimage: true,
    image: "ext:术樱包/mengsan/assets/cards/mengsan_dazed_shuying.png",
    enable: false, notarget: true,
    ai: { value: -1, useful: -1, order: 0 },
    cardPrompt: () => "不能被打出。虚无：弃牌阶段开始时移除此牌，退出此次战斗。",
});
