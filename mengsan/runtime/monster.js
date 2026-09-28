import { createCardData } from "./card-data.js";

// 梦三怪物规则只作用于敌方单位；子类可覆盖构造参数或 createDeck()。
const TIER_RULES = Object.freeze({
    normal: Object.freeze({ draw: 1, handLimit: 3, energy: 2 }),
    elite: Object.freeze({ draw: 2, handLimit: 5, energy: 3 }),
    boss: Object.freeze({ draw: 3, handLimit: 7, energy: 4 }),
});

const BASE_DECKS = Object.freeze({
    normal: Object.freeze(["sha", "sha", "sha", "sha", "shan", "shan", "tao", "jiu", "guohe", "sha"]),
    elite: Object.freeze(["sha", "sha", "sha", "sha", "shan", "shan", "shan", "tao", "jiu", "juedou", "wuzhong", "guohe"]),
    boss: Object.freeze(["sha", "sha", "sha", "sha", "sha", "shan", "shan", "shan", "tao", "tao", "jiu", "jiu", "juedou", "wuzhong", "guohe"]),
});

const HEALTH = Object.freeze({
    mengsan_soldier_shuying: 24,
    mengsan_flyconid_shuying: 48,
    re_xiahoudun: 30, re_zhangliao: 28, re_xuzhu: 34, re_lvbu: 120,
    re_ganning: 39, re_zhangfei: 42, re_huangzhong: 37, re_weiyan: 40,
    re_guanyu: 65, dianwei: 62, shen_guanyu: 165,
    re_simayi: 47, re_sunben: 49, dongzhuo: 55, re_yuanshao: 52,
    shen_zhaoyun: 76, shen_simayi: 80, shen_caocao: 210,
});
const validDeckCard = entry => typeof entry === "string" ? Boolean(entry) : Boolean(entry &&
    typeof entry.name === "string" && entry.name &&
    (entry.suit == null || ["spade", "heart", "club", "diamond"].includes(entry.suit)) &&
    (entry.number == null || Number.isInteger(entry.number) && entry.number >= 1 && entry.number <= 13));

export class Monster {
    constructor({ character, tier = "normal", hp, deck, draw, handLimit, energy } = {}) {
        if (!TIER_RULES[tier]) throw new Error("梦三怪物阶级无效：" + tier);
        if (typeof character !== "string" || !character) throw new Error("梦三怪物缺少武将ID");
        const defaults = TIER_RULES[tier];
        this.character = character;
        this.tier = tier;
        this.hp = hp ?? HEALTH[character] ?? (tier === "boss" ? 110 : tier === "elite" ? 60 : 32);
        this.draw = draw ?? defaults.draw;
        this.handLimit = handLimit ?? defaults.handLimit;
        this.energy = energy ?? defaults.energy;
        this.deck = deck || BASE_DECKS[tier];
        if (![this.hp, this.draw, this.handLimit, this.energy].every(value => Number.isInteger(value) && value > 0)) throw new Error("梦三怪物数值无效");
        if (!Array.isArray(this.deck) || !this.deck.length || this.deck.some(entry => !validDeckCard(entry))) throw new Error("梦三怪物牌堆无效");
    }

    createDeck(prefix) {
        return this.deck.map((entry, index) => {
            const card = typeof entry === "string" ? { name: entry } : entry;
            return createCardData({
                id: `${prefix}_${index}`, name: card.name,
                suit: card.suit || ["spade", "heart", "club", "diamond"][index % 4],
                number: card.number || index % 13 + 1,
                nature: card.nature || null, affixes: Array.isArray(card.affixes) ? card.affixes.slice() : [], upgrade: card.upgrade || 0,
            }, { enemy: true });
        });
    }
}

// 专属怪物示例：以后可在子类中覆写任意默认行为。
export class OpeningSoldier extends Monster {
    constructor(options = {}) { super({ character: "mengsan_soldier_shuying", tier: "normal", hp: 24, ...options }); }
}
export class Flyconid extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_flyconid_shuying", tier: "normal", hp: 48 }); }
}

// 新怪物子类在这里注册，未注册的角色使用 Monster 的阶级默认值。
export const MONSTER_TYPES = Object.freeze({ mengsan_soldier_shuying: OpeningSoldier, mengsan_flyconid_shuying: Flyconid });

export function createMonster(spec) {
    const Type = Object.hasOwn(MONSTER_TYPES, spec.character) ? MONSTER_TYPES[spec.character] : Monster;
    return new Type(spec);
}

export { TIER_RULES, BASE_DECKS };
