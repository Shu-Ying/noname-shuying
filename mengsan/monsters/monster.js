import { createCardData } from "../cards/card-data.js";

// 梦三怪物规则只作用于敌方单位；子类可覆盖构造参数或 createDeck()。
const TIER_RULES = Object.freeze({
    normal: Object.freeze({ draw: 1, handLimit: 3, energy: 2 }),
    elite: Object.freeze({ draw: 2, handLimit: 5, energy: 3 }),
    boss: Object.freeze({ draw: 3, handLimit: 7, energy: 4 }),
});

const BASE_DECKS = Object.freeze({
    normal: Object.freeze(["sha", "sha", "sha", "sha", "shan", "shan", "tao", "jiu", "sha"]),
    elite: Object.freeze(["sha", "sha", "sha", "sha", "shan", "shan", "shan", "tao", "jiu", "juedou", "wuzhong", "guohe"]),
    boss: Object.freeze(["sha", "sha", "sha", "sha", "sha", "shan", "shan", "shan", "tao", "jiu", "juedou", "wuzhong", "guohe"]),
});

const HEALTH = Object.freeze({
    mengsan_soldier_shuying: 24,
    mengsan_flyconid_shuying: 48,
    mengsan_fogmog_shuying: 74, mengsan_eye_with_teeth_shuying: 6,
    mengsan_mawler_shuying: 72,
    mengsan_vine_shambler_shuying: 61,
    mengsan_nibbit_shuying: 44,
    mengsan_cubex_construct_shuying: 65,
    mengsan_byrdonis_shuying: 82,
    mengsan_bygone_effigy_shuying: 127,
    mengsan_vantom_shuying: 173,
    mengsan_ceremonial_beast_shuying: 252,
    mengsan_kin_priest_shuying: 190, mengsan_kin_follower_shuying: 59,
    mengsan_phrog_parasite_shuying: 62,
    mengsan_wriggler_shuying: 19,
    mengsan_shrinker_beetle_shuying: 39,
    mengsan_twig_slime_m_shuying: 27,
    mengsan_twig_slime_s_shuying: 9,
    mengsan_leaf_slime_m_shuying: 34,
    mengsan_leaf_slime_s_shuying: 13,
    mengsan_slithering_strangler_shuying: 54,
    mengsan_snapping_jaxfruit_shuying: 32,
    mengsan_inklet_shuying: 14,
    mengsan_fuzzy_wurm_crawler_shuying: 56,
    mengsan_raider_brute_shuying: 32,
    mengsan_raider_assassin_shuying: 21,
    mengsan_raider_axe_shuying: 21,
    mengsan_raider_crossbow_shuying: 20,
    mengsan_raider_tracker_shuying: 23,
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
export class FuzzyWurmCrawler extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_fuzzy_wurm_crawler_shuying", tier: "normal", hp: options.hp ?? 56 });
    }
}
export class Inklet extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_inklet_shuying", tier: "normal", hp: options.hp ?? 14 });
    }
}
export class SnappingJaxfruit extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_snapping_jaxfruit_shuying", tier: "normal", hp: options.hp ?? 32 });
    }
}
export class SlitheringStrangler extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_slithering_strangler_shuying", tier: "normal", hp: options.hp ?? 54 });
    }
}
export class LeafSlimeSmall extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_leaf_slime_s_shuying", tier: "normal", hp: options.hp ?? 13 });
    }
}
export class LeafSlimeMedium extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_leaf_slime_m_shuying", tier: "normal", hp: options.hp ?? 34 });
    }
}
export class TwigSlimeSmall extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_twig_slime_s_shuying", tier: "normal", hp: options.hp ?? 9 });
    }
}
export class TwigSlimeMedium extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_twig_slime_m_shuying", tier: "normal", hp: options.hp ?? 27 });
    }
}
export class ShrinkerBeetle extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_shrinker_beetle_shuying", tier: "normal", hp: options.hp ?? 39 });
    }
}
export class PhrogParasite extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_phrog_parasite_shuying", tier: "elite", hp: options.hp ?? 62 }); }
}
export class Wriggler extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_wriggler_shuying", tier: "elite", hp: options.hp ?? 19 }); }
}
export class CeremonialBeast extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_ceremonial_beast_shuying", tier: "boss", hp: options.hp ?? 252 }); }
}
export class KinPriest extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_kin_priest_shuying", tier: "boss", hp: options.hp ?? 190 }); }
}
export class KinFollower extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_kin_follower_shuying", tier: "normal", hp: options.hp ?? 59 }); }
}
export class Vantom extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_vantom_shuying", tier: "boss", hp: options.hp ?? 173 });
    }
}
export class BygoneEffigy extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_bygone_effigy_shuying", tier: "elite", hp: options.hp ?? 127 });
    }
}
export class Byrdonis extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_byrdonis_shuying", tier: "elite", hp: options.hp ?? 82 });
    }
}
export class CubexConstruct extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_cubex_construct_shuying", tier: "normal", hp: options.hp ?? 65 });
    }
}
export class Nibbit extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_nibbit_shuying", tier: "normal", hp: options.hp ?? 44 });
    }
}
export class VineShambler extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_vine_shambler_shuying", tier: "normal", hp: options.hp ?? 61 });
    }
}
export class Mawler extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_mawler_shuying", tier: "normal", hp: 72 }); }
}
export class Fogmog extends Monster {
    constructor(options = {}) { super({ ...options, character: "mengsan_fogmog_shuying", tier: "normal", hp: 74 }); }
}
export class EyeWithTeeth extends Monster {
    constructor(options = {}) {
        super({ ...options, character: "mengsan_eye_with_teeth_shuying", tier: "normal", hp: 6, energy: 1, handLimit: 1 });
        this.draw = 0;
    }
    createDeck() { return []; } // 爪牙仅发动牵制，不额外抽取或打出三国杀牌。
}
const raiderClass = (character, hp) => class extends Monster {
    constructor(options = {}) { super({ ...options, character, tier: "normal", hp }); }
};
export const RaiderBrute = raiderClass("mengsan_raider_brute_shuying", 32);
export const RaiderAssassin = raiderClass("mengsan_raider_assassin_shuying", 21);
export const RaiderAxe = raiderClass("mengsan_raider_axe_shuying", 21);
export const RaiderCrossbow = raiderClass("mengsan_raider_crossbow_shuying", 20);
export const RaiderTracker = raiderClass("mengsan_raider_tracker_shuying", 23);

// 新怪物子类在这里注册，未注册的角色使用 Monster 的阶级默认值。
export const MONSTER_TYPES = Object.freeze({
    mengsan_soldier_shuying: OpeningSoldier,
    mengsan_flyconid_shuying: Flyconid,
    mengsan_fogmog_shuying: Fogmog,
    mengsan_mawler_shuying: Mawler,
    mengsan_vine_shambler_shuying: VineShambler,
    mengsan_nibbit_shuying: Nibbit,
    mengsan_cubex_construct_shuying: CubexConstruct,
    mengsan_byrdonis_shuying: Byrdonis,
    mengsan_bygone_effigy_shuying: BygoneEffigy,
    mengsan_vantom_shuying: Vantom,
    mengsan_ceremonial_beast_shuying: CeremonialBeast,
    mengsan_kin_priest_shuying: KinPriest, mengsan_kin_follower_shuying: KinFollower,
    mengsan_phrog_parasite_shuying: PhrogParasite,
    mengsan_wriggler_shuying: Wriggler,
    mengsan_shrinker_beetle_shuying: ShrinkerBeetle,
    mengsan_twig_slime_m_shuying: TwigSlimeMedium,
    mengsan_twig_slime_s_shuying: TwigSlimeSmall,
    mengsan_leaf_slime_m_shuying: LeafSlimeMedium,
    mengsan_leaf_slime_s_shuying: LeafSlimeSmall,
    mengsan_slithering_strangler_shuying: SlitheringStrangler,
    mengsan_snapping_jaxfruit_shuying: SnappingJaxfruit,
    mengsan_inklet_shuying: Inklet,
    mengsan_fuzzy_wurm_crawler_shuying: FuzzyWurmCrawler,
    mengsan_eye_with_teeth_shuying: EyeWithTeeth,
    mengsan_raider_brute_shuying: RaiderBrute,
    mengsan_raider_assassin_shuying: RaiderAssassin,
    mengsan_raider_axe_shuying: RaiderAxe,
    mengsan_raider_crossbow_shuying: RaiderCrossbow,
    mengsan_raider_tracker_shuying: RaiderTracker,
});

export function createMonster(spec) {
    const Type = Object.hasOwn(MONSTER_TYPES, spec.character) ? MONSTER_TYPES[spec.character] : Monster;
    return new Type(spec);
}

export { TIER_RULES, BASE_DECKS };
