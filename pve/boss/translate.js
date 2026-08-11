import shiershengxiao from "./sets/shiershengxiao/translate.js";
import zhuoguiquxie from "./sets/zhuoguiquxie/translate.js";
import qingqingzijin from "./sets/qingqingzijin/translate.js";
import tianshu from "./sets/tianshu/translate.js";
import mergeBossModules from "./merge.js";

// 汇总所有主题翻译，并阻止同名翻译在后加载模块中被覆盖。
const translates = mergeBossModules("翻译", [
    ["十二生肖", shiershengxiao],
    ["捉鬼驱邪", zhuoguiquxie],
    ["青青子衿", qingqingzijin],
    ["天书乱斗", tianshu],
]);

export default translates;
