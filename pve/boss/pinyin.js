import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const pinyins = mergeBossSection("拼音", bossSets, "pinyins");

export default pinyins;
