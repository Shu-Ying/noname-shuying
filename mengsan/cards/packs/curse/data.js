// Wiki Data:Card.tabx 保存快照；运行时效果由共用模块实现。
export const curseCards = Object.freeze([
  {
    "id": "spore_mind",
    "name": "mengsan_curse_spore_mind",
    "title": "孢子心灵",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": 1,
    "description": "消耗。",
    "base": {
      "exhaust": true
    }
  },
  {
    "id": "enthralled",
    "name": "mengsan_curse_enthralled",
    "title": "执迷",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": 2,
    "description": "如果这张牌在你的手牌中，你必须优先打出这张牌。永恒。",
    "base": {
      "eternal": true
    }
  },
  {
    "id": "clumsy",
    "name": "mengsan_curse_clumsy",
    "title": "笨拙",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。虚无。",
    "base": {
      "ethereal": true,
      "unplayable": true
    }
  },
  {
    "id": "normality",
    "name": "mengsan_curse_normality",
    "title": "凡庸",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。你在本回合不能打出超过3张牌。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "decay",
    "name": "mengsan_curse_decay",
    "title": "腐朽",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中, 你受到2点伤害。",
    "base": {
      "unplayable": true,
      "endDamage": 2
    }
  },
  {
    "id": "regret",
    "name": "mengsan_curse_regret",
    "title": "悔恨",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，失去相当于手牌数量的生命。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "ascenders_bane",
    "name": "mengsan_curse_ascenders_bane",
    "title": "进阶之灾",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。虚无。永恒。",
    "base": {
      "ethereal": true,
      "eternal": true,
      "unplayable": true
    }
  },
  {
    "id": "writhe",
    "name": "mengsan_curse_writhe",
    "title": "苦恼",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。固有。",
    "base": {
      "innate": true,
      "unplayable": true
    }
  },
  {
    "id": "guilty",
    "name": "mengsan_curse_guilty",
    "title": "愧疚",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在5场战斗后从你的牌组中移除。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "curse_of_the_bell",
    "name": "mengsan_curse_curse_of_the_bell",
    "title": "铃铛的诅咒",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。永恒。",
    "base": {
      "eternal": true,
      "unplayable": true
    }
  },
  {
    "id": "bad_luck",
    "name": "mengsan_curse_bad_luck",
    "title": "霉运",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，你失去13点生命。永恒。",
    "base": {
      "eternal": true,
      "unplayable": true,
      "endLoseHp": 13
    }
  },
  {
    "id": "injury",
    "name": "mengsan_curse_injury",
    "title": "受伤",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "poor_sleep",
    "name": "mengsan_curse_poor_sleep",
    "title": "睡眠不佳",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。保留。",
    "base": {
      "retain": true,
      "unplayable": true
    }
  },
  {
    "id": "greed",
    "name": "mengsan_curse_greed",
    "title": "贪婪",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。永恒。",
    "base": {
      "eternal": true,
      "unplayable": true
    }
  },
  {
    "id": "shame",
    "name": "mengsan_curse_shame",
    "title": "羞耻",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，则获得1层脆弱。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "doubt",
    "name": "mengsan_curse_doubt",
    "title": "疑虑",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，获得1层虚弱。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "folly",
    "name": "mengsan_curse_folly",
    "title": "愚行",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。固有。虚无。永恒。",
    "base": {
      "innate": true,
      "ethereal": true,
      "eternal": true,
      "unplayable": true
    }
  },
  {
    "id": "debt",
    "name": "mengsan_curse_debt",
    "title": "债务",
    "pack": "curse",
    "category": "utility",
    "cardType": "curse",
    "rarity": "curse",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，你失去10金币。",
    "base": {
      "unplayable": true
    }
  }
]);
