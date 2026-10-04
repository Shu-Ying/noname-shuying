import liubeiOpening, { openingRewards } from "./stories/liubei-opening.js";
import actMap from "./map.js";
import { rewardPools } from "./rewards.js";
import forestAmbush from "./stories/forest-ambush.js";
import { encounters } from "./encounters.js";

export default {
    map: actMap,
    encounters,
    nodeContents: {
        [forestAmbush.id]: forestAmbush,
        [liubeiOpening.id]: liubeiOpening,
    },
    rewardPools,
    rewards: openingRewards,
};
