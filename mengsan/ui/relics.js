import { ui } from "../../../../noname.js";
import { heldRelics } from "../relics/definitions.js";
import { createRelicIcon } from "./relic-icon.js";
import { mountRelicStrip } from "./relic-strip.js";

export function mountRelics(session, run, battleRelics, { stripRoot = ui.me } = {}) {
    let dialog = null, list = null, previousFocus = null, disposed = false;
    let relics = heldRelics(run), selected = null, strip = null;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mengsan-battle-piles-button-shuying " +
        "mengsan-battle-relics-button-shuying";
    button.textContent = `遗物 ${relics.length}`;
    button.setAttribute("aria-haspopup", "dialog");
    ui.window.appendChild(button);
    const close = () => {
        if (!dialog) return;
        const current = dialog;
        dialog = null; list = null;
        if (current.open) current.close();
        current.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
    };
    const refresh = () => {
        relics = heldRelics(run);
        button.textContent = `遗物 ${relics.length}`;
        strip?.refresh();
        if (!list) return;
        const expanded = new Set([...list.querySelectorAll('details[open]')].map(row => row.dataset.relicId));
        if (!list.children.length && selected) expanded.add(selected);
        list.replaceChildren();
        if (!relics.length) {
            const empty = document.createElement("p");
            empty.textContent = "本次征程尚未获得遗物。";
            list.appendChild(empty);
        }
        for (const relic of relics) {
            const row = document.createElement("details");
            row.className = "mengsan-info-row-shuying";
            row.dataset.relicId = relic.id;
            row.open = expanded.has(relic.id);
            const summary = document.createElement("summary");
            const icon=createRelicIcon(relic.image);if(icon)summary.appendChild(icon);
            const name = document.createElement("strong");
            name.textContent = relic.name;
            summary.appendChild(name);
            const description = document.createElement("p");
            description.textContent = relic.description;
            const status = document.createElement("small");
            status.textContent = `${relic.pool} · ${relic.tier}${relic.ancient ? ` · ${relic.ancient}` : ""} · ${battleRelics.status(relic)}`;
            row.append(summary, description, status);
            list.appendChild(row);
        }
    };
    const open = relic => {
        if (disposed || !session.active || dialog) return;
        selected = relic?.id || null;
        previousFocus = document.activeElement;
        dialog = document.createElement("dialog");
        const currentDialog = dialog;
        dialog.className = "mengsan-deck-dialog-shuying " +
            "mengsan-relic-dialog-shuying";
        dialog.setAttribute("aria-label", "遗物（道具）");
        const header = document.createElement("header");
        header.className = "ms-deck-header";
        const title = document.createElement("h2");
        title.textContent = "遗物（道具）";
        const dismiss = document.createElement("button");
        dismiss.type = "button";
        dismiss.className = "ms-deck-button";
        dismiss.textContent = "关闭";
        dismiss.addEventListener("click", close);
        header.append(title, dismiss);
        list = document.createElement("div");
        list.className = "mengsan-relic-list-shuying";
        dialog.append(header, list);
        dialog.addEventListener("cancel", event => {
            event.preventDefault(); close();
        });
        dialog.addEventListener("close", () => {
            if (dialog === currentDialog) close();
        });
        dialog.addEventListener("keydown", event => event.stopPropagation());
        refresh();
        document.body.appendChild(dialog);
        try { dialog.showModal(); dismiss.focus(); }
        catch (error) { close(); throw error; }
    };
    button.addEventListener("click", () => open());
    if (stripRoot) strip = mountRelicStrip(stripRoot, () => heldRelics(run),
        open, createRelicIcon, document, window);
    const dispose = () => {
        if (disposed) return;
        disposed = true; close(); strip?.dispose(); button.remove();
    };
    session.ownResource(button, dispose);
    return { dispose, refresh };
}
