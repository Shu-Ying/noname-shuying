import { canUpgradeCard } from "../cards/upgrades.js";
import { canAcquireRelic } from "../relics/definitions.js";

export function prepareRewardPackage(run, spec, randomChoices) {
    if (!Number.isSafeInteger(spec.gold) || spec.gold < 0) {
        throw new Error("奖励包金币无效");
    }
    const relicChoices = randomChoices(run, spec.relicPool, 3);
    if (relicChoices.some(reward => !reward.relic)) {
        throw new Error("奖励包候选必须是遗物");
    }
    return {
        gold: spec.gold,
        upgradeChoices: run.player.deck.filter(canUpgradeCard),
        relicChoices,
    };
}

export function applyRewardPackage(run, pack, selection, applyReward) {
    if (!selection || typeof selection !== "object") {
        throw new Error("奖励包选择无效");
    }
    const card = run.player.deck.find(card => card.id === selection.cardId);
    const relic = pack.relicChoices.find(choice =>
        choice.id === selection.relicId);
    if (pack.upgradeChoices.length) {
        if (!pack.upgradeChoices.some(card => card.id === selection.cardId) ||
            !canUpgradeCard(card)) throw new Error("强化目标无效");
    } else if (selection.cardId !== null) throw new Error("无可强化卡牌");
    if (pack.relicChoices.length) {
        if (!relic || !canAcquireRelic(run, relic.relic)) {
            throw new Error("遗物选择无效");
        }
    } else if (selection.relicId !== null) throw new Error("无可选遗物");
    run.player.gold += pack.gold;
    run.statistics.goldEarned += pack.gold;
    if (pack.upgradeChoices.length) card.upgrade = (card.upgrade || 0) + 1;
    if (relic) applyReward(run, relic.id);
}
