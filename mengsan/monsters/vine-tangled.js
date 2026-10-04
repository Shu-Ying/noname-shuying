import { consumeArtifact } from "./artifact-status.js";
import { cardDefinitions } from "../cards/card-definitions.js";
const KEY = "mengsanTangled_shuying";
const SKILL = "mengsan_tangled_shuying";
// 原版攻击分类优先；未配置类型的旧牌及原生攻击锦囊保留兼容判断。
const nativeAttacks = new Set(["nanman", "wanjian", "huogong"]);
export const isAttackCard = card => {
    if (!card) return false;
    const definition = Object.hasOwn(cardDefinitions, card.name) ? cardDefinitions[card.name] : null;
    return definition?.cardType ? definition.cardType === "attack" :
        nativeAttacks.has(card.name) || definition?.category === "damage";
};
const clear = target => { delete target.storage[KEY]; target.removeSkill(SKILL); };
const turnsOf = target => {
    const turns = target.storage?.[KEY] ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("缠结持续回合无效");
    return turns;
};
export function applyTangled(current, target, turns) {
    if (!current?.session.active || !target.isAlive() || !current.players.has(target)) return false;
    if (!Number.isSafeInteger(turns) || turns < 1) throw new RangeError("缠结回合数必须为正整数");
    const total = turnsOf(target) + turns;
    if (!Number.isSafeInteger(total)) throw new RangeError("缠结回合数溢出");
    if (consumeArtifact(target)) return false;
    if (!current.tangledTargets) {
        const targets = current.tangledTargets = new Set();
        current.session.ownResource(targets, () => {
            for (const target of targets) clear(target);
            targets.clear(); delete current.tangledTargets;
        });
    }
    current.tangledTargets.add(target); target.storage[KEY] = total;
    target.addSkill(SKILL); target.markSkill(SKILL); current.handUI?.refresh(); return true;
}
export function advanceTangled(current, target) {
    if (!current?.session.active || !current.tangledTargets?.has(target)) return;
    const remaining = Math.max(0, turnsOf(target) - 1);
    if (remaining) { target.storage[KEY] = remaining; target.markSkill(SKILL); }
    else { current.tangledTargets.delete(target); clear(target); }
    current.handUI?.refresh();
}
