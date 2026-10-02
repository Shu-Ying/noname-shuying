// 原生格挡完全结算后才抽牌，固定当前战斗和个人牌堆身份。
export function createBlockDrawer(game, getActiveBattle) {
    const valid = (player, battle) => Boolean(battle && getActiveBattle() === battle &&
        battle.session?.active && battle.players?.has(player) && player?.isAlive?.());
    const getPile = (player, battle) => player === game.me ? battle.personalPiles : battle.monsterPiles?.get(player);
    return async function blockDraw(player, block, draw) {
        if (!Number.isSafeInteger(block) || block < 0 || !Number.isSafeInteger(draw) || draw < 0) {
            throw new TypeError("格挡抽牌数值无效");
        }
        const battle = getActiveBattle();
        if (!valid(player, battle)) return;
        const pile = getPile(player, battle);
        if (typeof pile?.take !== "function") throw new Error("格挡抽牌缺少个人牌堆接口");
        await player.changeHujia(block);
        // 格挡的触发事件中可能结束战斗、死亡或换场，不摸新场次的牌。
        if (!valid(player, battle) || getPile(player, battle) !== pile) return;
        if (draw > 0) await player.draw(draw);
    };
}
