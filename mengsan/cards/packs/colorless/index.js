import { createSharedCardRuntime } from "../shared/runtime.js";
// 四类通用牌分目录保存数据，共用一次战斗控制器，避免重复安装全局事件。
export class ColorlessCardPack {
    static id = "colorless";
    static owner = null;
    constructor(context) { this.context = context; }
    createRuntime() { return createSharedCardRuntime(this.context); }
}
