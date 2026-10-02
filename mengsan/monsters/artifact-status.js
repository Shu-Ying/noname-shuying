const KEY = "mengsanArtifact_shuying", SKILL = "mengsan_artifact_shuying";
const bindings = new WeakMap();
const DEBUFFS = Object.freeze({
    vulnerable: ["mengsanVulnerable_shuying", "mengsan_vulnerable_shuying"],
    weak: ["mengsanWeak_shuying", "mengsan_weak_shuying"],
    frail: ["mengsanFrail_shuying", "mengsan_frail_shuying"],
});
export const clearArtifact = player => { delete player.storage[KEY]; player.removeSkill(SKILL); };
export function setArtifact(player, layers, current = null) {
    if (!Number.isSafeInteger(layers) || layers < 0) throw new RangeError("人工制品层数无效");
    if (!layers) { clearArtifact(player); return; }
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player); clearArtifact(player);
        });
        bindings.set(player, entry);
    }
    player.storage[KEY] = layers; player.addSkill(SKILL); player.markSkill(SKILL);
}
export function consumeArtifact(player) {
    if (!player?.isAlive() || !player.storage) return false;
    const layers = player.storage[KEY] ?? 0;
    if (!Number.isSafeInteger(layers) || layers < 0) throw new RangeError("人工制品层数无效");
    if (!layers) return false;
    if (layers === 1) clearArtifact(player);
    else { player.storage[KEY] = layers - 1; player.markSkill(SKILL); }
    return true;
}
// 一次施加抵消一次，不按负面层数逐层消耗；伤害和正面增益不走此入口。
export function applyMengsanDebuff(player, kind, amount) {
    if (!Object.hasOwn(DEBUFFS, kind) || !Number.isSafeInteger(amount) || amount < 0) throw new RangeError("负面状态参数无效");
    if (!amount || !player?.isAlive()) return false;
    const [key, skill] = DEBUFFS[kind], old = player.storage[key] ?? 0;
    if (!Number.isSafeInteger(old) || old < 0 || amount > Number.MAX_SAFE_INTEGER - old) throw new RangeError("负面状态层数越界");
    if (consumeArtifact(player)) return false;
    player.storage[key] = old + amount; player.addSkill(skill); player.markSkill(skill); return true;
}
