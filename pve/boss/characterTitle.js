import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const characterTitles = mergeBossSection("武将称号", bossSets, "characterTitle");

export default characterTitles;
