// Wiki Data:Card.tabx 保存快照；运行时效果由共用模块实现。
export const eventCards = Object.freeze([
  {
    "id": "byrd_swoop",
    "name": "mengsan_event_byrd_swoop",
    "title": "异鸟扑击",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 0,
    "description": "造成14点伤害。",
    "base": {
      "damage": 14,
      "hits": 1
    },
    "upgraded": {
      "damage": 18,
      "hits": 1,
      "cost": 0,
      "description": "造成18点伤害。"
    }
  },
  {
    "id": "mad_science-sapping",
    "name": "mengsan_event_mad_science_sapping",
    "title": "疯狂科学",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 1,
    "description": "造成12点伤害。给予2层虚弱。给予2层易伤。",
    "base": {
      "damage": 12,
      "hits": 1,
      "weak": 2,
      "vulnerable": 2
    },
    "upgraded": {
      "innate": true,
      "damage": 12,
      "hits": 1,
      "weak": 2,
      "vulnerable": 2,
      "cost": 1,
      "description": "固有。造成12点伤害。给予2层虚弱。给予2层易伤。"
    }
  },
  {
    "id": "mad_science-violence",
    "name": "mengsan_event_mad_science_violence",
    "title": "疯狂科学",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 1,
    "description": "造成12点伤害3次。",
    "base": {
      "damage": 12,
      "hits": 3
    },
    "upgraded": {
      "innate": true,
      "damage": 12,
      "hits": 3,
      "cost": 1,
      "description": "固有。造成12点伤害3次。"
    }
  },
  {
    "id": "mad_science-choking",
    "name": "mengsan_event_mad_science_choking",
    "title": "疯狂科学",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 1,
    "description": "造成12点伤害。本回合，你每打出一张牌，该敌人失去6点生命。",
    "base": {
      "damage": 12,
      "hits": 1,
      "choking": 6
    },
    "upgraded": {
      "innate": true,
      "damage": 12,
      "hits": 1,
      "choking": 6,
      "cost": 1,
      "description": "固有。造成12点伤害。本回合，你每打出一张牌，该敌人失去6点生命。"
    }
  },
  {
    "id": "exterminate",
    "name": "mengsan_event_exterminate",
    "title": "杀灭",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 1,
    "description": "对所有敌人造成3点伤害4次。",
    "base": {
      "damage": 3,
      "hits": 4,
      "all": true
    },
    "upgraded": {
      "damage": 4,
      "hits": 4,
      "all": true,
      "cost": 1,
      "description": "对所有敌人造成4点伤害4次。"
    }
  },
  {
    "id": "squash",
    "name": "mengsan_event_squash",
    "title": "压扁",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 1,
    "description": "造成10点伤害。给予2层易伤。",
    "base": {
      "damage": 10,
      "hits": 1,
      "vulnerable": 2
    },
    "upgraded": {
      "damage": 12,
      "hits": 1,
      "vulnerable": 3,
      "cost": 1,
      "description": "造成12点伤害。给予3层易伤。"
    }
  },
  {
    "id": "peck",
    "name": "mengsan_event_peck",
    "title": "啄击",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "event",
    "cost": 1,
    "description": "造成2点伤害3次。",
    "base": {
      "damage": 2,
      "hits": 3
    },
    "upgraded": {
      "damage": 2,
      "hits": 4,
      "cost": 1,
      "description": "造成2点伤害4次。"
    }
  },
  {
    "id": "feeding_frenzy",
    "name": "mengsan_event_feeding_frenzy",
    "title": "疯狂进食",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 0,
    "description": "在本回合内获得5点力量。",
    "base": {
      "temporaryStrength": 5
    },
    "upgraded": {
      "temporaryStrength": 7,
      "cost": 0,
      "description": "在本回合内获得7点力量。"
    }
  },
  {
    "id": "enlightenment",
    "name": "mengsan_event_enlightenment",
    "title": "开悟",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 0,
    "description": "本回合，你当前手牌的费用最高为1点。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "exhaust": true,
      "cost": 0,
      "description": "本场战斗中，你当前手牌的费用最高为1点。消耗。"
    }
  },
  {
    "id": "mad_science-energized",
    "name": "mengsan_event_mad_science_energized",
    "title": "疯狂科学",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 1,
    "description": "获得8点格挡，再补充2点费用。",
    "base": {
      "block": 8,
      "energy": 2
    },
    "upgraded": {
      "innate": true,
      "block": 8,
      "energy": 2,
      "cost": 1,
      "description": "固有。获得8点格挡，再补充2点费用。"
    }
  },
  {
    "id": "mad_science-wisdom",
    "name": "mengsan_event_mad_science_wisdom",
    "title": "疯狂科学",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 1,
    "description": "获得8点格挡，再抽3张牌。",
    "base": {
      "block": 8,
      "draw": 3
    },
    "upgraded": {
      "innate": true,
      "block": 8,
      "draw": 3,
      "cost": 1,
      "description": "固有。获得8点格挡，再抽3张牌。"
    }
  },
  {
    "id": "mad_science-chaos",
    "name": "mengsan_event_mad_science_chaos",
    "title": "疯狂科学",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 1,
    "description": "获得8点格挡。将一张随机牌放入你的手牌，这张牌在本回合可以免费打出。",
    "base": {
      "block": 8
    },
    "upgraded": {
      "innate": true,
      "block": 8,
      "cost": 1,
      "description": "固有。获得8点格挡。将一张随机牌放入你的手牌，这张牌在本回合可以免费打出。"
    }
  },
  {
    "id": "toric_toughness",
    "name": "mengsan_event_toric_toughness",
    "title": "坚韧之环",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 2,
    "description": "获得5点格挡。在接下来的2个回合开始时，获得5点格挡。",
    "base": {
      "block": 5,
      "futureBlock": 5,
      "futureTurns": 2
    },
    "upgraded": {
      "block": 7,
      "futureBlock": 7,
      "futureTurns": 2,
      "cost": 2,
      "description": "获得7点格挡。在接下来的2个回合开始时，获得7点格挡。"
    }
  },
  {
    "id": "metamorphosis",
    "name": "mengsan_event_metamorphosis",
    "title": "羽化",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "event",
    "cost": 2,
    "description": "在你的抽牌堆中加入3张随机攻击牌。它们在本场战斗中可以被免费打出。消耗。",
    "base": {
      "exhaust": true,
      "generateDrawAttacks": 3
    },
    "upgraded": {
      "exhaust": true,
      "generateDrawAttacks": 5,
      "cost": 2,
      "description": "在你的抽牌堆中加入5张随机攻击牌。它们在本场战斗中可以被免费打出。消耗。"
    }
  },
  {
    "id": "mad_science-expertise",
    "name": "mengsan_event_mad_science_expertise",
    "title": "疯狂科学",
    "pack": "event",
    "category": "utility",
    "cardType": "power",
    "rarity": "event",
    "cost": 1,
    "description": "获得2点力量。获得2点敏捷。",
    "base": {
      "strength": 2,
      "dexterity": 2
    },
    "upgraded": {
      "innate": true,
      "strength": 2,
      "dexterity": 2,
      "cost": 1,
      "description": "固有。获得2点力量。获得2点敏捷。"
    }
  },
  {
    "id": "mad_science-curious",
    "name": "mengsan_event_mad_science_curious",
    "title": "疯狂科学",
    "pack": "event",
    "category": "utility",
    "cardType": "power",
    "rarity": "event",
    "cost": 1,
    "description": "本场战斗中，你打出能力牌的费用减少1点。",
    "base": {
      "powerDiscount": 1
    },
    "upgraded": {
      "innate": true,
      "powerDiscount": 1,
      "cost": 1,
      "description": "固有。本场战斗中，你打出能力牌的费用减少1点。"
    }
  },
  {
    "id": "mad_science-improvement",
    "name": "mengsan_event_mad_science_improvement",
    "title": "疯狂科学",
    "pack": "event",
    "category": "utility",
    "cardType": "power",
    "rarity": "event",
    "cost": 1,
    "description": "赢得本场战斗后，随机强化永久牌组中一张可强化的牌。",
    "base": {
      "battleUpgrade": 1
    },
    "upgraded": {
      "innate": true,
      "battleUpgrade": 1,
      "cost": 1,
      "description": "固有。赢得本场战斗后，随机强化永久牌组中一张可强化的牌。"
    }
  },
  {
    "id": "neows_fury",
    "name": "mengsan_event_neows_fury",
    "title": "涅奥之怒",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "ancient",
    "cost": 1,
    "description": "造成10点伤害。将你弃牌堆中的至多2张牌放入你的手牌。消耗。",
    "base": {
      "exhaust": true,
      "damage": 10,
      "hits": 1,
      "chooseDiscard": 2
    },
    "upgraded": {
      "exhaust": true,
      "damage": 14,
      "hits": 1,
      "chooseDiscard": 3,
      "cost": 1,
      "description": "造成14点伤害。将你弃牌堆中的至多3张牌放入你的手牌。消耗。"
    }
  },
  {
    "id": "maul",
    "name": "mengsan_event_maul",
    "title": "撕咬",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "ancient",
    "cost": 1,
    "description": "造成5点伤害两次。在这场战斗中，将所有“撕咬”牌的伤害增加1。",
    "base": {
      "damage": 5,
      "hits": 2,
      "maulGrowth": 1
    },
    "upgraded": {
      "damage": 6,
      "hits": 2,
      "maulGrowth": 2,
      "cost": 1,
      "description": "造成6点伤害两次。在这场战斗中，将所有“撕咬”牌的伤害增加2。"
    }
  },
  {
    "id": "whistle",
    "name": "mengsan_event_whistle",
    "title": "吹哨",
    "pack": "event",
    "category": "damage",
    "cardType": "attack",
    "rarity": "ancient",
    "cost": 3,
    "description": "造成33点伤害。击晕该敌人。消耗。",
    "base": {
      "exhaust": true,
      "damage": 33,
      "hits": 1
    },
    "upgraded": {
      "exhaust": true,
      "damage": 44,
      "hits": 1,
      "cost": 3,
      "description": "造成44点伤害。击晕该敌人。消耗。"
    }
  },
  {
    "id": "wish",
    "name": "mengsan_event_wish",
    "title": "许愿",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "ancient",
    "cost": 0,
    "description": "将你抽牌堆中的一张牌放入你的手牌。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "exhaust": true,
      "retain": true,
      "cost": 0,
      "description": "保留。将你抽牌堆中的一张牌放入你的手牌。消耗。"
    }
  },
  {
    "id": "brightest_flame",
    "name": "mengsan_event_brightest_flame",
    "title": "至亮之焰",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "ancient",
    "cost": 0,
    "description": "补充2点费用，抽2张牌。若此时生命已满，先失去1点生命。随后降低1点最大生命。",
    "base": {
      "draw": 2,
      "energy": 2
    },
    "upgraded": {
      "draw": 3,
      "energy": 3,
      "cost": 0,
      "description": "补充3点费用，抽3张牌。若此时生命已满，先失去1点生命。随后降低1点最大生命。"
    }
  },
  {
    "id": "apparition",
    "name": "mengsan_event_apparition",
    "title": "灵体",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "ancient",
    "cost": 1,
    "description": "虚无。获得1层无实体。消耗。",
    "base": {
      "exhaust": true,
      "ethereal": true,
      "intangible": 1
    },
    "upgraded": {
      "exhaust": true,
      "intangible": 1,
      "cost": 1,
      "description": "获得1层无实体。消耗。"
    }
  },
  {
    "id": "apotheosis",
    "name": "mengsan_event_apotheosis",
    "title": "神化",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "ancient",
    "cost": 2,
    "description": "固有。强化本场战斗中属于你的所有可强化牌。消耗。",
    "base": {
      "exhaust": true,
      "innate": true
    },
    "upgraded": {
      "exhaust": true,
      "innate": true,
      "cost": 1,
      "description": "固有。强化本场战斗中属于你的所有可强化牌。消耗。"
    }
  },
  {
    "id": "relax",
    "name": "mengsan_event_relax",
    "title": "放松",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "ancient",
    "cost": 3,
    "description": "获得15点格挡。在你的下个回合开始时，抽2张牌并补充2点费用。消耗。",
    "base": {
      "exhaust": true,
      "block": 15,
      "nextDraw": 2,
      "nextEnergy": 2
    },
    "upgraded": {
      "exhaust": true,
      "block": 17,
      "nextDraw": 3,
      "nextEnergy": 3,
      "cost": 3,
      "description": "获得17点格挡。在你的下个回合开始时，抽3张牌并补充3点费用。消耗。"
    }
  },
  {
    "id": "abundance",
    "name": "mengsan_event_abundance",
    "title": "富足",
    "pack": "event",
    "category": "utility",
    "cardType": "skill",
    "rarity": "ancient",
    "cost": 1,
    "description": "从随机出现的至多3张能力牌中选一张，加入手牌。本回合可免费打出该牌。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "exhaust": true,
      "generatedUpgrade": 1,
      "cost": 1,
      "description": "从随机出现的至多3张能力牌中选一张，能强化时将其强化，再加入手牌。本回合可免费打出该牌。消耗。"
    }
  }
]);
