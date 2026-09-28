import { lib, get } from "../../../../noname.js";
import { cardCost } from "./combat-rules.js";
import { chooseButtons } from "./flow-ui.js";

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
    const image = /^[a-zA-Z0-9_]+$/.test(imageName) ? `${lib.assetURL || ""}image/card/${imageName}.png` : null;
    const type = { basic: "基本牌", trick: "锦囊牌", delay: "延时锦囊", equip: "装备牌" }[info?.type] || "卡牌";
    return {
        name: get.translation(name), type, image, cost: cardCost({ name }),
        description: plainText(lib.translate[`${name}_info`] || choice.description || "暂无卡牌介绍。"),
    };
};

const restoreFocus = previous => { if (previous?.isConnected) previous.focus(); };
const RETURN_TO_VICTORY = Symbol("return to victory choice");

// Reusable card-only selector. It accepts three cards today and can lay out four or five later.
// Callers supply stable choice IDs; this UI never creates or awards cards itself.
export function chooseCardDialog(choices, { title = "选择一张牌", allowSkip = true, skipLabel = "跳过" } = {}) {
    if (!Array.isArray(choices) || !choices.length || choices.some(choice => !choice?.id || !isCardReward(choice))) {
        return Promise.reject(new TypeError("chooseCardDialog requires nonempty card choices with IDs"));
    }
    return new Promise((resolve, reject) => {
        const previousFocus = document.activeElement;
        const dialog = element("dialog", "mengsan-card-choice-dialog-shuying", null);
        dialog.setAttribute("aria-label", title);
        const stage = element("div", "mengsan-card-choice-stage-shuying", null, dialog);
        const banner = element("header", "mengsan-card-choice-heading-shuying", null, stage);
        element("span", "mengsan-reward-overline-shuying", "梦三 · 战利品", banner);
        element("h2", "", title, banner);
        element("p", "", "择一入阵，余者留于身后", banner);
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
            const view = viewCard(choice);
            const card = element("button", "mengsan-card-choice-tile-shuying", null, cards);
            card.type = "button";
            card.setAttribute("aria-label", `${view.name}，${view.type}，${view.description}。选择此牌`);
            card.addEventListener("click", () => finish(choice.id));
            element("span", "mengsan-card-choice-cost-shuying", String(view.cost), card);
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
export function chooseVictoryOptions(options, { title = "战后抉择", allowSkip = true } = {}) {
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
        element("p", "", "此役已定，选择下一段征途的收获。", intro);
        const board = element("div", "mengsan-victory-options-shuying", null, stage);
        element("span", "mengsan-victory-eyebrow-shuying", "可选战利品", board);
        let settled = false, choosing = false;
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
            element("strong", "", option.label, copy);
            if (option.description) element("small", "", option.description, copy);
            element("span", "mengsan-victory-option-arrow-shuying", "›", entry).setAttribute("aria-hidden", "true");
            entry.addEventListener("click", async () => {
                if (settled || choosing) return;
                choosing = true;
                entry.disabled = true;
                if (dialog.open) dialog.close();
                try {
                    const selected = option.choose ? await option.choose() : option.id;
                    if (selected === RETURN_TO_VICTORY) {
                        dialog.showModal();
                        entry.disabled = false;
                        choosing = false;
                        entry.focus();
                    } else finish(selected);
                }
                catch (error) {
                    if (!settled) { settled = true; dialog.remove(); restoreFocus(previousFocus); reject(error); }
                }
            });
        }
        if (allowSkip) {
            const skip = element("button", "mengsan-victory-skip-shuying", "放弃本次选择", stage);
            skip.type = "button";
            skip.addEventListener("click", () => { if (!choosing) finish(null); });
        }
        dialog.addEventListener("cancel", event => event.preventDefault());
        dialog.addEventListener("keydown", event => event.stopPropagation());
        document.documentElement.appendChild(dialog);
        try { dialog.showModal(); board.querySelector("button")?.focus(); }
        catch (error) { dialog.remove(); restoreFocus(previousFocus); reject(error); }
    });
}

// Gold is a persisted candidate, not an automatic reward. The card pool remains
// a separate Dialog; skipping that Dialog returns to the victory choices.
export function chooseBattleReward(choices) {
    if (!Array.isArray(choices) || !choices.length) return Promise.resolve(null);
    const gold = choices.find(choice => choice.kind === "gold");
    const rewards = choices.filter(choice => choice.kind !== "gold");
    const options = [];
    if (gold) options.push({
        id: gold.id,
        label: `金币 · ${gold.amount}`,
        description: "将此关金币收入征程钱袋。",
    });
    if (rewards.length) {
        const cardOnly = rewards.every(isCardReward);
        options.push({
            id: "choose-reward",
            label: cardOnly ? "择一张牌" : "挑选一项战利品",
            description: cardOnly ? "从本次候选卡牌中选择一张，加入牌组。" : "检视本次战利品，再决定带走哪一项。",
            async choose() {
                const selected = cardOnly
                    ? await chooseCardDialog(rewards, {skipLabel:"跳过选卡"})
                    : await chooseButtons("选择一项奖励", rewards);
                return selected ?? RETURN_TO_VICTORY;
            },
        });
    }
    return chooseVictoryOptions(options);
}
