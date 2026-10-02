import { _status } from "../../../../noname.js";
import { canPayCard, isActiveCardUse } from "../battle/combat-rules.js";
export const SLIMED_NAME = "mengsan_slimed_shuying";
export function createSlimedData(id) {
    if (typeof id !== "string" || !id) throw new TypeError("黏液牌缺少ID");
    return { id, name: SLIMED_NAME, suit: "spade", number: 1, nature: null, affixes: ["exhaust"], upgrade: 0 };
}
export const slimedDefinition = Object.freeze({
    type: "status", fullimage: true,
    image: "ext:术樱包/mengsan/assets/cards/mengsan_slimed_shuying.png",
    mengsanCost_shuying: 1, mengsanExhaust_shuying: true,
    enable(used, player, event) {
        return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
    },
    notarget: true,
    async content(event, trigger, player) { await player.draw(1); },
    ai: { value: -1, useful: 0, order: 1, result: { player: 1 } },
    cardPrompt: () => "梦三：主动使用消耗1费用。抽1张牌。消耗：使用后退出此次战斗。",
});
