// 只读引擎当前完整回合的实际changeHp历史，不写角色/永久牌组状态。
const belongsTo = (event, root) => {
    const seen = new Set();
    for (let current = event; current && !seen.has(current); current = current.parent) {
        if (current === root) return true;
        seen.add(current);
    }
    return false;
};
export function createSpite(game, getActiveBattle) {
    return async function spite(player, event, damage, conditionalHits) {
        if (!Number.isSafeInteger(damage) || damage <= 0 ||
            !Number.isSafeInteger(conditionalHits) || conditionalHits <= 0)
            throw new RangeError("怨恨攻击参数无效");
        const battle = getActiveBattle(), session = battle?.session, root = battle?.root;
        const target = event?.target;
        const valid = () => Boolean(battle && root && getActiveBattle() === battle &&
            battle.session === session && session?.active && battle.root === root &&
            battle.players?.has(player) && battle.players.has(target) &&
            player?.isAlive?.() && target?.isAlive?.() && target !== player && player.isEnemyOf(target));
        if (!valid() || !belongsTo(event, root)) return;
        const history = game.getGlobalHistory("changeHp");
        const lost = Array.isArray(history) && history.some(change => change.player === player &&
            Number.isFinite(change.changedHp) && change.changedHp < 0 && belongsTo(change, root));
        const count = lost ? conditionalHits : 1;
        for (let index = 0; index < count; index++) {
            if (!valid() || game.getGlobalHistory("changeHp") !== history) break;
            player.line(target, "green");
            const hit = target.damage(damage, player);
            hit.mengsanAttack_shuying = true;
            await hit;
        }
    };
}
