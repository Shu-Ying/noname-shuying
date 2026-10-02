import { lib, get, ui } from "../../../../noname.js";
import { cardDefinitions } from "../cards/card-definitions.js";
import { DAZED_NAME } from "../cards/status-cards.js";
import { SLIMED_NAME } from "../cards/slimed-card.js";
import { cardCost } from "../battle/combat-rules.js";
import { AFFIX_INFO } from "../cards/affixes.js";
import { cardUpgradeLevel, cardUpgradeRule } from "../cards/upgrades.js";

const suits = { spade: "♠ 黑桃", heart: "♥ 红桃", club: "♣ 梅花", diamond: "♦ 方块" };
const types = { basic: "基本牌", trick: "锦囊牌", delay: "延时锦囊", equip: "装备牌", status: "状态牌" };
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

// 只读图鉴数据，不创建实体牌、伪造花色点数或写入永久牌组。
export function getCardCatalog() {
    const states = Object.entries(lib.card).filter(([name, info]) =>
        /^mengsan_[a-z0-9_]+$/.test(name) && info?.type === "status" &&
        /^ext:术樱包\/mengsan\/assets\/cards\/[a-z0-9_]+\.png$/.test(info.image)).map(([name]) => name);
    return [...new Set([...Object.keys(cardDefinitions), DAZED_NAME, SLIMED_NAME, ...states])]
        .map(name => ({ name, nature: null, affixes: [], upgrade: 0 }));
}

const categories = { damage: "攻击", utility: "辅助", recovery: "恢复", status: "状态" };
function describeCatalogCard(card) {
    const details = describeLibraryCard(card), info = lib.card[card.name];
    const definition = cardDefinitions[card.name];
    const category = info?.type === "status" || card.name === DAZED_NAME || card.name === SLIMED_NAME
        ? "status" : definition?.category || "utility";
    const unplayable = info?.enable === false;
    const cost = info && !unplayable ? cardCost(card) : null;
    return { ...details, category, categoryName: categories[category], cost, unplayable,
        costLabel: !info ? "未加载" : unplayable ? "不可打出" : `${cost}费`,
        exclusive: definition?.owner ? translate(definition.owner) : "" };
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
function preview(card, details, parent, catalog = false) {
    const face = element("div", "ms-deck-face", null, parent);
    element("span", `ms-deck-corner${details.red ? " ms-deck-red" : ""}`, catalog ? details.costLabel : `${details.suit} ${details.number}`, face);
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
    element("span", "ms-deck-meta", catalog ? `${details.categoryName} · ${details.exclusive ? "专属：" + details.exclusive : details.category === "status" ? "战斗生成" : "通用"}` : `${details.type} · ${details.nature}`, face);
    if (details.upgrade || details.affixes.length) {
        element("span", "ms-deck-tags", [details.upgrade ? `+${details.upgrade}` : "", ...details.affixes.map(value => value.split("：")[0])].filter(Boolean).join(" · "), face);
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
    let view = !options.sections && options.view === "catalog" ? "catalog" : "deck";
    const navigation = element("nav", "ms-deck-tabs", null, dialog);
    navigation.setAttribute("aria-label", "卡牌列表视图");
    navigation.hidden = Boolean(options.sections);
    const deckTab = button("持有牌", navigation, () => { view = "deck"; render(); });
    const catalogTab = button("图鉴", navigation, () => { view = "catalog"; render(); });
    const filters = element("div", "ms-catalog-filters", null, dialog);
    function field(label) {
        const wrapper = element("label", "ms-catalog-field", null, filters);
        element("span", "", label, wrapper); return wrapper;
    }
    const search = element("input", "ms-catalog-input", null, field("名称 / 效果"));
    search.type = "search"; search.maxLength = 120; search.placeholder = "搜索卡牌";
    search.setAttribute("aria-label", "搜索图鉴卡牌");
    const categoryFilter = element("select", "ms-catalog-select", null, field("类型"));
    categoryFilter.setAttribute("aria-label", "图鉴类型");
    for (const [key, label] of Object.entries({ "": "全部类型", ...categories })) {
        const option = element("option", "", label, categoryFilter); option.value = key;
    }
    const costFilter = element("select", "ms-catalog-select", null, field("费用"));
    costFilter.setAttribute("aria-label", "图鉴费用");
    for (const [key, label] of [["", "全部费用"], ["0", "0费"], ["1", "1费"], ["2", "2费"], ["3+", "3费及以上"], ["unplayable", "不可打出"]]) {
        const option = element("option", "", label, costFilter); option.value = key;
    }
    button("清空筛选", filters, () => {
        search.value = ""; categoryFilter.value = ""; costFilter.value = "";
        render(); search.focus();
    });
    search.addEventListener("input", render);
    categoryFilter.addEventListener("change", render);
    costFilter.addEventListener("change", render);
    const summary = element("p", "ms-deck-summary", null, dialog);
    summary.setAttribute("aria-live", "polite");
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
    function showDetail(card, details, owner, catalog = false) {
        selectedButton = owner; scrollTop = body.scrollTop;
        detail = true; list.hidden = true; detailPanel.hidden = false;
        detailPanel.replaceChildren();
        const backButton = button(catalog ? "返回图鉴" : "返回牌库", detailPanel, back);
        const content = element("div", "ms-deck-detail-content", null, detailPanel);
        preview(card, details, content, catalog);
        const copy = element("div", "ms-deck-detail-copy", null, content);
        element("h3", "", details.name, copy);
        element("p", "", catalog ? `${details.costLabel} · ${details.categoryName} · ${details.type}` :
            `${details.suit} ${details.number} · ${details.type} · ${details.nature}`, copy);
        if (catalog && details.exclusive) element("p", "ms-deck-rules", `专属角色：${details.exclusive}`, copy);
        element("h4", "", "卡牌介绍", copy);
        element("p", "ms-deck-rules", details.description, copy);
        if (!details.available) element("p", "ms-deck-warning", "该卡牌定义未加载；保留存档记录，不删除此牌。", copy);
        for (const affix of details.affixes) element("p", "ms-deck-rules", affix, copy);
        body.scrollTop = 0; backButton.focus();
    }
    function render() {
        detail = false; list.hidden = false; detailPanel.hidden = true;
        detailPanel.replaceChildren(); list.replaceChildren(); body.scrollTop = 0;
        selectedButton = null;
        const catalog = !options.sections && view === "catalog";
        filters.hidden = !catalog;
        deckTab.setAttribute("aria-pressed", String(!catalog));
        catalogTab.setAttribute("aria-pressed", String(catalog));
        list.classList.toggle("ms-catalog-grid", catalog);
        let records = [];
        if (catalog) {
            const query = search.value.trim().toLocaleLowerCase();
            records = getCardCatalog().map(card => ({ card, details: describeCatalogCard(card) }));
            const total = records.length;
            records = records.filter(({ card, details }) =>
                (!query || `${details.name} ${card.name} ${details.description}`.toLocaleLowerCase().includes(query)) &&
                (!categoryFilter.value || details.category === categoryFilter.value) &&
                (!costFilter.value || (costFilter.value === "unplayable" ? details.unplayable :
                    costFilter.value === "3+" ? details.cost !== null && details.cost >= 3 :
                    details.cost !== null && details.cost === Number(costFilter.value))));
            summary.textContent = `梦三卡牌图鉴 · 共 ${total} 种 · 当前显示 ${records.length} 种`;
        } else {
            summary.textContent = options.sections ? "剩余牌堆按从左到右、从上到下的顺序摸取；第 1 张为下一张。" :
                `本次征程实际携带 · 共 ${current.length} 张 · 同名不同花色、点数分别展示`;
        }
        footer.textContent = catalog ? "图鉴仅供查阅，不会获得卡牌或改变征程牌组 · 点击卡牌查看完整介绍" :
            "点击卡牌查看完整介绍 · 仅供查看，不改变牌组或抽牌顺序";
        const sections = catalog ? [{ title: "", cards: records.map(record => record.card) }] :
            options.sections ? options.sections() : [{ title: "", cards: current }];
        for (const section of sections) {
            const cards = section.cards;
            if (section.title) element("h3", "ms-deck-section", `${section.title} · ${cards.length} 张`, list);
            if (!cards.length) element("p", "ms-deck-empty", catalog ? "没有符合筛选的卡牌，可清空筛选后查看全部图鉴。" : section.ordered ? "剩余牌堆为空；下一次摸牌需按规则洗切弃牌堆，洗切后的顺序尚未确定。" : "此处暂无卡牌。", list);
            cards.forEach((card, index) => {
                const details = catalog ? records[index].details : describeLibraryCard(card);
                const tile = button("", list, () => showDetail(card, details, tile, catalog), "ms-deck-card");
                tile.setAttribute("aria-label", catalog ? `${details.name}，${details.categoryName}，${details.costLabel}，查看详情` :
                    `${section.ordered ? `第 ${index + 1} 张，` : ""}${details.name}，${details.suit}${details.number}，${details.nature}，查看详情`);
                if (section.ordered) element("span", "ms-deck-order", index === 0 ? "1 · 下一张" : `${index + 1}`, tile);
                preview(card, details, tile, catalog);
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
