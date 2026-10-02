import { cardUpgradeLevel } from "../../cards/upgrades.js";

export function createHandOverlays(document, cardCost) {
  const entries = new Map();
  const setData = (node, key, value) => {
    if (node.dataset[key] !== value) node.dataset[key] = value;
  };
  function refresh(card) {
    if (!card.name) return;
    let entry = entries.get(card);
    if (!entry) {
      const cost = document.createElement("span");
      cost.className = "mengsan-hand-cost-shuying";
      cost.setAttribute("role", "img");
      const upgrade = document.createElement("span");
      upgrade.className = "mengsan-hand-upgrade-shuying";
      upgrade.setAttribute("role", "img");
      entry = { cost, upgrade };
      entries.set(card, entry);
    }
    const cost = String(cardCost(card));
    setData(entry.cost, "mengsanCost", cost);
    entry.cost.setAttribute("aria-label", `费用 ${cost}`);
    if (card.name === "mengsan_dazed_shuying") entry.cost.remove();
    else if (entry.cost.parentNode !== card) card.appendChild(entry.cost);
    const level = cardUpgradeLevel(card);
    if (level) {
      setData(entry.upgrade, "mengsanUpgrade", String(level));
      entry.upgrade.setAttribute("aria-label", `已强化${level}次`);
      if (entry.upgrade.parentNode !== card) card.appendChild(entry.upgrade);
    } else {
      entry.upgrade.remove();
    }
  }
  function release(card) {
    const entry = entries.get(card);
    if (!entry) return;
    entry.cost.remove();
    entry.upgrade.remove();
    entries.delete(card);
  }
  return {
    sync(cards) {
      const current = new Set(cards);
      for (const card of entries.keys()) {
        if (!current.has(card)) release(card);
      }
      for (const card of cards) refresh(card);
    },
    dispose() {
      for (const card of entries.keys()) release(card);
    },
  };
}
