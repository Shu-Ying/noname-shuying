import { applyMengsanDebuff } from "../monsters/artifact-status.js";
import { ironcladBlocksEnergy, ironcladStrengthPenalty } from "../cards/ironclad-hooks.js";
import { isAttackCard } from "../monsters/vine-tangled.js";

export function createOpeningEffects(game, owner, refreshEnergy, random = Math.random) {
    const enemies = () => game.players.filter(player =>
        player !== owner && player.isAlive() &&
        player.storage?.mengsanCamp_shuying === "enemy");
    const addStatus = (player, key, skill, amount) => {
        if (key === "mengsanVulnerable_shuying" || key === "mengsanWeak_shuying")
            return applyMengsanDebuff(player, key === "mengsanWeak_shuying" ? "weak" : "vulnerable", amount, owner);
        player.storage[key] = (player.storage[key] || 0) + amount;
        player.addSkill(skill);
        player.markSkill(skill);
    };
    return async relic => {
        if (relic.effect === "firstTurnEnergy") {
            if (!ironcladBlocksEnergy(owner)) owner.storage.mengsanEnergy_shuying += relic.amount;
            refreshEnergy();
        } else if (relic.effect === "energy" || relic.effect === "nextEnergy") {
            if (!ironcladBlocksEnergy(owner)) owner.storage.mengsanEnergy_shuying = Math.max(0,(owner.storage.mengsanEnergy_shuying || 0)+relic.amount);
            refreshEnergy();
        } else if (["openingBlock","nextBlock","plating"].includes(relic.effect)) {
            await owner.changeHujia(relic.amount);
        } else if (relic.effect === "openingHeal" || relic.effect === "healAbsolute") {
            await owner.recover(relic.amount);
        } else if (relic.effect === "openingLoseHp") {
            await owner.loseHp(relic.amount);
        } else if (relic.effect === "targetDamage") {
            if (relic.target?.isAlive()) {
                const damage=relic.target.damage(relic.amount,owner,"nocard"); damage.mengsanScriptedSkill_shuying=true; await damage;
            }
        } else if (relic.effect === "randomDamage") {
            const targets=enemies(),target=targets[Math.floor(random()*targets.length)];
            if(target){const damage=target.damage(relic.amount,owner,"nocard");damage.mengsanScriptedSkill_shuying=true;await damage;}
        } else if (relic.effect === "openingStrength") {
            addStatus(owner, "mengsanStrength_shuying",
                "mengsan_raider_strength_shuying", relic.amount);
        } else {
            for (const target of enemies()) {
                if (!owner.isAlive()) break;
                if (!target.isAlive()) continue;
                if (relic.effect === "openingVulnerable") {
                    addStatus(target, "mengsanVulnerable_shuying",
                        "mengsan_vulnerable_shuying", relic.amount);
                } else if (relic.effect === "openingWeak") {
                    addStatus(target, "mengsanWeak_shuying",
                        "mengsan_weak_shuying", relic.amount);
                } else if (relic.effect === "openingEnemyStrength") {
                    addStatus(target,"mengsanStrength_shuying","mengsan_raider_strength_shuying",relic.amount);
                } else if (relic.effect === "openingDamage") {
                    const damage = target.damage(relic.amount, owner, "nocard");
                    damage.mengsanScriptedSkill_shuying = true;
                    await damage;
                }
            }
        }
    };
}

export function createRelicCombatSkills(getBattle, getOwner) {
    return {
        mengsan_relic_attack_shuying: {
            trigger: { global: "damageBegin1" },
            forced: true, silent: true, popup: false, priority: 80,
            filter(event) {
                const source = event.source;
                return Boolean(getBattle()?.session.active && (isAttackCard(event.card) || event.mengsanAttack_shuying) &&
                    !event.mengsanScriptedSkill_shuying &&
                    (source === getOwner() ||
                    source?.storage?.mengsanWeak_shuying > 0));
            },
            async content(event, trigger) {
                const source = trigger.source;
                if (source === getOwner()) {
                    trigger.num = Math.max(0, trigger.num + (source.storage.mengsanStrength_shuying || 0) - ironcladStrengthPenalty(source));
                    trigger.num = getBattle().relics?.outgoingDamage(trigger) ?? trigger.num;
                }
                if (source.storage.mengsanWeak_shuying > 0) {
                    trigger.num = Math.floor(trigger.num * (source !== getOwner() && getBattle().relics?.has("paper_krane") ? 0.6 : 0.75));
                }
            },
        },
        mengsan_relic_boot_shuying: {
            trigger:{global:"damageBegin2"},forced:true,silent:true,popup:false,priority:-1000,
            filter(event){return Boolean(getBattle()?.session.active && event.source===getOwner() && (isAttackCard(event.card) || event.mengsanAttack_shuying) && !event.mengsanScriptedSkill_shuying);},
            async content(event,trigger){trigger.num=getBattle().relics?.lateOutgoingDamage(trigger) ?? trigger.num;},
        },
        mengsan_weak_shuying: {
            mark: true, marktext: "弱",
            onremove(player) { delete player.storage.mengsanWeak_shuying; },
            intro: { content(storage, player) {
                return `剩余${player.storage.mengsanWeak_shuying || 0}回合：` +
                    "攻击伤害减少25%（向下取整）";
            } },
            trigger: { player: "phaseAfter" },
            forced: true, silent: true, popup: false,
            async content(event, trigger, player) {
                player.storage.mengsanWeak_shuying = Math.max(0,
                    (player.storage.mengsanWeak_shuying || 0) - 1);
                if (player.storage.mengsanWeak_shuying) {
                    player.markSkill("mengsan_weak_shuying");
                } else player.removeSkill("mengsan_weak_shuying");
            },
        },
    };
}
