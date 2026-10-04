// 2026-10-03 灰机Wiki铁甲战士详情页主表；所有值均为当前状态。
// 纯数据模块可被费用、升级、注册表及运行时共同导入，不依赖引擎。
import { ironcladAdvancedEntries } from "./advanced-data.js";
import { liubeiCardTraits } from "./traits.js";
const entries = [
    ["dismantle", "拆卸", 1, { damage: 8, vulnerableHits: 2 }, { damage: 10 }],
    ["ashen_strike", "灰烬打击", 1, { damage: 6, perExhaust: 3 }, { perExhaust: 4 }],
    ["pillage", "劫掠", 1, { damage: 6, drawUntilSkill: true }, { damage: 9 }],
    ["hemokinesis", "御血术", 1, { damage: 15, loseHp: 2 }, { damage: 20 }],
    ["uppercut", "上勾拳", 2, { damage: 13, weak: 1, vulnerable: 1 }, { weak: 2, vulnerable: 2 }],
    ["fight_me", "与我一战！", 2, { damage: 5, hits: 2, strength: 3, enemyStrength: 1 }, { damage: 6, strength: 4 }],
    ["bludgeon", "重锤", 3, { damage: 32 }, { damage: 42 }],
    ["demonic_shield", "恶魔护盾", 0, { loseHp: 1, allyBlock: true, exhaust: true }, { exhaust: false }],
    ["forgotten_ritual", "被遗忘的仪式", 1, { exhaustTurnEnergy: 3, exhaust: true }, { exhaustTurnEnergy: 4 }],
    ["burning_pact", "燃烧契约", 1, { chooseExhaust: true, draw: 2 }, { draw: 3 }],
    ["taunt", "挑衅", 1, { block: 7, vulnerable: 1 }, { block: 8, vulnerable: 2 }],
    ["evil_eye", "邪眼", 1, { block: 8, exhaustTurnBlock: true }, { block: 11 }],
    ["second_wind", "重振精神", 1, { exhaustNonAttacks: true, blockPerExhaust: 5 }, { blockPerExhaust: 7 }],
    ["dominate", "主宰", 1, { vulnerable: 1, strengthFromVulnerable: true, exhaust: true }, { vulnerable: 2 }],
    ["pacts_end", "契约终结", 0, { damage: 17, all: true, minExhaust: 3 }, { damage: 23 }],
    ["conflagration", "焚烧", 1, { damage: 2, all: true, hits: 4 }, { hits: 5 }],
    ["fiend_fire", "恶魔之焰", 2, { damage: 7, hitsPerExhaust: true, exhaust: true }, { damage: 10 }],
    ["offering", "祭品", 0, { loseHp: 6, energy: 2, draw: 3, exhaust: true }, { draw: 5 }],
    ["brand", "烙印", 0, { loseHp: 1, chooseExhaust: true, strength: 1 }, { strength: 2 }],
    ["impervious", "岿然不动", 2, { block: 30, exhaust: true }, { block: 40 }],
    ["not_yet", "时候未到", 2, { heal: 10, exhaust: true }, { heal: 13 }],
    ["clash", "交锋", 0, { damage: 14, onlyAttacks: true }, { damage: 18 }],
    ["entrench", "巩固", 2, { doubleBlock: true }, { cost: 1 }],
    ["break", "破击", 1, { damage: 20, vulnerable: 5 }, { damage: 30, vulnerable: 7 }],
    ["blaze", "炽焰", 2, { allyStrength: 5 }, { allyStrength: 7 }],
    ["inflame", "燃烧", 1, { power: "inflame", strength: 2 }, { strength: 3 }],
    ["demon_form", "恶魔形态", 3, { power: "demonForm", turnStrength: 2 }, { turnStrength: 3 }],
    ["pyre", "薪火之源", 2, { power: "pyre", turnEnergy: 1 }, { turnEnergy: 2 }],
    ["crimson_mantle", "绯红披风", 1, { power: "crimsonMantle", turnLoseHp: 1, turnBlock: 8 }, { turnBlock: 10 }],
    ["rage", "狂怒", 0, { turnPower: "rage", attackBlock: 3 }, { attackBlock: 5 }],
    ["rupture", "撕裂", 1, { power: "rupture", lossStrength: 1 }, { lossStrength: 2 }],
    ["flame_barrier", "火焰屏障", 2, { block: 12, turnPower: "flameBarrier", retaliation: 4 }, { block: 16, retaliation: 6 }],
    ["colossus", "巨像", 1, { block: 5, turnPower: "colossus", vulnerableReduction: 0.5 }, { block: 8 }],
    ["cruelty", "残酷", 1, { power: "cruelty", vulnerableBonus: 0.25 }, { vulnerableBonus: 0.5 }],
    ["inferno", "狱火", 1, { power: "inferno", infernoLoseHp: 1, lossDamage: 6 }, { lossDamage: 9 }],
    ["tear_asunder", "扯碎", 2, { damage: 5, hitsPerHpLoss: true }, { damage: 7 }],
    ...ironcladAdvancedEntries,
];

export const ironcladCards = Object.freeze(entries.map(([id, title, cost, base, upgraded]) =>
    Object.freeze({ id, title, name: `mengsan_ic_${id}`, cost, ...liubeiCardTraits[`mengsan_ic_${id}`],
        base: Object.freeze(base), upgraded: Object.freeze({ ...base, ...upgraded }),
        category: base.damage ? "damage" : base.heal ? "recovery" : "utility",
        wiki: `https://sts2.huijiwiki.com/wiki/${encodeURIComponent(id === "corruption" ? "腐化(卡牌)" : title)}` })));
export const ironcladByName = Object.freeze(Object.fromEntries(ironcladCards.map(c => [c.name, c])));
export const ironcladUpgradeRules = Object.freeze(Object.fromEntries(ironcladCards.map(c =>
    [c.name, Object.freeze({ maxLevel: 1, ...c.upgraded })])));
