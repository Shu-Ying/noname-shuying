import { lib, get, ui } from "../../../../noname.js";
import { AFFIX_INFO } from "../cards/affixes.js";
import { cardUpgradeLevel, cardUpgradeRule } from "../cards/upgrades.js";

const suits = { spade: "♠ 黑桃", heart: "♥ 红桃", club: "♣ 梅花", diamond: "♦ 方块" };
const types = { basic: "基本牌", trick: "锦囊牌", delay: "延时锦囊", equip: "装备牌" };
const affixes = Object.fromEntries(Object.entries(AFFIX_INFO).map(([key, info]) => [key, `${info.name}：${info.description}`]));
const text = value => {
    const template = document.createElement("template");
    // Translation markup is parsed inertly; only plain text is inserted into the UI.
    template.innerHTML = String(value ?? "").replace(/<br\s*\/?\s*>/gi, "\n");
    return template.content.textContent.trim();
};
const translate = value => text(lib.translate[value] || get.translation(value) || value);

export function describeLibraryCard(card) {
    const info = lib.card[card.name];
    const nature = typeof card.nature === "string" ? card.nature.split("|").filter(Boolean).map(translate).join("、") : "";
    return {
        name: translate(card.name), suit: suits[card.suit] || "无花色",
        number: ({ 1: "A", 11: "J", 12: "Q", 13: "K" })[card.number] || String(card.number ?? "—"),
        nature: nature || "无属性", type: types[info?.type] || "未知类别",
        red: card.suit === "heart" || card.suit === "diamond",
        description: text(cardUpgradeRule(card.name) && info?.cardPrompt
            ? info.cardPrompt(card)
            : lib.translate[`${card.name}_info`] || "暂无卡牌介绍。"),
        affixes: (Array.isArray(card.affixes) ? card.affixes : []).filter(key => key !== "annihilate").map(key => affixes[key] || `词缀：${translate(key)}`),
        upgrade: cardUpgradeLevel(card),
        upgradeLimit: cardUpgradeRule(card.name)?.maxLevel || 0,
        available: Boolean(info),
    };
}

function element(tag, className, value, parent) {
    const node = document.createElement(tag);
    node.className = className;
    if (value != null) node.textContent = value;
    parent?.appendChild(node);
    return node;
}

function button(label, parent, action, className = "ms-deck-button") {
    const node = element("button", className, label, parent);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
}

// Read-only DOM previews, never game.createCard or Card.init: no IDs, triggers or pile writes.
function preview(card, details, parent) {
    const face = element("div", "ms-deck-face", null, parent);
    element("span", `ms-deck-corner${details.red ? " ms-deck-red" : ""}`, `${details.suit} ${details.number}`, face);
    const art = element("div", "ms-deck-art", null, face);
    element("span", "ms-deck-glyph", details.name, art);
    const imageName = lib.card[card.name]?.cardimage || card.name;
    const modeImage = lib.card[card.name]?.image;
    const localArt = typeof modeImage === "string" &&
        /^ext:术樱包\/mengsan\/assets\/cards\/[a-z0-9_]+\.png$/.test(modeImage)
        ? modeImage.replace(/^ext:/, "extension/") : null;
    // Only mode-standard local art paths; unknown or missing art keeps the text fallback.
    if (/^[a-zA-Z0-9_]+$/.test(imageName)) {
        const image = element("img", "ms-deck-image", null, art);
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove(), { once: true });
        image.src = `${lib.assetURL || ""}${localArt || `image/card/${imageName}.png`}`;
    }
    element("strong", "ms-deck-name", details.name, face);
    element("span", "ms-deck-meta", `${details.type} · ${details.nature}`, face);
    if (details.upgrade || details.affixes.length) {
        element("span", "ms-deck-tags", [details.upgrade ? `强化 +${details.upgrade}` : "", ...details.affixes.map(value => value.split("：")[0])].filter(Boolean).join(" · "), face);
    }
    return face;
}

export function openCardLibrary(run, options = {}) {
    const existing = document.querySelector("dialog.mengsan-deck-dialog-shuying[open]");
    if (existing) { existing.focus(); return () => {}; }
    const previousFocus = document.activeElement;
    const dialog = element("dialog", "mengsan-deck-dialog-shuying", null);
    dialog.setAttribute("aria-label", options.title || "卡牌库");
    const header = element("header", "ms-deck-header", null, dialog);
    const title = element("div", "ms-deck-title-group", null, header);
    element("span", "ms-deck-eyebrow", options.eyebrow || "梦三 · 行囊", title);
    element("h2", "ms-deck-title", options.title || "卡牌库", title);
    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true;
        if (dialog.open) dialog.close();
        dialog.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
    };
    button("关闭", header, close);
    const summary = element("p", "ms-deck-summary", null, dialog);
    const body = element("div", "ms-deck-body", null, dialog);
    const footer = element("p", "ms-deck-footer", "点击卡牌查看完整介绍 · 仅供查看，不改变牌组或抽牌顺序", dialog);
    const current = Array.isArray(run?.player?.deck) ? run.player.deck : [];
    let detail = false, selectedButton = null, scrollTop = 0;
    const list = element("div", "ms-deck-grid", null, body);
    const detailPanel = element("section", "ms-deck-detail", null, body);
    detailPanel.hidden = true;
    function back() {
        detail = false; detailPanel.hidden = true; list.hidden = false;
        detailPanel.replaceChildren(); body.scrollTop = scrollTop;
        selectedButton?.focus({ preventScroll: true });
    }
    function showDetail(card, details, owner) {
        selectedButton = owner; scrollTop = body.scrollTop;
        detail = true; list.hidden = true; detailPanel.hidden = false;
        detailPanel.replaceChildren();
        const backButton = button("返回牌库", detailPanel, back);
        const content = element("div", "ms-deck-detail-content", null, detailPanel);
        preview(card, details, content);
        const copy = element("div", "ms-deck-detail-copy", null, content);
        element("h3", "", details.name, copy);
        element("p", "", `${details.suit} ${details.number} · ${details.type} · ${details.nature}`, copy);
        element("h4", "", "卡牌介绍", copy);
        element("p", "ms-deck-rules", details.description, copy);
        if (!details.available) element("p", "ms-deck-warning", "该卡牌定义未加载；保留存档记录，不删除此牌。", copy);
        element("p", "", details.upgradeLimit
            ? `强化：${details.upgrade}/${details.upgradeLimit}`
            : "此牌不可强化", copy);
        for (const affix of details.affixes) element("p", "ms-deck-rules", affix, copy);
        body.scrollTop = 0; backButton.focus();
    }
    function render() {
        detail = false; list.hidden = false; detailPanel.hidden = true;
        detailPanel.replaceChildren(); list.replaceChildren(); body.scrollTop = 0;
        const sections = options.sections ? options.sections() : [{ title: "", cards: current }];
        summary.textContent = options.sections ? "剩余牌堆按从左到右、从上到下的顺序摸取；第 1 张为下一张。" : `本次征程实际携带 · 共 ${current.length} 张 · 同名不同花色、点数分别展示`;
        for (const section of sections) {
            const cards = section.cards;
            if (section.title) element("h3", "ms-deck-section", `${section.title} · ${cards.length} 张`, list);
            if (!cards.length) element("p", "ms-deck-empty", section.ordered ? "剩余牌堆为空；下一次摸牌需按规则洗切弃牌堆，洗切后的顺序尚未确定。" : "此处暂无卡牌。", list);
            cards.forEach((card, index) => {
                const details = describeLibraryCard(card);
                const tile = button("", list, () => showDetail(card, details, tile), "ms-deck-card");
                tile.setAttribute("aria-label", `${section.ordered ? `第 ${index + 1} 张，` : ""}${details.name}，${details.suit}${details.number}，${details.nature}，查看详情`);
                if (section.ordered) element("span", "ms-deck-order", index === 0 ? "1 · 下一张" : `${index + 1}`, tile);
                preview(card, details, tile);
                element("span", "ms-deck-excerpt", details.description, tile);
            });
        }
    }
    dialog.addEventListener("cancel", event => { event.preventDefault(); if (detail) back(); else close(); });
    dialog.addEventListener("close", close);
    // Prevent the map's Escape/Tab handler from acting behind this modal.
    dialog.addEventListener("keydown", event => event.stopPropagation());
    render();
    document.body.appendChild(dialog);
    try { dialog.showModal(); } catch (error) { close(); throw error; }
    header.querySelector("button").focus();
    close.refresh = () => {
        if (closed) return;
        // Rebuild from live arrays after a pile mutation, including while viewing details.
        const wasDetail = detail, offset = body.scrollTop;
        render(); body.scrollTop = offset;
        if (wasDetail) header.querySelector("button").focus();
    };
    return close;
}

// The battle view exposes only this player's own piles, including consumed cards.
export function mountBattlePiles(session, battle) {
    let closeDialog = null, disposed = false;
    const control = button("牌堆", ui.window, () => {
        if (disposed || !session.active || battle.resolving) return;
        closeDialog?.();
        closeDialog = openCardLibrary(null, {
            title: "战斗牌堆", eyebrow: "梦三 · 个人牌堆",
            sections: () => [
                { title: "剩余牌堆", cards: battle.drawPile, ordered: true },
                { title: "弃牌堆", cards: battle.discardPile, ordered: false },
                { title: "消耗牌堆", cards: battle.exhaustPile, ordered: false },
            ],
        });
    }, "mengsan-battle-piles-button-shuying");
    control.setAttribute("aria-haspopup", "dialog");
    const dispose = () => {
        if (disposed) return;
        disposed = true; closeDialog?.(); closeDialog = null; control.remove();
    };
    session.ownResource(control, dispose);
    return { dispose, refresh() { if (!disposed) closeDialog?.refresh?.(); } };
}
