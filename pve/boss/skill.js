import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

// 汇总所有主题技能，确保跨 PVE 复用 BOSS 时技能始终随统一入口注册。
const skills = mergeBossSection("技能", bossSets, "skill");

export default skills;
