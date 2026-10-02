import { lib, get } from "../../../../noname.js";
import { cardCost } from "../battle/combat-rules.js";
import { cardUpgradeRule } from "../cards/upgrades.js";
import { getRelic } from "../relics/definitions.js";

const element = (tag, className, text, parent) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text != null) node.textContent = text;
    parent?.appendChild(node);
    return node;
};

const plainText = value => {
    const template = document.createElement("template");
    template.innerHTML = String(value ?? "").replace(/<br\s*\/?\s*>/gi, "\n");
    return template.content.textContent.trim();
};

const cardNameOf = choice => choice?.card?.name || ({ card_sha: "sha", card_tao: "tao" })[choice?.effectId] || null;
export const isCardReward = choice => Boolean(cardNameOf(choice));

const viewCard = choice => {
    const name = cardNameOf(choice);
    const info = lib.card[name];
    const imageName = info?.cardimage || name;
    const modeImage = info?.image;
    const localArt = typeof modeImage === "string" &&
        /^ext:术樱包\/mengsan\/assets\/cards\/[a-z0-9_]+\.png$/.test(modeImage)
        ? modeImage.replace(/^ext:/, "extension/") : null;
    const image = localArt ? `${lib.assetURL || ""}${localArt}` :
        /^[a-zA-Z0-9_]+$/.test(imageName)
            ? `${lib.assetURL || ""}image/card/${imageName}.png` : null;
    const type = { basic: "基本牌", trick: "锦囊牌", delay: "延时锦囊", equip: "装备牌" }[info?.type] || "卡牌";
    return {
        name: get.translation(name), type, image, cost: cardCost(choice.card || { name }),
        description: plainText(cardUpgradeRule(name) && info?.cardPrompt
            ? info.cardPrompt(choice.card || { name })
            : lib.translate[`${name}_info`] || choice.description ||
                "暂无卡牌介绍。"),
    };
};

const restoreFocus = previous => { if (previous?.isConnected) previous.focus(); };
export const RETURN_TO_VICTORY = Symbol("return to victory choice");

// Reusable card-only selector. It accepts three cards today and can lay out four or five later.
// Callers supply stable choice IDs; this UI never creates or awards cards itself.
export function chooseCardDialog(choices, options = {}) {
    if (!Array.isArray(choices) || !choices.length || choices.some(choice => !choice?.id || !isCardReward(choice))) {
        return Promise.reject(new TypeError("chooseCardDialog requires nonempty card choices with IDs"));
    }
    return chooseTilesDialog(choices, options, viewCard);
}

export function chooseRelicDialog(choices, options = {}) {
    if (!Array.isArray(choices) || !choices.length || choices.some(choice =>
        !choice?.id || !getRelic(choice.relic))) {
        return Promise.reject(new TypeError("遗物候选无效"));
    }
    return chooseTilesDialog(choices, {
        title: "择一件遗物",
        description: `${choices.length} 件珍藏，择一伴你远行。`,
        actionLabel: "携此遗物",
        ...options,
    }, choice => {
        const relic = getRelic(choice.relic);
        return { name: relic.name, type: "遗物", image: null, cost: null,
            description: relic.description };
    });
}

// Mixed reward pools use the same selector, with exactly one candidate awarded.
function chooseRewardDialog(choices) {
    if (choices.every(isCardReward)) return chooseCardDialog(choices);
    if (choices.every(choice => getRelic(choice.relic))) return chooseRelicDialog(choices);
    return chooseTilesDialog(choices, {
        title: "选择一项奖励", actionLabel: "领取此奖励",
        description: "从本次候选中选择一项，也可以跳过。",
    }, choice => {
        if (isCardReward(choice)) return viewCard(choice);
        const relic = getRelic(choice.relic);
        return { name: relic?.name || choice.name, type: relic ? "遗物" : "奖励",
            image: null, cost: null,
            description: plainText(relic?.description || choice.description) };
    });
}

function chooseTilesDialog(choices, {
    title = "选择一张牌", allowSkip = true, skipLabel = "跳过",
    description = "择一入阵，余者留于身后", describeChoice,
    actionLabel = "选择此牌",
} = {}, viewChoice) {
    return new Promise((resolve, reject) => {
        const previousFocus = document.activeElement;
        const dialog = element("dialog", "mengsan-card-choice-dialog-shuying", null);
        dialog.setAttribute("aria-label", title);
        const stage = element("div", "mengsan-card-choice-stage-shuying", null, dialog);
        const banner = element("header", "mengsan-card-choice-heading-shuying", null, stage);
        element("span", "mengsan-reward-overline-shuying", "梦三 · 战利品", banner);
        element("h2", "", title, banner);
        element("p", "", description, banner);
        const cards = element("div", "mengsan-card-choice-grid-shuying", null, stage);
        cards.style.setProperty("--choice-count", String(Math.min(choices.length, 5)));
        let settled = false;
        const finish = id => {
            if (settled) return;
            settled = true;
            if (dialog.open) dialog.close();
            dialog.remove();
            restoreFocus(previousFocus);
            resolve(id);
        };
        for (const choice of choices) {
            const view = viewChoice(choice);
            if (describeChoice) view.description = describeChoice(choice);
            const card = element("button", "mengsan-card-choice-tile-shuying", null, cards);
            card.type = "button";
            card.setAttribute("aria-label", `${view.name}，${view.type}，${view.description}。${actionLabel}`);
            card.addEventListener("click", () => finish(choice.id));
            if (view.cost !== null) {
                element("span", "mengsan-card-choice-cost-shuying", String(view.cost), card);
            }
            element("span", "mengsan-card-choice-name-shuying", view.name, card);
            const artwork = element("span", "mengsan-card-choice-art-shuying", null, card);
            if (view.image) {
                const image = element("img", "", null, artwork);
                image.src = view.image; image.alt = ""; image.loading = "lazy";
                image.addEventListener("error", () => image.remove(), { once: true });
            }
            element("span", "mengsan-card-choice-glyph-shuying", view.name.slice(0, 1), artwork);
            element("span", "mengsan-card-choice-kind-shuying", view.type, card);
            element("span", "mengsan-card-choice-description-shuying", view.description, card);
            element("span", "mengsan-reward-tile-action-shuying", actionLabel, card);
        }
        if (allowSkip) {
            const skip = element("button", "mengsan-card-choice-skip-shuying", skipLabel, stage);
            skip.type = "button";
            skip.addEventListener("click", () => finish(null));
        }
        dialog.addEventListener("cancel", event => event.preventDefault());
        dialog.addEventListener("keydown", event => event.stopPropagation());
        // The engine scales <body>; attach to <html> so viewport-sized modals stay full-screen.
        document.documentElement.appendChild(dialog);
        try { dialog.showModal(); cards.querySelector("button")?.focus(); }
        catch (error) { dialog.remove(); restoreFocus(previousFocus); reject(error); }
    });
}

// Reusable post-battle choice surface. Each option owns its follow-up; the surface
// only resolves a stable candidate ID (or null) and never awards a reward itself.
export function chooseVictoryOptions(options, {
    title = "战后抉择", allowSkip = true,
    description = "此役已定，选择下一段征途的收获。",
    rewardLabel = "可选战利品", rewardItems = [],
} = {}) {
    if (!Array.isArray(options) || !options.length || options.some(option => !option?.id || !option?.label)) {
        return Promise.reject(new TypeError("chooseVictoryOptions requires nonempty options with IDs and labels"));
    }
    return new Promise((resolve, reject) => {
        const previousFocus = document.activeElement;
        const dialog = element("dialog", "mengsan-victory-dialog-shuying", null);
        dialog.setAttribute("aria-label", title);
        const stage = element("div", "mengsan-victory-stage-shuying", null, dialog);
        const intro = element("header", "mengsan-victory-intro-shuying", null, stage);
        element("span", "mengsan-reward-overline-shuying", "梦三 · 战后", intro);
        element("span", "mengsan-victory-seal-shuying", "胜", intro);
        element("h2", "", title, intro);
        element("p", "", description, intro);
        const board = element("div", "mengsan-victory-options-shuying", null, stage);
        element("span", "mengsan-victory-eyebrow-shuying", rewardLabel, board);
        // Read-only loot list: inspecting a reward must not select or award it.
        for (const reward of rewardItems) {
            const item = element("p", "mengsan-victory-option-copy-shuying", null, board);
            element("strong", "", reward.name || reward.id, item);
            if (reward.description) element("small", "", plainText(reward.description), item);
        }
        let settled = false, choosing = false;
        const entries = [];
        const refresh = () => {
            for (const { option, entry, label, detail } of entries) {
                label.textContent = option.label;
                detail.textContent = option.description || "";
                entry.disabled = Boolean(option.isDisabled?.());
                entry.setAttribute("aria-label", `${option.label}。${option.description || ""}`);
            }
        };
        const finish = id => {
            if (settled) return;
            settled = true;
            if (dialog.open) dialog.close();
            dialog.remove();
            restoreFocus(previousFocus);
            resolve(id);
        };
        for (const [index, option] of options.entries()) {
            const entry = element("button", "mengsan-victory-option-shuying", null, board);
            entry.type = "button";
            entry.setAttribute("aria-label", `${option.label}。${option.description || ""}`);
            element("span", "mengsan-victory-option-index-shuying", String(index + 1).padStart(2, "0"), entry);
            const copy = element("span", "mengsan-victory-option-copy-shuying", null, entry);
            const label = element("strong", "", option.label, copy);
            const detail = element("small", "", option.description || "", copy);
            entries.push({ option, entry, label, detail });
            element("span", "mengsan-victory-option-arrow-shuying", "›", entry).setAttribute("aria-hidden", "true");
            entry.addEventListener("click", async () => {
                if (settled || choosing || entry.disabled) return;
                choosing = true;
                entry.disabled = true;
                if (dialog.open) dialog.close();
                try {
                    const selected = option.choose ? await option.choose() : option.id;
                    if (selected === RETURN_TO_VICTORY) {
                        refresh();
                        dialog.showModal();
                        choosing = false;
                        entry.focus();
                    } else finish(selected);
                }
                catch (error) {
                    if (!settled) { settled = true; dialog.remove(); restoreFocus(previousFocus); reject(error); }
                }
            });
        }
        refresh();
        if (allowSkip) {
            const skip = element("button", "mengsan-victory-skip-shuying", "放弃本次选择", stage);
            skip.type = "button";
            skip.addEventListener("click", () => { if (!choosing) finish(null); });
        }
        dialog.addEventListener("cancel", event => event.preventDefault());
        dialog.addEventListener("keydown", event => event.stopPropagation());
        document.documentElement.appendChild(dialog);
        try {
            dialog.showModal();
            entries.find(({ entry }) => !entry.disabled)?.entry.focus();
        }
        catch (error) { dialog.remove(); restoreFocus(previousFocus); reject(error); }
    });
}

// Gold and fixed rewards are guaranteed; random loot opens a separate one-of-N selector.
export function chooseBattleReward(choices, { fixedRewards = [] } = {}) {
    if (!Array.isArray(choices)) return Promise.resolve(null);
    const gold = choices.filter(choice => choice.kind === "gold")
        .reduce((amount, choice) => amount + choice.amount, 0);
    const rewards = choices.filter(choice => choice.kind !== "gold");
    const options = [];
    if (rewards.length) {
        const kind = rewards.every(isCardReward) ? "卡牌"
            : rewards.every(choice => getRelic(choice.relic)) ? "遗物" : "战利品";
        options.push({
            id: "choose-reward", label: `${kind}奖励 · ${rewards.length}选1`,
            description: `点击查看候选${kind}，选择一项领取，或点击跳过。`,
            choose: () => chooseRewardDialog(rewards),
        });
    }
    options.push({
        id: "skip-loot", label: "跳过",
        description: rewards.length ? "跳过本次可选奖励，必得奖励照常领取。"
            : "本次没有可选奖励，领取必得奖励后继续。",
        choose: () => null,
    });
    return chooseVictoryOptions(options, {
        title: "过关奖励", allowSkip: false,
        description: `本关必得 ${gold} 金币。点击奖励选项后择一领取，也可跳过。`,
        rewardLabel: "搜刮 · 战利品列表",
        rewardItems: [{name: `金币 · ${gold}（必得）`,
            description: "无论选择还是跳过，金币都会结算。"},
            ...fixedRewards.map(reward => ({ ...reward, name: `${reward.name}（必得）` }))],
    });
}
