// Lightweight bridge; no engine/catalog imports, so card/pile hooks cannot form cycles.
const bindings = new WeakMap();
export function bindRelicHooks(owner, session, controller) {
    const entry = { session, controller };
    bindings.set(owner, entry);
    session.ownResource(entry, () => {
        if (bindings.get(owner) === entry) bindings.delete(owner);
    });
}
export const relicHooks = owner => {
    const entry = bindings.get(owner);
    return entry?.session.active ? entry.controller : null;
};
export const relicBlocksDraw = owner => relicHooks(owner)?.blocksDraw() || false;
export const relicFreeCard = (owner, card) => relicHooks(owner)?.isFree(card) || false;
export const relicCardCost = (owner, card, cost) => relicHooks(owner)?.cost(card, cost) ?? cost;
export const relicBlockAmount = (owner, amount, event) => relicHooks(owner)?.blockAmount(amount, event) ?? amount;
export const relicXBonus = owner => relicHooks(owner)?.has("chemical_x") ? 2 : 0;
export const queueRelicExhaust = (owner, card) => relicHooks(owner)?.queueExhaust(card);
export const flushRelicExhaust = async owner => relicHooks(owner)?.flushExhaust();
export const queueRelicShuffle = owner => relicHooks(owner)?.queueShuffle();

// Permanent deck additions are synchronous and must not depend on a live battle.
let onDeckAdd = () => {};
export function installRelicDeckHook(callback) { onDeckAdd = callback; }
export const afterRelicDeckAdd = (run, card) => onDeckAdd(run, card);
