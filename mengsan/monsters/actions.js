import { addConstrict } from "./strangler-constrict.js";
import { applyShrink } from "./shrinker-status.js";
import { getIntentHostiles } from "../battle/intent-effects.js";
import { applyLeafslimeGoop } from "./leafslime-goop.js";
import { createIntentExecutor } from "../battle/intent-effects.js";
export { getIntentHostiles } from "../battle/intent-effects.js";
import { isStunned } from "../battle/stun-intent.js";
import { nextRandom } from "../progression/state.js";
import { selectFlyconidMove, recordFlyconidAction } from "./flyconid-intent.js";
import { isMawler, selectMawlerMove, recordMawlerAction } from "./mawler-intent.js";
import { isVine, selectVineMove, recordVineAction } from "./vine-intent.js";
import { isCubex, selectCubexMove, recordCubexAction } from "./cubex-intent.js";
import { isByrdonis, selectByrdonisMove, recordByrdonisAction } from "./byrdonis-intent.js";
import { isVantom, selectVantomMove, recordVantomAction } from "./vantom-intent.js";
import { isBeast, selectBeastMove, recordBeastAction, gainPlow, applyRinging } from "./beast-intent.js";
import { isKinActor, isKinPriest, canActKin, selectKinPriestMove, selectKinFollowerMove, recordKinAction } from "./kin-intent.js";
import { applyWound } from "../cards/wound-card.js";
import { isEffigy, selectEffigyMove, recordEffigyAction } from "./effigy-intent.js";
import { isPhrog, isPhrogActor, selectPhrogMove, selectWrigglerMove, recordPhrogAction } from "./phrog-intent.js";
import { applyInfection } from "../cards/infection-card.js";
import { isNibbit, selectNibbitMove, recordNibbitAction, bindNibbitOpenings } from "./nibbit-intent.js";
import { isShrinker, selectShrinkerMove, recordShrinkerAction } from "./shrinker-intent.js";
import { isTwigmedium, selectTwigmediumMove, recordTwigmediumAction } from "./twigmedium-intent.js";
import { isTwigslime, selectTwigslimeMove, recordTwigslimeAction } from "./twigslime-intent.js";
import { isLeafslimeMedium, selectLeafslimeMediumMove, recordLeafslimeMediumAction } from "./leafmedium-intent.js";
import { isLeafslime, selectLeafslimeMove, recordLeafslimeAction } from "./leafslime-intent.js";
import { isStrangler, selectStranglerMove, recordStranglerAction } from "./strangler-intent.js";
import { isJaxfruit, selectJaxfruitMove, recordJaxfruitAction } from "./jaxfruit-intent.js";
import { isCrawler, selectCrawlerMove, recordCrawlerAction } from "./crawler-intent.js";
import { isInklet, selectInkletMove, recordInkletAction } from "./inklet-intent.js";
import {
    isRaiderCharacter,
    selectRaiderMove,
    recordRaiderAction,
} from "./raider-intent.js";

import { isFogmog, isFogmogActor, selectFogmogMove, recordFogmogAction, EYE_INTENT } from "./fogmog-intent.js";

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
        } else if (isInklet(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanInkletIntent_shuying) return;
            const move = selectInkletMove(player.storage.mengsanInkletState_shuying || {}, () => nextRandom(run));
            player.storage.mengsanInkletIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isCrawler(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanCrawlerIntent_shuying) return;
            const move = selectCrawlerMove(player.storage.mengsanCrawlerState_shuying || {});
            player.storage.mengsanCrawlerIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isJaxfruit(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanJaxfruitIntent_shuying) return;
            const move = selectJaxfruitMove(player.storage.mengsanJaxfruitState_shuying || {});
            player.storage.mengsanJaxfruitIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isStrangler(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanStranglerIntent_shuying) return;
            const move = selectStranglerMove(player.storage.mengsanStranglerState_shuying || {}, () => nextRandom(run));
            player.storage.mengsanStranglerIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isLeafslime(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanLeafslimeIntent_shuying) return;
            const move = selectLeafslimeMove(player.storage.mengsanLeafslimeState_shuying || {}, () => nextRandom(run));
            player.storage.mengsanLeafslimeIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isLeafslimeMedium(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanLeafslimeMediumIntent_shuying) return;
            const move = selectLeafslimeMediumMove(player.storage.mengsanLeafslimeMediumState_shuying || {});
            player.storage.mengsanLeafslimeMediumIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isTwigslime(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanTwigslimeIntent_shuying) return;
            const move = selectTwigslimeMove(player.storage.mengsanTwigslimeState_shuying || {});
            player.storage.mengsanTwigslimeIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isTwigmedium(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanTwigmediumIntent_shuying) return;
            const move = selectTwigmediumMove(player.storage.mengsanTwigmediumState_shuying || {}, () => nextRandom(run));
            player.storage.mengsanTwigmediumIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isShrinker(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanShrinkerIntent_shuying) return;
            const move = selectShrinkerMove(player.storage.mengsanShrinkerState_shuying || {});
            player.storage.mengsanShrinkerIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isNibbit(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanNibbitIntent_shuying) return;
            bindNibbitOpenings(game.players);
            const move = selectNibbitMove(player.storage.mengsanNibbitState_shuying || {});
            player.storage.mengsanNibbitIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isEffigy(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanEffigyIntent_shuying) return;
            const move = selectEffigyMove(player.storage.mengsanEffigyState_shuying || {});
            player.storage.mengsanEffigyIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isPhrogActor(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanPhrogIntent_shuying) return;
            const move = (isPhrog(player) ? selectPhrogMove : selectWrigglerMove)(player.storage.mengsanPhrogState_shuying || {});
            player.storage.mengsanPhrogIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isKinActor(player)) {
            if (!canActKin(game, getActiveBattle(), player) || player.storage.mengsanKinIntent_shuying) return;
            const move = (isKinPriest(player) ? selectKinPriestMove : selectKinFollowerMove)(player.storage.mengsanKinState_shuying || {});
            player.storage.mengsanKinIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isBeast(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanBeastIntent_shuying) return;
            const move = selectBeastMove(player.storage.mengsanBeastState_shuying || {});
            player.storage.mengsanBeastIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isVantom(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanVantomIntent_shuying) return;
            const move = selectVantomMove(player.storage.mengsanVantomState_shuying || {});
            player.storage.mengsanVantomIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isByrdonis(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanByrdonisIntent_shuying) return;
            const move = selectByrdonisMove(player.storage.mengsanByrdonisState_shuying || {});
            player.storage.mengsanByrdonisIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isCubex(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanCubexIntent_shuying) return;
            const move = selectCubexMove(player.storage.mengsanCubexState_shuying || {});
            player.storage.mengsanCubexIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isVine(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanVineIntent_shuying) return;
            const move = selectVineMove(player.storage.mengsanVineState_shuying || {});
            player.storage.mengsanVineIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isMawler(player)) {
            if (!getActiveBattle()?.session.active || player.storage.mengsanMawlerIntent_shuying) return;
            const move = selectMawlerMove(player.storage.mengsanMawlerState_shuying || {},
                () => nextRandom(run));
            player.storage.mengsanMawlerIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isFogmogActor(player)) {
            if (player.storage.mengsanFogmogIntent_shuying || !getActiveBattle()?.fogmog?.canAct(player)) return;
            const move = isFogmog(player) ? selectFogmogMove(
                player.storage.mengsanFogmogState_shuying || {}, () => nextRandom(run)) : EYE_INTENT;
            player.storage.mengsanFogmogIntent_shuying = move;
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

    const executeInkletIntent = async player => {
        const current = getActiveBattle();
        if (!isInklet(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanInkletIntent_shuying;
        if (!move) return;
        player.storage.mengsanInkletIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanInkletState_shuying = recordInkletAction(player.storage.mengsanInkletState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeCrawlerIntent = async player => {
        const current = getActiveBattle();
        if (!isCrawler(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanCrawlerIntent_shuying;
        if (!move) return;
        player.storage.mengsanCrawlerIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanCrawlerState_shuying =
            recordCrawlerAction(player.storage.mengsanCrawlerState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeJaxfruitIntent = async player => {
        const current = getActiveBattle();
        if (!isJaxfruit(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanJaxfruitIntent_shuying;
        if (!move) return;
        player.storage.mengsanJaxfruitIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanJaxfruitState_shuying =
            recordJaxfruitAction(player.storage.mengsanJaxfruitState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeStranglerIntent = async player => {
        const current = getActiveBattle();
        if (!isStrangler(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanStranglerIntent_shuying;
        if (!move) return;
        player.storage.mengsanStranglerIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanStranglerState_shuying =
            recordStranglerAction(player.storage.mengsanStranglerState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.constrict) {
            for (const target of getIntentHostiles(game, player)) addConstrict(current, player, target, move.constrict);
        } else await executeEffects(player, move);
    };

    const executeLeafslimeIntent = async player => {
        const current = getActiveBattle();
        if (!isLeafslime(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanLeafslimeIntent_shuying;
        if (!move) return;
        player.storage.mengsanLeafslimeIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanLeafslimeState_shuying =
            recordLeafslimeAction(player.storage.mengsanLeafslimeState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.slimed) applyLeafslimeGoop(game, current, player);
        else await executeEffects(player, move);
    };

    const executeLeafslimeMediumIntent = async player => {
        const current = getActiveBattle();
        if (!isLeafslimeMedium(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanLeafslimeMediumIntent_shuying;
        if (!move) return;
        player.storage.mengsanLeafslimeMediumIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanLeafslimeMediumState_shuying =
            recordLeafslimeMediumAction(player.storage.mengsanLeafslimeMediumState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.slimed) applyLeafslimeGoop(game, current, player, move.slimed);
        else await executeEffects(player, move);
    };

    const executeTwigslimeIntent = async player => {
        const current = getActiveBattle();
        if (!isTwigslime(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanTwigslimeIntent_shuying;
        if (!move) return;
        player.storage.mengsanTwigslimeIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanTwigslimeState_shuying =
            recordTwigslimeAction(player.storage.mengsanTwigslimeState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeTwigmediumIntent = async player => {
        const current = getActiveBattle();
        if (!isTwigmedium(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanTwigmediumIntent_shuying;
        if (!move) return;
        player.storage.mengsanTwigmediumIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanTwigmediumState_shuying =
            recordTwigmediumAction(player.storage.mengsanTwigmediumState_shuying || {}, move);
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.slimed) applyLeafslimeGoop(game, current, player, move.slimed);
        else await executeEffects(player, move);
    };

    const executeShrinkerIntent = async player => {
        const current = getActiveBattle();
        if (!isShrinker(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanShrinkerIntent_shuying;
        if (!move) return;
        player.storage.mengsanShrinkerIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanShrinkerState_shuying =
            recordShrinkerAction(player.storage.mengsanShrinkerState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.shrink) {
            for (const target of getIntentHostiles(game, player)) applyShrink(current, player, target);
        } else await executeEffects(player, move);
    };

    const executeNibbitIntent = async player => {
        const current = getActiveBattle();
        if (!isNibbit(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanNibbitIntent_shuying;
        if (!move) return;
        player.storage.mengsanNibbitIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanNibbitState_shuying =
            recordNibbitAction(player.storage.mengsanNibbitState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeEffigyIntent = async (player, phase) => {
        const current = getActiveBattle();
        if (!isEffigy(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanEffigyIntent_shuying;
        if (!move) return;
        player.storage.mengsanEffigyIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanEffigyState_shuying =
            recordEffigyAction(player.storage.mengsanEffigyState_shuying || {});
        if (move.sleep) {
            phase?.cancel();
            game.log(player, "沉睡，本回合不行动"); return;
        }
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executePhrogIntent = async player => {
        const current = getActiveBattle();
        if (!isPhrogActor(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanPhrogIntent_shuying;
        if (!move || move.id === "spawned") return;
        player.storage.mengsanPhrogIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanPhrogState_shuying =
            recordPhrogAction(player.storage.mengsanPhrogState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.infection) applyInfection(game, current, player, move.infection);
        await executeEffects(player, move);
    };

    const executeKinIntent = async (player, phase) => {
        const current = getActiveBattle();
        if (!isKinActor(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        if (!canActKin(game, current, player)) { phase?.cancel(); return; }
        const move = player.storage.mengsanKinIntent_shuying;
        if (!move) return;
        player.storage.mengsanKinIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanKinState_shuying =
            recordKinAction(player.storage.mengsanKinState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await createIntentExecutor(game, () => getActiveBattle() === current && canActKin(game, current, player) ? current : null)(player, move);
    };

    const executeBeastIntent = async player => {
        const current = getActiveBattle();
        if (!isBeast(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanBeastIntent_shuying;
        if (!move) return;
        player.storage.mengsanBeastIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanBeastState_shuying =
            recordBeastAction(player.storage.mengsanBeastState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        const revision = player.storage.mengsanBeastState_shuying.revision;
        const valid = () => getActiveBattle() === current && current.session.active && player.isAlive() &&
            !isStunned(player) && player.storage.mengsanBeastState_shuying?.revision === revision;
        if (move.plow) gainPlow(player);
        else if (move.ringing) { for (const target of getIntentHostiles(game, player)) { if (!valid()) break; applyRinging(current, target); } }
        else await createIntentExecutor(game, () => valid() ? current : null)(player, move);
    };

    const executeVantomIntent = async player => {
        const current = getActiveBattle();
        if (!isVantom(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanVantomIntent_shuying;
        if (!move) return;
        player.storage.mengsanVantomIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanVantomState_shuying =
            recordVantomAction(player.storage.mengsanVantomState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await createIntentExecutor(game, () => getActiveBattle() === current ? current : null)(player, move);
        if (getActiveBattle() === current && move.wound) applyWound(game, current, player, move.wound);
    };

    const executeByrdonisIntent = async player => {
        const current = getActiveBattle();
        if (!isByrdonis(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanByrdonisIntent_shuying;
        if (!move) return;
        player.storage.mengsanByrdonisIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanByrdonisState_shuying =
            recordByrdonisAction(player.storage.mengsanByrdonisState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeCubexIntent = async player => {
        const current = getActiveBattle();
        if (!isCubex(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanCubexIntent_shuying;
        if (!move) return;
        player.storage.mengsanCubexIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanCubexState_shuying =
            recordCubexAction(player.storage.mengsanCubexState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeVineIntent = async player => {
        const current = getActiveBattle();
        if (!isVine(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanVineIntent_shuying;
        if (!move) return;
        player.storage.mengsanVineIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanVineState_shuying =
            recordVineAction(player.storage.mengsanVineState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name); return;
        }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeMawlerIntent = async player => {
        const current = getActiveBattle();
        if (!isMawler(player) || !player.isAlive() || isStunned(player) || !current?.session.active) return;
        const move = player.storage.mengsanMawlerIntent_shuying;
        if (!move) return;
        player.storage.mengsanMawlerIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        const paid = player.storage.mengsanEnergy_shuying >= 1;
        player.storage.mengsanMawlerState_shuying =
            recordMawlerAction(player.storage.mengsanMawlerState_shuying || {}, move, paid);
        if (!paid) { game.log(player, "费用不足，未发动", move.name); return; }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        await executeEffects(player, move);
    };

    const executeFogmogIntent = async player => {
        const current = getActiveBattle();
        if (!isFogmogActor(player) || isStunned(player) || !current?.fogmog?.canAct(player)) return;
        const move = player.storage.mengsanFogmogIntent_shuying;
        if (!move) return;
        player.storage.mengsanFogmogIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        const paid = player.storage.mengsanEnergy_shuying >= 1;
        if (isFogmog(player)) player.storage.mengsanFogmogState_shuying =
            recordFogmogAction(player.storage.mengsanFogmogState_shuying || {}, move, paid);
        if (!paid) { game.log(player, "费用不足，未发动", move.name); return; }
        player.storage.mengsanEnergy_shuying--;
        current.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        if (move.summon) await current.fogmog.summon(player);
        else if (move.dazed) current.fogmog.distract(player);
        else await executeEffects(player, move);
    };

    return {
        executeFogmogIntent,
        executeMawlerIntent,
        executeVineIntent,
        executeCubexIntent,
        executeByrdonisIntent,
        executeVantomIntent,
        executeBeastIntent,
        executeKinIntent,
        executeEffigyIntent,
        executePhrogIntent,
        executeNibbitIntent,
        executeShrinkerIntent,
        executeTwigmediumIntent,
        executeTwigslimeIntent,
        executeLeafslimeMediumIntent,
        executeLeafslimeIntent,
        executeStranglerIntent,
        executeJaxfruitIntent,
        executeCrawlerIntent,
        executeInkletIntent,
        planEnemyIntent,
        executeFlyconidIntent,
        executeRaiderIntent,
    };
}
