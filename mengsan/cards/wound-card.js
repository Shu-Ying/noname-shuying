import { getIntentHostiles } from "../battle/intent-effects.js";
import { isVantom } from "../monsters/vantom-intent.js";

export const WOUND_NAME = "mengsan_wound_shuying";
export function createWoundData(id) {
    if (typeof id !== "string" || !id) throw new TypeError("伤口牌缺少ID");
    return { id, name: WOUND_NAME, suit: "spade", number: 1,
        nature: null, affixes: ["unplayable"], upgrade: 0 };
}
export const woundDefinition = Object.freeze({
    type: "status", fullimage: true,
    image: "ext:术樱包/mengsan/assets/cards/mengsan_wound_shuying.png",
    enable: false, notarget: true,
    ai: { value: -5, useful: -5, order: 0 },
    cardPrompt: () => "不能被打出。",
});
export function applyWound(game, current, source, count) {
    if (!current?.session.active || !source?.isAlive() || !isVantom(source)) return;
    if (count !== 3) throw new RangeError("肢解须加入3张伤口");
    if (!current.woundCards) {
        const entry = current.woundCards = { sequence: 0 };
        current.session.ownResource(entry, () => { if (current.woundCards === entry) delete current.woundCards; });
    }
    for (const target of getIntentHostiles(game, source)) {
        if (!current.session.active || !source.isAlive()) break;
        const pile = target === game.me ? current.personalPiles : current.monsterPiles.get(target);
        if (!pile) continue;
        for (let i = 0; i < count; i++) {
            if (!current.session.active || !source.isAlive()) break;
            const sequence = current.woundCards.sequence + 1;
            if (!Number.isSafeInteger(sequence)) throw new RangeError("伤口牌序号溢出");
            current.woundCards.sequence = sequence;
            pile.addToDiscard(createWoundData(`wound_${source.playerid}_${sequence}`));
        }
        game.log(target, `的个人弃牌堆加入${count}张【伤口】`);
    }
}
