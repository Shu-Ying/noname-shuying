// Pure bridge: the controller validates the current battle/session on every lookup.
let resolver = () => null;
export function installSharedHookResolver(next) {
    if (typeof next !== "function") throw new TypeError("通用牌钩子无效");
    resolver = next;
}
export const sharedHooks = player => player ? resolver(player) : null;
export const sharedCardIsFree = (player,card) => sharedHooks(player)?.isFree(card) || false;
export const sharedCardCost = (player,card,cost) => sharedHooks(player)?.cost(card,cost) ?? cost;
export const sharedStrengthPenalty = player => player ? resolver(player, false)?.strengthPenalty() || 0 : 0;
export const beforeSharedBlock = (player,num,event) => sharedHooks(player)?.blockAmount(num,event) ?? num;
export const afterSharedDraw = async (player,cards) => sharedHooks(player)?.afterDraw(cards);

export function applyInterceptDamage(damage, source, target, players) {
    if (!source || !target || !players) return damage;
    let multiplier = 1;
    for (const holder of players) {
        const protectedAlly = resolver(holder, false)?.interceptTarget();
        if (!protectedAlly || !holder.isEnemyOf(source)) continue;
        if (target === protectedAlly) return 0;
        if (target === holder) multiplier *= 2;
    }
    return multiplier === 1 ? damage : Math.floor(damage * multiplier);
}

export function applyIntangibleDamage(damage, target) {
    return damage > 1 && target && resolver(target, false)?.isIntangible() ? 1 : damage;
}

