// Mode-owned piles use real Card nodes so native searches/gain/insert operations agree.
// DIY must access ui piles inside the acting player's engine event, never cache global nodes.
import { cardCost } from "../battle/combat-rules.js";
import { AFFIX_INFO } from "./affixes.js";
import { createHandUpgradeBadges } from "../ui/hand-upgrade.js";


export function installPersonalPiles(session, owner, battle, run, resources, env) {
    const { game, ui, get, _status, document, MutationObserver, shuffle } = env;
    for (const key of ["cardPile", "discardPile"]) {
        const descriptor = Object.getOwnPropertyDescriptor(ui, key);
        if (!descriptor || !descriptor.configurable || (!Object.hasOwn(descriptor, "value") && typeof descriptor.get !== "function")) throw new Error("Unsupported pile property: " + key);
    }
    const draw = document.createElement("div"), discard = document.createElement("div");
    // Detached nodes: engine get.position recognises these IDs; no duplicate document IDs.
    draw.id = "cardPile"; discard.id = "discardPile";
    const owned = new Set(), restores = [], costBadges = new Map();
    const upgradeBadges = createHandUpgradeBadges(document);
    const strict = env.strict !== false;
    let released = false, forcedOwner = false;
    const personal = () => {
        if (released) return false;
        if (forcedOwner) return true;
        const seen = new Set();
        for (let event = _status.event; event && !seen.has(event); event = event.parent) {
            seen.add(event);
            if (event.player) return event.player === owner;
        }
        return false; // Never infer ownership from whose turn it is.
    };
    const refresh = () => { if (!released) env.refresh(); };
    function showCost(card) {
        if (!env.showCosts || !card?.name) return;
        const cost = String(cardCost(card));
        card.dataset.mengsanCost = cost;
        let badge = costBadges.get(card);
        if (!badge) {
            badge = Array.from(card.children || []).find(child => child.classList?.contains("mengsan-hand-cost-shuying"));
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "mengsan-hand-cost-shuying";
                badge.setAttribute("aria-hidden", "true");
                card.appendChild(badge);
            }
            costBadges.set(card, badge);
        }
        // 十周年 UI scans thrown-card children via innerText when adding “刘备使用”.
        // Keep this child text-free so its numeric cost cannot match that scan.
        badge.textContent = "";
        badge.dataset.mengsanCost = cost;
    }
    function showHandBadges(card) {
        showCost(card);
        if (env.showCosts) upgradeBadges.refresh(card);
    }
    function adopt(card, data) {
        if (owned.has(card)) return;
        owned.add(card); resources.card(card);
        card.storage ||= {};
        card.storage.mengsanOwnerId_shuying = owner.playerid;
        if (data) {
            card.storage.mengsanCard_shuying = JSON.parse(JSON.stringify(data));
            // Retired affixes from old saves must not acquire new battle behaviour.
            card.storage.mengsanCard_shuying.affixes = (card.storage.mengsanCard_shuying.affixes || []).filter(key => key !== "annihilate");
        }
        if (data) showHandBadges(card);
        // Existing foreign/generated cards retain their original destruction semantics.
        if (!data) return;
        card.destroyLog = false;
        card.destroyed = (current, position) => {
            if (released || !["discardPile", "equip", "judge"].includes(position)) return false;
            if (current.storage.mengsanCard_shuying.affixes.includes("exhaust") && current.storage.mengsanConsumed_shuying) {
                if (current.storage.mengsanExhausted_shuying) return true;
                current.storage.mengsanExhausted_shuying = true;
                battle.exhaustPile.push(snapshot(current));
                refresh();
                return true;
            }
            return false; // Actual discarded cards remain available to native skills.
        };
        for (const key of card.storage.mengsanCard_shuying.affixes) card.addGaintag(AFFIX_INFO[key]?.name || key);
        if (data.upgrade) card.addGaintag(`强化+${data.upgrade}`);
    }
    function snapshot(card) {
        const data = card.storage?.mengsanCard_shuying || {};
        return { ...data, name: card.name, suit: card.suit, number: card.number,
            nature: card.nature || null, affixes: data.affixes?.slice() || [], upgrade: data.upgrade || 0 };
    }
    for (const data of battle.drawPile) {
        const card = game.createCard(data.name, data.suit, data.number, data.nature);
        adopt(card, data); draw.appendChild(card);
    }
    // Native and 十周年 UI both move real card nodes into these hand containers.
    // Decorate newly gained cards without patching either UI's card factory or layout.
    const handZones = [owner.node?.handcards1, owner.node?.handcards2].filter(Boolean);
    const handObserver = new MutationObserver(mutations => {
        if (released) return;
        for (const mutation of mutations) for (const card of mutation.addedNodes) {
            if (card.classList?.contains("card")) showHandBadges(card);
        }
    });
    for (const zone of handZones) {
        for (const card of zone.childNodes) {
            if (card.classList?.contains("card")) showHandBadges(card);
        }
        handObserver.observe(zone, { childList: true });
    }
    session.ownResource(handObserver, () => {
        handObserver.disconnect();
        for (const [card, badge] of costBadges) {
            if (badge.parentNode === card) badge.remove();
            delete card.dataset.mengsanCost;
        }
        costBadges.clear();
        upgradeBadges.dispose();
    });
    const publicDiscard = ui.discardPile;
    for (const [key, node] of [["cardPile", draw], ["discardPile", discard]]) {
        const descriptor = Object.getOwnPropertyDescriptor(ui, key);
        let publicNode = descriptor.value;
        const read = () => personal() ? node : (descriptor.get ? descriptor.get.call(ui) : publicNode);
        Object.defineProperty(ui, key, { configurable: true, enumerable: descriptor.enumerable,
            get: read, set(value) { if (descriptor.set) descriptor.set.call(ui, value); else publicNode = value; } });
        restores.push(() => {
            if (Object.getOwnPropertyDescriptor(ui, key)?.get === read) Object.defineProperty(ui, key, descriptor.get ? descriptor : { ...descriptor, value: publicNode });
        });
    }
    for (const [key, node] of [["drawPile", draw], ["discardPile", discard]]) {
        Object.defineProperty(battle, key, { configurable: true, enumerable: true,
            get: () => Array.from(node.childNodes, snapshot) });
    }
    const observer = new MutationObserver(() => {
        if (released) return;
        // A card from our deck can be discarded during an enemy-owned event.
        for (const card of Array.from(publicDiscard.childNodes)) if (owned.has(card)) discard.appendChild(card);
        for (const node of [draw, discard]) for (const card of node.childNodes) adopt(card);
        refresh();
    });
    for (const node of [draw, discard, publicDiscard]) observer.observe(node, { childList: true });
    function wash() {
        const cards = [...draw.childNodes, ...discard.childNodes];
        if (!cards.length) return false;
        shuffle(run, cards);
        for (const card of cards) { card.fix?.(); draw.appendChild(card); }
        refresh();
        return true;
    }
    function take(number = 1, putBack = false, bottom = false) {
        if (!Number.isFinite(number) || number <= 0) return [];
        number = Math.ceil(number);
        if (draw.childNodes.length + discard.childNodes.length < number) {
            if (strict) { game.mengsanFailRun_shuying("个人牌堆与弃牌堆不足，挑战失败"); return []; }
            number = draw.childNodes.length + discard.childNodes.length;
        }
        const cards = [];
        while (cards.length < number) {
            if (!draw.childNodes.length) wash();
            const card = draw.removeChild(bottom ? draw.lastChild : draw.firstChild); card.original = "c"; cards.push(card);
        }
        if (putBack) for (let i = cards.length - 1; i >= 0; i--) {
            if (bottom) draw.appendChild(cards[i]); else draw.insertBefore(cards[i], draw.firstChild);
        }
        refresh(); return cards;
    }
    function wrap(object, key, replacement) {
        const descriptor = Object.getOwnPropertyDescriptor(object, key), original = object[key];
        const wrapped = function (...args) { return personal() ? replacement(...args) : original.apply(this, args); };
        object[key] = wrapped;
        restores.push(() => { if (object[key] === wrapped) { if (descriptor) Object.defineProperty(object, key, descriptor); else delete object[key]; } });
    }
    wrap(get, "cards", (number, putBack) => take(typeof number === "number" ? number : 1, putBack));
    wrap(get, "bottomCards", (number, putBack) => take(typeof number === "number" ? number : 1, putBack, true));
    wrap(game, "washCard", wash);
    session.ownResource(draw, () => {
        if (released) return;
        observer.disconnect(); released = true;
        for (const restore of restores.reverse()) restore();
        for (const card of owned) card.remove();
        owned.clear(); draw.remove(); discard.remove();
    });
    return {
        take,
        addAffix(card, key) {
            if (released || !Object.hasOwn(AFFIX_INFO, key) || !owned.has(card) || !owner.getCards("h").includes(card)) return false;
            const affixes = card.storage?.mengsanCard_shuying?.affixes;
            if (!Array.isArray(affixes) || affixes.includes(key)) return false;
            affixes.push(key);
            card.addGaintag(AFFIX_INFO[key].name);
            refresh();
            return true;
        },
        // Engine/mod opening draws must not stack with the mode's four-card opening hand.
        resetOpeningHand() {
            for (const card of owner.getCards("h")) {
                if (owned.has(card)) draw.insertBefore(card, draw.firstChild);
                else card.remove();
            }
            refresh();
        },
        trimOpeningHand(limit = 4) {
            for (const card of owner.getCards("h").filter(card => !card.storage?.mengsanCard_shuying?.affixes?.includes("innate")).slice(limit)) {
                if (owned.has(card)) draw.insertBefore(card, draw.firstChild);
                else card.remove();
            }
            refresh();
        },
        drawInnate() {
            const cards = Array.from(draw.childNodes).filter(card => card.storage?.mengsanCard_shuying?.affixes?.includes("innate") && !owner.getCards("h").includes(card));
            if (cards.length) owner.directgain(cards);
            refresh();
            return cards;
        },
        withOwner(callback) { const before = forcedOwner; forcedOwner = true; try { return callback(); } finally { forcedOwner = before; } },
    };
}
