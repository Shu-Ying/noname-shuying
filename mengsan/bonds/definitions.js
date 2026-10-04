import { getBondIntents } from "./intents.js";

export const DEFAULT_BOND_DECK = Object.freeze([
    "sha", "sha", "sha", "shan", "shan", "tao", "wuzhong",
]);

export function getBondDeck(definition) {
    const deck = definition.deck;
    return deck == null || Array.isArray(deck) && !deck.length ?
        [...DEFAULT_BOND_DECK] : deck;
}

// 当前关羽/张飞的可用基础配置；等级先只影响到场概率，数值曲线与新技能后续单独配置。
const baseGrowth = () => Array.from({ length: 10 }, () => ({
    maxHp: 40,
    hand: 4,
    draw: 2,
    handLimit: 5,
    energy: 3,
    skills: [],
}));

export const bondDefinitions = {
    guanyu: {
        name: "关羽", character: "mengsan_guanyu_shuying",
        portrait: "extension/术樱包/mengsan/assets/portraits/guanyu-portrait.jpg",
        deck: null, intents: null, growth: baseGrowth(),
    },
    zhangfei: {
        name: "张飞", character: "mengsan_zhangfei_shuying",
        portrait: "extension/术樱包/mengsan/assets/portraits/zhangfei-portrait.jpg",
        deck: null, intents: null, growth: baseGrowth(),
    },
};

export function getBondCombat(id, level) {
    const definition = Object.hasOwn(bondDefinitions, id) ? bondDefinitions[id] : null;
    if (!definition || !Number.isInteger(level) || level < 1 || level > 10) {
        return null;
    }
    const unlocked = Array.isArray(definition.growth) ? Array.from(definition.growth.slice(0, level)) : [];
    const stats = unlocked[level - 1];
    if (!stats || !["maxHp", "hand", "draw", "handLimit", "energy"]
        .every(key => Number.isInteger(stats[key]) && stats[key] >= 0 && stats[key] <= 99)
        || stats.maxHp < 1 || stats.energy < 1
        || unlocked.some(growth => !growth || !Array.isArray(growth.skills) ||
            !growth.skills.every(skill => typeof skill === "string" && skill))) {
        return null;
    }
    const skills = new Set();
    for (const growth of unlocked) {
        for (const skill of growth.skills) skills.add(skill);
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
