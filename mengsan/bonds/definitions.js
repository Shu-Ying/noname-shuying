import { getBondIntents } from "./intents.js";

export const DEFAULT_BOND_DECK = Object.freeze([
    "sha", "sha", "sha", "shan", "shan", "tao", "wuzhong",
]);

export function getBondDeck(definition) {
    const deck = definition.deck;
    return deck == null || Array.isArray(deck) && !deck.length ?
        [...DEFAULT_BOND_DECK] : deck;
}

const emptyGrowth = () => Array.from({ length: 10 }, () => ({
    maxHp: null,
    hand: null,
    draw: null,
    handLimit: null,
    energy: null,
    skills: null,
}));

export const bondDefinitions = {
    guanyu: {
        name: "关羽", character: "guanyu", portrait: null,
        deck: null, intents: null, growth: emptyGrowth(),
    },
    zhangfei: {
        name: "张飞", character: "zhangfei", portrait: null,
        deck: null, intents: null, growth: emptyGrowth(),
    },
};

export function getBondCombat(id, level) {
    const definition = bondDefinitions[id];
    if (!definition || !Number.isInteger(level) || level < 1 || level > 10) {
        return null;
    }
    const stats = definition.growth[level - 1];
    if (!stats || !["maxHp", "hand", "draw", "handLimit", "energy"]
        .every(key => Number.isInteger(stats[key]) && stats[key] >= 0)
        || stats.maxHp < 1 || stats.energy < 1
        || !Array.isArray(stats.skills)
        || !stats.skills.every(skill => typeof skill === "string" && skill)) {
        return null;
    }
    const skills = new Set();
    for (const growth of definition.growth.slice(0, level)) {
        for (const skill of growth.skills || []) skills.add(skill);
    }
    return {
        id: `bond_${id}`, bondId: id, character: definition.character,
        camp: "ally", after: "player", inheritSkills: false,
        hp: stats.maxHp, maxHp: stats.maxHp, hand: stats.hand,
        draw: stats.draw, handLimit: stats.handLimit, energy: stats.energy,
        skills: [...skills],
        deck: getBondDeck(definition),
        intents: getBondIntents(definition).map(move => ({ ...move })),
    };
}
