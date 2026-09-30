import { defaultDeck } from "./cards/starting-deck.js";
import contentRegistry from "./content/registry.js";

const mengsanConfig = {
    modeId: "mengsan_shuying",
    saveKey: "mengsan_run_shuying",
    profileKey: "mengsan_profile_shuying",
    schemaVersion: 1,
    mapLayoutVersion: 8,
    routeCount: 4,
    characters: ["mengsan_liubei_shuying"],
    acts: contentRegistry.acts,
    startingDeck: defaultDeck,
    nodeNames: {
        battle: "战斗",
        elite: "精英",
        event: "事件",
        story: "剧情",
        chest: "宝箱",
        rest: "休息",
        shop: "商店",
        boss: "Boss",
    },
    nodeContents: contentRegistry.nodeContents,
    rewardPools: contentRegistry.rewardPools,
    rewards: contentRegistry.rewards,
};

export default mengsanConfig;
