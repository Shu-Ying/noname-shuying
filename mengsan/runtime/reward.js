import config from "../config.js";
import { nextRandom } from "../state.js";
import { canAcquireCard } from "../content/card-definitions.js";

export const rewardCardName = reward => reward?.card?.name || ({ card_sha: "sha", card_tao: "tao" })[reward?.effectId] || null;
export const canAcquireReward = (run, reward) => {
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
