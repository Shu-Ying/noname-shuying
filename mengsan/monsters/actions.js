import { createIntentExecutor } from "../battle/intent-effects.js";
export { getIntentHostiles } from "../battle/intent-effects.js";
import { isStunned } from "../battle/stun-intent.js";
import { nextRandom } from "../progression/state.js";
import { selectFlyconidMove, recordFlyconidAction } from "./flyconid-intent.js";
import {
    isRaiderCharacter,
    selectRaiderMove,
    recordRaiderAction,
} from "./raider-intent.js";

export const isFlyconid = player =>
    player?.name === "mengsan_flyconid_shuying" &&
    player.storage?.mengsanCamp_shuying === "enemy";

export const isRaider = player =>
    player?.storage?.mengsanCamp_shuying === "enemy" &&
    isRaiderCharacter(player.name);

export function createMonsterIntentActions(game, getActiveBattle) {
    const executeEffects = createIntentExecutor(game, getActiveBattle);
    const planEnemyIntent = (player, run) => {
        if (!player?.isAlive() || isStunned(player)) return;
        if (isFlyconid(player)) {
            if (player.storage.mengsanFlyconidIntent_shuying) return;
            const move = selectFlyconidMove(
                player.storage.mengsanFlyconidState_shuying || {},
                () => nextRandom(run));
            player.storage.mengsanFlyconidIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isRaider(player)) {
            if (player.storage.mengsanRaiderIntent_shuying) return;
            const move = selectRaiderMove(player.name,
                player.storage.mengsanRaiderState_shuying || {});
            player.storage.mengsanRaiderIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        }
    };

    const executeFlyconidIntent = async player => {
        const move = player.storage.mengsanFlyconidIntent_shuying;
        if (!move) return;
        player.storage.mengsanFlyconidIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        const paid = player.storage.mengsanEnergy_shuying >= 1;
        player.storage.mengsanFlyconidState_shuying =
            recordFlyconidAction(
                player.storage.mengsanFlyconidState_shuying || {},
                move, paid);
        if (!paid) {
            game.log(player, "费用不足，未发动", move.name);
            return;
        }
        player.storage.mengsanEnergy_shuying--;
        getActiveBattle()?.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeRaiderIntent = async player => {
        const move = player.storage.mengsanRaiderIntent_shuying;
        if (!move) return;
        player.storage.mengsanRaiderIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanRaiderState_shuying = recordRaiderAction(
            player.storage.mengsanRaiderState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name);
            return;
        }
        player.storage.mengsanEnergy_shuying--;
        getActiveBattle()?.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    return {
        planEnemyIntent,
        executeFlyconidIntent,
        executeRaiderIntent,
    };
}
