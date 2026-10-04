import { ironcladCards } from "./data.js";
import { cardUpgradeLevel } from "../../upgrades.js";
import { canPayCard, cardCost, isActiveCardUse } from "../../../battle/combat-rules.js";
import { isAttackCard } from "../../../monsters/vine-tangled.js";
import { applyMengsanDebuff } from "../../../monsters/artifact-status.js";
import { createAdvancedIronclad } from "./advanced.js";

const POWER_SKILL = "mengsan_ic_powers_shuying";
const belongsTo = (event, root) => {
    const seen = new Set();
    for (let e = event; e && !seen.has(e); e = e.parent) {
        if (e === root) return true;
        seen.add(e);
    }
    return false;
};
const positive = n => Number.isSafeInteger(n) && n >= 0;

export function createIroncladRuntime({ game, get, lib, status, getBattle, handExhaust, battleEnergy, random }) {
    const advanced=createAdvancedIronclad({game,get,lib,status,getBattle,battleEnergy,random});
    const states = new WeakMap();
    const capture = player => {
        const battle = getBattle();
        if (!battle?.session?.active || !battle.root || !battle.players?.has(player) || !player?.isAlive?.()) return null;
        return { battle, session: battle.session, root: battle.root };
    };
    const valid = (player, token) => Boolean(token && getBattle() === token.battle &&
        token.battle.session === token.session && token.session.active && token.battle.root === token.root &&
        token.battle.players.has(player) && player?.isAlive?.());
    const pileOf = (player, token) => player === game.me ? token.battle.personalPiles : token.battle.monsterPiles?.get(player);
    const stateOf = player => {
        const s = states.get(player);
        return s && valid(player, s.token) ? s : null;
    };
    const ensure = (player, token) => {
        let s = stateOf(player);
        if (s) return s;
        s = { token, powers: Object.create(null), turn: Object.create(null), defense: Object.create(null) };
        token.session.ownResource(s, () => {
            if (states.get(player) !== s) return;
            states.delete(player);
            player.removeSkill(POWER_SKILL);
        });
        states.set(player, s);
        player.addSkill(POWER_SKILL);
        return s;
    };
    const add = (object, key, n) => {
        const next = (object[key] || 0) + n;
        if (!Number.isFinite(next) || next < 0 || next > Number.MAX_SAFE_INTEGER) throw new RangeError("铁甲战士效果数值越界");
        object[key] = next;
    };
    const strength = (player, n, token) => {
        if (!valid(player, token) || !positive(n)) return false;
        const next = (player.storage.mengsanStrength_shuying || 0) + n;
        if (!positive(next)) throw new RangeError("力量数值越界");
        player.storage.mengsanStrength_shuying = next;
        player.addSkill("mengsan_raider_strength_shuying");
        player.markSkill("mengsan_raider_strength_shuying");
        return true;
    };
    const exhaustCount = (player, token) => {
        const cards = pileOf(player, token)?.battleCards?.() || [];
        return cards.filter(c => c.storage?.mengsanExhausted_shuying).length;
    };
    const exhaustedThisTurn = (player, token) => {
        const lost = game.getGlobalHistory("cardMove");
        if (Array.isArray(lost) && lost.some(e => e.player === player && e.type === "mengsanExhaust" &&
            belongsTo(e, token.root) && e.cards?.some(c => c.storage?.mengsanExhausted_shuying))) return true;
        return player.getHistory("useCard").some(e => belongsTo(e, token.root) &&
            e.cards?.some(c => c.storage?.mengsanExhausted_shuying));
    };
    const chooseExhaust = async (player, event, token) => {
        const choice = handExhaust.capture(player);
        if (!choice || choice.battle !== token.battle) return null;
        return await handExhaust.exhaust(player, event, choice, true, "选择消耗一张你的手牌");
    };
    const exhaustHands = async (player, event, token, filter = () => true, afterEach = null) => {
        const pile = pileOf(player, token);
        if (typeof pile?.exhaustFromHand !== "function") throw new Error("铁甲战士缺少个人消耗接口");
        const playing = new Set(event.cards || []);
        const cards = player.getCards("h").filter(c => !playing.has(c) && filter(c));
        let count = 0;
        for (const c of cards) {
            if (!valid(player, token) || pileOf(player, token) !== pile) break;
            if (await pile.exhaustFromHand(c)) {
                count++;
                if (afterEach && valid(player, token)) await afterEach();
            }
        }
        return count;
    };
    const ruleOf = (spec, card) => cardUpgradeLevel(card) ? spec.upgraded : spec.base;
    const prompt = (spec, card) => {
        if(spec.base.advanced)return advanced.describe(spec,card);
        const r = ruleOf(spec, card), out = [];
        if (r.onlyAttacks) out.push("只有手牌全部为攻击牌时才能打出。");
        if (r.loseHp) out.push(`失去${r.loseHp}点生命。`);
        if (r.block) out.push(`获得${r.block}点格挡。`);
        if (r.exhaustTurnBlock) out.push(`本回合消耗过卡牌时，再获得${r.block}点格挡。`);
        if (r.doubleBlock) out.push("将当前格挡翻倍。");
        if (r.allyBlock) out.push("给予另一名友方角色等于自己当前格挡值的格挡。");
        if (r.chooseExhaust) out.push("消耗一张手牌。");
        if (r.exhaustNonAttacks) out.push(`消耗所有非攻击手牌，每张获得${r.blockPerExhaust}点格挡。`);
        if (r.hitsPerExhaust) out.push(`消耗所有手牌，每张对一名敌人造成${r.damage}点伤害。`);
        else if (r.damage) {
            let text = `${r.all ? "对所有敌人" : "对一名敌人"}造成${r.damage}点伤害`;
            if (r.hits) text += `${r.hits}次`;
            out.push(text + "。");
        }
        if (r.minExhaust) out.unshift(`仅当个人消耗牌堆至少${r.minExhaust}张时造成伤害。`);
        if (r.vulnerableHits) out.push(`目标已有易伤时，攻击${r.vulnerableHits}次。`);
        if (r.hitsPerHpLoss) out.push("本场战斗每次实际失去生命，额外攻击一次。");
        if (r.perExhaust) out.push(`每张个人消耗牌额外增加${r.perExhaust}点基础伤害。`);
        if (r.drawUntilSkill) out.push("抽牌直到抽到一张非攻击牌。");
        if (r.vulnerable) out.push(`给予目标${r.vulnerable}层易伤。`);
        if (r.weak) out.push(`给予目标${r.weak}层虚弱。`);
        if (r.strengthFromVulnerable) out.push("目标每有一层易伤，获得1点力量。");
        if (r.strength) out.push(`获得${r.strength}点力量。`);
        if (r.enemyStrength) out.push(`目标获得${r.enemyStrength}点力量。`);
        if (r.allyStrength) out.push(`给予另一名友方角色${r.allyStrength}点力量。`);
        if (r.energy) out.push(`获得${r.energy}费用。`);
        if (r.exhaustTurnEnergy) out.push(`本回合消耗过卡牌时，获得${r.exhaustTurnEnergy}费用。`);
        if (r.draw) out.push(`抽${r.draw}张牌。`);
        if (r.heal) out.push(`回复${r.heal}点生命。`);
        if (r.turnStrength) out.push(`每个自身回合开始时获得${r.turnStrength}点力量。`);
        if (r.turnEnergy) out.push(`每个自身回合开始时获得${r.turnEnergy}费用。`);
        if (r.turnBlock) out.push(`每个自身回合开始时失去${r.turnLoseHp}点生命，再获得${r.turnBlock}点格挡。`);
        if (r.attackBlock) out.push(`本次自身回合内，每打出一张攻击牌获得${r.attackBlock}点格挡。`);
        if (r.lossStrength) out.push(`在自身回合内每次实际失去生命，获得${r.lossStrength}点力量。`);
        if (r.lossDamage) out.push(`自身回合开始时失去${r.infernoLoseHp}点生命；自身回合每次实际失血，对全部敌人造成${r.lossDamage}点非攻击伤害。`);
        if (r.retaliation) out.push(`至下个自身回合开始，每受到一次攻击，对攻击者造成${r.retaliation}点伤害。`);
        if (r.vulnerableReduction) out.push("至下个自身回合开始，易伤敌人对你的攻击伤害降低50%。");
        if (r.vulnerableBonus) out.push(`你攻击易伤敌人的易伤伤害倍率额外增加${r.vulnerableBonus * 100}%。`);
        if (r.exhaust) out.push("消耗。");
        if (r.power) out.push("能力持续本场战斗，打出后退出牌堆。");
        return `梦三：主动使用消耗${cardCost(card || { name: spec.name })}费用。` + out.join("");
    };
    const cards = {}, translate = {};
    for (const spec of ironcladCards) {
        const base = spec.base;
        const enemyTarget = Boolean(base.damage && !base.all || base.vulnerable);
        const allyTarget = Boolean(base.allyStrength || base.allyBlock);
        cards[spec.name] = {
            type: "basic", fullimage: true,
            image: `ext:术樱包/mengsan/assets/cards/${spec.name}.png`,
            mengsanCost_shuying: spec.cost, usable: Infinity,
            mengsanXCost_shuying: spec.cost === "X",
            mengsanInnate_shuying: card => Boolean(ruleOf(spec,card).innate),
            mengsanExhaust_shuying: base.exhaust ? card => Boolean(ruleOf(spec, card).exhaust) : false,
            mengsanPower_shuying: Boolean(base.power),
            selectTarget: enemyTarget || allyTarget ? 1 : -1,
            toself: !enemyTarget && !allyTarget,
            enable(card, player, event) {
                const token = capture(player);
                if (!token || isActiveCardUse(event || status.event, player) && !canPayCard(player, card)) return false;
                if (base.onlyAttacks && player.getCards("h").some(c => !isAttackCard(c))) return false;
                return true;
            },
            filterTarget(card, player, target) {
                if (!target?.isAlive?.()) return false;
                if (enemyTarget) return target !== player && player.isEnemyOf(target);
                if (allyTarget) return target !== player && player.isFriendOf(target);
                return target === player;
            },
            async content(event, trigger, player) {
                const token = capture(player), r = ruleOf(spec, event.card), target = event.target;
                if (!token || !belongsTo(event, token.root)) return;
                advanced.ensure(player);
                if(r.advanced){await advanced.play(spec,event,player);return;}
                const targetValid = () => valid(player, token) && valid(target, token) &&
                    (enemyTarget ? player.isEnemyOf(target) : allyTarget ? target !== player && player.isFriendOf(target) : target === player);
                if (!targetValid()) return;
                if (r.minExhaust && exhaustCount(player, token) < r.minExhaust) return;
                if (r.loseHp) { await player.loseHp(r.loseHp); if (!targetValid()) return; }
                if (r.allyBlock && player.hujia > 0) { await target.changeHujia(player.hujia); if (!targetValid()) return; }
                if (r.block) { await player.changeHujia(r.block); if (!targetValid()) return; }
                if (r.exhaustTurnBlock && exhaustedThisTurn(player, token)) {
                    await player.changeHujia(r.block); if (!targetValid()) return;
                }
                if (r.doubleBlock && player.hujia > 0) { await player.changeHujia(player.hujia); if (!targetValid()) return; }
                if (r.chooseExhaust) { await chooseExhaust(player, event, token); if (!targetValid()) return; }
                if (r.exhaustNonAttacks) {
                    await exhaustHands(player, event, token, c => !isAttackCard(c),
                        () => player.changeHujia(r.blockPerExhaust));
                    return;
                }
                let hits = r.hits || 1;
                if (r.hitsPerHpLoss) hits += game.getAllGlobalHistory("changeHp").filter(e =>
                    e.player === player && Number.isFinite(e.changedHp) && e.changedHp < 0 && belongsTo(e, token.root)).length;
                if (r.hitsPerExhaust) hits = await exhaustHands(player, event, token);
                else if (r.vulnerableHits && target.storage?.mengsanVulnerable_shuying > 0) hits = r.vulnerableHits;
                const amount = (r.damage || 0) + (r.perExhaust ? r.perExhaust * exhaustCount(player, token) : 0);
                if (!positive(amount) || !positive(hits)) throw new RangeError("铁甲战士攻击数值越界");
                if (amount > 0) for (let i = 0; i < hits && valid(player, token); i++) {
                    const targets = r.all ? [...token.battle.players].filter(p => p !== player && p.isAlive() && player.isEnemyOf(p)) : [target];
                    for (const t of targets) {
                        if (!valid(player, token)) return;
                        if (!valid(t, token) || !player.isEnemyOf(t)) continue;
                        const damage = t.damage(amount, player);
                        damage.card = event.card;
                        damage.mengsanAttack_shuying = true;
                        await damage;
                    }
                }
                if (!valid(player, token)) return;
                // 自身力量与抽牌不因目标被本牌击杀而丢失；目标状态只施加给存活目标。
                if (targetValid()) {
                    if (r.weak) applyMengsanDebuff(target, "weak", r.weak, player);
                    if (r.vulnerable) applyMengsanDebuff(target, "vulnerable", r.vulnerable, player);
                    if (r.enemyStrength) strength(target, r.enemyStrength, token);
                    if (r.allyStrength) strength(target, r.allyStrength, token);
                    if (r.strengthFromVulnerable) strength(player, target.storage?.mengsanVulnerable_shuying || 0, token);
                }
                await advanced.flushAll();
                if(!valid(player,token))return;
                if (r.strength) strength(player, r.strength, token);
                if (r.heal) { await player.recover(r.heal); if (!valid(player, token)) return; }
                if (r.energy) battleEnergy.grant(player, r.energy, token.battle);
                if (r.exhaustTurnEnergy && exhaustedThisTurn(player, token)) battleEnergy.grant(player, r.exhaustTurnEnergy, token.battle);
                if (r.draw) { await player.draw(r.draw); if (!valid(player, token)) return; }
                if (r.drawUntilSkill) {
                    const pile = pileOf(player, token);
                    if (typeof pile?.battleCards !== "function") throw new Error("劫掠缺少个人牌堆接口");
                    // 固定当前牌数作为安全上界，抽牌过程不重复消耗空牌堆。
                    const limit = pile.battleCards(event.cards).length;
                    for (let i = 0; i < limit && valid(player, token) && pileOf(player, token) === pile; i++) {
                        const draw = player.draw(1);
                        await draw;
                        const drawn = draw.result?.cards;
                        if (!Array.isArray(drawn) || !drawn.length || drawn.some(c => !isAttackCard(c))) break;
                    }
                }
                if ((r.power || r.turnPower) && valid(player, token)) {
                    const s = ensure(player, token);
                    if (r.turnStrength) add(s.powers, "turnStrength", r.turnStrength);
                    if (r.turnEnergy) add(s.powers, "turnEnergy", r.turnEnergy);
                    if (r.turnBlock) { add(s.powers, "turnBlock", r.turnBlock); add(s.powers, "turnLoseHp", r.turnLoseHp); }
                    if (r.lossStrength) add(s.powers, "lossStrength", r.lossStrength);
                    if (r.lossDamage) { add(s.powers, "lossDamage", r.lossDamage); add(s.powers, "infernoLoseHp", r.infernoLoseHp); }
                    if (r.vulnerableBonus) add(s.powers, "vulnerableBonus", r.vulnerableBonus);
                    if (r.attackBlock) add(s.turn, "attackBlock", r.attackBlock);
                    if (r.retaliation) add(s.defense, "retaliation", r.retaliation);
                    if (r.vulnerableReduction) s.defense.colossus = true;
                    player.markSkill(POWER_SKILL);
                }
            },
            cardPrompt(card) { return prompt(spec, card); },
            ai: { order: base.power ? 8 : 6, result: { target: enemyTarget ? -1 : 1 },
                tag: { damage: base.damage ? 1 : 0, recover: base.heal ? 1 : 0 } },
        };
        translate[spec.name] = spec.title;
        translate[`${spec.name}_info`] = prompt(spec, { name: spec.name });
    }
    const skills = {
        ...advanced.skills,
        [POWER_SKILL]: {
            trigger: { player: ["phaseBegin", "phaseAfter", "changeHpAfter", "damageBegin3", "damageAfter", "useCardAfter"] },
            forced: true, silent: true, popup: false, priority: 50,
            mark: true, marktext: "战",
            intro: { content(storage, player) {
                const s = stateOf(player);
                if (!s) return "本场战斗的铁甲战士效果";
                const names = { turnStrength: "每回合力量", turnEnergy: "每回合费用", turnBlock: "每回合格挡", turnLoseHp: "披风每回合失血", infernoLoseHp: "狱火每回合失血", lossDamage: "失血全体伤害", lossStrength: "失血获得力量", vulnerableBonus: "易伤倍率加成", attackBlock: "攻击获得格挡", retaliation: "反击伤害", colossus: "巨像减伤" };
                return Object.entries({ ...s.powers, ...s.turn, ...s.defense }).map(([k, v]) => `${names[k] || k}：${v === true ? "50%" : k === "vulnerableBonus" ? `${v * 100}%` : v}`).join("<br>");
            } },
            filter(event, player) { const s = stateOf(player); return Boolean(s && belongsTo(event, s.token.root)); },
            async content(event, trigger, player) {
                const s = stateOf(player);
                if (!s) return;
                const token = s.token;
                if (event.triggername === "phaseBegin") {
                    s.defense = Object.create(null);
                    s.turn = Object.create(null);
                    if (s.powers.turnStrength) strength(player, s.powers.turnStrength, token);
                    if (s.powers.turnEnergy) battleEnergy.grant(player, s.powers.turnEnergy, token.battle);
                    if (s.powers.turnLoseHp) { await player.loseHp(s.powers.turnLoseHp); if (!valid(player, token)) return; }
                    if (s.powers.turnBlock) await player.changeHujia(s.powers.turnBlock);
                    if (valid(player, token) && s.powers.infernoLoseHp) await player.loseHp(s.powers.infernoLoseHp);
                } else if (event.triggername === "phaseAfter") {
                    s.turn = Object.create(null);
                } else if (event.triggername === "useCardAfter") {
                    if (s.turn.attackBlock && status.currentPhase === player && isAttackCard(trigger.card)) await player.changeHujia(s.turn.attackBlock);
                } else if (event.triggername === "changeHpAfter") {
                    const lostHp = status.currentPhase === player && Number.isFinite(trigger.changedHp) && trigger.changedHp < 0;
                    if (s.powers.lossStrength && lostHp) strength(player, s.powers.lossStrength, token);
                    if (s.powers.lossDamage && lostHp) {
                        for (const target of [...token.battle.players]) {
                            if (!valid(player, token)) return;
                            if (!valid(target, token) || !player.isEnemyOf(target)) continue;
                            const damage = target.damage(s.powers.lossDamage, player, "nocard");
                            damage.mengsanScriptedSkill_shuying = true;
                            await damage;
                        }
                    }
                } else if (event.triggername === "damageBegin3") {
                    if (s.defense.colossus && trigger.source?.storage?.mengsanVulnerable_shuying > 0 &&
                        (trigger.mengsanAttack_shuying || isAttackCard(trigger.card))) trigger.num = Math.floor(trigger.num * 0.5);
                } else if (event.triggername === "damageAfter") {
                    const attacker = trigger.source;
                    if (s.defense.retaliation && valid(attacker, token) && attacker !== player &&
                        (trigger.mengsanAttack_shuying || isAttackCard(trigger.card))) {
                        const damage = attacker.damage(s.defense.retaliation, player, "nocard");
                        damage.mengsanScriptedSkill_shuying = true;
                        await damage;
                    }
                }
                if (valid(player, token)) player.markSkill(POWER_SKILL);
            },
        },
    };
    translate[POWER_SKILL] = "铁甲战意";
    translate.mengsan_ic_advanced_shuying = "刘备牌组状态";
    translate.mengsan_ic_bridge_shuying = "刘备牌组结算";
    return { cards, translate, skills, names: ironcladCards.map(c => c.name),
        onDeath:advanced.onDeath,
        vulnerableBonus(source, target) {
            return source !== target && source?.isEnemyOf?.(target) ? stateOf(source)?.powers.vulnerableBonus || 0 : 0;
        } };
}
