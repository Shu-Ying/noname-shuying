// 梦三独有的出牌经济，不修改 noname 的全局牌定义。
import { isAttackCard } from "../monsters/vine-tangled.js";
import { _status } from "../../../../noname.js";
import { cardUpgradeLevel, cardUpgradeRule } from "../cards/upgrades.js";
import { cardPackCosts } from "../cards/packs/data.js";
import { ironcladCardOwner, ironcladCost, ironcladCardIsFree } from "../cards/ironclad-hooks.js";
import { sharedCardCost, sharedCardIsFree } from "../cards/shared-hooks.js";
import { relicCardCost, relicFreeCard, relicXBonus } from "../relics/hooks.js";
export const PLAYER_ENERGY = 3;
export const PLAYER_HAND_LIMIT = 3;
export const SHA_DAMAGE = 6;
export const TRICK_DAMAGE = 4;

const COSTS = Object.freeze({ sha: 1, mengsan_zhongsha: 2, tao: 1, jiu: 1, shan: 0, wuxie: 0,
    juedou: 2, nanman: 2, wanjian: 2, taoyuan: 2 });

export const isXCostCard = card => cardPackCosts[card?.name] === "X";
const xUses = new WeakMap();
const xEnergy = player => player?.storage?.mengsanEnergy_shuying;
const validXEnergy = player => Number.isSafeInteger(xEnergy(player)) && xEnergy(player) >= 0;
const xTax = player => player?.storage?.mengsanTangled_shuying > 0 ? 1 : 0;
export const cardCost = (card, player = null) => {
    player ||= ironcladCardOwner(card);
    if (ironcladCardIsFree(player,card) || sharedCardIsFree(player,card) || relicFreeCard(player,card)) return 0;
    // 数值接口用于支付；X 的展示标签由牌定义/图鉴和空文本手牌叠层提供。
    if (isXCostCard(card)) return validXEnergy(player) ? xEnergy(player) : 0;
    const rule = cardUpgradeLevel(card) ? cardUpgradeRule(card.name) : null;
    const base = rule?.cost ?? cardPackCosts[card?.name] ?? COSTS[card?.name] ?? 1;
    return relicCardCost(player,card,sharedCardCost(player,card,ironcladCost(player,card,base))) +
        (player?.storage?.mengsanTangled_shuying > 0 && isAttackCard(card) ? 1 : 0);
};

export const isActiveCardUse = (event, player) => {
    if (!event || !player) return false;
    const seen = new Set();
    let inPhaseUse = false;
    for (let current = event; current && !seen.has(current); current = current.parent) {
        seen.add(current);
        if (current.name === "dying" || current.name === "respond" || current.name === "chooseToRespond") return false;
        if (current.name === "chooseToUse" && (current.respondTo || String(current.type || "").startsWith("respond"))) return false;
        if (current.name === "phaseUse" && current.player === player) inPhaseUse = true;
    }
    // 某些扩展创建的主动 useCard 事件不保留 phaseUse 父链。
    return inPhaseUse || (event.name === "useCard" && event.player === player &&
        _status.currentPhase === player);
};

// 仅授权破灭的这一条原生选择/使用父链及同一张实体牌；副本和其他使用不免费。
const freeUses = new WeakMap();
export function authorizeFreeCardUse(player, card, choice, valid) {
    const entries = freeUses.get(player) || new Set();
    freeUses.set(player, entries);
    const entry = { card, choice, valid }; entries.add(entry);
    return () => { entries.delete(entry); if (!entries.size) freeUses.delete(player); };
}
function isFreeCardUse(player, card, event) {
    for (const entry of freeUses.get(player) || []) {
        if (!entry.valid() || card?.name !== entry.card.name ||
            !(card === entry.card || card?.cards?.includes(entry.card))) continue;
        const seen = new Set();
        for (let current = event; current && !seen.has(current); current = current.parent) {
            seen.add(current);
            // 精确授权的虚拟重放 useCard 没有实体 cards，但不能授权它的嵌套用牌。
            if (current === entry.choice) return true;
            if (current.name === "useCard" && (current.player !== player ||
                current.cards?.length !== 1 || current.cards[0] !== entry.card)) break;
        }
    }
    return false;
}

export const canPayCard = (player, card, event = _status.event) => {
    if (isXCostCard(card)) return validXEnergy(player) &&
        (isFreeCardUse(player, card, event) || ironcladCardIsFree(player,card) || sharedCardIsFree(player,card) || relicFreeCard(player,card) || xEnergy(player) >= xTax(player));
    return isFreeCardUse(player, card, event) ||
        (player?.storage?.mengsanEnergy_shuying ?? Infinity) >= cardCost(card, player);
};

export const payCard = (player, card, event = _status.event, battle = null) => {
    if (isXCostCard(card)) {
        if (!event || event.name !== "useCard" || event.player !== player ||
            event.card?.name !== card.name) return false;
        const existing = xUses.get(event);
        if (existing) return existing.player === player && existing.name === card.name;
        if (!canPayCard(player, card, event)) return false;
        const free = isFreeCardUse(player, card, event) || ironcladCardIsFree(player,card) || sharedCardIsFree(player,card) || relicFreeCard(player,card);
        const count = xEnergy(player) - (free ? 0 : xTax(player)) + relicXBonus(player);
        xUses.set(event, { player, name: card.name, count, battle,
            session: battle?.session, taken: false });
        if (!free) player.storage.mengsanEnergy_shuying = 0;
        return true;
    }
    if (isFreeCardUse(player, card, event)) return true;
    if (!canPayCard(player, card, event)) return false;
    player.storage.mengsanEnergy_shuying -= cardCost(card, player);
    return true;
};

// X 仅属于最近一条真实 useCard；嵌套其他用牌不得借用外层次数。
export function takeXCardUse(player, event, battle) {
    const seen = new Set();
    for (let current = event; current && !seen.has(current); current = current.parent) {
        seen.add(current);
        if (current.name !== "useCard") continue;
        const entry = xUses.get(current);
        if (!entry || entry.taken || entry.player !== player ||
            current.player !== player || current.card?.name !== entry.name ||
            entry.battle !== battle || entry.session !== battle?.session) return null;
        entry.taken = true;
        return entry.count;
    }
    return null;
}
