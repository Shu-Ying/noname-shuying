import { cardUpgradeLevel } from "../../cards/upgrades.js";
import { isXCostCard } from "../../battle/combat-rules.js";
import { applyCardRarity } from "../../cards/rarity.js";

export function createHandOverlays(document, cardCost, { definitions, translations } = {}) {
  const entries = new Map();
  const setData = (node, key, value) => {
    if (node.dataset[key] !== value) node.dataset[key] = value;
  };
  function refresh(card) {
    if (!card.name) return;
    // Opt in only the mode's registered complete illustrations; native card skins stay native.
    // Re-evaluate after card.init/transformation, without adding child text for Decade UI to scan.
    const definition = definitions?.[card.name];
    const localArt = definition?.fullimage === true &&
      definition.image === `ext:术樱包/mengsan/assets/cards/${card.name}.png`;
    if (localArt) {
      setData(card, "mengsanLocalArt", "full");
      const title = translations?.[card.name];
      if (typeof title === "string" && Array.from(title).length >= 4) {
        setData(card, "mengsanLongName", "true");
      } else {
        delete card.dataset.mengsanLongName;
      }
    } else {
      delete card.dataset.mengsanLocalArt;
      delete card.dataset.mengsanLongName;
    }
    let entry = entries.get(card);
    if (!entry) {
      const cost = document.createElement("span");
      cost.className = "mengsan-hand-cost-shuying";
      cost.setAttribute("role", "img");
      const upgrade = document.createElement("span");
      upgrade.className = "mengsan-hand-upgrade-shuying";
      upgrade.setAttribute("role", "img");
      const rarity = document.createElement("span");
      rarity.className = "mengsan-hand-rarity-shuying";
      rarity.setAttribute("role", "img");
      entry = { cost, upgrade, rarity, border: null };
      entries.set(card, entry);
    }
    const rarity = applyCardRarity(card, card);
    entry.rarity.setAttribute("aria-label", `稀有度：${rarity.label}`);
    if (entry.rarity.parentNode !== card) card.appendChild(entry.rarity);
    const cost = isXCostCard(card) ? "X" : String(cardCost(card));
    setData(entry.cost, "mengsanCost", cost);
    entry.cost.setAttribute("aria-label", `费用 ${cost}`);
    if (card.name === "mengsan_dazed_shuying") entry.cost.remove();
    else if (entry.cost.parentNode !== card) card.appendChild(entry.cost);
    // Empty decorative node: Decade UI scans child innerText when cards move.
    if (card.name === "mengsan_infection_shuying") {
      if (!entry.border) {
        entry.border = document.createElement("span");
        entry.border.className = "mengsan-infection-border-shuying";
        entry.border.setAttribute("aria-hidden", "true");
      }
      if (entry.border.parentNode !== card) card.appendChild(entry.border);
    } else {
      entry.border?.remove();
    }
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
    entry.border?.remove();
    entry.rarity.remove();
    delete card.dataset.mengsanLocalArt;
    delete card.dataset.mengsanLongName;
    delete card.dataset.mengsanRarity;
    delete card.dataset.mengsanRarityLabel;
    for (const key of ["accent", "dark", "ink", "metal"]) card.style.removeProperty(`--ms-rarity-${key}`);
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
