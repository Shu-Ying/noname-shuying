// Same saved Mulberry32 stream as progression/state.js; avoids the config import cycle.
export function relicRandom(run) {
    let value = Number(run.randomState || run.seed || Date.now()) >>> 0;
    value += 0x6d2b79f5;
    run.randomState = value >>> 0;
    let result = Math.imul(value ^ value >>> 15, value | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
}
export const relicRandomGet = (run, list) => list.length ? list[Math.floor(relicRandom(run) * list.length)] : null;
