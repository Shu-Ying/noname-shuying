// STS2 Cinder selects from the actor's hand after damage, never from the draw pile.
export function createRandomHandExhauster(game, getActiveBattle, getRun, nextRandom) {
    return {
        capture() { const battle = getActiveBattle(); return battle?.session.active ? battle : null; },
        async exhaust(player, event, battle) {
            if (!battle || getActiveBattle() !== battle || !battle.session.active || !player?.isAlive()) return null;
            const piles = player === game.me ? battle.personalPiles : battle.monsterPiles?.get(player);
            if (typeof piles?.exhaustFromHand !== "function") throw new Error("余烬缺少个人消耗牌堆接口");
            const playing = new Set(event?.cards || []);
            const hand = player.getCards("h").filter(card => !playing.has(card) && !card.storage?.mengsanExhausted_shuying);
            if (!hand.length) return null;
            const run = getRun();
            if (!run) throw new Error("余烬缺少征程随机状态");
            const value = nextRandom(run);
            if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("余烬随机值无效");
            return await piles.exhaustFromHand(hand[Math.floor(value * hand.length)]);
        },
    };
}
