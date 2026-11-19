import { chooseFlow } from "./flow-ui.js";
import { mountMenu } from "./navigation.js";
import { createRelicIcon } from "./relic-icon.js";

const portraitUrl = new URL("../assets/portraits/sushuang-zhangshiping.png", import.meta.url).href;
const iconPaths = {
    coin: "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0ZM10 10h4v4h-4z",
    heart: "M20 8.6c0 4-5.4 7.7-8 10-2.6-2.3-8-6-8-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.6Z",
    heal: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6z",
    exit: "M13 4H6v16h7M12 12h9m-3-3 3 3-3 3",
};

function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = `ms-shop-${className}`;
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

function statusItem(symbol, label, value) {
    const item = element("span", "stat");
    item.append(icon(symbol), element("span", "stat-label", label), element("b", "value", value));
    return item;
}

function offer(choice, relic, finish) {
    const card = element("article", "offer");
    const art = element("span", "art");
    art.setAttribute("aria-hidden", "true");
    const visual = relic ? createRelicIcon(choice.image) :
        choice.id === "card_sha" ? element("span", "card-face", "杀") : icon("heal");
    if (visual) art.append(visual);

    const copy = element("div", "copy");
    const description = element("p", "description", choice.description);
    description.id = `ms-shop-description-${choice.id}`;
    copy.append(element("h3", "name", choice.name), description);

    const button = element("button", "price");
    button.type = "button";
    button.disabled = Boolean(choice.disabled);
    button.dataset.choice = choice.id;
    button.setAttribute("aria-label", `${choice.name}，${choice.price} 金币`);
    button.setAttribute("aria-describedby", description.id);
    const price = element("span", "amount");
    price.append(icon("coin"), element("b", "value", choice.price), element("span", "unit", "金币"));
    button.append(element("span", "buy", "购买"), price);
    button.addEventListener("click", () => finish(choice.id));
    card.append(art, copy, button);
    return card;
}

function appendOffers(counter, label, group, choices, finish) {
    if (!choices.length) return;
    const section = element("section", group);
    const offers = element("div", "offers");
    for (const choice of choices) offers.append(offer(choice, group === "relics", finish));
    section.append(element("h2", "heading", label), offers);
    counter.append(section);
}

export const chooseShop = (player, choices) => chooseFlow("商店", (overlay, finish) => {
    overlay.classList.add("mengsan-shop-overlay-shuying");
    const panel = element("section", "panel");
    const portrait = element("figure", "portrait");
    const image = document.createElement("img");
    image.alt = "";
    image.src = portraitUrl;
    image.addEventListener("error", () => image.remove(), { once: true });
    const caption = element("figcaption", "caption");
    caption.append(element("span", "merchant-label", "中山商贾"), element("b", "merchants", "苏双、张世平"));
    portrait.append(image, caption);

    const counter = element("div", "counter");
    const header = element("header", "header");
    const heading = element("div", "title");
    heading.append(element("p", "context", "梦三 · 征程"), element("h1", "title-text", "商店"));
    const status = element("div", "status");
    status.append(
        statusItem("coin", "金币", player.gold),
        statusItem("heart", "生命", player.hp == null ? "未初始化" : `${player.hp}/${player.maxHp}`),
    );
    const menu = mountMenu(status);
    header.append(heading, status);
    counter.append(header);

    const relics = [], supplies = [];
    for (const choice of choices) (choice.id.startsWith("relic:") ? relics : supplies).push(choice);
    appendOffers(counter, "遗物", "relics", relics, finish);
    appendOffers(counter, "补给", "supplies", supplies, finish);

    const footer = element("footer", "footer");
    const leave = element("button", "leave");
    leave.type = "button";
    leave.dataset.choice = "leave";
    leave.append(icon("exit"), "离开商店");
    leave.addEventListener("click", () => finish("leave"));
    footer.append(leave);
    counter.append(footer);
    panel.append(portrait, counter);
    overlay.append(panel);
    return menu;
});
