// 只呈现已经选定的预测技能；不从手牌或原生技能猜测意图。
export function attackIconForDamage(damage) {
    if (!Number.isInteger(damage) || damage < 0) throw new RangeError("预测伤害必须是非负整数");
    if (damage < 5) return 1;
    if (damage < 10) return 2;
    if (damage < 20) return 3;
    if (damage < 40) return 4;
    return 5;
}

export function mountEnemyIntent(player, session, assetBase, document) {
    const badge = document.createElement("div");
    badge.className = "mengsan-intent-shuying";
    badge.hidden = true;
    badge.setAttribute("aria-live", "polite");
    const name = document.createElement("span");
    name.className = "mengsan-intent-name-shuying";
    const damageLine = document.createElement("span");
    damageLine.className = "mengsan-intent-damage-shuying";
    const amount = document.createElement("span");
    amount.className = "mengsan-intent-amount-shuying";
    const icon = document.createElement("img");
    icon.className = "mengsan-intent-icon-shuying";
    icon.alt = "预计伤害";
    icon.decoding = "async";
    damageLine.append(amount, icon);
    const debuffLine = document.createElement("span");
    debuffLine.className = "mengsan-intent-debuff-shuying";
    const debuffIcon = document.createElement("img");
    debuffIcon.className = "mengsan-intent-icon-shuying";
    debuffIcon.alt = "预计施加负面状态";
    debuffIcon.decoding = "async";
    debuffIcon.src = `${assetBase}/assets/intent/Intent_debuff.webp`;
    const debuffAmount = document.createElement("span");
    debuffLine.append(debuffIcon, debuffAmount);
    badge.append(name, damageLine, debuffLine);
    player.appendChild(badge);
    session.ownResource(badge, () => badge.remove());
    return intent => {
        if (!intent) {
            badge.hidden = true;
            badge.removeAttribute("title");
            return;
        }
        if (typeof intent.name !== "string" || !intent.name.trim()) throw new TypeError("预测技能必须有名称");
        name.textContent = intent.name;
        const hasDamage = intent.damage != null;
        damageLine.hidden = !hasDamage;
        const hasDebuff = typeof intent.debuff === "string" && Number.isInteger(intent.stacks) && intent.stacks > 0;
        debuffLine.hidden = !hasDebuff;
        if (hasDebuff) debuffAmount.textContent = `${intent.debuff}×${intent.stacks}`;
        if (hasDamage) {
            const tier = attackIconForDamage(intent.damage);
            amount.textContent = String(intent.damage);
            const src = `${assetBase}/assets/intent/Intent_attack_${tier}.webp`;
            if (icon.getAttribute("src") !== src) icon.src = src;
            badge.title = `${intent.name}：预计造成 ${intent.damage} 点伤害（非最终伤害）${hasDebuff ? `，施加${intent.stacks}层${intent.debuff}` : ""}`;
        } else {
            badge.title = hasDebuff ? `${intent.name}：施加${intent.stacks}层${intent.debuff}` : intent.name;
        }
        badge.hidden = false;
    };
}
