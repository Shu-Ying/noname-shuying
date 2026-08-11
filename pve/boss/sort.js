import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const characterSort = mergeBossSection("武将分组", bossSets, "characterSort");
const characterSortTranslate = mergeBossSection("武将分组翻译", bossSets, "characterSortTranslate");

export { characterSort, characterSortTranslate };
