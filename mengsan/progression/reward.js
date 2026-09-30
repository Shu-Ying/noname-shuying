import config from "../config.js";
import { nextRandom } from "./state.js";
import { canAcquireCard } from "../cards/card-definitions.js";
import { hasUpgradeableCard } from "../cards/upgrades.js";
import { canAcquireRelic } from "../relics/definitions.js";

export const rewardCardName = reward => reward?.card?.name || ({ card_sha: "sha", card_tao: "tao" })[reward?.effectId] || null;
export const canAcquireReward = (run, reward) => {
    if (reward?.relic) return canAcquireRelic(run, reward.relic);
    if (reward?.effectId === "item_hand") {
        return canAcquireRelic(run, "mengsan_hand_charm_shuying");
    }
    if (reward?.effectId === "upgrade") {
        return hasUpgradeableCard(run?.player?.deck);
    }
    const name = rewardCardName(reward);
    return !name || canAcquireCard(run?.player?.character, name);
};

export const getRandomRewardChoices = (run, poolId, count = 3) => {
    const fallbackId = "shared.pool.battle.normal";
    const pool = (config.rewardPools[poolId] || config.rewardPools[fallbackId])
        .filter(id => canAcquireReward(run, config.rewards[id])).slice();
    for (let index = pool.length - 1; index > 0; index--) {
        const target = Math.floor(nextRandom(run) * (index + 1));
        [pool[index], pool[target]] = [pool[target], pool[index]];
    }
    return pool.slice(0, count).map(id => ({ id, ...config.rewards[id] }));
};
