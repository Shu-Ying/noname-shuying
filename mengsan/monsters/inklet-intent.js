import { isVantom } from "./vantom-intent.js";
// 灰机 Wiki 墨宝：奇数位刺击起手；偶数位旋风起手后刺击；以后随机招与刺击交替。
export const INKLET_CHARACTER = "mengsan_inklet_shuying";
export const INKLET_MOVES = Object.freeze({
    jab: Object.freeze({ id: "jab", name: "刺击", damage: 3 }),
    whirlwind: Object.freeze({ id: "whirlwind", name: "旋风斩", damage: 2, hits: 3 }),
    gaze: Object.freeze({ id: "gaze", name: "锐利凝视", damage: 10 }),
});
const roll = random => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("墨宝随机数必须在[0,1)内");
    return value;
};
const positionOf = state => {
    const position = state.position ?? 1;
    if (!Number.isInteger(position) || position < 1 || position > 7) throw new RangeError("墨宝站位必须为1~7");
    return position;
};
const stageOf = state => {
    const stage = state.stage ?? "opening";
    if (!["opening", "jab", "random"].includes(stage)) throw new RangeError("墨宝行动节点无效");
    return stage;
};
export function selectInkletMove(state = {}, random) {
    const position = positionOf(state), stage = stageOf(state);
    if (stage === "opening") return position % 2 ? INKLET_MOVES.jab : INKLET_MOVES.whirlwind;
    if (stage === "jab") return INKLET_MOVES.jab;
    return roll(random) < 0.5 ? INKLET_MOVES.gaze : INKLET_MOVES.whirlwind;
}
export function recordInkletAction(state = {}, advance = true) {
    const position = positionOf(state), stage = stageOf(state), turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0 || turns === Number.MAX_SAFE_INTEGER || typeof advance !== "boolean") {
        throw new RangeError("墨宝行动记录无效");
    }
    const next = stage === "opening" ? (position % 2 ? "random" : "jab") : stage === "jab" ? "random" : "jab";
    return { position, stage: advance ? next : stage, turnsTaken: turns + 1 };
}
export const rollInkletHp = random => 11 + Math.floor(roll(random) * 7);
export const isInklet = player => player?.name === INKLET_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";

// 在梦三的原生changeHp事件创建后限幅；保留护甲消耗量，只将穿透后的生命损失限制为1。
// 层数由实际changeHp通知消耗，完全格挡、零伤害及取消事件不消耗。
export function capInkletHpLoss(player, event) {
    if (!(isInklet(player) || isVantom(player)) || !(player.storage.mengsanSlippery_shuying > 0) ||
        !Number.isFinite(event.num) || event.num >= 0) return event;
    const parent = event.getParent();
    if (parent?.unreal) return event;
    const armor = parent?.name === "damage" && !parent.nohujia && !player.hasSkillTag("nohujia") ?
        Math.max(0, player.hujia || 0) : 0;
    if (-event.num > armor) event.num = -Math.min(-event.num, armor + 1);
    return event;
}
