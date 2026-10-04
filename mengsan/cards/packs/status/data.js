// Wiki Data:Card.tabx 保存快照；运行时效果由共用模块实现。
export const statusCards = Object.freeze([
  {
    "id": "toxic",
    "name": "mengsan_status_toxic",
    "title": "毒素",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": 1,
    "description": "在你的回合结束时，如果这张牌在你的手牌中，你受到5点伤害。消耗。",
    "base": {
      "exhaust": true,
      "endDamage": 5
    }
  },
  {
    "id": "beckon",
    "name": "mengsan_status_beckon",
    "title": "呼唤",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": 1,
    "description": "在你的回合结束时，如果这张牌在你的手牌中，你失去6点生命。",
    "base": {
      "endLoseHp": 6
    }
  },
  {
    "id": "slimed",
    "name": "mengsan_slimed_shuying",
    "title": "黏液",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": 1,
    "description": "抽1张牌。消耗。",
    "base": {
      "exhaust": true,
      "draw": 1
    }
  },
  {
    "id": "debris",
    "name": "mengsan_status_debris",
    "title": "碎屑",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": 1,
    "description": "消耗。",
    "base": {
      "exhaust": true
    }
  },
  {
    "id": "wither",
    "name": "mengsan_status_wither",
    "title": "凋萎",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，你受到3点伤害。",
    "base": {
      "unplayable": true,
      "endDamage": 3
    }
  },
  {
    "id": "infection",
    "name": "mengsan_infection_shuying",
    "title": "感染",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，你受到3点伤害。",
    "base": {
      "unplayable": true,
      "endDamage": 3
    }
  },
  {
    "id": "soot",
    "name": "mengsan_status_soot",
    "title": "煤灰",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "wound",
    "name": "mengsan_wound_shuying",
    "title": "伤口",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。",
    "base": {
      "unplayable": true
    }
  },
  {
    "id": "void",
    "name": "mengsan_status_void",
    "title": "虚空",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。虚无。每当你抽到这张牌时，失去1点能量。",
    "base": {
      "ethereal": true,
      "unplayable": true
    }
  },
  {
    "id": "dazed",
    "name": "mengsan_dazed_shuying",
    "title": "晕眩",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。虚无。",
    "base": {
      "ethereal": true,
      "unplayable": true
    }
  },
  {
    "id": "burn",
    "name": "mengsan_status_burn",
    "title": "灼伤",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": null,
    "description": "不能被打出。在你的回合结束时，如果这张牌在你的手牌中，你受到2点伤害。",
    "base": {
      "unplayable": true,
      "endDamage": 2
    }
  },
  {
    "id": "deprecated_card",
    "name": "mengsan_status_deprecated_card",
    "title": "弃用卡牌",
    "pack": "status",
    "category": "utility",
    "cardType": "status",
    "rarity": "status",
    "cost": 0,
    "description": "这张牌在近期的一次更新中被移除。抽1张牌。将这张牌从你的牌组中移除。消耗。",
    "base": {
      "exhaust": true,
      "draw": 1
    }
  }
]);
