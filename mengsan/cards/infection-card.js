import { getIntentHostiles } from "../battle/intent-effects.js";
import { isPhrog, isPhrogActor } from "../monsters/phrog-intent.js";

export const INFECTION_NAME = "mengsan_infection_shuying";
export function createInfectionData(id) {
    if (typeof id !== "string" || !id) throw new TypeError("感染牌缺少ID");
    return { id, name: INFECTION_NAME, suit: "spade", number: 1,
        nature: null, affixes: ["unplayable"], upgrade: 0 };
}
export const infectionDefinition = Object.freeze({
    type: "status", fullimage: true,
    image: "ext:术樱包/mengsan/assets/cards/mengsan_infection_shuying.png",
    enable: false, notarget: true,
    ai: { value: -5, useful: -5, order: 0 },
    cardPrompt: () => "不能被打出。回合结束弃牌前，若此牌在你的手牌中，你受到3点非攻击伤害。",
});
export function applyInfection(game, current, source, count) {
    if (!current?.session.active || !source?.isAlive() || !isPhrogActor(source)) return;
    if (count !== (isPhrog(source) ? 3 : 1)) throw new RangeError("感染牌数量与怪物不符");
    if (!current.infectionCards) {
        const entry = current.infectionCards = { sequence: 0, resolved: new WeakSet() };
        current.session.ownResource(entry, () => { if (current.infectionCards === entry) delete current.infectionCards; });
    }
    for (const target of getIntentHostiles(game, source)) {
        if (!current.session.active || !source.isAlive()) break;
        const pile = target === game.me ? current.personalPiles : current.monsterPiles.get(target);
        if (!pile) continue;
        for (let i = 0; i < count; i++) {
            if (!current.session.active || !source.isAlive()) break;
            const sequence = current.infectionCards.sequence + 1;
            if (!Number.isSafeInteger(sequence)) throw new RangeError("感染牌序号溢出");
            current.infectionCards.sequence = sequence;
            pile.addToDiscard(createInfectionData(`infection_${source.playerid}_${sequence}`));
        }
        game.log(target, `的个人弃牌堆加入${count}张【感染】`);
    }
}
export const infectionHand = player => [...new Set(player?.getCards("h") || [])].filter(card =>
    card.name === INFECTION_NAME && card.storage?.mengsanOwnerId_shuying === player.playerid);
const resolutions = new WeakMap();
export async function resolveInfection(current, player, phase) {
    if (!current?.session.active || !player?.isAlive() || !current.players.has(player)) return false;
    let resolved = resolutions.get(current);
    if (!resolved) { resolved = new WeakSet(); resolutions.set(current, resolved); }
    if (resolved.has(phase)) return false;
    resolved.add(phase);
    const cards = infectionHand(player);
    for (const card of cards) {
        if (!current.session.active || !player.isAlive()) break;
        if (!infectionHand(player).includes(card)) continue;
        const damage = player.damage(3, "nosource");
        damage.mengsanInfection_shuying = true;
        await damage;
    }
    return cards.length > 0;
}
