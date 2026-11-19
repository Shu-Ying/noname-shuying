import { chooseFlow } from "./flow-ui.js";
import { mountMenu } from "./navigation.js";
import { createRelicIcon } from "./relic-icon.js";

const iconPaths = {
    heal: "M3 12h4l2-4 3 8 2-4h7M20.8 12.2c1.8-2.4.9-6.2-2-7.2-2.5-.9-4.9.3-6.8 2.3C10.1 5.3 7.7 4.1 5.2 5c-2.9 1-3.8 4.8-2 7.2 2.3 3 5.6 6.4 8.8 8.3 3.2-1.9 6.5-5.3 8.8-8.3Z",
    upgrade: "m15 10-9.5 9.5-2-2L13 8m2-4 5 5-3 3-5-5 3-3ZM19 4l2 2",
    relic: "m12 3 8 9-8 9-8-9 8-9Z",
    chevron: "m9 6 6 6-6 6",
    leave: "M4 12h15m-6-6 6 6-6 6",
};

function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = `ms-rest-${className}`;
    if (text != null) node.textContent = text;
    return node;
}

function icon(name) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", iconPaths[name]);
    svg.append(path);
    return svg;
}

function actionButton(choice, core, finish) {
    const button = element("button", "action");
    button.type = "button";
    button.dataset.choice = choice.id;
    button.disabled = Boolean(choice.disabled);

    const art = element("span", "action-art");
    art.append(createRelicIcon(choice.image) || icon(core ? choice.id : "relic"));
    const copy = element("span", "action-copy");
    const description = choice.disabled && choice.disabledReason ? choice.disabledReason : choice.description;
    copy.append(element("strong", "action-name", choice.name), element("span", "action-description", description));
    button.append(art, copy);
    if (core) button.append(icon("chevron"));
    button.addEventListener("click", () => {
        if (!button.disabled) finish(choice.id);
    });
    return button;
}

export const chooseRest = (choices, { tent, lastAction }) => chooseFlow("休息处", (overlay, finish) => {
    overlay.classList.add("mengsan-rest-overlay-shuying");

    const header = element("header", "header");
    const brand = element("p", "brand");
    const mark = element("span", "mark", "夢");
    mark.setAttribute("aria-hidden", "true");
    brand.append(mark, element("span", "context", "梦三 · 征程"));
    header.append(brand);
    const menu = mountMenu(header);

    const body = element("section", "body");
    const dock = element("div", "dock");
    const core = element("div", "core");
    const relics = element("section", "relics");
    const relicActions = element("div", "relic-actions");
    for (const choice of choices) {
        const isCore = choice.id === "heal" || choice.id === "upgrade";
        (isCore ? core : relicActions).append(actionButton(choice, isCore, finish));
    }
    if (core.childElementCount) dock.append(core);
    if (relicActions.childElementCount) {
        relics.append(element("h2", "relic-heading", "遗物选项"), relicActions);
        dock.append(relics);
    }

    const footer = element("footer", "footer");
    const remaining = choices.filter(choice => !choice.disabled).length;
    const rule = remaining ? `还可执行 ${remaining} 项，每项限一次` : "已完成所有可用选项";
    const prefix = lastAction ? `已执行${lastAction}` : "微型帐篷";
    const status = element("p", "status", tent ? `${prefix} · ${rule}` : "选择一项后返回地图");
    status.setAttribute("role", "status");
    footer.append(status);
    if (tent) {
        const leave = element("button", "leave");
        leave.type = "button";
        leave.dataset.choice = "done";
        leave.append("离开休息处", icon("leave"));
        leave.addEventListener("click", () => finish("done"));
        footer.append(leave);
    }
    dock.append(footer);
    body.append(element("h1", "title", "休息处"), dock);
    overlay.append(header, body);
    return dock.querySelector("button:not(:disabled)") || menu;
});
