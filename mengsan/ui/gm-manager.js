import { AFFIX_INFO } from "../cards/affixes.js";
import { hasCardAffix } from "../cards/intrinsic-affixes.js";
import { describeLibraryCard, openCardLibrary } from "./card-library.js";
import { cardDefinitions } from "../cards/card-definitions.js";
import { createCardData } from "../cards/card-data.js";
import { DAZED_NAME, createDazedData } from "../cards/status-cards.js";
import { SLIMED_NAME, createSlimedData } from "../cards/slimed-card.js";
import { WOUND_NAME, createWoundData } from "../cards/wound-card.js";
import { INFECTION_NAME, createInfectionData } from "../cards/infection-card.js";
import { getDiagnostics } from "../../diagnostics/index.js";
import { _status } from "../../../../noname.js";

const statusFactories = {
    [DAZED_NAME]: createDazedData,
    [SLIMED_NAME]: createSlimedData,
    [WOUND_NAME]: createWoundData,
    [INFECTION_NAME]: createInfectionData,
};

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
    let closePicker = null, sequence = 0, message = "";
    const diagnostics = getDiagnostics().scope("mengsan.gm", () => ({
        sessionId: session.id,
    }));
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
        dialog.querySelector(".ms-gm-feedback").textContent = message;
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
            const applied = hasCardAffix(selected,key);
            const item = button(`${info.name}${applied ? " · 已有" : ""}`, choices, () => {
                if (!available() || !owner.getCards("h").includes(selected)) { render(); return; }
                piles.addAffix(selected, key);
                render();
            });
            item.disabled = applied;
            item.title = info.description;
        }
    };
    const chooseTemporaryCard = () => {
        if (!available() || closePicker) return;
        close();
        closePicker = openCardLibrary(null, {
            title: "添加临时牌", eyebrow: "梦三 · GM",
            view: "catalog",
            selection: {
                label: "加入手牌 · 仅本场战斗",
                description: "选择卡牌查看详情并加入手牌；正常弃置和洗牌，" +
                    "战斗结束清理。默认黑桃 A、未强化。",
                unavailableReason: card =>
                    Object.hasOwn(cardDefinitions, card.name) ||
                    Object.hasOwn(statusFactories, card.name) ? "" :
                    "该卡牌尚无可用的战斗创建规则。",
                onSelect(card) {
                    if (!available() || !owner.isAlive()) {
                        throw new Error("当前战斗已结束或角色已阵亡，无法添加。");
                    }
                    if (!describeLibraryCard(card).available) {
                        throw new Error("该卡牌定义未加载。");
                    }
                    const id = `mengsan_gm_${session.id}_${++sequence}`;
                    const factory = Object.hasOwn(statusFactories, card.name)
                        ? statusFactories[card.name] : null;
                    const data = factory ? factory(id) : createCardData({
                        id, name: card.name, suit: "spade", number: 1,
                        nature: null, affixes: [], upgrade: 0,
                    }, { enemy: true });
                    // GM injection must not await the paused native event queue.
                    const created = piles.addToDiscard(data);
                    if (!created) throw new Error("当前战斗无法创建临时牌。");
                    try {
                        owner.directgain([created]);
                        if (!owner.getCards("h").includes(created)) {
                            throw new Error("临时牌未能加入手牌。");
                        }
                    } catch (error) {
                        created.remove();
                        diagnostics.error("temporaryCard.failed", error, {
                            cardName: data.name, cardId: id,
                        });
                        game.log("GM 临时牌添加失败", data.name, id,
                            error.message);
                        throw error;
                    }
                    selected = created;
                    message = `已将【${describeLibraryCard(data).name}】加入手牌，` +
                        "仅本场战斗有效。";
                    game.log("GM 添加临时牌", owner, data.name, id,
                        session.id);
                    diagnostics.info("temporaryCard.added", {
                        cardName: data.name, cardId: id,
                    });
                    try {
                        // check() reuses the choices from before directgain.
                        // Invalidate them without clearing the user's selection.
                        const event = _status.event;
                        if (event?.player === owner) {
                            delete event._cardChoice;
                            delete event._targetChoice;
                            delete event._skillChoice;
                        }
                        game.check();
                    }
                    catch (error) {
                        game.log("GM 临时牌已入手，选择状态刷新失败",
                            error.message);
                    }
                },
            },
            onClose() {
                closePicker = null;
                if (available()) open();
            },
        });
    };
    const open = () => {
        if (!available()) return false;
        if (closePicker) return true;
        if (dialog?.open) { render(); dialog.focus(); return true; }
        const existing = document.querySelector(
            "dialog.mengsan-deck-dialog-shuying[open]");
        if (existing) { existing.focus(); return false; }
        previousFocus = document.activeElement;
        dialog = node("dialog", "mengsan-deck-dialog-shuying mengsan-gm-dialog-shuying", null);
        dialog.setAttribute("aria-label", "梦三 GM 管理器");
        dialog.tabIndex = -1;
        const header = node("header", "ms-deck-header", null, dialog);
        node("h2", "ms-deck-title", "GM 管理器", header);
        button("关闭", header, close);
        node("p", "ms-deck-summary",
            "手牌词缀 / 添加临时牌 · 仅本场战斗生效，不改永久牌组或存档。", dialog);
        button("添加临时牌", dialog, chooseTemporaryCard);
        button("刷新手牌", dialog, render);
        const feedback = node("p", "ms-gm-feedback", "", dialog);
        feedback.setAttribute("role", "status");
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
    const handle = { dispose() {
        disposed = true;
        closePicker?.(); closePicker = null;
        close();
    } };
    session.ownResource(handle, handle.dispose);
    return handle;
}
