// Count current actor-owned combat cards; permanent save data is deliberately absent.
export function createStrikeCounter(game, getActiveBattle, lib) {
    return (player, event) => {
        const battle = getActiveBattle();
        if (!battle?.session.active || !player?.isAlive()) return 0;
        const piles = player === game.me ? battle.personalPiles : battle.monsterPiles?.get(player);
        if (typeof piles?.battleCards !== "function") throw new Error("完美打击缺少个人战斗牌堆接口");
        const playing = new Set(event?.cards || []);
        const seen = new Set();
        for (let parent = event?.parent; parent && !seen.has(parent); parent = parent.parent) {
            seen.add(parent);
            if (parent.name === "useCard" && parent.player === player) {
                for (const card of parent.cards || []) playing.add(card);
            }
        }
        // Nested native attacks may leave earlier originals in the playing zone.
        for (const used of player.getHistory?.("useCard") || []) {
            for (const card of used.cards || []) playing.add(card);
        }
        let count = 0;
        for (const card of piles.battleCards(playing)) {
            const name = lib.translate[card.name];
            if (typeof name === "string" && name.includes("打击")) count++;
        }
        return count;
    };
}
