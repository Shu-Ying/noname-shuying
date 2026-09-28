import { AFFIX_INFO } from "../content/affixes.js";
import { describeLibraryCard } from "./card-library.js";

const node = (tag, className, label, parent) => {
    const element = document.createElement(tag);
    element.className = className;
    if (label != null) element.textContent = label;
    parent?.appendChild(element);
    return element;
};

const button = (label, parent, action) => {
    const element = node("button", "ms-deck-button", label, parent);
    element.type = "button";
    element.addEventListener("click", action);
    return element;
};

// Keep the command battle-scoped; further GM actions can be added as panels here.
export function mountGMManager(session, owner, piles, battle, resources, game) {
    let dialog = null, selected = null, previousFocus = null, disposed = false;
    const available = () => !disposed && session.active && !battle.resolving;
    const close = () => {
        if (!dialog) return;
        const current = dialog;
        dialog = null;
        if (current.open) current.close();
        current.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
        previousFocus = null;
    };
    const render = () => {
        if (!dialog) return;
        const list = dialog.querySelector(".ms-gm-hand");
        const editor = dialog.querySelector(".ms-gm-editor");
        list.replaceChildren(); editor.replaceChildren();
        const hand = owner.getCards("h").filter(card => card.storage?.mengsanCard_shuying);
        if (!hand.includes(selected)) selected = null;
        if (!hand.length) node("p", "ms-deck-empty", "当前没有可编辑的梦三手牌。", list);
        for (const [index, card] of hand.entries()) {
            const data = card.storage.mengsanCard_shuying;
            const details = describeLibraryCard({ ...data, name: card.name, suit: card.suit, number: card.number });
            const label = `${index + 1}. ${details.name} ${details.suit}${details.number}${details.affixes.length ? ` · ${details.affixes.map(value => value.split("：")[0]).join("、")}` : ""}`;
            const item = button(label, list, () => { selected = card; render(); });
            item.classList.add("ms-gm-card");
            item.setAttribute("aria-pressed", String(selected === card));
        }
        if (!selected) { node("p", "ms-deck-empty", "选择一张手牌，然后添加词缀。", editor); return; }
        node("h3", "", `编辑：${describeLibraryCard(selected.storage.mengsanCard_shuying).name}`, editor);
        const choices = node("div", "ms-gm-affixes", null, editor);
        for (const [key, info] of Object.entries(AFFIX_INFO)) {
            const applied = selected.storage.mengsanCard_shuying.affixes.includes(key);
            const item = button(`${info.name}${applied ? " · 已有" : ""}`, choices, () => {
                if (!available() || !owner.getCards("h").includes(selected)) { render(); return; }
                piles.addAffix(selected, key);
                render();
            });
            item.disabled = applied;
            item.title = info.description;
        }
    };
    const open = () => {
        if (!available()) return false;
        if (dialog?.open) { render(); dialog.focus(); return true; }
        previousFocus = document.activeElement;
        dialog = node("dialog", "mengsan-deck-dialog-shuying mengsan-gm-dialog-shuying", null);
        dialog.setAttribute("aria-label", "梦三 GM 管理器");
        dialog.tabIndex = -1;
        const header = node("header", "ms-deck-header", null, dialog);
        node("h2", "ms-deck-title", "GM 管理器", header);
        button("关闭", header, close);
        node("p", "ms-deck-summary", "手牌词缀 · 仅本场战斗生效，不改永久牌组或存档。", dialog);
        button("刷新手牌", dialog, render);
        node("div", "ms-gm-hand", null, dialog);
        node("section", "ms-gm-editor", null, dialog);
        const created = dialog;
        dialog.addEventListener("close", () => { if (dialog === created) close(); });
        dialog.addEventListener("keydown", event => event.stopPropagation());
        document.body.appendChild(dialog);
        try { dialog.showModal(); } catch (error) { close(); throw error; }
        render();
        dialog.querySelector(".ms-deck-header button").focus();
        return true;
    };
    resources.field(globalThis, "mengsanGM_shuying", open);
    resources.field(game, "mengsanGM_shuying", open);
    const handle = { dispose: close };
    session.ownResource(handle, () => { disposed = true; close(); });
    return handle;
}
