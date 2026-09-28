// 梦三独有的出牌经济，不修改 noname 的全局牌定义。
import { _status } from "../../../../noname.js";
export const PLAYER_ENERGY = 3;
export const PLAYER_HAND_LIMIT = 3;
export const SHA_DAMAGE = 4;

const COSTS = Object.freeze({ sha: 1, tao: 1, jiu: 1, shan: 0, wuxie: 0,
    juedou: 2, nanman: 2, wanjian: 2, taoyuan: 2 });

export const cardCost = card => COSTS[card?.name] ?? 1;

export const isActiveCardUse = (event, player) => {
    if (!event || !player) return false;
    const seen = new Set();
    let inPhaseUse = false;
    for (let current = event; current && !seen.has(current); current = current.parent) {
        seen.add(current);
        if (current.name === "dying" || current.name === "chooseToRespond") return false;
        if (current.name === "chooseToUse" && (current.respondTo || String(current.type || "").startsWith("respond"))) return false;
        if (current.name === "phaseUse" && current.player === player) inPhaseUse = true;
    }
    // 某些扩展创建的主动 useCard 事件不保留 phaseUse 父链。
    return inPhaseUse || (event.name === "useCard" && event.player === player &&
        _status.currentPhase === player);
};

export const canPayCard = (player, card) => (player?.storage?.mengsanEnergy_shuying ?? Infinity) >= cardCost(card);

export const payCard = (player, card) => {
    if (!canPayCard(player, card)) return false;
    player.storage.mengsanEnergy_shuying -= cardCost(card);
    return true;
};
