import { cardDefinitions } from "../cards/card-definitions.js";
import { isRetiredDeckCard } from "../cards/retired-cards.js";
import { canUpgradeCard } from "../cards/upgrades.js";
import { addPermanentRelicCard, relicCardPool, transformPermanentCard } from "../relics/progression.js";
import { randomGet } from "./state.js";

const services = {
    remove: { name: "剔除", description: "从永久牌组移除一张牌" },
    transform: { name: "易换", description: "将一张牌变成另一张随机武将牌" },
    upgrade: { name: "磨砺", description: "永久强化一张牌" },
    duplicate: { name: "誊录", description: "复制一张牌，保留强化和已有成长" },
    cleanse: { name: "禳解", description: "移除牌组中所有可移除的诅咒牌" },
};

const events = [
    {
        id: "quartermaster",
        actIndex: 0,
        name: "辎重盘点",
        description: "车骑将在天明前启程。管领辎重的军吏愿匀出片刻，按你的意思整备行装。",
        services: ["remove", "transform", "upgrade"],
    },
    {
        id: "ford-ward",
        name: "渡口禳符",
        description: "渡口有人替夜行的旅人解去厄契。他望见你行囊里的咒印，请你把能解的都交出来。",
        services: ["cleanse"],
    },
    {
        id: "camp-scribe",
        name: "营中抄手",
        description: "帐里灯火未熄。书吏铺开一片新简，愿为你照录一份军中旧法。",
        services: ["duplicate"],
    },
    {
        id: "pack-mender",
        name: "裁囊人",
        description: "背囊的缝线快绷开了。驿道旁的修补匠替你理出了一处可以舍去的累赘。",
        services: ["remove"],
    },
    {
        id: "county-exchange",
        name: "县亭换策",
        description: "县亭墙下有人收集各营送来的战书。交出手中一策，他便从封存的竹筒中取出另一策。",
        services: ["transform"],
    },
    {
        id: "old-drillmaster",
        name: "旧营教头",
        description: "废营里仍立着几只草靶。一名老教头正在校正槊架，答应替你指点一门尚未练熟的本领。",
        services: ["upgrade"],
    },
];

const leave = { id: "leave", name: "继续赶路" };
const canRemove = card => !card.affixes?.includes("eternal");
const suitNames = { spade: "♠", heart: "♥", club: "♣", diamond: "♦" };

function eventTargets(run, transformPool) {
    const { deck, character } = run.player;
    const removable = deck.filter(canRemove);
    const curses = removable.filter(card => cardDefinitions[card.name]?.cardType === "curse");
    return {
        remove: deck.length > 1 ? removable : [],
        transform: removable.filter(card => transformPool.some(name => name !== card.name)),
        upgrade: deck.filter(canUpgradeCard),
        duplicate: deck.filter(card => Object.hasOwn(cardDefinitions, card.name) && !isRetiredDeckCard(character, card.name)),
        cleanse: curses.length < deck.length ? curses : [],
    };
}

async function applyEventService(run, event, kind, targets, transformPool, choose, translate) {
    const { deck } = run.player;
    if (kind === "cleanse") {
        const removed = new Set(targets);
        run.player.deck = deck.filter(card => !removed.has(card));
        return;
    }

    const options = targets.map(card => ({
        id: card.id,
        name: `${translate(card.name) || card.name}${card.upgrade ? ` +${card.upgrade}` : ""}`,
        description: `${suitNames[card.suit] || card.suit} ${card.number}`,
    }));
    const selected = await choose(event.name, [...options, leave], services[kind].description, { back: leave.id });
    if (selected === leave.id) return;
    const card = targets.find(card => card.id === selected);
    if (!card) throw new Error("梦三事件选牌无效");
    if (kind === "remove") {
        deck.splice(deck.indexOf(card), 1);
    } else if (kind === "transform") {
        const candidates = transformPool.filter(name => name !== card.name);
        transformPermanentCard(run, card, false, candidates);
        await choose(event.name, [{ id: "continue", name: "继续赶路" }], `获得【${translate(card.name) || card.name}】。`);
    } else if (kind === "upgrade") {
        card.upgrade = (card.upgrade || 0) + 1;
    } else if (kind === "duplicate") {
        addPermanentRelicCard(run, card.name, card);
    }
}

export async function finishRandomEvent(run, node, choose, translate) {
    if (run.actIndex !== 0 || node.type !== "event" || node.contentId || node.completed) return false;

    const seen = new Set(run.map.nodes.filter(entry => entry.completed).map(entry => entry.eventId));
    const transformPool = relicCardPool(run);
    const targets = eventTargets(run, transformPool);
    const candidates = events.filter(event => (event.actIndex == null || event.actIndex === run.actIndex) &&
        !seen.has(event.id) && event.services.some(kind => targets[kind].length));
    if (!candidates.length) return false;

    const event = randomGet(run, candidates);
    const options = event.services.map(kind => ({ id: kind, ...services[kind], disabled: !targets[kind].length }));
    const kind = await choose(event.name, [...options, leave], event.description, { back: leave.id });
    if (kind !== leave.id) {
        if (!event.services.includes(kind) || !targets[kind].length) throw new Error("梦三事件选项无效");
        await applyEventService(run, event, kind, targets[kind], transformPool, choose, translate);
    }
    node.eventId = event.id;
    return true;
}
