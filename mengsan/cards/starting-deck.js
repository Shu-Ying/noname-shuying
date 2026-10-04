import { createCardData } from "./card-data.js";

// Mode-owned starting decks. Existing saves always retain their actual player.deck.
export const defaultDeck = Object.freeze([
    ["spade", 7, "sha"], ["heart", 10, "sha"],
    ["club", 4, "sha"], ["diamond", 6, "sha"],
    ["heart", 2, "shan"], ["diamond", 7, "shan"], ["club", 2, "shan"],
    ["heart", 3, "tao"], ["spade", 3, "guohe"], ["heart", 7, "wuzhong"],
    ["spade", 2, "bagua"], ["club", 6, "sha"],
].map(Object.freeze));

// Character ID -> [suit, number, card name, optional nature, optional affixes].
// Example: edit these twelve entries to change only this private Liu Bei's new-run deck.
export const characterDecks = {
    mengsan_liubei_shuying: [
        ["spade", 7, "sha"], ["heart", 10, "sha"], ["club", 4, "sha"], ["diamond", 6, "sha"],
        ["heart", 2, "mengsan_fangyu"], ["diamond", 7, "mengsan_fangyu"], ["club", 2, "shan"],
        ["heart", 3, "tao"], ["heart", 7, "wuzhong"], ["spade", 1, "juedou"],
        ["spade", 2, "bagua"], ["club", 6, "sha"],
    ],
};

export function getStartingDeck(character) {
    const override = Object.hasOwn(characterDecks, character) ? characterDecks[character] : null;
    return Array.isArray(override) && override.length ? override : defaultDeck;
}

export function createStartingDeck(character, prefix = `mengsan_card_${Date.now()}`) {
    return getStartingDeck(character).map((entry, index) => createCardData({
        id: `${prefix}_${index}`, suit: entry[0], number: entry[1], name: entry[2],
        nature: entry[3] || null, affixes: entry[4] ? entry[4].slice() : [], upgrade: 0,
    }, { character }));
}
