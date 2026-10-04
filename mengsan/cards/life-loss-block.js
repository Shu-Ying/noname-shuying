// 生命流失的原生事件（含濒死救援）完全结束后，才继续结算格挡。
export function createLifeLossBlocker(getActiveBattle) {
    const valid = (player, battle, session) => Boolean(battle &&
        getActiveBattle() === battle && battle.session === session && session?.active &&
        battle.players?.has(player) && player?.isAlive?.());
    return {
        canUse(player) {
            const battle = getActiveBattle();
            return valid(player, battle, battle?.session);
        },
        async apply(player, loseHp, block) {
            if (!Number.isSafeInteger(loseHp) || loseHp <= 0 ||
                !Number.isSafeInteger(block) || block < 0) {
                throw new TypeError("生命流失格挡数值无效");
            }
            const battle = getActiveBattle(), session = battle?.session;
            if (!valid(player, battle, session)) return;
            await player.loseHp(loseHp);
            // 救援成功可以继续；死亡、结束、换场或原会话被替换时不授予格挡。
            if (!valid(player, battle, session)) return;
            await player.changeHujia(block);
        },
    };
}
