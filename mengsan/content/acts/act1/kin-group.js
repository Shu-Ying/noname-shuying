import { KIN_PRIEST_CHARACTER, KIN_FOLLOWER_CHARACTER } from "../../../monsters/kin-intent.js";

// 一名神官、两名信徒；用角色默认/入场随机HP，不把超过99的神官HP写入关卡覆盖值。
export function createKinBattlePlan() {
    return { units: [
        { id: "kin_priest", character: KIN_PRIEST_CHARACTER, camp: "enemy", tier: "boss", hand: 4, inheritSkills: false },
        { id: "kin_follower_1", character: KIN_FOLLOWER_CHARACTER, camp: "enemy", tier: "normal", hand: 4, inheritSkills: false, kinOwner: "kin_priest", after: "kin_priest" },
        { id: "kin_follower_2", character: KIN_FOLLOWER_CHARACTER, camp: "enemy", tier: "normal", hand: 4, inheritSkills: false, kinOwner: "kin_priest", after: "kin_follower_1" },
    ], rules: [] };
}
