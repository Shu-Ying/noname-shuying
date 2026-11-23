import { nextRandom } from "../progression/state.js";

export const potions = Object.freeze({
    ENERGY_POTION: { name: "能量药水", stat: "能量", variable: "Energy", amount: 2 },
    BLOCK_POTION: { name: "格挡药水", stat: "格挡", variable: "Block", amount: 12 },
    SWIFT_POTION: { name: "迅捷药水", stat: "抽牌", variable: "Cards", amount: 3 },
    FIRE_POTION: { name: "火焰药水", stat: "伤害", variable: "Damage", amount: 20, enemy: true },
    STRENGTH_POTION: { name: "力量药水", stat: "力量", variable: "StrengthPower", amount: 2 },
});

export const potionIds = Object.freeze(Object.keys(potions));
export const getPotion = id => Object.hasOwn(potions, id) ? potions[id] : null;
export const potionCapacity = player => 3 + (player.potionSlotBonus ?? 0);
export const potionSlots = player => Array.from({ length: potionCapacity(player) }, (_, index) =>
    getPotion(player.potions?.[index]) ? player.potions[index] : null);

export function samplePotions(run, count, exclude = []) {
    const pool = potionIds.filter(id => !exclude.includes(id));
    const result = [];
    while (result.length < count && pool.length) {
        result.push(pool.splice(Math.floor(nextRandom(run) * pool.length), 1)[0]);
    }
    return result;
}

export function rollPotionReward(run, elite) {
    const chance = run.potionDropChance ?? 40;
    const dropped = nextRandom(run) * 100 < chance + (elite ? 12.5 : 0);
    run.potionDropChance = chance + (dropped ? -10 : 10);
    return dropped ? samplePotions(run, 1) : [];
}

export function createPotionOffer(run, excluded) {
    const [id] = samplePotions(run, 1, excluded);
    return id ? { id, price: Math.round(50 * (0.95 + nextRandom(run) * 0.1)) } : null;
}

export function acquirePotion(player, id, replaceIndex = null) {
    if (!getPotion(id)) return false;
    const slots = potionSlots(player);
    const empty = slots.indexOf(null);
    const index = replaceIndex ?? empty;
    if (!Number.isInteger(index) || index < 0 || index >= slots.length ||
        (replaceIndex !== null && (empty >= 0 || !slots[index]))) return false;
    slots[index] = id;
    player.potions = slots;
    return true;
}

export function removePotion(player, index, id) {
    const slots = potionSlots(player);
    if (!getPotion(id) || slots[index] !== id) return false;
    slots[index] = null;
    player.potions = slots;
    return true;
}

export function applyPotionReward(player, candidates, selection) {
    if (selection == null) return;
    if (!candidates.includes(selection.id) || !acquirePotion(player, selection.id, selection.replaceIndex)) {
        throw new Error("药水奖励选择无效");
    }
}
