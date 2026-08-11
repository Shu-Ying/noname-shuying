import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

// 汇总所有主题动态描述；空主题模块会被安全忽略。
const dynamicTranslates = mergeBossSection("动态翻译", bossSets, "dynamicTranslate");

export default dynamicTranslates;
