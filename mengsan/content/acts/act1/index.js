import liubeiOpening, { openingRewards } from "./stories/liubei-opening.js";
import actMap from "./map.js";
import { rewardPools } from "./rewards.js";
import forestAmbush from "./stories/forest-ambush.js";

export default {
    map: actMap,
    nodeContents: {
        [forestAmbush.id]: forestAmbush,
        [liubeiOpening.id]: liubeiOpening,
    },
    rewardPools,
    rewards: openingRewards,
};
