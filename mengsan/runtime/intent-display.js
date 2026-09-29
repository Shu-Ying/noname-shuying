// 只呈现已经选定的预测技能；不从手牌或原生技能猜测意图。
import { attackHitCount, previewAttackDamage } from "./intent-damage.js";
import { isDeathBlowIntent } from "./death-blow.js";
import { isStunIntent } from "./stun-intent.js";

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
    icon.alt = "Attack";
    icon.decoding = "async";
    damageLine.append(icon, amount);
    const debuffLine = document.createElement("span");
    debuffLine.className = "mengsan-intent-debuff-shuying";
    const debuffIcon = document.createElement("img");
    debuffIcon.className = "mengsan-intent-icon-shuying";
    debuffIcon.alt = "Debuff";
    debuffIcon.decoding = "async";
    debuffIcon.src = `${assetBase}/assets/intent/Intent_debuff.png`;
    const debuffAmount = document.createElement("span");
    debuffLine.append(debuffIcon, debuffAmount);
    const blockLine = document.createElement("span");
    blockLine.className = "mengsan-intent-block-shuying";
    const blockIcon = document.createElement("img");
    blockIcon.className = "mengsan-intent-icon-shuying";
    blockIcon.alt = "Block";
    blockIcon.decoding = "async";
    blockIcon.src = `${assetBase}/assets/intent/Intent_defend.png`;
    const blockAmount = document.createElement("span");
    blockLine.append(blockIcon, blockAmount);
    const buffLine = document.createElement("span");
    buffLine.className = "mengsan-intent-buff-shuying";
    const buffIcon = document.createElement("img");
    buffIcon.className = "mengsan-intent-icon-shuying";
    buffIcon.alt = "Buff";
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
            icon.alt = "Stunned";
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
        const hasDebuff = typeof intent.debuff === "string" &&
            Number.isInteger(intent.stacks) && intent.stacks > 0;
        debuffLine.hidden = !hasDebuff;
        if (hasDebuff) {
            const label = intent.debuff === "脆弱" ? "Frail" :
                intent.debuff === "易伤" ? "Vulnerable" : "Debuff";
            const debuffText = `${label} ×${intent.stacks}`;
            if (debuffAmount.textContent !== debuffText) {
                debuffAmount.textContent = debuffText;
            }
        }
        const hasBlock = Number.isInteger(intent.block) && intent.block > 0;
        const hasStrength = Number.isInteger(intent.strength) && intent.strength > 0;
        blockLine.hidden = !hasBlock;
        buffLine.hidden = !hasStrength;
        if (hasBlock) blockAmount.textContent = String(intent.block);
        if (hasStrength) buffAmount.textContent = `力量 ×${intent.strength}`;
        const effects = [];
        if (hasDamage) {
            const hits = attackHitCount(intent);
            if (deathBlow && hits !== 1) {
                throw new RangeError("濒死一击只能造成一次伤害");
            }
            const damage = previewAttackDamage(intent, player, getTarget());
            const tier = deathBlow ? null :
                attackIconForDamage(damage * hits);
            const damageText = hits > 1 ? `${damage}×${hits}` :
                String(damage);
            if (amount.textContent !== damageText) {
                amount.textContent = damageText;
            }
            const src = deathBlow ?
                `${assetBase}/assets/intent/Intent_death_blow.png` :
                `${assetBase}/assets/intent/Intent_attack_${tier}.png`;
            if (icon.getAttribute("src") !== src) icon.src = src;
            icon.alt = deathBlow ? "Death Blow" : "Attack";
            effects.push(`${deathBlow ? "Death Blow" : "Attack"}: ${damage} damage${hits > 1 ? ` × ${hits} hits` : ""}`);
        }
        if (hasDebuff) effects.push(debuffAmount.textContent);
        if (hasBlock) effects.push(`Block ${intent.block}`);
        if (hasStrength) effects.push(`Strength +${intent.strength}`);
        const label = effects.join(", ") || intent.name || "Intent";
        if (badge.getAttribute("aria-label") !== label) badge.setAttribute("aria-label", label);
        badge.hidden = false;
    };
    timer = setInterval(refresh, 100);
    return intent => {
        currentIntent = intent;
        refresh();
    };
}
