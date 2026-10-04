// Pure bridge: the controller validates the current battle/session on every lookup.
let resolver = () => null;
export function installSharedHookResolver(next) {
    if (typeof next !== "function") throw new TypeError("通用牌钩子无效");
    resolver = next;
}
export const sharedHooks = player => player ? resolver(player) : null;
export const sharedCardIsFree = (player,card) => sharedHooks(player)?.isFree(card) || false;
export const sharedCardCost = (player,card,cost) => sharedHooks(player)?.cost(card,cost) ?? cost;
export const sharedStrengthPenalty = player => sharedHooks(player)?.strengthPenalty() || 0;
export const beforeSharedBlock = (player,num,event) => sharedHooks(player)?.blockAmount(num,event) ?? num;
export const afterSharedDraw = async (player,cards) => sharedHooks(player)?.afterDraw(cards);

