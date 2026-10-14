export const skillCardStorage = "shuYing_tianshu_skillCardSkills";

export function getSkillCardOrigin(event, lib, get) {
    if (!["useCard", "respond"].includes(event?.name) || !event.card) {
        return null;
    }
    const virtual = get.is.virtualCard(event.card)
        && (!event.card.isCard || !event.cards?.length);
    if (!virtual && !get.is.convertedCard(event.card)) return null;
    if (event.skill && lib.skill[event.skill]) {
        return { skill: get.sourceSkillFor(event.skill), player: event.player };
    }
    let current = event.getParent?.(1, true);
    const visited = new Set();
    while (current && !visited.has(current)) {
        visited.add(current);
        if (["useCard", "respond"].includes(current.name)
            || ["card", "precard", "postcard"].includes(current.type)
            || current.name?.endsWith("_cost")) return null;
        const skill = lib.skill[current.name] ? current.name : current.skill;
        if (skill && lib.skill[skill]) {
            if (current.player != event.player) return null;
            return { skill: get.sourceSkillFor(skill), player: current.player };
        }
        current = current.getParent?.(1, true);
    }
    return null;
}

export function getSkillCardCount(player, skills, lib) {
    const recorded = player?.storage?.[skillCardStorage];
    if (!Array.isArray(recorded)) return 0;
    return new Set(skills.filter(skill => recorded.includes(skill))
        .map(skill => lib.translate[skill] || skill)).size;
}

export function getSkillCardTargetOptions(event, lib, game, get) {
    const options = { add: [], remove: [] };
    const info = get.info(event.card);
    if (!info || !event.targets?.length || info.notarget || info.toself
        || info.complexTarget || info.singleCard
        || info.filterAddedTarget) return options;
    if (event.targets.length > 1) {
        options.remove = event.targets.filter(target => target.isIn());
    }
    if (info.allowMultiple !== false) {
        options.add = game.players.filter(target => target.isIn()
            && !event.targets.includes(target)
            && lib.filter.targetEnabled2(event.card, event.player, target)
            && lib.filter.targetInRange(event.card, event.player, target));
    }
    return options;
}

export function applySkillCardEffects(event, level, players) {
    if (level >= 2) {
        if (!Array.isArray(event.directHit)) event.directHit = [];
        for (const player of players) {
            if (!event.directHit.includes(player)) event.directHit.push(player);
        }
        event.nowuxie = true;
    }
    if (level >= 3) event.effectCount = (Number(event.effectCount) || 1) + 1;
}
