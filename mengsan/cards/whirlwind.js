import { takeXCardUse } from "../battle/combat-rules.js";
// 固定原场次与会话；一轮一个存活敌人快照，下一轮包含新生成敌人。
export function createWhirlwind(game, getActiveBattle) {
    const valid = (player, battle, session) => Boolean(battle && getActiveBattle() === battle &&
        battle.session === session && session?.active && battle.players?.has(player) && player?.isAlive?.());
    const eligible = (player, battle, target) => target !== player && battle.players.has(target) &&
        target.isAlive() && player.isEnemyOf(target);
    return async function whirlwind(player, event, damage) {
        if (!Number.isSafeInteger(damage) || damage <= 0) throw new TypeError("旋风斩伤害无效");
        const battle = getActiveBattle(), session = battle?.session;
        if (!valid(player, battle, session)) return;
        const count = takeXCardUse(player, event, battle);
        if (count === null) return;
        for (let round = 0; round < count; round++) {
            if (!valid(player, battle, session)) break;
            const targets = game.filterPlayer(target => eligible(player, battle, target));
            if (!targets.length) break;
            for (const target of targets) {
                if (!valid(player, battle, session)) return;
                if (!eligible(player, battle, target)) continue;
                player.line(target, "green");
                const hit = target.damage(damage, player);
                hit.mengsanAttack_shuying = true;
                await hit;
            }
        }
    };
}
