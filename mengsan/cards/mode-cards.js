// 梦三的模式牌定义：复制标准/军争的实体牌定义，不改动原牌包。
// 保留原牌名，以兼容原有牌的响应、装备技能及转化牌引用。
import standard from "../../../../card/standard.js";
import extra from "../../../../card/extra.js";
import { _status, game } from "../../../../noname.js";
import { cardCost, canPayCard, isActiveCardUse, SHA_DAMAGE,
    TRICK_DAMAGE } from "../battle/combat-rules.js";
import { cardUpgradeLevel, cardUpgradeRule } from "./upgrades.js";

const packs = [standard, extra];
const names = [...new Set(packs.flatMap(pack => pack.list.map(entry => entry[2])))];
const sourceCard = name => standard.card[name] || extra.card[name];
const sourceText = name => extra.translate[`${name}_info`] || standard.translate[`${name}_info`];

export function createMengsanCards() {
    const card = {};
    const translate = {};
    for (const name of names) {
        const source = sourceCard(name);
        if (!source) throw new Error(`梦三牌定义缺失：${name}`);
        const copy = { ...source, mengsanCost_shuying: cardCost({ name }) };
        // 卡牌本身校验费用；响应和濒死救援不属于主动出牌。
        if (source.enable || source.type === "equip" || source.type === "delay") {
            copy.enable = function (used, player, event) {
                if (isActiveCardUse(event || _status.event, player) && !canPayCard(player, used)) return false;
                return typeof source.enable === "function" ? source.enable.call(this, used, player, event) : source.enable ?? true;
            };
        }
        const prompt = source.cardPrompt;
        const costLabel = name === "shan" || name === "wuxie"
            ? "响应不消耗费用" : `主动使用消耗${copy.mengsanCost_shuying}费用`;
        copy.cardPrompt = function (used) {
            const detail = typeof prompt === "function" ? prompt.call(this, used) : prompt;
            return `梦三：${costLabel}。${detail || sourceText(name) || ""}`;
        };
        const nativeText = sourceText(name);
        if (nativeText) translate[`${name}_info`] = `梦三：${costLabel}。${nativeText}`;
        card[name] = copy;
    }
    // 【杀】的基础伤害由牌内容决定，而不是事后追加伤害的角色技能。
    const nativeSha = sourceCard("sha");
    card.sha.baseDamage = SHA_DAMAGE;
    card.sha.content = async function (event, trigger, player) {
        if (typeof event.baseDamage !== "number") event.baseDamage = SHA_DAMAGE;
        if (cardUpgradeLevel(event.card)) {
            event.baseDamage += cardUpgradeRule("sha").damage - SHA_DAMAGE;
        }
        return nativeSha.content.call(this, event, trigger, player);
    };
    card.sha.usable = Infinity;
    card.sha.cardPrompt = used => {
        const damage = cardUpgradeLevel(used)
            ? cardUpgradeRule("sha").damage : SHA_DAMAGE;
        return `梦三：主动使用消耗1费用；目标须使用【闪】，` +
            `否则受到${damage}点伤害。每回合使用次数不限。` +
            (cardUpgradeLevel(used) ? "已强化（上限1次）。" :
                "可强化1次：伤害变为9点。");
    };
    translate.sha_info = `梦三：主动使用消耗1费用。出牌阶段，对攻击范围内的一名角色使用；其须使用【闪】，否则受到${SHA_DAMAGE}点伤害。每回合使用次数不限。`;
    card.mengsan_zhongsha = {
        type: "basic",
        fullskin: true,
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
            target.storage.mengsanVulnerable_shuying =
                (target.storage.mengsanVulnerable_shuying || 0) +
                effect.vulnerable;
            target.addSkill("mengsan_vulnerable_shuying");
            target.markSkill("mengsan_vulnerable_shuying");
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
                "每回合使用次数不限。" + (cardUpgradeLevel(used)
                    ? "已强化（上限1次）。" :
                    "可强化1次：10点伤害、3层易伤。");
        },
    };
    translate.mengsan_zhongsha = "重杀";
    translate.mengsan_zhongsha_info =
        "梦三：主动使用消耗2费用。出牌阶段，对攻击范围内的" +
        "一名其他角色造成8点伤害，然后给予其2层易伤。" +
        "易伤使受到的攻击伤害增加50%（向上取整），" +
        "每个自身回合结束减少1层。每回合使用次数不限。";
    // 【桃】的回复量也由梦三牌本体提供；救援仍不消耗费用。
    card.tao.content = async function (event) { await event.target.recover(8); };
    translate.tao_info = "梦三：主动使用消耗1费用，回复8点生命；濒死救援不消耗费用，同样回复8点生命。";
    card.taoyuan.content = async function (event) { await event.target.recover(8); };
    translate.taoyuan_info = "梦三：主动使用消耗2费用。所有角色各回复8点生命。";
    card.taoyuan.cardPrompt = () => translate.taoyuan_info;
    for (const name of ["nanman", "wanjian", "juedou"]) {
        const nativeContent = sourceCard(name).content;
        card[name].baseDamage = TRICK_DAMAGE;
        card[name].content = async function (event, trigger, player) {
            if (typeof event.baseDamage !== "number") event.baseDamage = TRICK_DAMAGE;
            return nativeContent.call(this, event, trigger, player);
        };
        const detail = {
            nanman: "所有其他角色须打出【杀】，否则受到4点伤害。",
            wanjian: "所有其他角色须打出【闪】，否则受到4点伤害。",
            juedou: "目标与你轮流打出【杀】；未能打出的一方受到4点伤害。",
        }[name];
        translate[`${name}_info`] = `梦三：主动使用消耗${cardCost({ name })}费用。${detail}`;
        card[name].cardPrompt = () => translate[`${name}_info`];
    }
    // 火攻通过当前牌事件的 baseDamage 传入 damage("fire")。
    card.huogong.baseDamage = TRICK_DAMAGE;
    translate.huogong_info = "梦三：主动使用消耗1费用。令一名有手牌的角色展示一张手牌；若你弃置同花色牌，对其造成4点火焰伤害。";
    card.huogong.cardPrompt = () => translate.huogong_info;
    // 闪电属于延时锦囊，其命中伤害在 effect 中显式写死为3，需要独立覆写。
    card.shandian.effect = async function (event, trigger, player, result) {
        if (result.bool === false) await player.damage(12, "thunder", "nosource");
        else player.addJudgeNext(event.card);
    };
    translate.shandian_info = "梦三：主动使用消耗1费用。若判定为黑桃2～9，目标受到12点雷电伤害；否则移至下家的判定区。";
    card.shandian.cardPrompt = () => translate.shandian_info;
    return { card, translate, names: [...names, "mengsan_zhongsha"] };
}
