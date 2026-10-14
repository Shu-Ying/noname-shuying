export const directDamageStorage = "shuYing_tianshu_directDamageSkills";

export function getDirectDamageOrigin(event, lib, get) {
    if (!event || event.num <= 0 || event.unreal) return null;
    if (typeof event.notLink == "function" && !event.notLink()) return null;
    let current = event.getParent?.(1, true);
    const visited = new Set();
    while (current && !visited.has(current)) {
        visited.add(current);
        if (["card", "precard", "postcard"].includes(current.type)) {
            return null;
        }
        if (["useCard", "respond", "damage", "_lianhuan", "_lianhuan2"]
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

export function getDirectDamageSkillCount(player, skills, lib) {
    const recorded = player?.storage?.[directDamageStorage];
    if (!Array.isArray(recorded)) return 0;
    return new Set(skills.filter(skill => recorded.includes(skill))
        .map(skill => lib.translate[skill] || skill)).size;
}
