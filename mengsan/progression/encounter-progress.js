export const WEAK_BATTLE_COUNT = 3;

// 与结算事务一起提交；事件、精英、Boss、固定专属关卡、失败和重试均不增加此计数。
export function normalBattleCount(run) {
    const saved = run.statistics?.normalBattles;
    if (saved != null) {
        if (!Number.isSafeInteger(saved) || saved < 0) throw new Error("普通战斗计数无效");
        return saved;
    }
    // 旧存档按第一章当前地图已完成的普通节点恢复；第二章起不再使用本次弱池阶段。
    const completed = (run.map?.nodes || []).filter(node => node.completed && node.type === "battle" && !node.contentId).length;
    return run.actIndex > 0 ? Math.max(WEAK_BATTLE_COUNT, completed) : completed;
}

// 已生成的地图也受保护；转换后的节点按普通战斗结算，未来楼层不提前转换。
export function protectEarlyBattleNodes(run, nodes) {
    if (run.actIndex !== 0 || normalBattleCount(run) >= WEAK_BATTLE_COUNT) return;
    for (const node of nodes) {
        if (node && !node.completed && !node.contentId && node.type === "elite") {
            node.type = "battle";
        }
    }
}

export function recordNormalBattleVictory(run, node, encounter) {
    if (run.actIndex !== 0 || node.type !== "battle" || node.contentId || encounter.requiredCharacter ||
        encounter.boss || encounter.tier !== "normal") return;
    const next = normalBattleCount(run) + 1;
    if (!Number.isSafeInteger(next)) throw new RangeError("普通战斗计数越界");
    run.statistics.normalBattles = next;
}
