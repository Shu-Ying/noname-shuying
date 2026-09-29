// 灰机 Wiki：五名劫掠者中随机抽取三名，且同场不重复。
export const RAIDER_TRIO_ENCOUNTER = "mengsan_raider_trio_shuying";

export const RAIDER_MEMBERS = Object.freeze([
    Object.freeze({ character: "mengsan_raider_brute_shuying", minHp: 30, maxHp: 33 }),
    Object.freeze({ character: "mengsan_raider_assassin_shuying", minHp: 18, maxHp: 23 }),
    Object.freeze({ character: "mengsan_raider_axe_shuying", minHp: 20, maxHp: 22 }),
    Object.freeze({ character: "mengsan_raider_crossbow_shuying", minHp: 18, maxHp: 21 }),
    Object.freeze({ character: "mengsan_raider_tracker_shuying", minHp: 21, maxHp: 25 }),
]);

export function createRaiderTrioBattlePlan(random) {
    if (typeof random !== "function") throw new TypeError("劫掠者团伙需要随机数生成器");
    const members = RAIDER_MEMBERS.slice();
    const pick = count => {
        const value = random();
        if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("随机数必须在 [0,1) 内");
        return Math.floor(value * count);
    };
    for (let index = members.length - 1; index > 0; index--) {
        const other = pick(index + 1);
        [members[index], members[other]] = [members[other], members[index]];
    }
    return {
        units: members.slice(0, 3).map((member, index) => {
            const hp = member.minHp + pick(member.maxHp - member.minHp + 1);
            return { id: `raider_${index + 1}`, character: member.character,
                camp: "enemy", tier: "normal", hp, maxHp: hp, hand: 4 };
        }),
        rules: [],
    };
}
