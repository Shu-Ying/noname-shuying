import {
    attackHitCount,
    outgoingAttackDamage,
} from "./intent-damage.js";

const pendingDeathBlows = new WeakSet();

export function isDeathBlowIntent(intent) {
    return intent?.intentType === "death_blow";
}

export function hasPendingDeathBlow(source) {
    return pendingDeathBlows.has(source);
}

export async function beginDeathBlow(source, target, intent) {
    if (!isDeathBlowIntent(intent)) {
        throw new TypeError("濒死一击需要 death_blow 意图类型");
    }
    if (attackHitCount(intent) !== 1) {
        throw new RangeError("濒死一击只能造成一次伤害");
    }
    const damage = outgoingAttackDamage(intent, source);
    if (!source?.isAlive() || !target?.isAlive()) return false;

    const hit = target.damage(damage, source);
    hit.mengsanAttack_shuying = true;
    await hit;
    if (source.isAlive()) pendingDeathBlows.add(source);
    return true;
}

export async function finishDeathBlow(source) {
    if (!hasPendingDeathBlow(source)) return false;
    pendingDeathBlows.delete(source);
    if (source.isAlive()) await source.die();
    return true;
}
