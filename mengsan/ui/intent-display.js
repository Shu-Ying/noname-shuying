// 只呈现已经选定的预测技能；不从手牌或原生技能猜测意图。
import { attackHitCount, previewAttackDamage } from "../battle/intent-damage.js";
import { isDeathBlowIntent } from "../battle/death-blow.js";
import { isStunIntent } from "../battle/stun-intent.js";

export function attackIconForDamage(damage) {
    if (!Number.isInteger(damage) || damage < 0) {
        throw new RangeError("预测伤害必须是非负整数");
    }
    if (damage < 5) return 1;
    if (damage < 10) return 2;
    if (damage < 20) return 3;
    if (damage < 40) return 4;
    return 5;
}

export function mountEnemyIntent(player, session, assetBase, document,
    getTarget = () => null) {
    const badge = document.createElement("div");
    badge.className = "mengsan-intent-shuying";
    badge.hidden = true;
    badge.setAttribute("aria-live", "polite");
    badge.setAttribute("aria-atomic", "true");
    const damageLine = document.createElement("span");
    damageLine.className = "mengsan-intent-damage-shuying";
    const amount = document.createElement("span");
    amount.className = "mengsan-intent-amount-shuying";
    const icon = document.createElement("img");
    icon.className = "mengsan-intent-icon-shuying";
    icon.alt = "";
    icon.decoding = "async";
    damageLine.append(icon, amount);
    const debuffLine = document.createElement("span");
    debuffLine.className = "mengsan-intent-debuff-shuying";
    const debuffIcon = document.createElement("img");
    debuffIcon.className = "mengsan-intent-icon-shuying";
    debuffIcon.alt = "";
    debuffIcon.decoding = "async";
    debuffIcon.src = `${assetBase}/assets/intent/Intent_debuff.png`;
    const debuffAmount = document.createElement("span");
    debuffLine.append(debuffIcon, debuffAmount);
    const blockLine = document.createElement("span");
    blockLine.className = "mengsan-intent-block-shuying";
    const blockIcon = document.createElement("img");
    blockIcon.className = "mengsan-intent-icon-shuying";
    blockIcon.alt = "";
    blockIcon.decoding = "async";
    blockIcon.src = `${assetBase}/assets/intent/Intent_defend.png`;
    const blockAmount = document.createElement("span");
    blockLine.append(blockIcon, blockAmount);
    const buffLine = document.createElement("span");
    buffLine.className = "mengsan-intent-buff-shuying";
    const buffIcon = document.createElement("img");
    buffIcon.className = "mengsan-intent-icon-shuying";
    buffIcon.alt = "";
    buffIcon.decoding = "async";
    buffIcon.src = `${assetBase}/assets/intent/Intent_buff.png`;
    const buffAmount = document.createElement("span");
    buffLine.append(buffIcon, buffAmount);
    badge.append(damageLine, debuffLine, blockLine, buffLine);
    player.appendChild(badge);
    let currentIntent = null;
    let timer;
    session.ownResource(badge, () => {
        clearInterval(timer);
        badge.remove();
    });
    const refresh = () => {
        const intent = currentIntent;
        if (!intent) {
            badge.hidden = true;
            return;
        }
        if (isStunIntent(intent)) {
            damageLine.hidden = false;
            debuffLine.hidden = true;
            blockLine.hidden = true;
            buffLine.hidden = true;
            amount.textContent = "";
            const src = `${assetBase}/assets/intent/Intent_stun.png`;
            if (icon.getAttribute("src") !== src) icon.src = src;
            if (badge.getAttribute("aria-label") !== "Stunned") {
                badge.setAttribute("aria-label", "Stunned");
            }
            badge.hidden = false;
            return;
        }
        const hasDamage = intent.damage != null;
        const deathBlow = isDeathBlowIntent(intent);
        if (deathBlow && !hasDamage) {
            throw new TypeError("濒死一击必须有伤害数值");
        }
        damageLine.hidden = !hasDamage;
        const hasSummon = typeof intent.summon === "string";
        const hasSlimed = Number.isInteger(intent.slimed) && intent.slimed > 0;
        const hasInfection = Number.isInteger(intent.infection) && intent.infection > 0;
        const hasDazed = Number.isInteger(intent.dazed) && intent.dazed > 0;
        const hasDebuff = typeof intent.debuff === "string" &&
            Number.isInteger(intent.stacks) && intent.stacks > 0;
        debuffLine.hidden = !(hasDebuff || hasDazed || hasSlimed || hasInfection);
        const debuffSrc = `${assetBase}/assets/intent/${hasDazed || hasSlimed || hasInfection ? "Intent_status_card.png" : "Intent_debuff.png"}`;
        if (debuffIcon.getAttribute("src") !== debuffSrc) debuffIcon.src = debuffSrc;
        if (hasInfection) debuffAmount.textContent = `×${intent.infection}`;
        if (hasSlimed) debuffAmount.textContent = `×${intent.slimed}`;
        if (hasDazed) debuffAmount.textContent = `×${intent.dazed}`;
        if (hasDebuff) {
            const debuffText = `×${intent.stacks}`;
            if (debuffAmount.textContent !== debuffText) {
                debuffAmount.textContent = debuffText;
            }
        }
        const hasBlock = Number.isInteger(intent.block) && intent.block > 0;
        const hasStrength = Number.isInteger(intent.strength) && intent.strength > 0;
        const buffSrc = `${assetBase}/assets/intent/${hasSummon ? "Intent_summon.png" : "Intent_buff.png"}`;
        if (buffIcon.getAttribute("src") !== buffSrc) buffIcon.src = buffSrc;
        blockLine.hidden = !hasBlock;
        buffLine.hidden = !(hasStrength || hasSummon);
        if (hasSummon) buffAmount.textContent = "×1";
        if (hasBlock) blockAmount.textContent = String(intent.block);
        if (hasStrength) {
            buffAmount.textContent = `+${intent.strength}`;
        }
        const effects = [];
        if (hasDamage) {
            const hits = attackHitCount(intent);
            if (deathBlow && hits !== 1) {
                throw new RangeError("濒死一击只能造成一次伤害");
            }
            const target = getTarget();
            const targets = Array.isArray(target) ? target : [target];
            const damages = (targets.length ? targets : [null]).map(
                current => previewAttackDamage(intent, player, current));
            const damage = Math.max(...damages);
            const minimum = Math.min(...damages);
            const range = minimum === damage ? String(damage) :
                `${minimum}～${damage}`;
            const tier = deathBlow ? null :
                attackIconForDamage(damage * hits);
            const damageText = hits > 1 ? `${range}×${hits}` : range;
            if (amount.textContent !== damageText) {
                amount.textContent = damageText;
            }
            const src = deathBlow ?
                `${assetBase}/assets/intent/Intent_death_blow.png` :
                `${assetBase}/assets/intent/Intent_attack_${tier}.png`;
            if (icon.getAttribute("src") !== src) icon.src = src;
            effects.push(`${deathBlow ? "Death Blow" : "Attack"}: ${range} damage${hits > 1 ? ` × ${hits} hits` : ""}`);
        }
        if (hasDebuff) {
            const label = intent.debuff === "脆弱" ? "Frail" :
                intent.debuff === "易伤" ? "Vulnerable" : intent.debuff === "缩小" ? "Shrink" : intent.debuff === "缠结" ? "Tangled" : "Debuff";
            effects.push(`${label} ×${intent.stacks}`);
        }
        if (hasSummon) effects.push("Summon: 利齿之眼 ×1");
        if (hasDazed) effects.push(`Dazed ×${intent.dazed}`);
        if (hasInfection) effects.push(`Infection ×${intent.infection}`);
        if (hasSlimed) effects.push(`Slimed ×${intent.slimed}`);
        if (hasBlock) effects.push(`Block ${intent.block}`);
        if (hasStrength) effects.push(`Strength +${intent.strength}`);
        if (!effects.length) {
            damageLine.hidden = false;
            amount.textContent = "";
            const src = `${assetBase}/assets/intent/${intent.sleep ? "Intent_sleep.png" : "Intent_unknown.png"}`;
            if (icon.getAttribute("src") !== src) icon.src = src;
            effects.push(intent.sleep ? "Sleep" : "Unknown");
        }
        const label = effects.join(", ");
        badge.title = hasInfection ? `向敌对角色的个人弃牌堆加入${intent.infection}张感染；不能被打出，回合结束在手牌中每张造成3点非攻击伤害。` : intent.sleep ? "沉睡：本回合不行动，不消耗费用。" : intent.debuff === "缠结" ? "紧绕藤蔓：攻击后施加1回合缠结，攻击牌费用增加1；自身回合结束减少1回合。" : intent.shrink ? "缩小：攻击伤害减少30%，不重复叠加；来源死亡解除。" : hasSlimed ? `黏液：向敌对角色的个人弃牌堆加入${intent.slimed}张黏液；耗1费用、抽1张牌、消耗。` : hasSummon ? "虚幻孢子：召唤1只6生命的利齿之眼。" :
            hasDazed ? "牵制：向敌对角色的个人弃牌堆加入3张晕眩；晕眩不能被打出，具有虚无。" :
            "攻击与负面效果作用于所有存活敌对角色；伤害按各目标状态计算，护甲另行抵扣。";
        if (badge.getAttribute("aria-label") !== label) badge.setAttribute("aria-label", label);
        badge.hidden = false;
    };
    timer = setInterval(refresh, 100);
    return intent => {
        currentIntent = intent;
        refresh();
    };
}
