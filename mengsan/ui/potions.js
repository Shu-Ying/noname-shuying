import { game } from "../../../../noname.js";
import { potionSlots } from "../potions/state.js";
import { hasPotionText, importPotionText, potionView } from "../potions/presentation.js";
import { chooseButtons } from "./flow-ui.js";
import { choosePotionDialog } from "./reward-ui.js";

export async function choosePotionReplacement(slots, id) {
    if (slots.includes(null)) return { id, replaceIndex: null };
    const selected = await chooseButtons("药水栏已满", [
        ...slots.map((held, index) => {
            const { name, description } = potionView(held);
            return { id: String(index), name: "替换 " + name, description };
        }),
        { id: "skip", name: "保留已有药水" },
    ], "选择一个栏位来放入" + potionView(id).name, { back: "skip", menu: false });
    return selected === "skip" ? null : { id, replaceIndex: Number(selected) };
}

export async function choosePotionReward(candidates, slots) {
    const id = await choosePotionDialog(candidates.map(id => ({ id, ...potionView(id) })));
    return id === null ? null : choosePotionReplacement(slots, id);
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function potionIcon(view) {
    const icon = element("span", "mengsan-potion-icon");
    icon.setAttribute("aria-hidden", "true");
    const fallback = element("span", "", view.name[0]);
    const image = element("img");
    image.alt = "";
    image.addEventListener("load", () => { fallback.hidden = true; }, { once: true });
    image.addEventListener("error", () => image.remove(), { once: true });
    image.src = view.image;
    icon.append(fallback, image);
    return icon;
}

export function showPotionDescription(node, view) {
    const tags = /\[(\/?)(blue|gold|green|red)\]/g;
    let parent = node;
    let start = 0;
    for (const match of view.richDescription.matchAll(tags)) {
        parent.append(view.richDescription.slice(start, match.index));
        if (match[1]) {
            parent = node;
        } else {
            parent = element("span", "mengsan-potion-text-" + match[2]);
            node.append(parent);
        }
        start = match.index + match[0].length;
    }
    parent.append(view.richDescription.slice(start));
}

export function mountPotionSlots(root, player, actions = {}) {
    const strip = element("div", "mengsan-potion-slots");
    if (actions.use) strip.classList.add("mengsan-battle-potions");
    strip.setAttribute("role", "group");
    strip.setAttribute("aria-label", "药水栏");
    root.append(strip);
    let dialog = null;
    let previousFocus = null;
    function close() {
        if (!dialog) return;
        dialog.close();
        dialog.remove();
        dialog = null;
        if (previousFocus?.isConnected) previousFocus.focus();
    }
    function details(index, id) {
        const view = potionView(id);
        previousFocus = document.activeElement;
        dialog = element("dialog", "mengsan-potion-dialog");
        dialog.setAttribute("aria-label", view.name);
        dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
        dialog.addEventListener("keydown", event => event.stopPropagation());
        const description = element("p");
        showPotionDescription(description, view);
        dialog.append(potionIcon(view), element("h2", "", view.name), description);
        const buttons = element("div", "mengsan-potion-actions");
        const button = (caption, callback, disabled = false) => {
            const control = element("button", "", caption);
            control.type = "button";
            control.disabled = disabled;
            control.addEventListener("click", () => { close(); callback?.(); });
            buttons.append(control);
        };
        if (actions.use) button("使用", () => actions.use(index, id), !actions.canUse(index, id));
        if (actions.discard) button("丢弃", () => actions.discard(index, id), !actions.canDiscard());
        button("关闭");
        dialog.append(buttons);
        document.documentElement.append(dialog);
        dialog.showModal();
    }
    function refresh() {
        strip.replaceChildren();
        for (const [index, id] of potionSlots(player).entries()) {
            if (id === null) {
                const empty = element("span", "mengsan-potion-slot mengsan-potion-slot-empty", "·");
                empty.setAttribute("aria-label", "空药水槽");
                strip.append(empty);
                continue;
            }
            const view = potionView(id);
            const button = element("button", "mengsan-potion-slot");
            button.type = "button";
            button.title = view.name;
            button.setAttribute("aria-label", view.name);
            button.append(potionIcon(view));
            button.addEventListener("click", () => details(index, id));
            strip.append(button);
        }
        if (actions.allowImport && !hasPotionText()) {
            const input = element("input");
            input.type = "file";
            input.accept = "application/json,.json";
            input.hidden = true;
            const importButton = element("button", "mengsan-potion-import", "载入药水文本");
            importButton.type = "button";
            importButton.addEventListener("click", () => input.click());
            input.addEventListener("change", async () => {
                if (!input.files[0]) return;
                try {
                    await importPotionText(input.files[0], game);
                    refresh();
                } catch (error) {
                    importButton.textContent = "重新选择 potions.json";
                    importButton.title = error.message;
                    input.value = "";
                }
            });
            strip.append(importButton, input);
        }
    }
    for (const type of ["click", "pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend"]) {
        strip.addEventListener(type, event => event.stopPropagation());
    }
    refresh();
    return { refresh, dispose() { close(); strip.remove(); } };
}
