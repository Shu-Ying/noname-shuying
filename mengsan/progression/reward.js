import config from "../config.js";
import { nextRandom } from "./state.js";
import { canAcquireCard, cardDefinitions } from "../cards/card-definitions.js";
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

// 精英先抽稀有度再抽牌，避免牌池中各等级数量不同影响概率。
// 每个候选：普通20%、罕见60%、稀有20%；同一组选项不重复。
const eliteRarityWeights = Object.freeze({ common: 20, uncommon: 60, rare: 20 });
const rewardRarity = id => cardDefinitions[rewardCardName(config.rewards[id])]?.rarity;

export const getRandomRewardChoices = (run, poolId, count = 3, { allowSharedCards = false } = {}) => {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError("奖励候选数量无效");
    const fallbackId = "shared.pool.battle.normal";
    const boss = poolId === "shared.pool.boss.premium";
    const pool = (config.rewardPools[poolId] || config.rewardPools[fallbackId])
        .filter(id => {
            const reward = config.rewards[id];
            if (!canAcquireReward(run, reward)) return false;
            const name = rewardCardName(reward);
            // 普通随机卡牌奖励仅来自当前角色；特殊剧情可显式允许通用牌。
            if (name && !allowSharedCards && cardDefinitions[name]?.owner !== run.player.character) return false;
            return !boss || name && cardDefinitions[name]?.rarity === "rare";
        });
    if (boss && pool.length < count) throw new Error("角色专属稀有卡奖励不足，拒绝降级奖励");
    if (poolId === "shared.pool.battle.elite") {
        const groups = Object.entries(eliteRarityWeights).map(([rarity, weight]) => ({
            weight, ids: pool.filter(id => rewardRarity(id) === rarity),
        }));
        const choices = [];
        while (choices.length < count) {
            const available = groups.filter(group => group.ids.length);
            if (!available.length) break;
            let cursor = nextRandom(run) * available.reduce((sum, group) => sum + group.weight, 0);
            const group = available.find(group => (cursor -= group.weight) < 0) || available[available.length - 1];
            const index = Math.floor(nextRandom(run) * group.ids.length);
            const [id] = group.ids.splice(index, 1);
            choices.push({ id, ...config.rewards[id] });
        }
        return choices;
    }
    for (let index = pool.length - 1; index > 0; index--) {
        const target = Math.floor(nextRandom(run) * (index + 1));
        [pool[index], pool[target]] = [pool[target], pool[index]];
    }
    return pool.slice(0, count).map(id => ({ id, ...config.rewards[id] }));
};
