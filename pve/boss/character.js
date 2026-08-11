import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

// 汇总所有主题武将，PVE 玩法只需引用唯一的 BOSS ID。
const characters = mergeBossSection("武将", bossSets, "character");

export default characters;
