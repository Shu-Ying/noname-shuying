import characters from "./character.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterFilters from "./characterFilter.js";
import characterTitles from "./characterTitle.js";
import characterIntros from "./intro.js";
import dynamicTranslates from "./dynamicTranslate.js";
import perfectPairs from "./perfectPairs.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";

const shuying_character = {
    name: "shuYing_character",
    connect: true,
    character: { ...characters },
    characterSort: {
        shuYing_character: characterSort,
    },
    characterFilter: { ...characterFilters },
    characterTitle: { ...characterTitles },
    dynamicTranslate: { ...dynamicTranslates },
    characterIntro: { ...characterIntros },
    skill: { ...skills },
    perfectPair: { ...perfectPairs },
    translate: { ...translates, ...voices, ...characterSortTranslate },
};

export default shuying_character;
