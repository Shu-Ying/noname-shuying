import zhuoguiquxie from "./sets/zhuoguiquxie/dynamicTranslate.js";
import qingqingzijin from "./sets/qingqingzijin/dynamicTranslate.js";
import tianshu from "./sets/tianshu/dynamicTranslate.js";
import mergeBossModules from "./merge.js";

// 汇总存在动态描述的主题技能；无动态描述的主题不需要空模块占位。
const dynamicTranslates = mergeBossModules("动态翻译", [
    ["捉鬼驱邪", zhuoguiquxie],
    ["青青子衿", qingqingzijin],
    ["天书乱斗", tianshu],
]);

export default dynamicTranslates;
