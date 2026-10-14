export const skillRecoverStorage = "shuYing_tianshu_skillRecoverSkills";

export function getSkillRecoverOrigin(event, lib, get) {
    if (!event || event.num <= 0 || event.shuYing_tianshu_taoyuanSecondary) {
        return null;
    }
    let current = event.getParent?.(1, true);
    const visited = new Set();
    while (current && !visited.has(current)) {
        visited.add(current);
        if (["card", "precard", "postcard"].includes(current.type)) {
            return null;
        }
        if (["useCard", "respond", "recover", "damage"]
            .includes(current.name) || current.name?.endsWith("_cost")) {
            return null;
        }
        const skill = lib.skill[current.name] ? current.name : current.skill;
        if (skill && lib.skill[skill]) {
            return { skill: get.sourceSkillFor(skill), player: current.player };
        }
        current = current.getParent?.(1, true);
    }
    return null;
}

export function getSkillRecoverCount(player, skills, lib) {
    const recorded = player?.storage?.[skillRecoverStorage];
    if (!Array.isArray(recorded)) return 0;
    return new Set(skills.filter(skill => recorded.includes(skill))
        .map(skill => lib.translate[skill] || skill)).size;
}

export function wrapSkillRecoverEvent(event, record, onSettle, nativeContent,
    getLevel) {
    const originalFilter = event.filterStop;
    const originalContent = nativeContent
        || (typeof event.content.original == "function"
            ? event.content.original : event.content);
    event.shuYing_tianshu_skillRecover = record;
    event.filterStop = function () {
        if (!record.boosted && getLevel) record.level = getLevel();
        if (record.level >= 3 && this.num > 0 && this.player.isHealthy()
            && !this.shuYing_tianshu_taoyuanSecondary) return false;
        return originalFilter?.call(this) || false;
    };
    event.setContent(async current => {
        if (record.settled) return;
        if (current.shuYing_tianshu_taoyuanSecondary) {
            await originalContent(current, current._trigger, current.player);
            return;
        }
        const missing = Math.max(0, current.player.maxHp - current.player.hp);
        const overflow = record.level >= 3
            ? Math.max(0, current.num - missing) : 0;
        if (record.level >= 3) current.num = Math.min(current.num, missing);
        await originalContent(current, current._trigger, current.player);
        if (overflow > 0) await current.player.gainMaxHp(overflow);
        record.settled = true;
        if (current.num > 0 || overflow > 0) {
            await onSettle(current, record, overflow);
        }
    });
}
