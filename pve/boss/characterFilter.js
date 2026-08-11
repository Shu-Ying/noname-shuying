import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const characterFilters = mergeBossSection("武将过滤", bossSets, "characterFilter");

export default characterFilters;
