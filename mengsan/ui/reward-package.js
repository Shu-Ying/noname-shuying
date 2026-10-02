import { lib, get } from "../../../../noname.js";
import { getRelic } from "../relics/definitions.js";
import {
    chooseCardDialog, chooseRelicDialog, chooseVictoryOptions,
    RETURN_TO_VICTORY,
} from "./reward-ui.js";

const upgradeDescription = choice => {
    const card = choice.card;
    const info = lib.card[card.name];
    const suit = get.translation(card.suit);
    // Display this card's current rules, not eligibility or upgrade comparisons.
    const description = typeof info?.cardPrompt === "function"
        ? info.cardPrompt(card) : lib.translate[`${card.name}_info`] || "暂无卡牌介绍。";
    return `${suit}${card.number} · ${description}`;
};

export async function chooseRewardPackage(choices, {
    rewardPackage: pack, fixedRewards = [],
}) {
    let cardId = null, relicId = null;
    const upgradeChoices = pack.upgradeChoices.map(card => ({
        id: card.id, card,
    }));
    const upgrade = {
        id: "upgrade", label: "强化一张牌",
        description: upgradeChoices.length
            ? "从个人牌库中选择一张牌进行磨砺。"
            : "当前没有可强化卡牌，此项无需选择。",
        isDisabled: () => !upgradeChoices.length,
        async choose() {
            const selected = await chooseCardDialog(upgradeChoices, {
                title: "磨砺 · 强化一张牌", skipLabel: "跳过强化",
                description: "择一磨砺，锋芒更盛。只强化你选中的一张牌。",
                describeChoice: upgradeDescription, actionLabel: "强化此牌",
            });
            cardId = selected;
            if (selected !== null) {
                const choice = upgradeChoices.find(card => card.id === selected);
                upgrade.label = `已选强化 · ${get.translation(choice.card.name)}`;
                upgrade.description = upgradeDescription(choice);
            } else {
                upgrade.label = "已跳过强化";
                upgrade.description = "不强化卡牌；点击可重新选择。";
            }
            return RETURN_TO_VICTORY;
        },
    };
    const relic = {
        id: "relic", label: pack.relicChoices.length
            ? `遗物奖励 · ${pack.relicChoices.length}选1` : "遗物奖励 · 暂无候选",
        description: pack.relicChoices.length
            ? "检视本次随机珍藏，择一伴你踏上下一段征途。"
            : "已持有奖励池中的全部遗物，此项无需选择。",
        isDisabled: () => !pack.relicChoices.length,
        async choose() {
            const selected = await chooseRelicDialog(pack.relicChoices, {
                skipLabel: "跳过遗物", actionLabel: "携此遗物",
            });
            relicId = selected;
            if (selected !== null) {
                const choice = pack.relicChoices.find(item => item.id === selected);
                const definition = getRelic(choice.relic);
                relic.label = `已选遗物 · ${definition.name}`;
                relic.description = definition.description;
            } else {
                relic.label = "已跳过遗物";
                relic.description = "不领取遗物；点击可重新选择。";
            }
            return RETURN_TO_VICTORY;
        },
    };
    return chooseVictoryOptions([upgrade, relic, {
        id: "claim-package", label: "领取奖励并继续",
        description: "领取必得奖励与已选奖励，未选择的项目视为跳过。",
        choose: () => ({ cardId, relicId }),
    }, {
        id: "skip-package", label: "跳过",
        description: "跳过强化与遗物，金币与固定卡牌仍会获得。",
        choose: () => ({ cardId: null, relicId: null }),
    }], {
        title: "初识的卢", allowSkip: false,
        rewardLabel: "搜刮 · 战利品列表",
        rewardItems: [{ name: `金币 · ${pack.gold}（必得）`,
            description: "无论选择还是跳过，金币都会结算。" },
            ...fixedRewards.map(reward => ({ ...reward, name: `${reward.name}（必得）` }))],
        description: `固定获得 ${pack.gold} 金币与${fixedRewards.map(
            reward => `【${reward.name}】`).join("、")}。` +
            "强化与遗物点击后选择，也可跳过。",
    });
}
