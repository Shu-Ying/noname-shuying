import { EYE_CHARACTER, isFogmog, isToothedEye } from "./fogmog-intent.js";
import { createDazedData } from "../cards/status-cards.js";
import { getIntentHostiles } from "../battle/intent-effects.js";

// 生命周期属于单场战斗；复活复用原席位，不追加玩家或定时器。
export function createFogmogBattle(game, current, spawn) {
    const owners = new Map(), eyes = new Map(), pending = new Map();
    let round = 0, sequence = 0, cardSequence = 0;
    const active = () => current.session.active;
    const canAct = player => active() && player.isAlive() &&
        (isFogmog(player) || isToothedEye(player) && eyes.get(player)?.isAlive());
    current.session.ownResource(owners, () => { owners.clear(); eyes.clear(); pending.clear(); });
    return {
        canAct,
        register(player, spec) {
            if (!isToothedEye(player)) return;
            const owner = game.players.find(p => p.playerid === spec.fogmogOwner && isFogmog(p));
            if (!owner || owners.has(owner)) throw new Error("利齿之眼缺少唯一雾菇召唤者");
            owners.set(owner, player); eyes.set(player, owner);
            player.storage.mengsanFogmogOwner_shuying = owner.playerid;
            player.addSkill("mengsan_fogmog_illusion_shuying");
            player.markSkill("mengsan_fogmog_illusion_shuying");
        },
        async summon(owner) {
            if (!canAct(owner) || !isFogmog(owner) || owners.has(owner)) return;
            if (game.players.length + game.dead.length >= 8) throw new Error("雾菇召唤需要一个空席位");
            await spawn({ id: `fogmog_eye_${++sequence}`, character: EYE_CHARACTER,
                camp: "enemy", tier: "normal", hp: 6, maxHp: 6, hand: 0,
                inheritSkills: false, fogmogOwner: owner.playerid }, owner);
        },
        distract(source) {
            if (!canAct(source)) return;
            for (const target of getIntentHostiles(game, source)) {
                const pile = target === game.me ? current.personalPiles : current.monsterPiles.get(target);
                if (!pile) continue; // 无个人牌堆的剧情援军不向公共牌堆塞入状态牌。
                for (let index = 0; index < 3 && canAct(source); index++) {
                    pile.addToDiscard(createDazedData(`dazed_${source.playerid}_${++cardSequence}`));
                }
                game.log(target, "的个人弃牌堆加入3张【晕眩】");
            }
        },
        onDeath(player) {
            if (eyes.has(player)) {
                if (eyes.get(player).isAlive()) pending.set(player, round + 1);
                player.storage.mengsanFogmogIntent_shuying = null;
                game.mengsanSetEnemyIntent_shuying(player, null);
            }
            if (owners.has(player)) {
                const eye = owners.get(player);
                pending.delete(eye);
                eye.storage.mengsanFogmogIntent_shuying = null;
                game.mengsanSetEnemyIntent_shuying(eye, null);
            }
        },
        beforeRound() {
            if (!active()) return;
            round++;
            for (const [eye, due] of pending) {
                const owner = eyes.get(eye);
                if (!owner?.isAlive()) { pending.delete(eye); continue; }
                if (round < due) continue;
                pending.delete(eye);
                if (!eye.isAlive()) {
                    eye.revive(6, false);
                    eye.hujia = 0;
                    eye.storage.mengsanEnergy_shuying = eye.storage.mengsanMaxEnergy_shuying;
                    eye.addSkill("mengsan_fogmog_illusion_shuying");
                    eye.markSkill("mengsan_fogmog_illusion_shuying");
                    eye.update();
                    game.log(eye, "以6点生命复活");
                }
            }
        },
    };
}
