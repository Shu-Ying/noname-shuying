import config from "../config.js";
import { nextRandom } from "../state.js";

export const getRandomRewardChoices = (run, poolId, count = 3) => {
    const fallbackId = "shared.pool.battle.normal";
    const pool = (config.rewardPools[poolId] || config.rewardPools[fallbackId]).slice();
    for (let index = pool.length - 1; index > 0; index--) {
        const target = Math.floor(nextRandom(run) * (index + 1));
        [pool[index], pool[target]] = [pool[target], pool[index]];
    }
    return pool.slice(0, count).map(id => ({ id, ...config.rewards[id] }));
};
