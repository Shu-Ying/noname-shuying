import { cardUpgradeLevel } from "../cards/upgrades.js";

export function createHandUpgradeBadges(document) {
    const badges = new Map();
    return {
        refresh(card) {
            if (!card?.name) return;
            const level = cardUpgradeLevel(card);
            let badge = badges.get(card) || Array.from(card.children || [])
                .find(child => child.classList?.contains(
                    "mengsan-hand-upgrade-shuying"));
            if (!level) {
                badge?.remove();
                badges.delete(card);
                delete card.dataset.mengsanUpgrade;
                return;
            }
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "mengsan-hand-upgrade-shuying";
                badge.setAttribute("role", "img");
            }
            if (badge.parentNode !== card) card.appendChild(badge);
            badge.textContent = "";
            badge.dataset.mengsanUpgrade = String(level);
            badge.setAttribute("aria-label", `已强化${level}次`);
            card.dataset.mengsanUpgrade = String(level);
            badges.set(card, badge);
        },
        dispose() {
            for (const [card, badge] of badges) {
                badge.remove();
                delete card.dataset.mengsanUpgrade;
            }
            badges.clear();
        },
    };
}
