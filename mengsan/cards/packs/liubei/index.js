import { createIroncladRuntime } from "./runtime.js";
import { createLegacyLiuBeiCards } from "./legacy.js";

export class LiuBeiCardPack {
    static id = "liubei";
    static owner = "mengsan_liubei_shuying";
    constructor(context) { this.context = context; }
    createRuntime() {
        const legacy = createLegacyLiuBeiCards(this.context);
        const current = createIroncladRuntime(this.context);
        return { ...current, cards:{...legacy.cards,...current.cards},
            translate:{...legacy.translate,...current.translate},
            names:[...legacy.names,...current.names] };
    }
}
