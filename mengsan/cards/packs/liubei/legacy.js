// 刘备牌组沿用的 25 张铁甲牌及兼容重杀；保留原有卡名与效果接口。
import standard from "../../../../../../card/standard.js";
import { _status, game, get } from "../../../../../../noname.js";
import { cardCost, canPayCard, isActiveCardUse } from "../../../battle/combat-rules.js";
import { cardUpgradeLevel, cardUpgradeRule } from "../../upgrades.js";
import { applyMengsanDebuff } from "../../../monsters/artifact-status.js";
import { isAttackCard } from "../../../monsters/vine-tangled.js";

export function createLegacyLiuBeiCards({ copyToDiscard, reclaimFromDiscard, temporaryStrength, countStrikeCards, randomHandExhaust, battleEnergy, handExhaust, playDrawTop, blockDraw, blockUpgrade, lifeLossBlock, whirlwind, spite, rampage, isBattleActive = () => true } = {}) {
    const card = {}, translate = {}, nativeSha = standard.card.sha;
    card.mengsan_zhongsha = {
        type: "basic",
        fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_zhongsha.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_zhongsha" }),
        enable(used, player, event) {
            return !isActiveCardUse(event || _status.event, player) ||
                canPayCard(player, used);
        },
        usable: Infinity,
        selectTarget: 1,
        range: nativeSha.range,
        filterTarget: nativeSha.filterTarget,
        async content(event, trigger, player) {
            const target = event.target;
            const effect = cardUpgradeLevel(event.card)
                ? cardUpgradeRule("mengsan_zhongsha")
                : { damage: 8, vulnerable: 2 };
            const damage = target.damage(effect.damage, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            if (!target.isAlive()) return;
            if (applyMengsanDebuff(target, "vulnerable", effect.vulnerable, player))
                game.log(target, `获得${effect.vulnerable}层易伤`);
        },
        ai: { order: 4, result: { target: -1.5 },
            tag: { damage: 1 } },
        cardPrompt(used) {
            const effect = cardUpgradeLevel(used)
                ? cardUpgradeRule("mengsan_zhongsha")
                : { damage: 8, vulnerable: 2 };
            return "梦三：主动使用消耗2费用。对攻击范围内的" +
                `一名其他角色造成${effect.damage}点伤害，然后给予其` +
                `${effect.vulnerable}层易伤。受到攻击伤害增加50%` +
                "（向上取整），每个自身回合结束减少1层。" +
                "每回合使用次数不限。";
        },
    };
    translate.mengsan_zhongsha = "重杀";
    translate.mengsan_zhongsha_info =
        "梦三：主动使用消耗2费用。出牌阶段，对攻击范围内的" +
        "一名其他角色造成8点伤害，然后给予其2层易伤。" +
        "易伤使受到的攻击伤害增加50%（向上取整），" +
        "每个自身回合结束减少1层。每回合使用次数不限。";
    // STS2 Setup Strike: the new temporary strength does not enhance its own hit.
    // STS2 Cinder: damage first, then exhaust one random remaining hand card.
    card.mengsan_yujin = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_yujin.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_yujin" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                target === player || !player.isEnemyOf(target)) return;
            if (!randomHandExhaust?.capture || !randomHandExhaust?.exhaust) throw new Error("余烬缺少随机消耗接口");
            const battle = randomHandExhaust.capture();
            if (!battle) return;
            const rule = cardUpgradeRule("mengsan_yujin");
            const damage = target.damage(cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            if (isBattleActive() && player.isAlive()) await randomHandExhaust.exhaust(player, event, battle);
        },
        ai: { order: 6, result: { target: -2 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_yujin");
            const amount = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return `梦三：主动使用消耗2费用。对一名敌方角色造成${amount}点伤害，然后随机消耗一张你的手牌（退出本场战斗，不进入弃牌堆或洗牌）。没有手牌时不消耗牌。每回合使用次数不限。`;
        },
    };
    translate.mengsan_yujin = "余烬";
    translate.mengsan_yujin_info = card.mengsan_yujin.cardPrompt({ name: "mengsan_yujin" });
    // STS2 Perfected Strike counts current physical combat cards, including itself/exhaust.
    card.mengsan_wanmeidaji = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_wanmeidaji.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_wanmeidaji" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                target === player || !player.isEnemyOf(target)) return;
            if (typeof countStrikeCards !== "function") throw new Error("完美打击缺少打击牌计数接口");
            const count = countStrikeCards(player, event);
            if (!Number.isSafeInteger(count) || count < 0) throw new RangeError("打击牌数量无效");
            const rule = cardUpgradeRule("mengsan_wanmeidaji");
            const amount = rule.baseDamage + count * (cardUpgradeLevel(event.card) ? rule.perStrike : rule.basePerStrike);
            if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("完美打击伤害无效");
            const damage = target.damage(amount, player);
            damage.mengsanAttack_shuying = true;
            damage.mengsanStrikeCount_shuying = count;
            await damage;
        },
        ai: { order: 7, result: { target: -2 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_wanmeidaji");
            const bonus = cardUpgradeLevel(used) ? rule.perStrike : rule.basePerStrike;
            return `梦三：主动使用消耗2费用。对一名敌方角色造成6点伤害，本场战斗的牌中每有一张【杀】或名称含“打击”的牌，伤害增加${bonus}点（包括手牌、个人抽牌堆、个人弃牌堆、消耗牌及打出区）。每回合使用次数不限。`;
        },
    };
    translate.mengsan_wanmeidaji = "完美打击";
    translate.mengsan_wanmeidaji_info = card.mengsan_wanmeidaji.cardPrompt({ name: "mengsan_wanmeidaji" });
    card.mengsan_yubeidaji = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_yubeidaji.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_yubeidaji" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                target === player || !player.isEnemyOf(target)) return;
            if (!temporaryStrength?.capture || !temporaryStrength?.grant) throw new Error("预备打击缺少临时力量接口");
            const battle = temporaryStrength.capture();
            if (!battle) return;
            const rule = cardUpgradeRule("mengsan_yubeidaji");
            const upgraded = cardUpgradeLevel(event.card);
            const damage = target.damage(upgraded ? rule.damage : rule.baseDamage, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            if (isBattleActive() && player.isAlive()) {
                temporaryStrength.grant(player, upgraded ? rule.strength : rule.baseStrength, event, battle);
            }
        },
        ai: { order: 8, result: { player: 0.8, target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_yubeidaji");
            const upgraded = cardUpgradeLevel(used);
            return `梦三：主动使用消耗1费用。对一名敌方角色造成${upgraded ? rule.damage : rule.baseDamage}点伤害，然后在本回合内获得${upgraded ? rule.strength : rule.baseStrength}点力量。每回合使用次数不限。`;
        },
    };
    translate.mengsan_yubeidaji = "预备打击";
    translate.mengsan_yubeidaji_info = "梦三：主动使用消耗1费用。对一名敌方角色造成7点伤害，然后在本回合内获得2点力量。每回合使用次数不限。";
    // STS2 Breakthrough: native life loss is paid once before the all-enemy attack.
    card.mengsan_tupo = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_tupo.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_tupo" }),
        notarget: true, usable: Infinity,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            if (!game.filterPlayer(target => target !== player &&
                target.isAlive() && player.isEnemyOf(target)).length) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        async content(event, trigger, player) {
            if (!isBattleActive() || !player.isAlive()) return;
            if (!game.filterPlayer(target => target !== player &&
                target.isAlive() && player.isEnemyOf(target)).length) return;
            // loseHp bypasses block and awaits the normal dying/rescue process.
            await player.loseHp(1);
            if (!isBattleActive() || !player.isAlive()) return;
            const rule = cardUpgradeRule("mengsan_tupo");
            const amount = cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage;
            const targets = game.filterPlayer(target => target !== player &&
                target.isAlive() && player.isEnemyOf(target));
            for (const target of targets) {
                if (!isBattleActive() || !player.isAlive()) break;
                if (!target.isAlive() || !player.isEnemyOf(target)) continue;
                player.line(target, "green");
                const damage = target.damage(amount, player);
                damage.mengsanAttack_shuying = true;
                await damage;
            }
        },
        ai: { order: 7, result: { player(player) { return player.hp <= 1 ? -10 : 1; } }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_tupo");
            const amount = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return `梦三：主动使用消耗1费用。失去1点生命，然后对所有敌方角色造成${amount}点伤害。每回合使用次数不限。`;
        },
    };
    translate.mengsan_tupo = "突破";
    translate.mengsan_tupo_info = "梦三：主动使用消耗1费用。失去1点生命，然后对所有敌方角色造成9点伤害。每回合使用次数不限。";
    // STS2 Headbutt: damage first, then choose from the actor's own real discard pile.
    card.mengsan_touchui = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_touchui.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_touchui" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                target === player || !player.isEnemyOf(target)) return;
            if (typeof reclaimFromDiscard !== "function") throw new Error("头槌缺少个人弃牌回收接口");
            const rule = cardUpgradeRule("mengsan_touchui");
            const amount = cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage;
            const damage = target.damage(amount, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            // Defeating one enemy does not prevent recovery unless combat actually ends.
            if (isBattleActive() && player.isAlive()) await reclaimFromDiscard(player);
        },
        ai: { order: 6, result: { player: 0.4, target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_touchui");
            const amount = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return '梦三：主动使用消耗1费用。对一名敌方角色造成' + amount +
                '点伤害，然后选择个人弃牌堆中的一张牌放到个人抽牌堆顶部。每回合使用次数不限。';
        },
    };
    translate.mengsan_touchui = "头槌";
    translate.mengsan_touchui_info = "梦三：主动使用消耗1费用。对一名敌方角色造成9点伤害，" +
        "然后选择个人弃牌堆中的一张牌放到个人抽牌堆顶部。每回合使用次数不限。";
    // STS2 Iron Wave: obtain block before resolving the attack.
    card.mengsan_tiezhanbo = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_tiezhanbo.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_tiezhanbo" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            const canResolve = () => isBattleActive() && player.isAlive() &&
                target?.isAlive() && target !== player && player.isEnemyOf(target);
            if (!canResolve()) return;
            const rule = cardUpgradeRule("mengsan_tiezhanbo");
            const upgraded = cardUpgradeLevel(event.card) > 0;
            await player.changeHujia(upgraded ? rule.block : rule.baseBlock);
            // Block triggers may end combat or remove the acting player/target.
            if (!canResolve()) return;
            const damage = target.damage(upgraded ? rule.damage : rule.baseDamage, player);
            damage.mengsanAttack_shuying = true;
            await damage;
        },
        ai: { order: 7, result: { player: 0.6, target: -1.2 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_tiezhanbo");
            const upgraded = cardUpgradeLevel(used) > 0;
            const block = upgraded ? rule.block : rule.baseBlock;
            const damage = upgraded ? rule.damage : rule.baseDamage;
            return '梦三：主动使用消耗1费用。获得' + block +
                '点格挡（护甲），然后对一名敌方角色造成' + damage +
                '点伤害。每回合使用次数不限。';
        },
    };
    translate.mengsan_tiezhanbo = "铁斩波";
    translate.mengsan_tiezhanbo_info = "梦三：主动使用消耗1费用。获得5点格挡（护甲），" +
        "然后对一名敌方角色造成5点伤害。每回合使用次数不限。";
    // STS2 Twin Strike: each hit resolves on the same target separately.
    card.mengsan_shuangchongdaji = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_shuangchongdaji.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_shuangchongdaji" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            const rule = cardUpgradeRule("mengsan_shuangchongdaji");
            const amount = cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage;
            for (let hitIndex = 0; hitIndex < rule.hits; hitIndex++) {
                if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                    target === player || !player.isEnemyOf(target)) break;
                const damage = target.damage(amount, player);
                damage.mengsanAttack_shuying = true;
                await damage;
            }
        },
        ai: { order: 6, result: { target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_shuangchongdaji");
            const amount = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return '梦三：主动使用消耗1费用。对一名敌方角色造成' +
                amount + '点伤害两次，两次伤害分别结算。每回合使用次数不限。';
        },
    };
    translate.mengsan_shuangchongdaji = "双重打击";
    translate.mengsan_shuangchongdaji_info = "梦三：主动使用消耗1费用。对一名敌方角色造成5点伤害两次，" +
        "两次伤害分别结算。每回合使用次数不限。";
    // STS2 Thunderclap: hit each living enemy before adding new vulnerable.
    card.mengsan_shandianpili = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_shandianpili.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_shandianpili" }),
        notarget: true, usable: Infinity,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            if (!game.filterPlayer(target => target !== player &&
                target.isAlive() && player.isEnemyOf(target)).length) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        async content(event, trigger, player) {
            if (!isBattleActive() || !player.isAlive()) return;
            const rule = cardUpgradeRule("mengsan_shandianpili");
            const amount = cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage;
            const targets = game.filterPlayer(target => target !== player &&
                target.isAlive() && player.isEnemyOf(target));
            for (const target of targets) {
                if (!isBattleActive() || !player.isAlive()) break;
                if (!target.isAlive() || !player.isEnemyOf(target)) continue;
                player.line(target, "green");
                const damage = target.damage(amount, player);
                damage.mengsanAttack_shuying = true;
                await damage;
            }
            // 伤害结束后重新取得存活敌人，包含异蛙亡语刚生成的扭动虫。
            for (const target of game.filterPlayer(target => target !== player && target.isAlive() && player.isEnemyOf(target))) {
                if (!isBattleActive() || !player.isAlive()) break;
                if (applyMengsanDebuff(target, "vulnerable", rule.vulnerable, player))
                    game.log(target, `获得${rule.vulnerable}层易伤`);
            }
        },
        ai: { order: 7, result: { player: 1 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_shandianpili");
            const amount = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return `梦三：主动使用消耗1费用。对所有敌方角色造成${amount}点伤害，然后给予其1层易伤。` +
                "易伤使受到的攻击伤害增加50%（向上取整），每个自身回合结束减少1层。每回合使用次数不限。";
        },
    };
    translate.mengsan_shandianpili = "闪电霹雳";
    translate.mengsan_shandianpili_info = "梦三：主动使用消耗1费用。对所有敌方角色造成4点伤害，然后给予其1层易伤。" +
        "易伤使受到的攻击伤害增加50%（向上取整），每个自身回合结束减少1层。每回合使用次数不限。";
    // Each throw resolves separately and samples the still-living enemies again.
    card.mengsan_feijianhuixuanbiao = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_feijianhuixuanbiao.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_feijianhuixuanbiao" }),
        notarget: true, usable: Infinity,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            if (!game.filterPlayer(target => target !== player &&
                target.isAlive() && player.isEnemyOf(target)).length) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        async content(event, trigger, player) {
            const rule = cardUpgradeRule("mengsan_feijianhuixuanbiao");
            const count = cardUpgradeLevel(event.card) ? rule.hits : rule.baseHits;
            for (let hitIndex = 0; hitIndex < count; hitIndex++) {
                if (!isBattleActive() || !player.isAlive()) break;
                const enemies = game.filterPlayer(target => target !== player &&
                    target.isAlive() && player.isEnemyOf(target));
                if (!enemies.length) break;
                // Use the engine helper with an inclusive index range.
                const target = enemies[get.rand(0, enemies.length - 1)];
                player.line(target, "green");
                const damage = target.damage(rule.damage, player);
                damage.mengsanAttack_shuying = true;
                await damage;
            }
        },
        ai: { order: 6, result: { player: 1 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_feijianhuixuanbiao");
            const count = cardUpgradeLevel(used) ? rule.hits : rule.baseHits;
            return `梦三：主动使用消耗1费用。每次对随机一名敌方角色造成${rule.damage}点伤害，共${count}次。` +
                "每次攻击重新随机选择存活的敌人，可以重复命中同一敌人。" +
                "每回合使用次数不限。";
        },
    };
    translate.mengsan_feijianhuixuanbiao = "飞剑回旋镖";
    translate.mengsan_feijianhuixuanbiao_info = "梦三：主动使用消耗1费用。随机对敌人造成3点伤害3次。" +
        "每次攻击重新随机选择存活的敌人，可以重复命中同一敌人。每回合使用次数不限。";
    // Resolve damage before drawing from the acting player's mode-owned pile.
    card.mengsan_jianbingdaji = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_jianbingdaji.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_jianbingdaji" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            if (!isBattleActive() || !player.isAlive()) return;
            const rule = cardUpgradeRule("mengsan_jianbingdaji");
            const upgraded = cardUpgradeLevel(event.card) > 0;
            const damage = event.target.damage(upgraded ? rule.damage : rule.baseDamage, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            // Defeating the last enemy may dispose the personal pile during damage.
            if (isBattleActive() && player.isAlive()) {
                await player.draw(upgraded ? rule.draw : rule.baseDraw);
            }
        },
        ai: { order: 6, result: { player: 0.6, target: -1.5 }, tag: { damage: 1, draw: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_jianbingdaji");
            const upgraded = cardUpgradeLevel(used) > 0;
            const damage = upgraded ? rule.damage : rule.baseDamage;
            const draw = upgraded ? rule.draw : rule.baseDraw;
            return `梦三：主动使用消耗1费用。对一名敌方角色造成${damage}点伤害，然后抽${draw}张牌。` +
                "每回合使用次数不限。";
        },
    };
    translate.mengsan_jianbingdaji = "剑柄打击";
    translate.mengsan_jianbingdaji_info = "梦三：主动使用消耗1费用。对一名敌方角色造成9点伤害，然后抽1张牌。" +
        "每回合使用次数不限。";
    // Block determines base damage without spending the acting player's block.
    card.mengsan_quanshenzhuangji = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_quanshenzhuangji.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_quanshenzhuangji" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            if (!isBattleActive() || !player.isAlive()) return;
            const block = Number.isFinite(player.hujia) ? Math.max(0, player.hujia) : 0;
            const storedStrength = player.storage?.mengsanStrength_shuying;
            const strength = Number.isInteger(storedStrength) ? storedStrength : 0;
            // Native damage(0) stops before damageBegin1, so strength must be included here.
            const temporary = temporaryStrength?.amount(player) || 0;
            const damage = event.target.damage(Math.max(0, block + strength + temporary), player);
            damage.mengsanAttack_shuying = true;
            damage.mengsanCardStrengthApplied_shuying = true;
            damage.mengsanSetupStrengthApplied_shuying = true;
            await damage;
        },
        ai: {
            order: 5,
            result: { target(used, player) { return player.hujia > 0 ? -1.5 : 0; } },
            tag: { damage: 1 },
        },
        cardPrompt(used) {
            const cost = cardCost(used || { name: "mengsan_quanshenzhuangji" });
            return `梦三：主动使用消耗${cost}费用。对一名敌方角色造成等同于你当前格挡（护甲）值的伤害。` +
                "不消耗格挡，可以受到力量加成。" +
                "每回合使用次数不限。";
        },
    };
    translate.mengsan_quanshenzhuangji = "全身撞击";
    translate.mengsan_quanshenzhuangji_info = "梦三：主动使用消耗1费用。对一名敌方角色造成等同于你当前格挡（护甲）值的伤害。" +
        "不消耗格挡，可以受到力量加成。每回合使用次数不限。";
    // Double only the surviving target's existing vulnerable after damage resolves.
    card.mengsan_rongrongzhiquan = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_rongrongzhiquan.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_rongrongzhiquan" }),
        mengsanExhaust_shuying: true,
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            if (!isBattleActive() || !player.isAlive()) return false;
            return !isActiveCardUse(event || _status.event, player) || canPayCard(player, used);
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            if (!isBattleActive() || !player.isAlive()) return;
            const rule = cardUpgradeRule("mengsan_rongrongzhiquan");
            const target = event.target;
            const damage = target.damage(cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            if (!target.isAlive() || !isBattleActive()) return;
            const stacks = target.storage?.mengsanVulnerable_shuying;
            if (!Number.isSafeInteger(stacks) || stacks <= 0) return;
            const doubled = stacks * 2;
            if (!Number.isSafeInteger(doubled)) throw new RangeError("易伤层数越界");
            if (applyMengsanDebuff(target, "vulnerable", stacks, player))
                game.log(target, `易伤层数从${stacks}翻倍为${doubled}`);
        },
        ai: { order: 6, result: { target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_rongrongzhiquan");
            const damage = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return `梦三：主动使用消耗1费用。对一名敌方角色造成${damage}点伤害，然后将该目标已有的易伤层数翻倍。` +
                "没有易伤时不会新增易伤。消耗：使用后退出本场战斗，不进入弃牌堆或洗牌。";
        },
    };
    translate.mengsan_rongrongzhiquan = "熔融之拳";
    translate.mengsan_rongrongzhiquan_info = "梦三：主动使用消耗1费用。对一名敌方角色造成10点伤害，然后将该目标已有的易伤层数翻倍。" +
        "消耗：使用后退出本场战斗。";
    // STS2【愤怒】：攻击后生成独立的战斗复制品，不扩充永久牌组。
    card.mengsan_fennu = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_fennu.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_fennu" }),
        enable(used, player, event) {
            return !isActiveCardUse(event || _status.event, player) ||
                canPayCard(player, used);
        },
        usable: Infinity, selectTarget: 1,
        filterTarget(used, player, target) {
            return target !== player && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            if (typeof copyToDiscard !== "function") throw new Error("愤怒缺少战斗复制接口");
            const amount = cardUpgradeLevel(event.card)
                ? cardUpgradeRule("mengsan_fennu").damage : 6;
            const damage = event.target.damage(amount, player);
            damage.mengsanAttack_shuying = true;
            await damage;
            if (copyToDiscard(player, event.card, event.cards)) {
                game.log(player, "将一张【愤怒】的复制品加入个人弃牌堆");
            }
        },
        ai: { order: 6, result: { target: -1 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const amount = cardUpgradeLevel(used)
                ? cardUpgradeRule("mengsan_fennu").damage : 6;
            return `梦三：主动使用消耗0费用。对一名敌方角色造成${amount}点伤害，` +
                "然后将一张此牌的复制品加入你的个人弃牌堆。" +
                "复制品保留原牌状态和词缀，仅存在于本场战斗。";
        },
    };
    translate.mengsan_fennu = "愤怒";
    translate.mengsan_fennu_info = "梦三：主动使用消耗0费用。对一名敌方角色造成6点伤害，" +
        "然后将一张此牌的复制品加入你的个人弃牌堆。复制品保留原牌状态和词缀，仅存在于本场战斗。" +
        "每回合使用次数不限。";
    // STS2【放血】：先等待原生生命流失及濒死救援，再增加当前战斗费用。
    card.mengsan_fangxue = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_fangxue.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_fangxue" }),
        enable(used, player, event) {
            return isBattleActive() && Boolean(battleEnergy?.canUse(player)) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        usable: Infinity, toself: true, selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            if (typeof battleEnergy?.capture !== "function" || typeof battleEnergy?.grant !== "function") {
                throw new Error("放血缺少战斗费用接口");
            }
            const rule = cardUpgradeRule("mengsan_fangxue");
            const amount = cardUpgradeLevel(event.card) ? rule.energy : rule.baseEnergy;
            const battle = battleEnergy.capture(player, amount);
            if (!battle) return;
            await player.loseHp(rule.loseHp);
            battleEnergy.grant(player, amount, battle);
        },
        ai: { order: 9, result: { player: player => player.hp > 3 ? 1 : -1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_fangxue");
            const amount = cardUpgradeLevel(used) ? rule.energy : rule.baseEnergy;
            return "梦三：主动使用消耗0费用。失去" + rule.loseHp + "点生命，然后获得" + amount + "点费用。";
        },
    };
    translate.mengsan_fangxue = "放血";
    translate.mengsan_fangxue_info = "梦三：主动使用消耗0费用。失去3点生命，然后获得2点费用。";
    // STS2【坚毅】：先获得格挡，再消耗一张自身当时的手牌。
    card.mengsan_jianyi = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_jianyi.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_jianyi" }),
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        usable: Infinity, toself: true, selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            if (typeof handExhaust?.capture !== "function" || typeof handExhaust?.exhaust !== "function") {
                throw new Error("坚毅缺少手牌消耗接口");
            }
            const battle = handExhaust.capture(player);
            if (!battle) return;
            const rule = cardUpgradeRule("mengsan_jianyi");
            const current = cardUpgradeLevel(event.card);
            await player.changeHujia(current ? rule.block : rule.baseBlock);
            await handExhaust.exhaust(player, event, battle, Boolean(current && rule.chooseExhaust));
        },
        ai: { order: 7, result: { player: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_jianyi");
            const current = cardUpgradeLevel(used);
            const block = current ? rule.block : rule.baseBlock;
            return "梦三：主动使用消耗1费用。获得" + block + "点格挡（护甲），然后" +
                (current && rule.chooseExhaust ? "选择消耗" : "随机消耗") +
                "一张你的手牌（退出本场战斗，不进入弃牌堆或洗牌）。没有手牌时不消耗牌。";
        },
    };
    translate.mengsan_jianyi = "坚毅";
    translate.mengsan_jianyi_info = "梦三：主动使用消耗1费用。获得7点格挡（护甲），然后随机消耗一张你的手牌（退出本场战斗，不进入弃牌堆或洗牌）。没有手牌时不消耗牌。";
    // STS2【破灭】：免费使用自己的堆顶原牌，再将这一原牌消耗。
    card.mengsan_pomie = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_pomie.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_pomie" }),
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        usable: Infinity, toself: true, selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            if (typeof playDrawTop !== "function") throw new Error("破灭缺少堆顶使用接口");
            await playDrawTop(player);
        },
        ai: { order: 6, result: { player: 1 } },
        cardPrompt(used) {
            return "梦三：主动使用消耗" + cardCost(used) +
                "费用。免费使用你抽牌堆顶部的牌，然后将该原牌消耗（退出本场战斗，不进入弃牌堆或洗牌）。抽牌堆为空时不生效。";
        },
    };
    translate.mengsan_pomie = "破灭";
    translate.mengsan_pomie_info = "梦三：主动使用消耗1费用。免费使用你抽牌堆顶部的牌，然后将该原牌消耗（退出本场战斗，不进入弃牌堆或洗牌）。抽牌堆为空时不生效。";
    // STS2【耸肩无视】：先获得格挡，再抽一张牌。
    card.mengsan_songjianwushi = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_songjianwushi.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_songjianwushi" }),
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        usable: Infinity, toself: true, selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            if (typeof blockDraw !== "function") throw new Error("耸肩无视缺少格挡抽牌接口");
            const rule = cardUpgradeRule("mengsan_songjianwushi");
            await blockDraw(player, cardUpgradeLevel(event.card) ? rule.block : rule.baseBlock, rule.draw);
        },
        ai: { order: 7, result: { player: 1 }, tag: { draw: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_songjianwushi");
            const block = cardUpgradeLevel(used) ? rule.block : rule.baseBlock;
            return "梦三：主动使用消耗1费用。获得" + block + "点格挡（护甲），然后抽" + rule.draw + "张牌。";
        },
    };
    translate.mengsan_songjianwushi = "耸肩无视";
    translate.mengsan_songjianwushi_info = "梦三：主动使用消耗1费用。获得8点格挡（护甲），然后抽1张牌。";
    // STS2【暴走】：先攻击，再仅增加本场这张实体牌的伤害。
    card.mengsan_baozou = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_baozou.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_baozou" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            if (typeof rampage?.apply !== "function") throw new Error("暴走缺少战斗累积接口");
            const rule = cardUpgradeRule("mengsan_baozou");
            const original = rampage.original(event) || event.card;
            await rampage.apply(player, event, rule.damage,
                cardUpgradeLevel(original) ? rule.increase : rule.baseIncrease);
        },
        ai: { order: 5, result: { target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_baozou");
            const source = rampage?.card(used) || used;
            const increase = cardUpgradeLevel(source) ? rule.increase : rule.baseIncrease;
            const damage = rampage?.damage(used) ?? rule.damage;
            return "梦三：主动使用消耗1费用。对一名敌方角色造成" + damage +
                "点伤害，然后将这张牌在本场战斗中的伤害增加" + increase + "点。";
        },
    };
    translate.mengsan_baozou = "暴走";
    translate.mengsan_baozou_info = card.mengsan_baozou.cardPrompt({ name: "mengsan_baozou" });
    // STS2【怨恨】：读取本回合实际生命损失，固定次数后逐次原生攻击。
    card.mengsan_yuanhen = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_yuanhen.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_yuanhen" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            if (typeof spite !== "function") throw new Error("怨恨缺少战斗攻击接口");
            const rule = cardUpgradeRule("mengsan_yuanhen");
            await spite(player, event, rule.damage,
                cardUpgradeLevel(event.card) ? rule.hits : rule.baseHits);
        },
        ai: { order: 4, result: { target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_yuanhen");
            const hits = cardUpgradeLevel(used) ? rule.hits : rule.baseHits;
            return "梦三：主动使用消耗0费用。对一名敌方角色造成5点伤害。" +
                "如果你在本回合失去过生命值，则改为连续攻击" + hits + "次，每次造成5点伤害，分别结算。";
        },
    };
    translate.mengsan_yuanhen = "怨恨";
    translate.mengsan_yuanhen_info = card.mengsan_yuanhen.cardPrompt({ name: "mengsan_yuanhen" });
    // STS2【旋风斩】：X 在原生用牌支付时固定，逐次重取存活敌人。
    card.mengsan_xuanfengzhan = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_xuanfengzhan.png",
        mengsanCost_shuying: "X", mengsanXCost_shuying: true,
        notarget: true, usable: Infinity,
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                game.filterPlayer(target => target !== player && target.isAlive() && player.isEnemyOf(target)).length > 0 &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used, event || _status.event));
        },
        async content(event, trigger, player) {
            if (typeof whirlwind !== "function") throw new Error("旋风斩缺少X费用攻击接口");
            const rule = cardUpgradeRule("mengsan_xuanfengzhan");
            await whirlwind(player, event, cardUpgradeLevel(event.card) ? rule.damage : rule.baseDamage);
        },
        ai: { order: 3, result: { player: 1 }, tag: { damage: 1, multitarget: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_xuanfengzhan");
            const amount = cardUpgradeLevel(used) ? rule.damage : rule.baseDamage;
            return "梦三：X费用。消耗当前剩余费用，对所有敌方角色各造成" + amount +
                "点伤害X次，每次分别结算。X为本次用于攻击的费用；缠结时先扣除1点附加费用。X为0时不造成伤害。";
        },
    };
    translate.mengsan_xuanfengzhan = "旋风斩";
    translate.mengsan_xuanfengzhan_info = card.mengsan_xuanfengzhan.cardPrompt({ name: "mengsan_xuanfengzhan" });
    // STS2【欺凌】：按本次目标当前易伤层数计算一次基础攻击，不消耗易伤。
    card.mengsan_qiling = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_qiling.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_qiling" }),
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                target === player || !player.isEnemyOf(target)) return;
            const layers = target.storage?.mengsanVulnerable_shuying ?? 0;
            if (!Number.isSafeInteger(layers) || layers < 0) throw new RangeError("欺凌易伤层数无效");
            const rule = cardUpgradeRule("mengsan_qiling");
            const perLayer = cardUpgradeLevel(event.card) ? rule.perVulnerable : rule.basePerVulnerable;
            const amount = rule.baseDamage + layers * perLayer;
            if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("欺凌伤害越界");
            const damage = target.damage(amount, player);
            damage.mengsanAttack_shuying = true;
            await damage;
        },
        ai: { order: 6, result: { target: -1.5 }, tag: { damage: 1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_qiling");
            const perLayer = cardUpgradeLevel(used) ? rule.perVulnerable : rule.basePerVulnerable;
            return "梦三：主动使用消耗0费用。对一名敌方角色造成4点伤害，" +
                "该目标每有1层易伤，额外增加" + perLayer + "点伤害。不消耗易伤层数。每回合使用次数不限。";
        },
    };
    translate.mengsan_qiling = "欺凌";
    translate.mengsan_qiling_info = "梦三：主动使用消耗0费用。对一名敌方角色造成4点伤害，" +
        "该目标每有1层易伤，额外增加2点伤害。不消耗易伤层数。每回合使用次数不限。";
    // STS2【血墙】：等待原生生命流失及濒死救援，再给同一战斗中的使用者格挡。
    card.mengsan_xueqiang = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_xueqiang.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_xueqiang" }),
        enable(used, player, event) {
            return isBattleActive() && Boolean(lifeLossBlock?.canUse(player)) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        usable: Infinity, toself: true, selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            if (typeof lifeLossBlock?.apply !== "function") throw new Error("血墙缺少生命流失格挡接口");
            const rule = cardUpgradeRule("mengsan_xueqiang");
            await lifeLossBlock.apply(player, rule.loseHp,
                cardUpgradeLevel(event.card) ? rule.block : rule.baseBlock);
        },
        ai: { order: 7, result: { player: player => player.hp > 2 ? 1 : -1 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_xueqiang");
            const block = cardUpgradeLevel(used) ? rule.block : rule.baseBlock;
            return "梦三：主动使用消耗2费用。失去2点生命，然后获得" + block + "点格挡（护甲）。";
        },
    };
    translate.mengsan_xueqiang = "血墙";
    translate.mengsan_xueqiang_info = "梦三：主动使用消耗2费用。失去2点生命，然后获得16点格挡（护甲）。";
    // STS2【战栗】：施加易伤走既有人工制品入口，消耗走原生用牌及个人牌堆。
    card.mengsan_zhanli = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_zhanli.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_zhanli" }),
        mengsanExhaust_shuying: true,
        usable: Infinity, selectTarget: 1,
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        filterTarget(used, player, target) {
            return target !== player && target.isAlive() && player.isEnemyOf(target);
        },
        async content(event, trigger, player) {
            const target = event.target;
            if (!isBattleActive() || !player.isAlive() || !target?.isAlive() ||
                target === player || !player.isEnemyOf(target)) return;
            const rule = cardUpgradeRule("mengsan_zhanli");
            const amount = cardUpgradeLevel(event.card) ? rule.vulnerable : rule.baseVulnerable;
            if (applyMengsanDebuff(target, "vulnerable", amount, player))
                game.log(target, `获得${amount}层易伤`);
        },
        ai: { order: 9, result: { target: -1.2 } },
        cardPrompt(used) {
            const rule = cardUpgradeRule("mengsan_zhanli");
            const amount = cardUpgradeLevel(used) ? rule.vulnerable : rule.baseVulnerable;
            return "梦三：主动使用消耗1费用。给予一名敌方角色" + amount + "层易伤。" +
                "易伤使受到的攻击伤害增加50%（向上取整），每个自身回合结束减少1层。" +
                "消耗（使用后退出本场战斗，不进入弃牌堆或洗牌）。";
        },
    };
    translate.mengsan_zhanli = "战栗";
    translate.mengsan_zhanli_info = "梦三：主动使用消耗1费用。给予一名敌方角色3层易伤。" +
        "易伤使受到的攻击伤害增加50%（向上取整），每个自身回合结束减少1层。" +
        "消耗（使用后退出本场战斗，不进入弃牌堆或洗牌）。";
    // STS2【武装】：格挡结算后只强化当前战斗的真实手牌。
    card.mengsan_wuzhuang = {
        type: "basic", fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_wuzhuang.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_wuzhuang" }),
        enable(used, player, event) {
            return isBattleActive() && Boolean(player?.isAlive?.()) &&
                (!isActiveCardUse(event || _status.event, player) || canPayCard(player, used));
        },
        usable: Infinity, toself: true, selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            if (typeof blockUpgrade !== "function") throw new Error("武装缺少格挡强化接口");
            await blockUpgrade(player, event, cardUpgradeRule("mengsan_wuzhuang").block,
                Boolean(cardUpgradeLevel(event.card)));
        },
        ai: { order: 8, result: { player: 1 } },
        cardPrompt(used) {
            const selection = cardUpgradeLevel(used) ? "所有牌" : "一张牌";
            return "梦三：主动使用消耗1费用。获得5点格挡（护甲），然后强化你手牌中的" + selection + "（仅本场战斗）。";
        },
    };
    translate.mengsan_wuzhuang = "武装";
    translate.mengsan_wuzhuang_info = "梦三：主动使用消耗1费用。获得5点格挡（护甲），然后强化你手牌中的一张牌（仅本场战斗）。";
    // 【防御】沿用梦三护甲事件，保留脆弱与伤害抵扣等既有规则。
    card.mengsan_fangyu = {
        type: "basic",
        fullimage: true,
        image: "ext:术樱包/mengsan/assets/cards/mengsan_fangyu.png",
        mengsanCost_shuying: cardCost({ name: "mengsan_fangyu" }),
        enable(used, player, event) {
            return !isActiveCardUse(event || _status.event, player) ||
                canPayCard(player, used);
        },
        usable: Infinity,
        toself: true,
        selectTarget: -1,
        filterTarget(used, player, target) { return target === player; },
        async content(event, trigger, player) {
            await player.changeHujia(cardUpgradeLevel(event.card) ? 8 : 5);
        },
        ai: { order: 7, result: { target: 1 } },
        cardPrompt(used) { return `梦三：主动使用消耗1费用。获得${cardUpgradeLevel(used) ? 8 : 5}点格挡（护甲）。`; },
    };
    translate.mengsan_fangyu = "防御";
    translate.mengsan_fangyu_info =
        "梦三：主动使用消耗1费用。出牌阶段，对自己使用，获得5点格挡（护甲）。" +
        "每回合使用次数不限。";
    // 【桃】的回复量也由梦三牌本体提供；救援仍不消耗费用。
    return { cards:card, translate, names:Object.keys(card) };
}
