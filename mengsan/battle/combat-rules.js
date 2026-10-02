// 梦三独有的出牌经济，不修改 noname 的全局牌定义。
import { isAttackCard } from "../monsters/vine-tangled.js";
import { _status } from "../../../../noname.js";
import { cardUpgradeLevel, cardUpgradeRule } from "../cards/upgrades.js";
export const PLAYER_ENERGY = 3;
export const PLAYER_HAND_LIMIT = 3;
export const SHA_DAMAGE = 6;
export const TRICK_DAMAGE = 4;

const COSTS = Object.freeze({ sha: 1, mengsan_zhongsha: 2, mengsan_fangyu: 1, mengsan_fennu: 0,
    mengsan_feijianhuixuanbiao: 1, mengsan_jianbingdaji: 1, mengsan_quanshenzhuangji: 1, mengsan_rongrongzhiquan: 1, mengsan_shandianpili: 1, mengsan_shuangchongdaji: 1, mengsan_tiezhanbo: 1, mengsan_touchui: 1, mengsan_tupo: 1, mengsan_yubeidaji: 1, mengsan_wanmeidaji: 2, mengsan_yujin: 2, mengsan_fangxue: 0, mengsan_jianyi: 1, mengsan_pomie: 1, mengsan_songjianwushi: 1,
    tao: 1, jiu: 1, shan: 0, wuxie: 0,
    juedou: 2, nanman: 2, wanjian: 2, taoyuan: 2 });

export const cardCost = (card, player = null) => {
    const rule = cardUpgradeLevel(card) ? cardUpgradeRule(card.name) : null;
    const base = rule?.cost ?? COSTS[card?.name] ?? 1;
    return base + (player?.storage?.mengsanTangled_shuying > 0 && isAttackCard(card) ? 1 : 0);
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
            if (current.name === "useCard" && (current.player !== player ||
                current.cards?.length !== 1 || current.cards[0] !== entry.card)) break;
            if (current === entry.choice) return true;
        }
    }
    return false;
}

export const canPayCard = (player, card, event = _status.event) =>
    isFreeCardUse(player, card, event) || (player?.storage?.mengsanEnergy_shuying ?? Infinity) >= cardCost(card, player);

export const payCard = (player, card, event = _status.event) => {
    if (isFreeCardUse(player, card, event)) return true;
    if (!canPayCard(player, card, event)) return false;
    player.storage.mengsanEnergy_shuying -= cardCost(card, player);
    return true;
};
