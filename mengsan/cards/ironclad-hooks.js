// 轻量桥接模块：不导入牌注册表或引擎，避免费用/牌堆/运行时循环依赖。
import { sharedStrengthPenalty } from "./shared-hooks.js";
import { flushRelicExhaust } from "../relics/hooks.js";
const bindings = new WeakMap(), owners = new Map();
export function bindIroncladHooks(player, session, hooks) {
    const entry = {player,session,hooks};
    bindings.set(player,entry); owners.set(player.playerid,entry);
    session.ownResource(entry, () => {
        if (bindings.get(player) === entry) bindings.delete(player);
        if (owners.get(player.playerid) === entry) owners.delete(player.playerid);
    });
}
export function ironcladHooks(player) {
    const entry = bindings.get(player);
    return entry?.session.active && entry.hooks.valid() ? entry.hooks : null;
}
export function ironcladCardOwner(card) {
    const node = card?.cards?.length === 1 ? card.cards[0] : card;
    const entry = owners.get(node?.storage?.mengsanOwnerId_shuying);
    return entry?.session.active && entry.hooks.valid() ? entry.player : null;
}
export const ironcladBlocksDraw = player => Boolean(ironcladHooks(player)?.blocksDraw());
export const ironcladBlocksEnergy = player => Boolean(ironcladHooks(player)?.blocksEnergy());
export const ironcladPreservesBlock = player => Boolean(ironcladHooks(player)?.preservesBlock());
export const ironcladSkillExhausts = (player,card) => Boolean(ironcladHooks(player)?.skillExhausts(card));
export const ironcladCost = (player,card,cost) => ironcladHooks(player)?.cost(card,cost) ?? cost;
export const ironcladCardIsFree = (player,card) => Boolean(ironcladHooks(player)?.isFree(card));
export const ironcladStrengthPenalty = player => (ironcladHooks(player)?.strengthPenalty() || 0) + sharedStrengthPenalty(player);
export const queueIroncladExhaust = (player,card) => ironcladHooks(player)?.queueExhaust(card);
export const flushIroncladExhaust = async player => { await ironcladHooks(player)?.flushExhaust(); await flushRelicExhaust(player); };
export const afterIroncladDraw = async (player,cards) => { await ironcladHooks(player)?.afterDraw(cards); };
export const afterIroncladVulnerable = (source,target) => ironcladHooks(source)?.queueVulnerable(target);
export const beforeIroncladBlock = (player,num,event) => ironcladHooks(player)?.blockAmount(num,event) ?? num;
