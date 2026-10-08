import { ui } from "../../../../noname.js";
import { mountMenu } from "./navigation.js";
import { createRelicIcon } from "./relic-icon.js";

export const chooseButtons = (title, choices, description = "", options = {}) => new Promise(resolve => {
    const previousFocus = document.activeElement;
    const overlay = ui.create.div(".mengsan-overlay-shuying.mengsan-flow-overlay-shuying", ui.window);
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title);
    const panel = ui.create.div(".mengsan-panel-shuying.mengsan-flow-panel-shuying", overlay);
    const eyebrow = document.createElement("p");
    eyebrow.className = "mengsan-flow-eyebrow-shuying";
    eyebrow.textContent = options.eyebrow || "梦三 · 征程";
    panel.appendChild(eyebrow);
    const heading = ui.create.div(".mengsan-title-shuying", panel);
    heading.textContent = title;
    heading.setAttribute("role", "heading");
    heading.setAttribute("aria-level", "1");
    if (description) {
        const summary = ui.create.div(".mengsan-description-shuying", panel);
        summary.textContent = description;
    }
    const buttons = ui.create.div(".mengsan-choice-list-shuying", panel);
    const finish = id => {
        if (overlay.dataset.resolved) return;
        overlay.dataset.resolved = "true";
        overlay.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
        resolve(id);
    };
    choices.forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mengsan-choice-shuying";
        button.dataset.choice = choice.id;
        const icon=createRelicIcon(choice.image);if(icon){button.classList.add("has-relic-image");button.appendChild(icon);}
        if (choice.danger) button.classList.add("danger");
        const name = document.createElement("span");
        name.className = "mengsan-choice-name-shuying";
        name.textContent = choice.name;
        button.appendChild(name);
        if (choice.description) {
            const detail = document.createElement("span");
            detail.className = "mengsan-choice-description-shuying";
            detail.textContent = choice.description;
            button.appendChild(detail);
        }
        button.disabled = Boolean(choice.disabled);
        button.addEventListener("click", () => finish(choice.id));
        buttons.appendChild(button);
    });
    if (options.menu !== false) mountMenu(overlay);
    overlay.addEventListener("keydown", event => {
        if (event.key === "Escape" && options.back) {
            event.preventDefault(); finish(options.back); return;
        }
        if (event.key !== "Tab") return;
        const focusable = [...overlay.querySelectorAll("button:not(:disabled)")];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    buttons.querySelector("button:not(:disabled)")?.focus();
});
