import { openCardLibrary } from "../card-library.js";
import { askMenu, openModeSelection } from "../navigation.js";
import { ui, get } from "../../../../../noname.js";
import config from "../../config.js";
import { getRelic } from "../../relics/definitions.js";
import { renderBonds } from "../bonds.js";
import { getSelectableNodes } from "../../progression/state.js";

// Original vector pictograms; no external image/font requests.
const iconPaths = {
    battle: "M8 5l19 22M24 4l4 4L9 27M5 23l5 5M22 7l5 5M6 4l5 2-3 4z",
    elite: "M16 3l10 5v9c0 6-10 12-10 12S6 23 6 17V8zM10 13l6 4 6-4M16 17v7M11 5l5-3 5 3",
    event: "M10 10c0-9 15-8 15 0 0 5-9 5-9 10M16 25v1",
    story: "M8 5h18v20H10c-5 0-5-6 0-6h16M8 5c-5 0-5 6 0 6h3V5M12 10h10M12 14h8",
    chest: "M4 13h24v15H4zM2 8h28v6H2zM16 8v20" +
        "M9 8c-4-3-1-7 3-5l4 5M23 8c4-3 1-7-3-5l-4 5",
    rest: "M3 26L16 5l13 21zM10 26l6-11 6 11M16 5V2M7 28h19",
    shop: "M4 12l3-7h18l3 7M4 12v4h24v-4M7 16v12h18V16M12 28v-8h8v8M3 28h26M11 6v6M21 6v6",
    boss: "M6 28V5M6 6c8-8 12 6 22-1v16c-10 7-14-7-22 1M11 10l11 7M22 10l-11 7M3 28h9",
};
const controlIconPaths = {
    menu: "M5 8h22M5 16h22M5 24h22",
    map: "M4 7l7-3 10 4 7-3v20l-7 3-10-4-7 3zM11 4v20M21 8v20",
    bag: "M9 10V8a7 7 0 0114 0v2M6 10h20l2 18H4zM12 16v3M20 16v3",
    book: "M5 5h9a5 5 0 015 5v17a5 5 0 00-5-5H5zM27 5h-9a5 5 0 00-5 5v17a5 5 0 015-5h9z",
    record: "M8 4h16v24H8zM12 10h8M12 16h8M12 22h5",
    settings: "M16 11a5 5 0 100 10 5 5 0 000-10zM16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3",
    exit: "M13 5H6v22h7M20 10l6 6-6 6M26 16H11",
    back: "M20 7l-9 9 9 9M11 16h16",
    close: "M8 8l16 16M24 8L8 24",
};
const makeIcon = type => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 32 32");
    icon.setAttribute("aria-hidden", "true");
    icon.classList.add("mengsan-ink-icon-shuying");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", iconPaths[type] || iconPaths.event);
    icon.appendChild(path);
    return icon;
};

const makeControlIcon = type => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 32 32");
    icon.setAttribute("aria-hidden", "true");
    icon.classList.add("mengsan-control-icon-shuying");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", controlIconPaths[type]);
    icon.appendChild(path);
    return icon;
};

const createText = (className, text, parent) => {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
};

const nodeColor = {
    battle: "#9d4937",
    elite: "#7e3f79",
    event: "#477aa6",
    story: "#8c6a34",
    chest: "#a27b35",
    rest: "#3f8560",
    shop: "#a27b35",
    boss: "#a62727",
};

const createMapOverlay = title => {
    const overlay = ui.create.div(".mengsan-overlay-shuying.mengsan-map-overlay-shuying", ui.window);
    const panel = ui.create.div(".mengsan-panel-shuying.mengsan-map-panel-shuying", overlay);
    const header = ui.create.div(".mengsan-map-header-shuying", panel);
    const titleGroup = ui.create.div(".mengsan-map-title-group-shuying", header);
    createText("mengsan-map-eyebrow-shuying", "MENGSAN EXPEDITION", titleGroup);
    const heading = ui.create.div(".mengsan-title-shuying", titleGroup);
    heading.textContent = `${title} · 行军图`;
    return { overlay, panel, header };
};

const getTraversedEdgeIds = map => {
    const traversed = new Set();
    const completed = map.completedNodeIds || [];
    for (let index = 1; index < completed.length; index++) {
        traversed.add(`${completed[index - 1]}\u0000${completed[index]}`);
    }
    return traversed;
};

export const showMap = (run, { saveRun } = {}) => new Promise(resolve => {
    const act = config.acts[run.actIndex];
    const selectable = getSelectableNodes(run);
    const selectableIds = new Set(selectable.map(node => node.id));
    const traversedEdgeIds = getTraversedEdgeIds(run.map);
    const { overlay, panel, header } = createMapOverlay(act.name);
    let closeCardLibrary = null;
    let savingBonds = false;
    const finish = result => {
        if (overlay.dataset.resolved || savingBonds) return;
        overlay.dataset.resolved = "true";
        document.removeEventListener("keydown", handleEscape);
        closeCardLibrary?.();
        overlay.remove();
        resolve(result);
    };

    const menuTrigger = document.createElement("button");
    menuTrigger.type = "button";
    menuTrigger.className = "mengsan-map-menu-trigger-shuying";
    menuTrigger.appendChild(makeControlIcon("menu"));
    const menuTriggerLabel = document.createElement("span");
    menuTriggerLabel.textContent = "菜单";
    menuTrigger.appendChild(menuTriggerLabel);
    menuTrigger.setAttribute("aria-haspopup", "dialog");
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.setAttribute("aria-controls", "mengsan-map-menu-shuying");
    header.insertBefore(menuTrigger, header.firstChild);

    const status = ui.create.div(".mengsan-map-status-shuying", header);
    const statusItems = [
        ["生命", run.player.hp == null ? "未初始化" : `${run.player.hp}/${run.player.maxHp}`],
        ["金币", String(run.player.gold)],
        ["牌组", String(run.player.deck.length)],
    ];
    statusItems.forEach(([label, value]) => {
        const item = ui.create.div(".mengsan-map-stat-shuying", status);
        createText("mengsan-map-stat-label-shuying", label, item);
        createText("mengsan-map-stat-value-shuying", value, item);
    });

    const menuLayer = ui.create.div(".mengsan-map-menu-layer-shuying", panel);
    menuLayer.id = "mengsan-map-menu-shuying";
    menuLayer.hidden = true;
    const menuScrim = ui.create.div(".mengsan-map-menu-scrim-shuying", menuLayer);
    const menuSheet = document.createElement("div");
    menuSheet.className = "mengsan-map-menu-sheet-shuying";
    menuSheet.setAttribute("role", "dialog");
    menuSheet.setAttribute("aria-modal", "true");
    menuSheet.setAttribute("aria-labelledby", "mengsan-map-menu-title-shuying");
    menuLayer.appendChild(menuSheet);
    const menuHeader = document.createElement("div");
    menuHeader.className = "mengsan-map-menu-header-shuying";
    menuSheet.appendChild(menuHeader);
    const menuHeadingGroup = document.createElement("div");
    menuHeadingGroup.className = "mengsan-map-menu-heading-group-shuying";
    menuHeader.appendChild(menuHeadingGroup);
    createText("mengsan-map-menu-kicker-shuying", "征程管理", menuHeadingGroup);
    const menuTitle = createText("mengsan-map-menu-title-shuying", "行军菜单", menuHeadingGroup);
    menuTitle.id = "mengsan-map-menu-title-shuying";
    const closeMenu = document.createElement("button");
    closeMenu.type = "button";
    closeMenu.className = "mengsan-map-icon-button-shuying";
    closeMenu.appendChild(makeControlIcon("close"));
    closeMenu.setAttribute("aria-label", "关闭菜单");
    menuHeader.appendChild(closeMenu);
    const menuContent = document.createElement("div");
    menuContent.className = "mengsan-map-menu-content-shuying";
    menuSheet.appendChild(menuContent);
    const menuFooter = document.createElement("div");
    menuFooter.className = "mengsan-map-menu-footer-shuying";
    menuSheet.appendChild(menuFooter);

    const exitButton = document.createElement("button");
    exitButton.type = "button";
    exitButton.className = "mengsan-map-exit-fixed-shuying";
    exitButton.appendChild(makeControlIcon("exit"));
    const exitCopy = document.createElement("span");
    exitCopy.className = "mengsan-map-exit-copy-shuying";
    const exitName = document.createElement("strong");
    exitName.textContent = "返回模式选择";
    const exitDescription = document.createElement("small");
    exitDescription.textContent = "保留已保存征程，选择其他模式";
    exitCopy.append(exitName, exitDescription);
    exitButton.appendChild(exitCopy);
    exitButton.addEventListener("click", async () => {
        if (exitButton.disabled || savingBonds) return;
        exitButton.disabled = true;
        try {
            const result = await askMenu("返回模式选择？", "保留上次完成节点的存档，未完成内容不会提交。", [
                { id: "cancel", name: "留在行军图" },
                { id: "exit", name: "确认返回模式选择", danger: true },
            ]);
            if (result === "exit") await openModeSelection();
        } catch (error) {
            console.error(error);
            await askMenu("暂时无法返回", "征程未被清除，请重试。", [{ id: "close", name: "关闭提示" }]);
        } finally { exitButton.disabled = false; }
    });
    menuFooter.appendChild(exitButton);

    const setMenuOpen = open => {
        if (savingBonds) return;
        if (open) renderMainMenu();
        menuLayer.hidden = !open;
        menuTrigger.setAttribute("aria-expanded", String(open));
        panel.classList.toggle("menu-open", open);
        if (open) requestAnimationFrame(() => menuSheet.querySelector("button")?.focus());
        else menuTrigger.focus();
    };

    const createMenuAction = ({ icon, name, description, danger = false, disabled = false, onClick }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mengsan-map-menu-action-shuying";
        if (danger) button.classList.add("danger");
        button.disabled = disabled;
        button.appendChild(makeControlIcon(icon));
        const copy = document.createElement("div");
        copy.className = "mengsan-map-menu-action-copy-shuying";
        button.appendChild(copy);
        createText("mengsan-map-menu-action-name-shuying", name, copy);
        createText("mengsan-map-menu-action-description-shuying", description, copy);
        button.addEventListener("click", onClick);
        menuContent.appendChild(button);
        return button;
    };

    const showMenuPage = (title, subtitle, render, focusSelector = null) => {
        menuTitle.textContent = title;
        menuContent.replaceChildren();
        const intro = ui.create.div(".mengsan-map-menu-page-intro-shuying", menuContent);
        intro.textContent = subtitle;
        render(menuContent);
        const back = document.createElement("button");
        back.type = "button";
        back.className = "mengsan-map-menu-back-shuying";
        back.appendChild(makeControlIcon("back"));
        const label = document.createElement("span");
        label.textContent = "返回菜单";
        back.appendChild(label);
        back.addEventListener("click", renderMainMenu);
        menuContent.appendChild(back);
        requestAnimationFrame(() => {
            const target = focusSelector ?
                menuContent.querySelector(focusSelector) : back;
            target?.focus({ preventScroll: Boolean(focusSelector) });
        });
    };

    const renderBackpack = parent => {
        const summary = ui.create.div(".mengsan-map-inventory-summary-shuying", parent);
        [["卡牌", run.player.deck.length], ["道具", run.player.items?.length || 0], ["技能", run.player.permanentSkills?.length || 0]].forEach(([label, value]) => {
            const item = ui.create.div(".mengsan-map-inventory-count-shuying", summary);
            createText("", String(value), item);
            createText("", label, item);
        });
        const library = document.createElement("button");
        library.type = "button";
        library.className = "mengsan-map-menu-action-shuying";
        library.setAttribute("aria-haspopup", "dialog");
        library.appendChild(makeControlIcon("book"));
        const copy = document.createElement("div");
        copy.className = "mengsan-map-menu-action-copy-shuying";
        createText("mengsan-map-menu-action-name-shuying", "卡牌库", copy);
        createText("mengsan-map-menu-action-description-shuying", `共 ${run.player.deck.length} 张 · 查看花色、点数、属性和卡牌详情`, copy);
        library.appendChild(copy);
        library.addEventListener("click", () => { closeCardLibrary = openCardLibrary(run); });
        parent.appendChild(library);
        const appendNames = (title, values, emptyText) => {
            createText("mengsan-map-inventory-section-title-shuying", title, parent);
            const list = ui.create.div(".mengsan-map-inventory-list-shuying", parent);
            if (!values?.length) {
                createText("mengsan-map-empty-shuying", emptyText, list);
                return;
            }
            values.forEach(value => {
                const row = ui.create.div(".mengsan-map-inventory-row-shuying", list);
                const relic = getRelic(value);
                createText("", relic?.name || get.translation(value) || value, row);
                createText("", relic?.description || "已获得", row);
            });
        };
        const supports = run.player.supports || [];
        createText("mengsan-map-inventory-section-title-shuying", "战斗支援", parent);
        const supportList = ui.create.div(".mengsan-map-inventory-list-shuying", parent);
        if (!supports.length) createText("mengsan-map-empty-shuying", "暂无战斗支援。", supportList);
        for (const support of supports) {
            const row = ui.create.div(".mengsan-map-inventory-row-shuying", supportList);
            createText("", config.rewards[support.rewardId]?.name || get.translation(support.unit.character), row);
            createText("", support.battles === -1 ? "本次征程持续生效" : `剩余 ${support.battles} 场`, row);
        }
        appendNames("遗物（道具）", run.player.items, "尚未获得遗物。");
        appendNames("永久技能", run.player.permanentSkills, "尚未获得永久技能。");
    };

    const renderPlaceholder = (parent, message) => {
        const empty = ui.create.div(".mengsan-map-placeholder-shuying", parent);
        empty.appendChild(makeControlIcon("record"));
        createText("mengsan-map-placeholder-title-shuying", "功能开发中", empty);
        createText("mengsan-map-placeholder-text-shuying", message, empty);
    };

    function renderMainMenu() {
        menuTitle.textContent = "行军菜单";
        menuContent.replaceChildren();
        createMenuAction({ icon: "map", name: "继续行军", description: "关闭菜单并返回当前路线", onClick: () => setMenuOpen(false) });
        createMenuAction({ icon: "bag", name: "行囊", description: `查看牌组、道具与永久技能 · ${run.player.deck.length}张牌`, onClick: () => showMenuPage("行囊", "本次征程携带的资源", renderBackpack) });
        createMenuAction({ icon: "book", name: "羁绊", description: "查看羁绊等级、成长进度与助战角色", onClick: () => showMenuPage("羁绊", "本次征程的同行之谊 · 仅可指定一名助战", parent => renderBonds(parent, run, saveRun, busy => {
            savingBonds = busy;
            closeMenu.disabled = busy;
            exitButton.disabled = busy;
            const back = menuContent.querySelector(".mengsan-map-menu-back-shuying");
            if (back) back.disabled = busy;
        }), ".mengsan-bonds-shuying button") });
        createMenuAction({ icon: "book", name: "图鉴", description: "查看已发现的敌人、事件与奖励 · 开发中", onClick: () => showMenuPage("图鉴", "征程见闻与收集记录", parent => renderPlaceholder(parent, "后续将收录已发现的节点、敌人和奖励。")) });
        createMenuAction({ icon: "record", name: "征程记录", description: `已通过 ${run.statistics?.completedNodes || 0} 个节点`, onClick: () => showMenuPage("征程记录", "本次征程的阶段统计", parent => {
            const list = ui.create.div(".mengsan-map-record-list-shuying", parent);
            [["已通过节点", run.statistics?.completedNodes || 0], ["击败敌人", run.statistics?.defeatedEnemies || 0], ["累计金币", run.statistics?.goldEarned || 0]].forEach(([label, value]) => {
                const row = ui.create.div(".mengsan-map-inventory-row-shuying", list);
                createText("", label, row);
                createText("", String(value), row);
            });
        }) });
        createMenuAction({ icon: "settings", name: "设置与说明", description: "显示、音效与玩法说明 · 开发中", onClick: () => showMenuPage("设置与说明", "个性化与帮助", parent => renderPlaceholder(parent, "后续将在这里提供显示、音效和操作设置。")) });
    }

    function handleEscape(event) {
        if (window.inSplash) return;
        if (document.querySelector("dialog.mengsan-deck-dialog-shuying[open]")) return;
        if (document.querySelector(".mengsan-menu-dialog-shuying[open]")) return;
        if (event.key == "Escape" && !menuLayer.hidden) {
            event.preventDefault();
            setMenuOpen(false);
        }
        else if (event.key == "Tab" && !menuLayer.hidden) {
            const focusable = Array.from(menuSheet.querySelectorAll("button:not(:disabled)"));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    }

    renderMainMenu();
    menuTrigger.addEventListener("click", () => setMenuOpen(true));
    closeMenu.addEventListener("click", () => setMenuOpen(false));
    menuScrim.addEventListener("click", () => setMenuOpen(false));
    document.addEventListener("keydown", handleEscape);

    const legend = document.createElement("details");
    legend.className = "mengsan-ink-legend-shuying";
    legend.open = window.matchMedia("(min-width: 900px)").matches;
    const summary = document.createElement("summary");
    summary.textContent = "行军图例";
    legend.appendChild(summary);
    Object.keys(iconPaths).forEach(type => {
        const item = document.createElement("div");
        item.appendChild(makeIcon(type));
        const label = document.createElement("span");
        label.textContent = type === "boss" ? "关底主将" : config.nodeNames[type];
        item.appendChild(label);
        legend.appendChild(item);
    });
    const hint = document.createElement("p");
    hint.textContent = "朱圈可行 · 墨线已行";
    legend.appendChild(hint);
    panel.appendChild(legend);

    const viewport = ui.create.div(".mengsan-map-viewport-shuying", panel);
    let drag = null;
    let suppressClick = false;
    viewport.addEventListener("pointerdown", event => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick = false;
        if (event.pointerType !== "mouse") return;
        drag = { id: event.pointerId, y: event.clientY, top: viewport.scrollTop, moved: false };
    });
    viewport.addEventListener("pointermove", event => {
        if (!drag || drag.id !== event.pointerId) return;
        const distance = event.clientY - drag.y;
        if (!drag.moved && Math.abs(distance) < 6) return;
        drag.moved = true;
        suppressClick = true;
        if (!viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("dragging");
        viewport.scrollTop = drag.top - distance;
        event.preventDefault();
    });
    const endDrag = event => {
        if (!drag || drag.id !== event.pointerId) return;
        drag = null;
        viewport.classList.remove("dragging");
        if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("lostpointercapture", endDrag);
    viewport.addEventListener("pointerleave", event => {
        if (drag && !drag.moved) endDrag(event);
    });
    viewport.addEventListener("click", event => {
        if (suppressClick && event.detail !== 0) {
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressClick = false;
        }
    }, true);
    const map = ui.create.div(".mengsan-map-shuying", viewport);
    const floorCount = Math.max(...run.map.nodes.map(node =>
        Math.floor(node.floor))) + 1;
    map.style.setProperty("--mengsan-map-min-height",
        `${floorCount * 150}px`);
    const landscape = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    landscape.classList.add("mengsan-ink-landscape-shuying");
    landscape.setAttribute("viewBox", "0 0 800 1200");
    landscape.setAttribute("preserveAspectRatio", "none");
    landscape.setAttribute("aria-hidden", "true");
    ["M0 580L45 380 80 420 145 210 204 340 242 310 295 590Z", "M510 950l80-240 30 40 60-280 42 110 32-70 46 330v110Z", "M0 1140q150-75 320-5t480-30v95H0Z"].forEach(d => {
        const mountain = document.createElementNS("http://www.w3.org/2000/svg", "path");
        mountain.setAttribute("d", d);
        landscape.appendChild(mountain);
    });
    map.appendChild(landscape);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("mengsan-lines-shuying");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    map.appendChild(svg);

    const nodeMap = new Map(run.map.nodes.map(node => [node.id, node]));
    run.map.edges.forEach(edge => {
        const source = nodeMap.get(edge[0]);
        const target = nodeMap.get(edge[1]);
        if (!source || !target) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const midY = (source.y + target.y) / 2;
        line.setAttribute("d", `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`);
        if (source.id === run.map.currentNodeId && selectableIds.has(target.id)) line.classList.add("available");
        if (traversedEdgeIds.has(`${source.id}\u0000${target.id}`)) line.classList.add("completed");
        if (source.dynamic || target.dynamic) line.classList.add("dynamic");
        svg.appendChild(line);
    });

    run.map.nodes.forEach(node => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mengsan-node-shuying";
        map.appendChild(button);
        button.style.left = `${node.x}%`;
        button.style.top = `${node.y}%`;
        button.style.setProperty("--node-color", nodeColor[node.type] || "#666");
        const content = node.contentId ? config.nodeContents?.[node.contentId] : null;
        const label = content?.mapName || (node.type === "boss" ? "关底主将" : config.nodeNames[node.type]) || node.type;
        button.appendChild(makeIcon(node.type));
        const caption = document.createElement("span");
        caption.textContent = label;
        button.appendChild(caption);
        button.title = label;
        button.setAttribute("aria-label", `${label}，${node.completed ? "已完成" : selectableIds.has(node.id) ? "可前往" : "未开放"}`);
        button.setAttribute("aria-disabled", String(!selectableIds.has(node.id)));
        button.tabIndex = selectableIds.has(node.id) ? 0 : -1;
        button.dataset.type = node.type;
        if (node.id === run.map.currentNodeId) {
            button.classList.add("current");
            button.setAttribute("aria-current", "step");
        }
        button.dataset.nodeId = node.id;
        if (node.completed) button.classList.add("completed");
        else if (selectableIds.has(node.id)) button.classList.add("selectable");
        else button.classList.add("locked");
        button.addEventListener("click", event => {
            event.preventDefault();
            if (!selectableIds.has(node.id) || overlay.dataset.resolved) return;
            finish(node);
        });
    });

    requestAnimationFrame(() => {
        if (!overlay.isConnected) return;
        const current = nodeMap.get(run.map.currentNodeId) || selectable[0];
        viewport.scrollTop = current
            ? Math.max(0, map.offsetHeight * current.y / 100 - viewport.clientHeight * 0.76)
            : viewport.scrollHeight;
    });
});

export default showMap;
