// 阵营是梦三敌我关系的唯一来源；side/identity 仅供核心及界面兼容。
export const battleCamp = player => {
    const camp = player?.storage?.mengsanCamp_shuying;
    return camp === "ally" || camp === "enemy" ? camp : null;
};

export const campFriend = (from, to) => Boolean(from && to &&
    (from === to || (battleCamp(from) !== null && battleCamp(from) === battleCamp(to))));

export const campEnemy = (from, to) => Boolean(from && to && from !== to &&
    battleCamp(from) !== null && battleCamp(to) !== null &&
    battleCamp(from) !== battleCamp(to));

// get.attitude 会继续处理混乱、技能态度修正；get.effect 等沿用核心收益计算。
export const campAttitude = (from, to) =>
    campFriend(from, to) ? 8 : campEnemy(from, to) ? -8 : 0;

export function setBattleCamp(player, camp) {
    if (camp !== "ally" && camp !== "enemy") throw new Error("梦三战斗阵营无效：" + camp);
    player.storage.mengsanCamp_shuying = camp;
    player.side = camp === "enemy";
    player.identity = `mengsan_${camp}_shuying`;
    player.isZhu = false;
    player.setIdentity(player.identity);
    player.identityShown = true;
    player.ai.shown = 1;
    player.classList.add("mengsan-hide-identity-shuying");
}

export function createCampPlayerMethods(game) {
    return {
        isFriendOf(player) { return campFriend(this, player); },
        isEnemyOf(player) { return campEnemy(this, player); },
        getEnemies(filter, includeDie) {
            return game[includeDie ? "filterPlayer2" : "filterPlayer"](player =>
                campEnemy(this, player) && (typeof filter !== "function" || filter(player)));
        },
        getFriends(filter, includeDie) {
            const includeSelf = filter === true;
            return game[includeDie ? "filterPlayer2" : "filterPlayer"](player =>
                (player !== this || includeSelf) && campFriend(this, player) &&
                (typeof filter !== "function" || filter(player)));
        },
        // 阵营始终公开，不根据行动收益推断隐藏身份或积累暴露值。
        logAi() { this.ai.shown = 1; },
        addExpose() { return this; },
        showIdentity() {
            const camp = battleCamp(this);
            if (camp) setBattleCamp(this, camp);
        },
        isZhu2() { return false; },
        hasZhuSkill() { return false; },
    };
}
