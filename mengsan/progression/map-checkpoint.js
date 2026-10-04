// 输入为存档副本；只保留征程成长和地图进度，不恢复战斗或未确认的结算。
export function stripBattleProgress(run) {
    if (!run || typeof run !== "object") return run;
    delete run.battleFlow;
    delete run.bondBattle;
    delete run.sharedBattleCardEffects;
    return run;
}
