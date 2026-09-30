import { relicRewardIds } from "../../../relics/definitions.js";

export const rewardPools = {
    "act1.pool.chest": [
        ...relicRewardIds,
        "shared.reward.item.handCharm",
        "shared.reward.maxHp",
        "shared.reward.support.scout",
    ],
    "act1.pool.story.scoutGift": [
        "shared.reward.support.scout",
        "shared.reward.card.sha",
        "shared.reward.card.tao",
        "shared.reward.card.upgrade",
        "shared.reward.item.handCharm",
    ],
    "act1.pool.story.ambushLoot": [
        "shared.reward.card.sha",
        "shared.reward.card.tao",
        "shared.reward.card.upgrade",
        "shared.reward.heal",
        "shared.reward.item.handCharm",
    ],
};
