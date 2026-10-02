// 毛绒伏地虫：酸液 -> 吸入 -> 酸液 -> 回到开头，不是两招交替。
export const CRAWLER_CHARACTER = "mengsan_fuzzy_wurm_crawler_shuying";
export const CRAWLER_MOVES = Object.freeze({
    acid: Object.freeze({ id: "acid", name: "酸液黏球", damage: 4 }),
    inhale: Object.freeze({ id: "inhale", name: "吸入", strength: 7 }),
});
export const CRAWLER_CYCLE = Object.freeze([
    CRAWLER_MOVES.acid, CRAWLER_MOVES.inhale, CRAWLER_MOVES.acid,
]);
const cycleIndex = state => {
    const index = state.cycleIndex ?? 0;
    if (!Number.isInteger(index) || index < 0 || index >= CRAWLER_CYCLE.length) {
        throw new RangeError("毛绒伏地虫循环位置无效");
    }
    return index;
};
export const selectCrawlerMove = (state = {}) => CRAWLER_CYCLE[cycleIndex(state)];
export function recordCrawlerAction(state = {}, advance = true) {
    const index = cycleIndex(state), turn = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turn) || turn < 0 || turn === Number.MAX_SAFE_INTEGER || typeof advance !== "boolean") {
        throw new RangeError("毛绒伏地虫行动记录无效");
    }
    return { turnsTaken: turn + 1,
        cycleIndex: (index + (advance ? 1 : 0)) % CRAWLER_CYCLE.length };
}
export function rollCrawlerHp(random) {
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("怪物随机数必须在 [0,1) 内");
    return 55 + Math.floor(roll * 3);
}
export const isCrawler = player => player?.name === CRAWLER_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
