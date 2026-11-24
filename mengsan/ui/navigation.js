import { lib, game, ui, _status } from "../../../../noname.js";
import { save } from "../../../../noname/util/config.js";
import { getDiagnostics } from "../../diagnostics/index.js";
import config from "../config.js";

let selectingMode = false;
let nonameMenuTask = null;
let restartingJourney = false;

const journeyRestartKey = () => `${lib.configprefix}${config.modeId}:restart`;
const canRestartJourney = () => lib.storage?.[config.saveKey]?.status === "running";

export const consumeJourneyRestart = () => {
    const key = journeyRestartKey();
    if (sessionStorage.getItem(key) !== "true") return false;
    sessionStorage.removeItem(key);
    return true;
};

// Open the engine's real settings menu without ending the current expedition flow.
export const openNonameMenu = async () => {
    if (nonameMenuTask) return nonameMenuTask;
    const container = ui.menuContainer;
    if (!container?.isConnected || typeof ui.click?.config !== "function"
        || typeof ui.click?.configMenu !== "function") {
        throw new Error("Noname 菜单尚未加载，请稍后重试。");
    }
    nonameMenuTask = new Promise((resolve, reject) => {
        const previousFocus = document.activeElement;
        const initiallyHidden = container.classList.contains("hidden");
        const wasPaused = _status.paused2;
        const layerClass = "mengsan-noname-menu-open-shuying";
        const hadLayerClass = ui.window.classList.contains(layerClass);
        const previousTabindex = container.getAttribute("tabindex");
        const overlays = Array.from(ui.window.querySelectorAll(".mengsan-overlay-shuying"))
            .map(node => ({ node, inert: node.inert }));
        let closed = false;
        const finish = error => {
            if (closed) return;
            closed = true;
            observer.disconnect();
            if (!hadLayerClass) ui.window.classList.remove(layerClass);
            for (const { node, inert } of overlays) node.inert = inert;
            if (previousTabindex == null) container.removeAttribute("tabindex");
            else container.setAttribute("tabindex", previousTabindex);
            if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
            if (error) reject(error);
            else resolve();
        };
        const observer = new MutationObserver(() => {
            if (!container.isConnected || container.classList.contains("hidden")) finish();
        });
        try {
            observer.observe(container, { attributes: true, attributeFilter: ["class"] });
            observer.observe(ui.window, { childList: true });
            ui.window.classList.add(layerClass);
            for (const { node } of overlays) node.inert = true;
            if (initiallyHidden) ui.click.config();
            if (container.classList.contains("hidden")) throw new Error("Noname 菜单未能打开，请稍后重试。");
            container.setAttribute("tabindex", "-1");
            container.focus({ preventScroll: true });
        } catch (error) {
            if (initiallyHidden) {
                try {
                    if (!container.classList.contains("hidden")) ui.click.configMenu();
                } catch (closeError) {
                    getDiagnostics().scope("mengsan.navigation").error("menu.close.failed", closeError);
                    console.error("Noname 菜单关闭失败：", closeError);
                }
                if (wasPaused) game.pause2();
                else game.resume2();
            }
            finish(error);
        }
    });
    try { await nonameMenuTask; }
    finally { nonameMenuTask = null; }
};

// Reuse the registered engine splash, not reload-to-the-current-mode or a fake mode list.
export const openModeSelection = async () => {
    if (selectingMode) return;
    const splash = lib.onloadSplashes.find(item => item.id === lib.config.splash_style) || lib.onloadSplashes[0];
    if (!splash) throw new Error("模式选择界面未加载，请稍后重试。");
    selectingMode = true;
    const previousSplash = window.inSplash;
    const previousFocus = document.activeElement;
    const previousInert = ui.window.inert;
    const node = ui.create.div("#splash", document.body);
    node.style.zIndex = "1000";
    window.inSplash = true;
    ui.window.inert = true;
    try {
        let choose;
        const selected = new Promise(resolve => { choose = resolve; });
        await splash.init(node, choose);
        const mode = await selected;
        if (!lib.config.all.mode.includes(mode)) throw new Error("所选模式不可用。");
        await save("mode", "config", mode);
        lib.config.mode = mode;
        localStorage.setItem(`${lib.configprefix}directstart`, "true");
        // Reload only AFTER a mode is chosen; retain engine pending-write handling.
        node.inert = true;
        game.reload();
        // Keep the abandoned flow inert while the engine waits for pending DB writes.
        await new Promise(() => {});
    } catch (error) {
        // DefaultSplash owns a Vue app. Clean it up if opening/saving failed.
        splash.app?.unmount?.();
        throw error;
    } finally {
        node.remove();
        window.inSplash = previousSplash;
        ui.window.inert = previousInert;
        selectingMode = false;
        if (previousFocus?.isConnected) previousFocus.focus();
    }
};

export const askMenu = (title, description, choices) => new Promise(resolve => {
    const previousFocus = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.className = "mengsan-menu-dialog-shuying";
    dialog.setAttribute("aria-label", title);
    const heading = document.createElement("h2");
    heading.textContent = title;
    const body = document.createElement("p");
    body.textContent = description;
    dialog.append(heading, body);
    let closed = false;
    const finish = value => {
        if (closed) return;
        closed = true;
        dialog.close();
        dialog.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
        resolve(value);
    };
    for (const choice of choices) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.name;
        if (choice.danger) button.className = "danger";
        button.addEventListener("click", () => finish(choice.id));
        dialog.appendChild(button);
    }
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(null); });
    document.documentElement.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector("button")?.focus();
});

export const confirmRestartJourney = async () => {
    if (restartingJourney || !canRestartJourney()) return;
    restartingJourney = true;
    let cleared = false;
    try {
        const confirmed = await askMenu("重新开始？", "当前征程的存档将被清除。确认后返回角色选择。", [
            { id: "cancel", name: "取消" },
            { id: "confirm", name: "确认重新开始", danger: true },
        ]);
        if (confirmed !== "confirm") return;

        const restartKey = journeyRestartKey();
        const directStartKey = `${lib.configprefix}directstart`;
        const previousDirectStart = localStorage.getItem(directStartKey);
        const previousInert = ui.window.inert;
        const wasPaused = _status.paused2;
        ui.window.inert = true;
        game.pause2();
        try {
            sessionStorage.setItem(restartKey, "true");
            localStorage.setItem(directStartKey, "true");
            await game.mengsanClearRun_shuying();
        } catch (error) {
            ui.window.inert = previousInert;
            if (!wasPaused) game.resume2();
            sessionStorage.removeItem(restartKey);
            if (previousDirectStart === null) localStorage.removeItem(directStartKey);
            else localStorage.setItem(directStartKey, previousDirectStart);
            throw error;
        }
        cleared = true;

        // Reload through the engine so the old flow stops and pending DB writes can finish.
        game.reload();
        await new Promise(() => {});
    } catch (error) {
        console.error("梦三重新开始失败：", error);
        getDiagnostics().scope("mengsan.navigation").error("restart.failed", error);
        const message = cleared ? "本局存档已清除，请重新进入梦三选择角色。" : "请关闭提示后重试。";
        await askMenu("暂时无法重新开始", message, [
            { id: "close", name: "关闭提示" },
        ]);
    } finally {
        restartingJourney = false;
    }
};

export const mountMenu = (overlay, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mengsan-flow-menu-shuying";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M4 6h16M4 12h16M4 18h16");
    icon.appendChild(path);
    const label = document.createElement("span");
    label.textContent = "菜单";
    button.append(icon, label);
    button.setAttribute("aria-haspopup", "dialog");
    let opened = false;
    button.addEventListener("click", async event => {
        event.stopPropagation();
        if (opened) return;
        opened = true;
        options.onOpen?.();
        let action = null;
        try {
            const choices = [
                { id: "resume", name: "继续当前界面" },
                { id: "noname", name: "显示 Noname 菜单" },
                { id: "exit", name: "返回模式选择" },
            ];
            if (canRestartJourney()) choices.push({ id: "restart", name: "重新开始", danger: true });
            action = await askMenu("征程菜单", "返回模式选择会保留存档。未完成的节点与对话将在下次进入时重新开始。", choices);
            if (action === "noname") { await openNonameMenu(); return; }
            if (action === "restart") { await confirmRestartJourney(); return; }
            if (action !== "exit") return;
            const confirmed = await askMenu("返回模式选择？", "保留上次已完成节点的存档。本次尚未完成的内容不会提交。", [
                { id: "cancel", name: "留在梦三" },
                { id: "confirm", name: "确认返回模式选择", danger: true },
            ]);
            if (confirmed === "confirm") await openModeSelection();
        } catch (error) {
            console.error("梦三菜单操作失败：", error);
            getDiagnostics().scope("mengsan.navigation").error("menu.operation.failed", error);
            await askMenu(action === "noname" ? "暂时无法显示菜单" : "暂时无法返回",
                action === "noname" ? error.message || "请关闭提示后重试。" : "没有清除征程。请关闭提示后重试。",
                [{ id: "close", name: "回到当前界面" }]);
        } finally {
            opened = false;
            options.onClose?.();
        }
    });
    overlay.appendChild(button);
    return button;
};
