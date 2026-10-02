import { NIBBIT_CHARACTER } from "../../../monsters/nibbit-intent.js";
export const NIBBIT_PAIR_ENCOUNTER = "mengsan_nibbit_pair_shuying";
export function createNibbitPairBattlePlan() {
    return { units: [
        { id: "nibbit_front", character: NIBBIT_CHARACTER, camp: "enemy", tier: "normal", hand: 4, inheritSkills: false },
        { id: "nibbit_back", character: NIBBIT_CHARACTER, camp: "enemy", tier: "normal", hand: 4, inheritSkills: false },
    ], rules: [] };
}
