import { ui } from "../../../../noname.js";
import { heldRelics } from "../relics/definitions.js";
import { createRelicIcon } from "./relic-icon.js";

export function mountRelics(session, run, battleRelics) {
    let dialog = null, list = null, previousFocus = null, disposed = false;
    const relics = heldRelics(run);
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
        if (!list) return;
        list.replaceChildren();
        if (!relics.length) {
            const empty = document.createElement("p");
            empty.textContent = "本次征程尚未获得遗物。";
            list.appendChild(empty);
        }
        for (const relic of relics) {
            const row = document.createElement("section");
            const icon=createRelicIcon(relic.image);if(icon)row.appendChild(icon);
            const name = document.createElement("h3");
            name.textContent = relic.name;
            const description = document.createElement("p");
            description.textContent = relic.description;
            const status = document.createElement("small");
            status.textContent = `${relic.pool} · ${relic.tier}${relic.ancient ? ` · ${relic.ancient}` : ""} · ${battleRelics.status(relic)}`;
            row.append(name, description, status);
            list.appendChild(row);
        }
    };
    button.addEventListener("click", () => {
        if (disposed || !session.active || dialog) return;
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
    });
    const dispose = () => {
        if (disposed) return;
        disposed = true; close(); button.remove();
    };
    session.ownResource(button, dispose);
    return { dispose, refresh };
}
