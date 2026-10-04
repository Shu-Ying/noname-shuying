// Wiki Data:Card.tabx 保存快照；运行时效果由共用模块实现。
export const colorlessCards = Object.freeze([
  {
    "id": "volley",
    "name": "mengsan_colorless_volley",
    "title": "连射",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": "X",
    "description": "随机对敌人造成10点伤害X次。",
    "base": {
      "damage": 10,
      "hits": 1
    },
    "upgraded": {
      "damage": 14,
      "hits": 1,
      "cost": "X",
      "description": "随机对敌人造成14点伤害X次。"
    }
  },
  {
    "id": "flash_of_steel",
    "name": "mengsan_colorless_flash_of_steel",
    "title": "亮剑",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 0,
    "description": "造成5点伤害。抽1张牌。",
    "base": {
      "damage": 5,
      "hits": 1,
      "draw": 1
    },
    "upgraded": {
      "damage": 8,
      "hits": 1,
      "draw": 1,
      "cost": 0,
      "description": "造成8点伤害。抽1张牌。"
    }
  },
  {
    "id": "dramatic_entrance",
    "name": "mengsan_colorless_dramatic_entrance",
    "title": "闪亮登场",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 0,
    "description": "固有。对所有敌人造成11点伤害。消耗。",
    "base": {
      "exhaust": true,
      "innate": true,
      "damage": 11,
      "hits": 1,
      "all": true
    },
    "upgraded": {
      "exhaust": true,
      "innate": true,
      "damage": 15,
      "hits": 1,
      "all": true,
      "cost": 0,
      "description": "固有。对所有敌人造成15点伤害。消耗。"
    }
  },
  {
    "id": "omnislice",
    "name": "mengsan_colorless_omnislice",
    "title": "万向斩",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 0,
    "description": "造成8点伤害。对所有其他敌人造成等量的伤害。",
    "base": {
      "damage": 8,
      "hits": 1
    },
    "upgraded": {
      "damage": 11,
      "hits": 1,
      "cost": 0,
      "description": "造成11点伤害。对所有其他敌人造成等量的伤害。"
    }
  },
  {
    "id": "ultimate_strike",
    "name": "mengsan_colorless_ultimate_strike",
    "title": "究极打击",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "造成14点伤害。",
    "base": {
      "damage": 14,
      "hits": 1
    },
    "upgraded": {
      "damage": 20,
      "hits": 1,
      "cost": 1,
      "description": "造成20点伤害。"
    }
  },
  {
    "id": "fisticuffs",
    "name": "mengsan_colorless_fisticuffs",
    "title": "拳斗",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "造成7点伤害。获得等量于所造成伤害的格挡。",
    "base": {
      "damage": 7,
      "hits": 1
    },
    "upgraded": {
      "damage": 9,
      "hits": 1,
      "cost": 1,
      "description": "造成9点伤害。获得等量于所造成伤害的格挡。"
    }
  },
  {
    "id": "gang_up",
    "name": "mengsan_colorless_gang_up",
    "title": "群起攻之",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "造成5点伤害。本回合其他玩家每攻击过一次该敌人，该牌造成的伤害就额外增加5点。",
    "base": {
      "damage": 5,
      "hits": 1,
      "perAllyAttack": 5
    },
    "upgraded": {
      "damage": 5,
      "hits": 1,
      "perAllyAttack": 7,
      "cost": 1,
      "description": "造成5点伤害。本回合其他玩家每攻击过一次该敌人，该牌造成的伤害就额外增加7点。"
    }
  },
  {
    "id": "seeker_strike",
    "name": "mengsan_colorless_seeker_strike",
    "title": "探寻打击",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "造成9点伤害。从抽牌堆的随机3张牌中选择一张加入你的手牌。",
    "base": {
      "damage": 9,
      "hits": 1
    },
    "upgraded": {
      "damage": 12,
      "hits": 1,
      "cost": 1,
      "description": "造成12点伤害。从抽牌堆的随机3张牌中选择一张加入你的手牌。"
    }
  },
  {
    "id": "thrumming_hatchet",
    "name": "mengsan_colorless_thrumming_hatchet",
    "title": "无休手斧",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "造成11点伤害。在你的下个回合开始时，将此卡返回你的手牌。",
    "base": {
      "damage": 11,
      "hits": 1
    },
    "upgraded": {
      "damage": 14,
      "hits": 1,
      "cost": 1,
      "description": "造成14点伤害。在你的下个回合开始时，将此卡返回你的手牌。"
    }
  },
  {
    "id": "mind_blast",
    "name": "mengsan_colorless_mind_blast",
    "title": "心灵震慑",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "固有。造成你抽牌堆中剩余牌数的伤害。",
    "base": {
      "innate": true,
      "hits": 1
    },
    "upgraded": {
      "innate": true,
      "hits": 1,
      "cost": 0,
      "description": "固有。造成你抽牌堆中剩余牌数的伤害。"
    }
  },
  {
    "id": "dark_shackles",
    "name": "mengsan_colorless_dark_shackles",
    "title": "黑暗镣铐",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "使一名敌人在本回合失去9点力量。消耗。",
    "base": {
      "exhaust": true,
      "negativeStrength": 9
    },
    "upgraded": {
      "exhaust": true,
      "negativeStrength": 15,
      "cost": 0,
      "description": "使一名敌人在本回合失去15点力量。消耗。"
    }
  },
  {
    "id": "jack_of_all_trades",
    "name": "mengsan_colorless_jack_of_all_trades",
    "title": "花样百出",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "将1张随机无色牌加入你的手牌。消耗。",
    "base": {
      "exhaust": true,
      "generate": 1
    },
    "upgraded": {
      "exhaust": true,
      "generate": 2,
      "cost": 0,
      "description": "将2张随机无色牌加入你的手牌。消耗。"
    }
  },
  {
    "id": "impatience",
    "name": "mengsan_colorless_impatience",
    "title": "急躁",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "如果你的手牌中没有攻击牌，抽2张牌。",
    "base": {
      "conditionalDraw": 2
    },
    "upgraded": {
      "conditionalDraw": 3,
      "cost": 0,
      "description": "如果你的手牌中没有攻击牌，抽3张牌。"
    }
  },
  {
    "id": "purity",
    "name": "mengsan_colorless_purity",
    "title": "净化",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "保留。从手牌中选择最多3张牌消耗。消耗。",
    "base": {
      "exhaust": true,
      "retain": true,
      "chooseExhaust": 3
    },
    "upgraded": {
      "exhaust": true,
      "retain": true,
      "chooseExhaust": 5,
      "cost": 0,
      "description": "保留。从手牌中选择最多5张牌消耗。消耗。"
    }
  },
  {
    "id": "finesse",
    "name": "mengsan_colorless_finesse",
    "title": "妙计",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "获得4点格挡。抽1张牌。",
    "base": {
      "block": 4,
      "draw": 1
    },
    "upgraded": {
      "block": 7,
      "draw": 1,
      "cost": 0,
      "description": "获得7点格挡。抽1张牌。"
    }
  },
  {
    "id": "thinking_ahead",
    "name": "mengsan_colorless_thinking_ahead",
    "title": "深谋远虑",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "抽2张牌。将手牌中的一张牌放到你的抽牌堆的顶端。消耗。",
    "base": {
      "exhaust": true,
      "draw": 2
    },
    "upgraded": {
      "draw": 2,
      "cost": 0,
      "description": "抽2张牌。将手牌中的一张牌放到你的抽牌堆的顶端。"
    }
  },
  {
    "id": "production",
    "name": "mengsan_colorless_production",
    "title": "生产制造",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "获得2点能量。消耗。",
    "base": {
      "exhaust": true,
      "energy": 2
    },
    "upgraded": {
      "exhaust": true,
      "energy": 3,
      "cost": 0,
      "description": "获得3点能量。消耗。"
    }
  },
  {
    "id": "believe_in_you",
    "name": "mengsan_colorless_believe_in_you",
    "title": "相信着你",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "另一名玩家获得2点能量。",
    "base": {
      "allyEnergy": 2
    },
    "upgraded": {
      "allyEnergy": 3,
      "cost": 0,
      "description": "另一名玩家获得3点能量。"
    }
  },
  {
    "id": "restlessness",
    "name": "mengsan_colorless_restlessness",
    "title": "心神不宁",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "保留。如果你的手牌为空，则抽2张牌并获得2点能量。",
    "base": {
      "retain": true,
      "emptyDraw": 2,
      "emptyEnergy": 2
    },
    "upgraded": {
      "retain": true,
      "emptyDraw": 3,
      "emptyEnergy": 3,
      "cost": 0,
      "description": "保留。如果你的手牌为空，则抽3张牌并获得3点能量。"
    }
  },
  {
    "id": "prolong",
    "name": "mengsan_colorless_prolong",
    "title": "延伸",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "在下个回合获得等量于你当前格挡值的格挡。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "cost": 0,
      "description": "在下个回合获得等量于你当前格挡值的格挡。"
    }
  },
  {
    "id": "panic_button",
    "name": "mengsan_colorless_panic_button",
    "title": "应急按钮",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 0,
    "description": "获得30点格挡。你在接下来的2回合内无法再从卡牌中获得格挡。消耗。",
    "base": {
      "exhaust": true,
      "block": 30
    },
    "upgraded": {
      "exhaust": true,
      "block": 40,
      "cost": 0,
      "description": "获得40点格挡。你在接下来的2回合内无法再从卡牌中获得格挡。消耗。"
    }
  },
  {
    "id": "huddle_up",
    "name": "mengsan_colorless_huddle_up",
    "title": "抱团",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 1,
    "description": "所有玩家抽2张牌。消耗。",
    "base": {
      "exhaust": true,
      "teamDraw": 2
    },
    "upgraded": {
      "exhaust": true,
      "teamDraw": 3,
      "cost": 1,
      "description": "所有玩家抽3张牌。消耗。"
    }
  },
  {
    "id": "discovery",
    "name": "mengsan_colorless_discovery",
    "title": "发现",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 1,
    "description": "从3张随机牌中选择1张加入你的手牌。这张牌在本回合可以免费打出。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "cost": 1,
      "description": "从3张随机牌中选择1张加入你的手牌。这张牌在本回合可以免费打出。"
    }
  },
  {
    "id": "ultimate_defend",
    "name": "mengsan_colorless_ultimate_defend",
    "title": "究极防御",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 1,
    "description": "获得11点格挡。",
    "base": {
      "block": 11
    },
    "upgraded": {
      "block": 15,
      "cost": 1,
      "description": "获得15点格挡。"
    }
  },
  {
    "id": "intercept",
    "name": "mengsan_colorless_intercept",
    "title": "拦截",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 1,
    "description": "获得9点格挡。将本回合所有要对另一名玩家发起的攻击转移到你的身上。",
    "base": {
      "block": 9
    },
    "upgraded": {
      "block": 13,
      "cost": 1,
      "description": "获得13点格挡。将本回合所有要对另一名玩家发起的攻击转移到你的身上。"
    }
  },
  {
    "id": "lift",
    "name": "mengsan_colorless_lift",
    "title": "托举",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 1,
    "description": "给另一名玩家11点格挡。",
    "base": {
      "allyBlock": 11
    },
    "upgraded": {
      "allyBlock": 16,
      "cost": 1,
      "description": "给另一名玩家16点格挡。"
    }
  },
  {
    "id": "coordinate",
    "name": "mengsan_colorless_coordinate",
    "title": "协同配合",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 1,
    "description": "在本回合给予其他玩家5点力量。",
    "base": {
      "teamStrength": 5
    },
    "upgraded": {
      "teamStrength": 8,
      "cost": 1,
      "description": "在本回合给予其他玩家8点力量。"
    }
  },
  {
    "id": "catastrophe",
    "name": "mengsan_colorless_catastrophe",
    "title": "横祸",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 2,
    "description": "从你的抽牌堆中随机打出2张牌。",
    "base": {
      "autoDraw": 2
    },
    "upgraded": {
      "autoDraw": 3,
      "cost": 2,
      "description": "从你的抽牌堆中随机打出3张牌。"
    }
  },
  {
    "id": "equilibrium",
    "name": "mengsan_colorless_equilibrium",
    "title": "均衡",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 2,
    "description": "获得13点格挡。在本回合保留你的手牌。",
    "base": {
      "block": 13
    },
    "upgraded": {
      "block": 16,
      "cost": 2,
      "description": "获得16点格挡。在本回合保留你的手牌。"
    }
  },
  {
    "id": "the_bomb",
    "name": "mengsan_colorless_the_bomb",
    "title": "炸弹",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 2,
    "description": "在3回合结束后，对所有敌人造成40点伤害。",
    "base": {
      "bombDamage": 40
    },
    "upgraded": {
      "bombDamage": 50,
      "cost": 2,
      "description": "在3回合结束后，对所有敌人造成50点伤害。"
    }
  },
  {
    "id": "shockwave",
    "name": "mengsan_colorless_shockwave",
    "title": "震荡波",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "uncommon",
    "cost": 2,
    "description": "给予所有敌人3层虚弱和易伤。消耗。",
    "base": {
      "exhaust": true,
      "weak": 3,
      "vulnerable": 3,
      "all": true
    },
    "upgraded": {
      "exhaust": true,
      "weak": 5,
      "vulnerable": 5,
      "all": true,
      "cost": 2,
      "description": "给予所有敌人5层虚弱和易伤。消耗。"
    }
  },
  {
    "id": "panache",
    "name": "mengsan_colorless_panache",
    "title": "神气制胜",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "uncommon",
    "cost": 0,
    "description": "每当你在一回合内打出五张牌时，对所有敌人造成10点伤害。",
    "base": {
      "panache": 10
    },
    "upgraded": {
      "panache": 14,
      "cost": 0,
      "description": "每当你在一回合内打出五张牌时，对所有敌人造成14点伤害。"
    }
  },
  {
    "id": "prowess",
    "name": "mengsan_colorless_prowess",
    "title": "非凡技艺",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "uncommon",
    "cost": 1,
    "description": "获得1点力量。获得1点敏捷。",
    "base": {
      "strength": 1,
      "dexterity": 1
    },
    "upgraded": {
      "strength": 2,
      "dexterity": 2,
      "cost": 1,
      "description": "获得2点力量。获得2点敏捷。"
    }
  },
  {
    "id": "fasten",
    "name": "mengsan_colorless_fasten",
    "title": "勒紧",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "uncommon",
    "cost": 1,
    "description": "从“防御”牌中额外获得4点格挡。",
    "base": {
      "defendBonus": 4
    },
    "upgraded": {
      "defendBonus": 6,
      "cost": 1,
      "description": "从“防御”牌中额外获得6点格挡。"
    }
  },
  {
    "id": "prep_time",
    "name": "mengsan_colorless_prep_time",
    "title": "准备时间",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "uncommon",
    "cost": 1,
    "description": "在你的回合开始时，获得4点活力。",
    "base": {
      "turnVigor": 4
    },
    "upgraded": {
      "turnVigor": 6,
      "cost": 1,
      "description": "在你的回合开始时，获得6点活力。"
    }
  },
  {
    "id": "automation",
    "name": "mengsan_colorless_automation",
    "title": "自动化",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "uncommon",
    "cost": 1,
    "description": "你每抽10张牌，获得1点能量。",
    "base": {
      "automation": 1
    },
    "upgraded": {
      "automation": 1,
      "cost": 0,
      "description": "你每抽10张牌，获得1点能量。"
    }
  },
  {
    "id": "bolas",
    "name": "mengsan_colorless_bolas",
    "title": "流星锤",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 0,
    "description": "造成3点伤害。在你的下个回合开始时，将此卡返回你的手牌。",
    "base": {
      "damage": 3,
      "hits": 1
    },
    "upgraded": {
      "damage": 4,
      "hits": 1,
      "cost": 0,
      "description": "造成4点伤害。在你的下个回合开始时，将此卡返回你的手牌。"
    }
  },
  {
    "id": "salvo",
    "name": "mengsan_colorless_salvo",
    "title": "箭雨",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 1,
    "description": "造成12点伤害。在本回合保留你的手牌。",
    "base": {
      "damage": 12,
      "hits": 1
    },
    "upgraded": {
      "damage": 16,
      "hits": 1,
      "cost": 1,
      "description": "造成16点伤害。在本回合保留你的手牌。"
    }
  },
  {
    "id": "gold_axe",
    "name": "mengsan_colorless_gold_axe",
    "title": "金斧",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 1,
    "description": "造成本场战斗中所打出牌数的伤害。",
    "base": {
      "hits": 1
    },
    "upgraded": {
      "retain": true,
      "hits": 1,
      "cost": 1,
      "description": "保留。造成本场战斗中所打出牌数的伤害。"
    }
  },
  {
    "id": "rend",
    "name": "mengsan_colorless_rend",
    "title": "撕碎",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 2,
    "description": "造成15点伤害。该名敌人身上每有一种负面效果，就额外造成5点伤害。",
    "base": {
      "damage": 15,
      "hits": 1,
      "perDebuff": 5
    },
    "upgraded": {
      "damage": 18,
      "hits": 1,
      "perDebuff": 8,
      "cost": 2,
      "description": "造成18点伤害。该名敌人身上每有一种负面效果，就额外造成8点伤害。"
    }
  },
  {
    "id": "hand_of_greed",
    "name": "mengsan_colorless_hand_of_greed",
    "title": "贪婪之手",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 2,
    "description": "造成20点伤害。斩杀时，获得20金币。",
    "base": {
      "damage": 20,
      "hits": 1,
      "killGold": 20
    },
    "upgraded": {
      "damage": 25,
      "hits": 1,
      "killGold": 25,
      "cost": 2,
      "description": "造成25点伤害。斩杀时，获得25金币。"
    }
  },
  {
    "id": "jackpot",
    "name": "mengsan_colorless_jackpot",
    "title": "大奖",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 3,
    "description": "造成25点伤害。将3张随机0能量的牌加入你的手牌。",
    "base": {
      "damage": 25,
      "hits": 1,
      "generateZero": 3
    },
    "upgraded": {
      "damage": 30,
      "hits": 1,
      "generateZero": 3,
      "generatedUpgrade": 1,
      "cost": 3,
      "description": "造成30点伤害。将3张随机升级过的0能量的牌加入你的手牌。"
    }
  },
  {
    "id": "knockdown",
    "name": "mengsan_colorless_knockdown",
    "title": "击倒",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "rare",
    "cost": 3,
    "description": "造成10点伤害。该敌人在本回合受到的来自其他玩家的伤害变为两倍。",
    "base": {
      "damage": 10,
      "hits": 1,
      "allyDamageMultiplier": 2
    },
    "upgraded": {
      "damage": 14,
      "hits": 1,
      "allyDamageMultiplier": 3,
      "cost": 3,
      "description": "造成14点伤害。该敌人在本回合受到的来自其他玩家的伤害变为三倍。"
    }
  },
  {
    "id": "the_gambit",
    "name": "mengsan_colorless_the_gambit",
    "title": "孤注一掷",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 0,
    "description": "获得50点格挡。如果你在本场战斗中受到未被格挡的攻击伤害，则立刻死亡。",
    "base": {
      "block": 50
    },
    "upgraded": {
      "block": 75,
      "cost": 0,
      "description": "获得75点格挡。如果你在本场战斗中受到未被格挡的攻击伤害，则立刻死亡。"
    }
  },
  {
    "id": "secret_technique",
    "name": "mengsan_colorless_secret_technique",
    "title": "秘密技法",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 0,
    "description": "从抽牌堆中选择一张技能牌放入你的手牌。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "cost": 0,
      "description": "从抽牌堆中选择一张技能牌放入你的手牌。"
    }
  },
  {
    "id": "secret_weapon",
    "name": "mengsan_colorless_secret_weapon",
    "title": "秘密武器",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 0,
    "description": "从抽牌堆中选择一张攻击牌放入你的手牌。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "cost": 0,
      "description": "从抽牌堆中选择一张攻击牌放入你的手牌。"
    }
  },
  {
    "id": "master_of_strategy",
    "name": "mengsan_colorless_master_of_strategy",
    "title": "战略大师",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 0,
    "description": "抽3张牌。消耗。",
    "base": {
      "exhaust": true,
      "draw": 3
    },
    "upgraded": {
      "exhaust": true,
      "draw": 4,
      "cost": 0,
      "description": "抽4张牌。消耗。"
    }
  },
  {
    "id": "scrawl",
    "name": "mengsan_colorless_scrawl",
    "title": "潦草急就",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 1,
    "description": "抽牌直到抽满手牌。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "exhaust": true,
      "retain": true,
      "cost": 1,
      "description": "保留。抽牌直到抽满手牌。消耗。"
    }
  },
  {
    "id": "mimic",
    "name": "mengsan_colorless_mimic",
    "title": "拟态",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 1,
    "description": "获得等同于另一位玩家格挡值的格挡。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "cost": 1,
      "description": "获得等同于另一位玩家格挡值的格挡。"
    }
  },
  {
    "id": "anointed",
    "name": "mengsan_colorless_anointed",
    "title": "天选",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 1,
    "description": "将你抽牌堆中的所有稀有牌放入你的手牌。消耗。",
    "base": {
      "exhaust": true
    },
    "upgraded": {
      "exhaust": true,
      "retain": true,
      "cost": 1,
      "description": "保留。将你抽牌堆中的所有稀有牌放入你的手牌。消耗。"
    }
  },
  {
    "id": "rally",
    "name": "mengsan_colorless_rally",
    "title": "集结",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 2,
    "description": "所有玩家获得12点格挡。",
    "base": {
      "teamBlock": 12
    },
    "upgraded": {
      "teamBlock": 17,
      "cost": 2,
      "description": "所有玩家获得17点格挡。"
    }
  },
  {
    "id": "beat_down",
    "name": "mengsan_colorless_beat_down",
    "title": "狠揍",
    "pack": "colorless",
    "category": "utility",
    "cardType": "skill",
    "rarity": "rare",
    "cost": 3,
    "description": "打出你弃牌堆中的3张随机攻击牌。",
    "base": {
      "autoDiscard": 3
    },
    "upgraded": {
      "autoDiscard": 4,
      "cost": 3,
      "description": "打出你弃牌堆中的4张随机攻击牌。"
    }
  },
  {
    "id": "nostalgia",
    "name": "mengsan_colorless_nostalgia",
    "title": "怀旧",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 1,
    "description": "每回合首次打出攻击或技能牌时，将其置于你的抽牌堆顶端。",
    "base": {},
    "upgraded": {
      "cost": 0,
      "description": "每回合首次打出攻击或技能牌时，将其置于你的抽牌堆顶端。"
    }
  },
  {
    "id": "entropy",
    "name": "mengsan_colorless_entropy",
    "title": "熵",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 1,
    "description": "在你的回合开始时，变化你手牌中的1张牌。",
    "base": {},
    "upgraded": {
      "innate": true,
      "cost": 1,
      "description": "固有。在你的回合开始时，变化你手牌中的1张牌。"
    }
  },
  {
    "id": "beacon_of_hope",
    "name": "mengsan_colorless_beacon_of_hope",
    "title": "希望灯塔",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 1,
    "description": "每当你在你的回合获得格挡时，其他玩家获得相应一半的格挡。",
    "base": {},
    "upgraded": {
      "innate": true,
      "cost": 1,
      "description": "固有。每当你在你的回合获得格挡时，其他玩家获得相应一半的格挡。"
    }
  },
  {
    "id": "mayhem",
    "name": "mengsan_colorless_mayhem",
    "title": "乱战",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 2,
    "description": "在你的回合开始时，打出你抽牌堆顶部的牌。",
    "base": {},
    "upgraded": {
      "cost": 1,
      "description": "在你的回合开始时，打出你抽牌堆顶部的牌。"
    }
  },
  {
    "id": "rolling_boulder",
    "name": "mengsan_colorless_rolling_boulder",
    "title": "滚石",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 3,
    "description": "在你的回合开始时，对所有敌人造成5点伤害，然后将该伤害增加5点。",
    "base": {
      "boulder": 5
    },
    "upgraded": {
      "boulder": 10,
      "cost": 3,
      "description": "在你的回合开始时，对所有敌人造成10点伤害，然后将该伤害增加5点。"
    }
  },
  {
    "id": "calamity",
    "name": "mengsan_colorless_calamity",
    "title": "劫难",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 3,
    "description": "每当你打出一张攻击牌时，将一张随机攻击牌添加到你的手牌。",
    "base": {},
    "upgraded": {
      "cost": 2,
      "description": "每当你打出一张攻击牌时，将一张随机攻击牌添加到你的手牌。"
    }
  },
  {
    "id": "eternal_armor",
    "name": "mengsan_colorless_eternal_armor",
    "title": "永恒铠甲",
    "pack": "colorless",
    "category": "utility",
    "cardType": "power",
    "rarity": "rare",
    "cost": 3,
    "description": "获得9层覆甲。",
    "base": {
      "plating": 9
    },
    "upgraded": {
      "plating": 12,
      "cost": 3,
      "description": "获得12层覆甲。"
    }
  },
  {
    "id": "the_ball",
    "name": "mengsan_colorless_the_ball",
    "title": "魔球",
    "pack": "colorless",
    "category": "damage",
    "cardType": "attack",
    "rarity": "uncommon",
    "cost": 1,
    "description": "造成10点伤害。将这张牌在本场战斗中的伤害增加15，然后将其交给一名随机盟友。",
    "base": {
      "damage": 10,
      "hits": 1,
      "ballGrowth": 15
    },
    "upgraded": {
      "damage": 10,
      "hits": 1,
      "ballGrowth": 25,
      "cost": 1,
      "description": "造成10点伤害。将这张牌在本场战斗中的伤害增加25，然后将其交给一名随机盟友。"
    }
  }
]);
