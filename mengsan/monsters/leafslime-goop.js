import { createSlimedData } from "../cards/slimed-card.js";
import { getIntentHostiles } from "../battle/intent-effects.js";
import { isLeafslime } from "./leafslime-intent.js";
import { isLeafslimeMedium } from "./leafmedium-intent.js";
import { isTwigmedium } from "./twigmedium-intent.js";
export function applyLeafslimeGoop(game, current, source, count = 1) {
    if (!current?.session.active || !source.isAlive() || !(isLeafslime(source) || isLeafslimeMedium(source) || isTwigmedium(source))) return;
    const expected = isLeafslimeMedium(source) ? 2 : 1;
    if (count !== expected) throw new RangeError("黏液牌数量与怪物配置不符");
    if (!current.leafslimeCards) {
        const counter = current.leafslimeCards = { sequence: 0 };
        current.session.ownResource(counter, () => { delete current.leafslimeCards; });
    }
    for (const target of getIntentHostiles(game, source)) {
        if (!current.session.active || !source.isAlive()) break;
        const pile = target === game.me ? current.personalPiles : current.monsterPiles.get(target);
        if (!pile) continue; // 无个人牌堆的剧情援军不污染公共牌堆。
        for (let index = 0; index < count; index++) {
            if (!current.session.active || !source.isAlive()) break;
            const sequence = ++current.leafslimeCards.sequence;
            if (!Number.isSafeInteger(sequence)) throw new RangeError("黏液牌序号溢出");
            pile.addToDiscard(createSlimedData(`slimed_${source.playerid}_${sequence}`));
        }
        game.log(target, `的个人弃牌堆加入${count}张【黏液】`);
    }
}
