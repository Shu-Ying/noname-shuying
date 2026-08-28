const dynamicTranslates = {
    qixi_shuying(player, skill) {
        if (player?.storage.fenwei_shuying_upgraded) {
            return "你可以将一张黑色牌当【过河拆桥】使用。<br>你使用【过河拆桥】结束后，若其弃置过一张牌，你记录该牌的花色。<br>每回合各限一次，若此次花色与上次花色不同，你可以消耗1点蓄力点并选择一项：①摸一张牌。②若该牌仍在弃牌堆中，获得之。";
        }

        return "你可以将一张黑色牌当【过河拆桥】使用。<br>你使用【过河拆桥】结束后，若其弃置过一张牌，你记录该牌的花色。<br>每回合限一次，若此次花色与上次花色不同，你可以消耗1点蓄力点并选择一项：①摸一张牌。②若该牌仍在弃牌堆中，获得之。";
    },
};

export default dynamicTranslates;
