import { isAttackCard } from "./vine-tangled.js";
const bindings = new WeakMap();
const layersOf = player => {
    const value = player?.storage?.mengsanSlow_shuying ?? 0;
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("缓慢层数无效");
    return value;
};
export function slowPercent(player) {
    const count = player?.storage?.mengsanSlowCards_shuying ?? 0;
    const percent = count * layersOf(player) * 10;
    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(percent)) throw new RangeError("缓慢计数溢出");
    return percent;
}
export function initializeSlow(player, current) {
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current, seen: new WeakSet() };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player);
            delete player.storage.mengsanEffigyState_shuying;
            delete player.storage.mengsanEffigyIntent_shuying;
            player.removeSkill("mengsan_slow_shuying");
            player.removeSkill("mengsan_raider_strength_shuying");
        });
        bindings.set(player, entry);
    }
    player.storage.mengsanSlow_shuying = 1;
    player.storage.mengsanSlowCards_shuying = 0;
    player.addSkill("mengsan_slow_shuying");
    player.markSkill("mengsan_slow_shuying");
}
export function canCountSlowCard(player, current, event, phasePlayer) {
    const binding = bindings.get(player);
    return Boolean(current?.session.active && binding?.battle === current && player.isAlive() &&
        layersOf(player) > 0 && event?.name === "useCard" && event.card &&
        !event.cancelled && !event._cancelled && event.player?.storage?.mengsanCamp_shuying === "ally" &&
        phasePlayer?.storage?.mengsanCamp_shuying === "ally" && current.players?.has(event.player) &&
        !binding.seen.has(event));
}
// AfterCardPlayed: the attack being resolved does not count itself. A virtual card is one play.
export function recordSlowCard(player, current, event, phasePlayer) {
    if (!canCountSlowCard(player, current, event, phasePlayer)) return false;
    const count = (player.storage.mengsanSlowCards_shuying ?? 0) + 1;
    if (!Number.isSafeInteger(count) || !Number.isSafeInteger(count * layersOf(player) * 10)) throw new RangeError("缓慢计数溢出");
    bindings.get(player).seen.add(event);
    player.storage.mengsanSlowCards_shuying = count;
    player.markSkill("mengsan_slow_shuying");
    return true;
}
export function resetSlow(player) {
    player.storage.mengsanSlowCards_shuying = 0;
    player.markSkill("mengsan_slow_shuying");
}
export const slowApplies = (player, event) => Boolean(layersOf(player) > 0 && slowPercent(player) > 0 &&
    (event?.mengsanAttack_shuying || isAttackCard(event?.card)) && !event.mengsanSlowApplied_shuying);
// 整数伤害适配：力量/虚弱/易伤之后乘(1+10%×已使用牌数)，向下取整，护甲之后由引擎处理。
export function slowAttackDamage(damage, target) {
    if (!Number.isSafeInteger(damage) || damage < 0) throw new RangeError("缓慢攻击伤害无效");
    const value = damage * (100 + slowPercent(target));
    if (!Number.isSafeInteger(value)) throw new RangeError("缓慢攻击伤害溢出");
    return Math.floor(value / 100);
}
