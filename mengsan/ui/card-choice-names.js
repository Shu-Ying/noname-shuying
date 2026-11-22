import { cardUpgradeLevel } from "../cards/upgrades.js";

export function mountCardChoiceNames(session, resources, { ui, lib, document }) {
    const createButton = ui.create.button;
    resources.field(ui.create, "button", function (...args) {
        const button = createButton.apply(this, args);
        if (!session.active || !button?.matches(".button.card:not(.blank, .infohidden, .infoflip)")) return button;

        const name = button.name;
        const definition = lib.card[name];
        const title = lib.translate[name];
        if (definition?.fullimage !== true ||
            definition.image !== `ext:术樱包/mengsan/assets/cards/${name}.png` ||
            typeof title !== "string" || !title) return button;

        // 实体牌按钮的强化数据在原牌上，虚拟牌按钮没有实体牌实例。
        const level = Array.isArray(button.link) ? 0 : cardUpgradeLevel(button.link);
        const label = document.createElement("span");
        label.className = "mengsan-choice-card-name-shuying";
        label.textContent = level ? `${title}+${level}` : title;
        button.appendChild(label);
        return button;
    });
}
