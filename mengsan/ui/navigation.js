import { lib, game, ui, _status } from "../../../../noname.js";
import { save } from "../../../../noname/util/config.js";

let selectingMode = false;
let nonameMenuTask = null;

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
                } catch (closeError) { console.error("Noname 菜单关闭失败：", closeError); }
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
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector("button")?.focus();
});

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
            action = await askMenu("征程菜单", "退出不删除存档。未完成的节点与对话将在下次进入时重新开始。", [
                { id: "resume", name: "继续当前界面" },
                { id: "noname", name: "显示 Noname 菜单" },
                { id: "exit", name: "返回模式选择" },
            ]);
            if (action === "noname") { await openNonameMenu(); return; }
            if (action !== "exit") return;
            const confirmed = await askMenu("返回模式选择？", "保留上次已完成节点的存档。本次尚未完成的内容不会提交。", [
                { id: "cancel", name: "留在梦三" },
                { id: "confirm", name: "确认返回模式选择", danger: true },
            ]);
            if (confirmed === "confirm") await openModeSelection();
        } catch (error) {
            console.error("梦三菜单操作失败：", error);
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
