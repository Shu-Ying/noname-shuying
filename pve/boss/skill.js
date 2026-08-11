import shiershengxiao from "./sets/shiershengxiao/skill.js";
import zhuoguiquxie from "./sets/zhuoguiquxie/skill.js";
import qingqingzijin from "./sets/qingqingzijin/skill.js";
import tianshu from "./sets/tianshu/skill.js";
import mergeBossModules from "./merge.js";

// 汇总所有主题技能，确保跨 PVE 复用 BOSS 时技能始终随统一入口注册。
const skills = mergeBossModules("技能", [
    ["十二生肖", shiershengxiao],
    ["捉鬼驱邪", zhuoguiquxie],
    ["青青子衿", qingqingzijin],
    ["天书乱斗", tianshu],
]);

export default skills;
