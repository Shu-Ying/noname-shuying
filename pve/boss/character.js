import shiershengxiao from "./sets/shiershengxiao/character.js";
import zhuoguiquxie from "./sets/zhuoguiquxie/character.js";
import qingqingzijin from "./sets/qingqingzijin/character.js";
import tianshu from "./sets/tianshu/character.js";
import mergeBossModules from "./merge.js";

// 汇总所有主题武将，PVE 玩法只需引用唯一的 BOSS ID。
const characters = mergeBossModules("武将", [
    ["十二生肖", shiershengxiao],
    ["捉鬼驱邪", zhuoguiquxie],
    ["青青子衿", qingqingzijin],
    ["天书乱斗", tianshu],
]);

export default characters;
