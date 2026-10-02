import { INKLET_CHARACTER } from "../../../monsters/inklet-intent.js";

// 网页未指定固定群体数量；梦三适配为三只，前/中/后位置固定，生命在实际入场抽取。
export function createInkletBattlePlan() {
    return {
        units: Array.from({ length: 3 }, (_, index) => ({
            id: `inklet_${index + 1}`, character: INKLET_CHARACTER, camp: "enemy",
            tier: "normal", inkletPosition: index + 1, hand: 4, inheritSkills: false,
        })),
        rules: [],
    };
}
