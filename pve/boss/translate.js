import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

// 汇总所有主题翻译，并阻止同名翻译在后加载模块中被覆盖。
const translates = mergeBossSection("翻译", bossSets, "translate");

export default translates;
