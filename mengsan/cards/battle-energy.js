// 只向同一场仍在进行的战斗中的存活角色增加当前费用，不改变上限。
export function createBattleEnergy(game, getActiveBattle) {
    const valid = (player, battle) => Boolean(battle &&
        battle === getActiveBattle() && battle.session?.active &&
        battle.players?.has(player) && player?.isAlive?.());
    const validateAmount = (player, amount) => {
        const current = player.storage?.mengsanEnergy_shuying;
        if (!Number.isSafeInteger(current) || current < 0 ||
            !Number.isSafeInteger(amount) || amount <= 0 ||
            !Number.isSafeInteger(current + amount)) {
            throw new Error("梦三费用数值无效");
        }
    };
    return {
        canUse(player) { return valid(player, getActiveBattle()); },
        capture(player, amount) {
            const battle = getActiveBattle();
            if (!valid(player, battle)) return null;
            validateAmount(player, amount);
            return battle;
        },
        grant(player, amount, battle) {
            if (!valid(player, battle)) return false;
            validateAmount(player, amount);
            player.storage.mengsanEnergy_shuying += amount;
            battle.energyUI.get(player)?.();
            if (player === game.me) battle.handUI?.refresh();
            return true;
        },
    };
}
