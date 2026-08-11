import characters from "./character.js";
import cards from "./card.js";
import pinyins from "./pinyin.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterTitles from "./characterTitle.js";
import characterIntros from "./intro.js";
import characterFilters from "./characterFilter.js";
import dynamicTranslates from "./dynamicTranslate.js";
import perfectPairs from "./perfectPairs.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";

// 青青子衿主题数据片段，由活动 BOSS 根入口统一注册。
export default {
    character: characters,
    card: cards,
    pinyins,
    skill: skills,
    translate: translates,
    characterTitle: characterTitles,
    characterIntro: characterIntros,
    characterFilter: characterFilters,
    dynamicTranslate: dynamicTranslates,
    perfectPair: perfectPairs,
    voices,
    characterSort,
    characterSortTranslate,
};
