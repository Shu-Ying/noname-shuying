import { canUpgradeCard, cardUpgradeLevel } from "./upgrades.js";

// 武装只强化当前战斗的真实手牌；不写征程永久牌组。
export function createHandUpgrader(game, getActiveBattle, get) {
    const states = new WeakMap();
    const valid = (player, battle) => Boolean(battle && getActiveBattle() === battle &&
        battle.session?.active && battle.players?.has(player) && player?.isAlive?.());
    const getPile = (player, battle) => player === game.me
        ? battle.personalPiles : battle.monsterPiles?.get(player);
    function dataOf(card) {
        return card.storage?.mengsanCard_shuying || {
            name: card.name, suit: card.suit, number: card.number, nature: card.nature || null,
            upgrade: cardUpgradeLevel(card), affixes: Array.isArray(card.affixes) ? card.affixes : [],
        };
    }
    function eligible(card) {
        const data = dataOf(card);
        return !card.storage?.mengsanExhausted_shuying && data.name === card.name &&
            canUpgradeCard(data);
    }
    const handCards = (player, event) => {
        const playing = new Set(event?.cards || []);
        return player.getCards("h").filter(card => !playing.has(card) && eligible(card));
    };
    function remember(battle, card, after) {
        let cards = states.get(battle);
        if (!cards) {
            cards = new Map();
            states.set(battle, cards);
            battle.session.ownResource(cards, () => {
                // Do not overwrite a later replacement by another mechanic.
                for (const [node, state] of cards) {
                    if (node.storage?.mengsanCard_shuying !== state.after) continue;
                    if (state.before === undefined) delete node.storage.mengsanCard_shuying;
                    else node.storage.mengsanCard_shuying = state.before;
                }
                cards.clear();
                states.delete(battle);
            });
        }
        const previous = cards.get(card);
        cards.set(card, { before: previous ? previous.before : card.storage?.mengsanCard_shuying, after });
    }
    return async function blockUpgrade(player, event, block, all) {
        if (!Number.isSafeInteger(block) || block < 0 || typeof all !== "boolean") {
            throw new TypeError("武装格挡与手牌强化参数无效");
        }
        const battle = getActiveBattle();
        if (!valid(player, battle)) return [];
        const pile = getPile(player, battle);
        if (typeof pile?.take !== "function") throw new Error("武装缺少个人牌堆接口");
        await player.changeHujia(block);
        if (!valid(player, battle) || getPile(player, battle) !== pile) return [];
        const candidates = handCards(player, event);
        if (!candidates.length) return [];
        let chosen = candidates;
        if (!all && candidates.length > 1) {
            const result = await player.chooseButton({
                createDialog: ["武装：选择强化一张你的手牌", candidates],
                forced: true, selectButton: 1,
                ai(button) { return get.value(button.link, player); },
            }).forResult();
            if (!result.bool || result.links?.length !== 1 || !candidates.includes(result.links[0])) return [];
            chosen = result.links;
        } else if (!all) chosen = [candidates[0]];
        // No asynchronous work during commit: one current-hand snapshot avoids quadratic filtering.
        const currentHand = new Set(player.getCards("h"));
        const playing = new Set(event?.cards || []);
        const changed = [];
        for (const card of chosen) {
            if (!valid(player, battle) || getPile(player, battle) !== pile) break;
            if (!currentHand.has(card) || playing.has(card) || !eligible(card)) continue;
            const data = dataOf(card);
            const next = { ...data, affixes: data.affixes?.slice() || [], upgrade: (data.upgrade || 0) + 1 };
            remember(battle, card, next);
            card.storage ||= {};
            card.storage.mengsanCard_shuying = next;
            changed.push(card);
        }
        if (changed.length) {
            battle.handUI?.refresh();
            battle.pilesUI?.refresh();
            game.log(player, "强化了", changed, "（仅本场战斗）");
        }
        return changed;
    };
}
