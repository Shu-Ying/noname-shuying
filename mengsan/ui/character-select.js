import { chooseFlow } from "./flow-ui.js";
import { mountMenu } from "./navigation.js";

const featuredCharacters = [
    { id: "mengsan_liubei_shuying", name: "刘备", faction: "han", factionName: "汉", file: "liubei-portrait.jpg" },
    { id: "mengsan_caocao_shuying", name: "曹操", faction: "wei", factionName: "魏", file: "caocao-portrait.jpg" },
    { id: "mengsan_sunquan_shuying", name: "孙权", faction: "wu", factionName: "吴", file: "sunquan-portrait.jpg" },
];

function element(tag, className, text = "") {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
}

export function chooseCharacterCards(playable, assetBase, backLabel) {
    const available = new Map(playable.map(character => [character.id, character]));
    const featuredIds = new Set(featuredCharacters.map(character => character.id));
    const roster = featuredCharacters.map(character => {
        const registered = available.get(character.id);
        return {
            ...character,
            name: registered?.name || character.name,
            portrait: registered?.portrait || `${assetBase}/assets/portraits/${character.file}`,
            description: registered?.description,
        };
    });
    roster.push(...playable.filter(character => !featuredIds.has(character.id)));
    const title = "选择出征武将";

    return chooseFlow(title, (overlay, finish) => {
        overlay.classList.add("mengsan-character-overlay-shuying");
        const panel = element("section", "mengsan-panel-shuying mengsan-character-panel-shuying");
        const header = element("header", "ms-character-header");
        const heading = element("div", "ms-character-heading");
        heading.append(
            element("p", "ms-character-eyebrow", "梦三 · 出征准备"),
            element("h1", "ms-character-title", title),
        );
        const back = element("button", "ms-character-button", backLabel);
        back.type = "button";
        back.addEventListener("click", () => finish("back"));
        header.append(heading, back);

        const list = element("section", "ms-character-list");
        list.setAttribute("aria-label", "武将");
        const footer = element("footer", "ms-character-footer");
        const status = element("p", "ms-character-status");
        status.setAttribute("role", "status");
        const confirm = element("button", "ms-character-button ms-character-confirm", "确认出征");
        confirm.type = "button";
        footer.append(status, confirm);
        panel.append(header, list, footer);
        overlay.appendChild(panel);

        let selected = roster.find(character => available.has(character.id)) || roster[0];
        const cards = roster.map(character => {
            const button = element("button", "ms-character-card");
            button.type = "button";
            button.dataset.faction = character.faction;
            if (character.portrait) {
                const portrait = element("img", "ms-character-portrait");
                portrait.alt = "";
                portrait.draggable = false;
                portrait.src = character.portrait;
                button.appendChild(portrait);
            }
            const seal = element("span", "ms-character-faction", character.factionName);
            const mark = element("span", "ms-character-picked", "已选");
            mark.setAttribute("aria-hidden", "true");
            const caption = element("span", "ms-character-caption");
            caption.append(
                element("strong", "ms-character-name", character.name),
                element("span", "ms-character-description", available.has(character.id) ? character.description : "玩法待定"),
            );
            button.append(seal, mark, caption);
            button.addEventListener("click", () => {
                selected = character;
                updateSelection();
            });
            list.appendChild(button);
            return { character, button, mark };
        });

        function updateSelection() {
            for (const { character, button, mark } of cards) {
                const isSelected = character === selected;
                button.setAttribute("aria-pressed", String(isSelected));
                mark.hidden = !isSelected;
            }
            const canDepart = available.has(selected.id);
            confirm.disabled = !canDepart;
            confirm.textContent = canDepart ? "确认出征" : "玩法待定";
            status.textContent = `${canDepart ? "已选" : "正在查看"}${selected.name} · ${selected.factionName}`;
        }

        confirm.addEventListener("click", () => {
            if (available.has(selected.id)) finish(selected.id);
        });
        updateSelection();
        mountMenu(overlay);
        return cards.find(({ character }) => character === selected).button;
    }, { back: "back" });
}
