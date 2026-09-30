import { createCardData } from "../cards/card-data.js";
import { bondDefinitions } from "./definitions.js";
import { ensureBonds, markBondDown } from "./state.js";
import { getBondIntents } from "./intents.js";

export function initializeBondUnit(player, spec, run) {
    if (!spec.bondId) return null;
    const portrait = bondDefinitions[spec.bondId].portrait;
    if (player.node?.avatar) {
        player.node.avatar.style.backgroundImage = portrait ?
            `url("${portrait}")` : "none";
    }
    player.storage.mengsanBond_shuying = {
        id: spec.bondId, draw: spec.draw, handLimit: spec.handLimit,
        intents: getBondIntents(spec).map(move => ({ ...move })),
        turnsTaken: 0, intent: null,
    };
    player.storage.mengsanMaxEnergy_shuying = spec.energy;
    player.storage.mengsanEnergy_shuying = spec.energy;
    if (run.bondBattle?.id === spec.bondId) run.bondBattle.arrived = true;
    return {
        createDeck(prefix) {
            return spec.deck.map((entry, index) => {
                const card = typeof entry === "string" ? { name: entry } : entry;
                return createCardData({
                    ...card, id: `${prefix}_${index}`,
                    suit: card.suit ||
                        ["spade", "heart", "club", "diamond"][index % 4],
                    number: card.number || index % 13 + 1,
                }, { enemy: true });
            });
        },
    };
}

export function recordBondDeath(player, run, log) {
    const id = player.storage?.mengsanBond_shuying?.id;
    if (!id || !run) return;
    if (ensureBonds(run).npcs[id]?.down) return;
    markBondDown(run, id);
    log(`${bondDefinitions[id].name}已退出战斗，羁绊状态：濒死`);
}
