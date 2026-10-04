// 灰机 Wiki 雾菇页的普通难度：74生命，重击8、头槌14。
import { isKinFollower } from "./kin-intent.js";
export const FOGMOG_CHARACTER = "mengsan_fogmog_shuying";
export const EYE_CHARACTER = "mengsan_eye_with_teeth_shuying";
export const FOGMOG_MOVES = Object.freeze({
    spores: Object.freeze({ id: "spores", name: "虚幻孢子", summon: EYE_CHARACTER }),
    thwack: Object.freeze({ id: "thwack", name: "重击", damage: 8, strength: 1 }),
    headbutt: Object.freeze({ id: "headbutt", name: "头槌", damage: 14 }),
});
export const EYE_INTENT = Object.freeze({ id: "distract", name: "牵制", dazed: 3 });
export function selectFogmogMove(state = {}, random) {
    const turn = state.turnsTaken || 0;
    if (!Number.isSafeInteger(turn) || turn < 0) throw new RangeError("雾菇行动次数无效");
    if (!turn) return FOGMOG_MOVES.spores;
    if (state.lastMove !== "thwack") return FOGMOG_MOVES.thwack;
    if ((state.thwacks || 0) >= 2) return FOGMOG_MOVES.headbutt;
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("怪物随机数必须在 [0,1) 内");
    return roll < 0.4 ? FOGMOG_MOVES.thwack : FOGMOG_MOVES.headbutt;
}
export function recordFogmogAction(state = {}, move, paid) {
    return {
        turnsTaken: (state.turnsTaken || 0) + 1,
        lastMove: paid && move ? move.id : state.lastMove || null,
        thwacks: paid && move ? (move.id === "thwack" ?
            (state.lastMove === "thwack" ? (state.thwacks || 0) + 1 : 1) : 0) : state.thwacks || 0,
    };
}
export const isFogmog = player => player?.name === FOGMOG_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
export const isToothedEye = player => player?.name === EYE_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
export const isFogmogActor = player => isFogmog(player) || isToothedEye(player);
// 爪牙不单独构成胜利目标；雾菇死亡后无需继续杀死或等待其幻象。
export const isEncounterEnemy = player => player?.isAlive() &&
    player.storage?.mengsanCamp_shuying === "enemy" && !isToothedEye(player) && !isKinFollower(player);
