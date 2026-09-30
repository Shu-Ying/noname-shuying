import { get } from "../../../../noname.js";
import { cardUpgradeRule } from "../cards/upgrades.js";
import { getRelic } from "../relics/definitions.js";
import {
    chooseCardDialog, chooseRelicDialog, chooseVictoryOptions,
    RETURN_TO_VICTORY,
} from "./reward-ui.js";

const upgradeDescription = choice => {
    const card = choice.card;
    const rule = cardUpgradeRule(card.name);
    const damage = card.name === "sha" ? 6 : 8;
    const suit = get.translation(card.suit);
    return `${suit}${card.number} · 伤害 ${damage} → ${rule.damage}` +
        (rule.vulnerable ? `；易伤 2 → ${rule.vulnerable} 层` : "") +
        "。费用不变，最多强化一次。";
};

export async function chooseRewardPackage(choices, {
    rewardPackage: pack, fixedRewards = [],
}) {
    let cardId = null, relicId = null;
    const upgradeChoices = pack.upgradeChoices.map(card => ({
        id: card.id, card,
    }));
    const ready = () => (!upgradeChoices.length || cardId !== null) &&
        (!pack.relicChoices.length || relicId !== null);
    const upgrade = {
        id: "upgrade", label: "强化一张牌",
        description: upgradeChoices.length
            ? "从个人牌库中择一磨砺，查看强化前后的变化。"
            : "当前没有可强化卡牌，此项无需选择。",
        isDisabled: () => !upgradeChoices.length,
        async choose() {
            const selected = await chooseCardDialog(upgradeChoices, {
                title: "磨砺 · 强化一张牌", skipLabel: "返回奖励",
                description: "择一磨砺，锋芒更盛。只强化你选中的一张牌。",
                describeChoice: upgradeDescription, actionLabel: "强化此牌",
            });
            if (selected !== null) {
                cardId = selected;
                const choice = upgradeChoices.find(card => card.id === selected);
                upgrade.label = `已选强化 · ${get.translation(choice.card.name)}`;
                upgrade.description = upgradeDescription(choice);
            }
            return RETURN_TO_VICTORY;
        },
    };
    const relic = {
        id: "relic", label: "遗物 · 三选一",
        description: pack.relicChoices.length
            ? "检视本次随机珍藏，择一伴你踏上下一段征途。"
            : "已持有奖励池中的全部遗物，此项无需选择。",
        isDisabled: () => !pack.relicChoices.length,
        async choose() {
            const selected = await chooseRelicDialog(pack.relicChoices, {
                skipLabel: "返回奖励", actionLabel: "携此遗物",
            });
            if (selected !== null) {
                relicId = selected;
                const choice = pack.relicChoices.find(item => item.id === selected);
                const definition = getRelic(choice.relic);
                relic.label = `已选遗物 · ${definition.name}`;
                relic.description = definition.description;
            }
            return RETURN_TO_VICTORY;
        },
    };
    return chooseVictoryOptions([upgrade, relic, {
        id: "claim-package", label: "领取全部奖励",
        description: "完成以上选择后，金币、强化、遗物与固定卡牌一并入囊。",
        isDisabled: () => !ready(),
        choose: () => ({ cardId, relicId }),
    }], {
        title: "初识的卢", allowSkip: false,
        rewardLabel: "固定收获 · 完成两项选择后领取",
        description: `固定获得 ${pack.gold} 金币与${fixedRewards.map(
            reward => `【${reward.name}】`).join("、")}。` +
            "另可强化一张牌，并从随机遗物中择一件。",
    });
}
