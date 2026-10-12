// Every implemented property is consumed by progression.js, battle.js or rooms.js.
// Missing mechanisms remain catalogued with an explicit reason; never fake their reward.
const rules = Object.create(null);
const set = (ids, rule) => ids.split(" ").forEach(id => { rules[id] = { ...rule }; });
set("burning_blood", { battleHeal: 6 });
set("black_blood", { battleHeal: 12, replaces: "burning_blood" });
set("ring_of_the_snake bag_of_preparation", { openingDraw: 2 });
set("ring_of_the_drake", { earlyTurnDraw: 2, earlyTurns: 3, replaces: "ring_of_the_snake" });
set("centennial_puzzle", { firstHpLossDraw: 3 });
set("pendulum", { turnDraw: 1, turnEvery: 3 });
set("pollinous_core", { turnDraw: 2, turnEvery: 4 });
set("meal_ticket", { shopHeal: 15 });
set("strawberry lees_waffle", { maxHp: 7 });
rules.lees_waffle.fullHeal = true;
set("pear", { maxHp: 10 }); set("mango", { maxHp: 14 });
set("fake_mango", { maxHp: 3 }); set("nutritious_oyster", { maxHp: 11 });
set("looming_fruit", { maxHp: 31 });
set("strike_dummy", { strikeDamage: 3 }); set("fake_strike_dummy", { strikeDamage: 1 });
set("bag_of_marbles", { openingVulnerable: 1 });
set("red_mask", { openingWeak: 1 });
set("lantern", { firstTurnEnergy: 1 });
set("venerable_tea_set", { afterRestEnergy: 2 });
set("fake_venerable_tea_set", { afterRestEnergy: 1 });
set("gorget", { plating: 4 });
set("regal_pillow", { restHeal: 15 });
set("festive_popper", { openingDamage: 9 });
set("vajra", { openingStrength: 1 }); set("sword_of_jade", { openingStrength: 3 });
set("anchor", { openingBlock: 10 }); set("fake_anchor", { openingBlock: 4 });
set("whetstone", { gainUpgrade: 2, upgradeType: "attack" });
set("war_paint", { gainUpgrade: 2, upgradeType: "skill" });
set("sand_castle", { gainUpgrade: 6 }); set("yummy_cookie", { gainUpgrade: 4 });
set("bronze_scales", { thorns: 3 });
set("book_of_five_rings", { deckAddHealEvery: 5, deckAddHeal: 20 });
set("blood_vial", { openingHeal: 2 }); set("fake_blood_vial", { openingHeal: 1 });
set("oddly_smooth_stone", { openingDexterity: 1 });
set("amethyst_aubergine", { battleGold: 15 });
set("red_skull", { lowHpStrength: 3 });
set("orichalcum", { emptyBlock: 6 }); set("fake_orichalcum", { emptyBlock: 3 });
set("vambrace", { firstCardBlockDouble: true });
set("ripple_basin", { noAttackBlock: 4 });
set("akabeko", { vigor: 8 });
set("horn_cleat", { nthTurn: 2, nthTurnBlock: 14 });
set("gremlin_horn", { killDraw: 1, killEnergy: 1 });
set("pen_nib", { nthAttackDouble: 10 });
set("planisphere", { eventHeal: 5 });
set("joss_paper", { exhaustDrawEvery: 5 });
set("ornamental_fan", { tripleAttackBlock: 4 });
set("letter_opener", { tripleSkillDamage: 5 });
set("sparkling_rouge", { nthTurn: 3, nthTurnStrength: 1, nthTurnDexterity: 1 });
set("nunchaku", { attackEnergyEvery: 10 });
set("mercury_hourglass", { turnDamage: 3 });
set("stone_cracker", { openingUpgradeDraw: 2 });
set("pantograph", { bossOpeningHeal: 25 });
set("kusarigama", { tripleAttackDamage: 6 });
set("miniature_cannon", { upgradedAttackDamage: 3 });
set("tuning_fork", { skillBlockEvery: 10, skillBlock: 7 });
set("permafrost", { firstPowerBlock: 7 });
set("eternal_feather", { restEntryHealPerFive: 3 });
set("bowler_hat", { goldMultiplier: 1.25 });
set("lucky_fysh", { deckAddGold: 15 });
set("parrying_shield", { endBlockThreshold: 10, endBlockDamage: 6 });
set("candelabra", { nthTurn: 2, nthTurnEnergy: 2 });
set("paper_phrog", { vulnerableMultiplier: 1.75 });
set("self_forming_clay", { hpLossNextBlock: 3 });
set("tingsha", { discardDamage: 3 }); set("tough_bandages", { discardBlock: 3 });
set("ice_cream", { keepEnergy: true });
set("unceasing_top", { emptyHandDraw: true });
set("rainbow_ring", { rainbow: true });
set("shovel", { restAction: "dig" });
set("meat_on_the_bone", { lowHpBattleHeal: 12 });
set("chandelier", { nthTurn: 3, nthTurnEnergy: 3 });
set("frozen_egg", { upgradeAddedType: "power" });
set("toxic_egg", { upgradeAddedType: "skill" });
set("molten_egg", { upgradeAddedType: "attack" });
set("cloak_clasp", { endHandBlock: 1 });
set("gambling_chip", { openingDiscardDraw: true });
set("captains_wheel", { nthTurn: 3, nthTurnBlock: 18 });
set("vexing_puzzlebox", { openingRandom: 1, openingRandomFree: true });
set("bellows", { openingUpgradeHand: true });
set("mummified_hand", { powerFreeRandom: true });
set("old_coin", { gainGold: 300 }); set("golden_pearl", { gainGold: 150 });
set("signet_ring", { gainGold: 999 });
set("intimidating_helmet", { costlyBlock: 4, costlyThreshold: 2 });
set("girya", { restAction: "lift" });
set("pocketwatch", { fewCardsDraw: 3, fewCardsLimit: 3 });
set("sturdy_clamp", { keepBlock: 10 });
set("kunai", { tripleAttackDexterity: 1 });
set("stone_calendar", { endTurn: 7, endTurnDamage: 52 });
set("beating_remnant", { turnHpLossCap: 20 });
set("game_piece", { powerDraw: 1 });
set("shuriken", { tripleAttackStrength: 1 });
set("the_courier", { shopDiscount: 0.8 });
set("membership_card", { shopDiscount: 0.5 });
set("art_of_war", { noAttackNextEnergy: 1 });
set("razor_tooth", { upgradePlayed: true });
set("tungsten_rod", { reduceHpLoss: 1 });
set("lizard_tail", { deathHealFraction: 0.5 });
set("charons_ashes", { exhaustDamage: 3 });
set("demon_tongue", { firstTurnLossHeal: true });
set("ruined_helmet", { firstStrengthDouble: true });
set("paper_krane", { weakMultiplier: 0.6 });
set("orange_dough", { openingRandom: 2, openingRandomPack: "colorless" });
set("big_hat", { openingRandom: 2, openingRandomEthereal: true });
set("ivory_tile", { costlyEnergy: 1, costlyThreshold: 3 });
set("power_cell", { openingFetchZero: 2 });
set("dingy_rug", { allowColorlessRewards: true });
set("dollys_mirror", { choice: "duplicate", choiceCount: 1 });
set("toolbox", { openingChooseColorless: 3 });
set("chemical_x", { xBonus: 2 });
set("dragon_fruit", { goldGainMaxHp: 1 });
set("screaming_flagon", { emptyHandDamage: 20 });
set("bread", { firstTurnEnergy: -2, laterTurnEnergy: 1 });
set("burning_sticks", { firstSkillExhaustCopy: true });
set("ringing_triangle", { firstTurnRetain: true });
set("the_abacus", { shuffleBlock: 6 });
set("miniature_tent", { allRestOptions: true });
set("orrery", { cardChoices: 5 });
set("sling_of_courage", { eliteOpeningStrength: 2 });
set("ghost_seed", { starterVoid: true });
set("brimstone", { turnStrength: 2, enemyTurnStrength: 1 });
set("arcane_scroll", { gainRandomRarity: "rare" });
set("hefty_tablet", { cardChoices: 1, cardChoiceRarity: "rare", addCards: ["mengsan_wound_shuying"] });
set("pomander", { choice: "upgrade", choiceCount: 1 });
set("fishing_rod", { normalBattleUpgradeEvery: 3 });
set("booming_conch", { eliteOpeningDraw: 2, eliteFirstTurnEnergy: 1 });
set("precise_scissors", { choice: "remove", choiceCount: 1 });
set("precarious_shears", { choice: "remove", choiceCount: 2, gainLoseHp: 16 });
set("lead_paperweight", { cardChoices: 1, cardChoicePack: "colorless", choiceOfferCount: 2 });
set("lava_rock", { actOneBossRelics: 2 });
set("stone_humidifier", { restMaxHp: 5 });
set("new_leaf", { choice: "transform", choiceCount: 1 });
set("small_capsule", { randomRelics: 1 });
set("large_capsule", { randomRelics: 2, addStarters: true });
set("neows_talisman", { upgradeStarters: true });
set("neows_torment", { addCards: ["mengsan_event_neows_fury"] });
set("neows_bones", { randomRelics: 2, randomRelicAncient: "涅奥", randomCurse: 1 });
set("leafy_poultice", { transformStarters: true, maxHp: -12 });
set("cursed_pearl", { addCards: ["mengsan_curse_greed"], gainGold: 333 });
set("glass_eye", { cardChoiceRarities: ["common", "common", "uncommon", "uncommon", "rare"] });
set("radiant_pearl", { openingCards: ["mengsan_event_glow"] });
set("sand_castle", { gainUpgrade: 6 });
set("paels_legion", { cardBlockDoubleCooldown: 2 });
set("paels_horn", { addCards: ["mengsan_event_relax", "mengsan_event_relax"] });
set("paels_tears", { unspentNextEnergy: 2 });
set("paels_flesh", { fromTurn: 3, turnEnergy: 1 });
set("paels_blood", { turnDraw: 1 });
set("paels_tooth", { choice: "store", choiceCount: 5, returnStored: true });
set("paels_eye", { noCardsExtraTurn: true });
set("biiig_hug", { choice: "remove", choiceCount: 4, shuffleCard: "mengsan_status_soot" });
set("storybook", { addCards: ["mengsan_event_brightest_flame"] });
set("toasty_mittens", { exhaustTopStrength: 1 });
set("seal_of_gold", { paidTurnEnergy: 1, paidTurnGold: 5 });
set("pumpkin_candle", { candleEnergy: 1, candleBattles: 5, restAction: "rekindle" });
set("very_hot_cocoa", { firstTurnEnergy: 4 });
set("blessed_antler", { turnEnergy: 1, openingDrawCards: ["mengsan_dazed_shuying", "mengsan_dazed_shuying", "mengsan_dazed_shuying"] });
set("fur_coat", { markBattles: 7 });
set("brilliant_scarf", { fifthCardFree: true });
set("jewelry_box", { addCards: ["mengsan_event_apotheosis"] });
set("diamond_diadem", { fewCardsHalfDamage: 2 });
set("sai", { turnBlock: 7 });
set("spiked_gauntlets", { turnEnergy: 1, powerTax: 1 });
set("claws", { choice: "bite", choiceCount: 6, optionalChoices: true });
set("meat_cleaver", { restAction: "cook" });
set("crossbow", { turnRandomAttack: true });
set("tanxs_whistle", { addCards: ["mengsan_event_whistle"] });
set("iron_club", { cardDrawEvery: 4 });
set("throwing_axe", { firstCardEcho: true });
set("war_hammer", { eliteUpgrade: 4 });
set("jeweled_mask", { openingFetchPower: true });
set("fiddle", { turnDraw: 2, noMidturnDraw: true });
set("choices_paradox", { openingChooseRandom: 5, chosenRetain: true });
set("blood_soaked_rose", { turnEnergy: 1, addCards: ["mengsan_curse_enthralled"] });
set("preserved_fog", { choice: "remove", choiceCount: 3, addCards: ["mengsan_curse_folly"] });
set("music_box", { firstAttackVoidCopy: true });
set("sere_talon", { randomCurse: 2, addCards: ["mengsan_event_wish", "mengsan_event_wish", "mengsan_event_wish"] });
set("distinguished_cape", { maxHp: -9, addCards: ["mengsan_event_apparition", "mengsan_event_apparition", "mengsan_event_apparition"] });
set("dusty_tome", { gainAncientCard: true });
set("runic_pyramid", { retainHand: true });
set("black_star", { eliteRelics: 1 });
set("empty_cage", { choice: "remove", choiceCount: 2 });
set("ectoplasm", { blockGold: true, turnEnergy: 1 });
set("pandoras_box", { transformAllStarters: true });
set("velvet_choker", { turnEnergy: 1, turnCardLimit: 6 });
set("philosophers_stone", { turnEnergy: 1, openingEnemyStrength: 1 });
set("astrolabe", { choice: "transformUpgrade", choiceCount: 3 });
set("snecko_eye", { turnDraw: 2, confusion: true });
set("fake_snecko_eye", { confusion: true });
set("calling_bell", { randomRelics: 3, addCards: ["mengsan_curse_curse_of_the_bell"] });
set("mr_struggles", { turnNumberDamage: true });
set("bing_bong", { duplicateAdded: true });
set("dream_catcher", { restCardChoice: true });
set("big_mushroom", { maxHp: 20, openingDraw: -2 });
set("the_boot", { minimumAttackDamage: 5 });
set("fragrant_mushroom", { gainLoseHp: 15, gainUpgrade: 2 });
set("daughter_of_the_wind", { attackBlock: 1 });
set("bone_tea", { oneBattleUpgradeHand: true });
set("darkstone_periapt", { addedCurseMaxHp: 6 });
set("maw_bank", { nodeGold: 12, breaksOnPurchase: true });
set("fake_lees_waffle", { gainHealFraction: 0.1 });
set("history_course", { replayLastAttackSkill: true });
set("lost_wisp", { powerDamage: 8 });
set("fake_merchants_rug wongo_customer_appreciation_badge circlet", { noEffect: true });
set("sword_of_stone", { eliteTransformAfter: 5, transformRelic: "sword_of_jade" });
set("hand_drill", { breakBlockVulnerable: 2 });
set("chosen_cheese", { battleMaxHp: 1 });
set("royal_poison", { openingLoseHp: 4 });
set("wongos_mystery_ticket", { afterBattles: 5, randomRelicsAfter: 3 });
set("tea_of_discourtesy", { oneBattleDrawCards: ["mengsan_dazed_shuying", "mengsan_dazed_shuying"] });
set("forgotten_soul", { exhaustRandomDamage: 1 });
set("ember_tea", { limitedOpeningStrength: 2, limitedBattles: 5 });
set("dowsing_rod", { addCards: ["mengsan_event_seek"] });

// These require unavailable gameplay or source-specific enchantments, not just fields.
export const missingMechanisms = Object.freeze({
    divine_right: "辉星系统", divine_destiny: "辉星系统",
    bound_phylactery: "奥斯提召唤系统", phylactery_unbound: "奥斯提召唤系统",
    cracked_core: "充能球系统", infused_core: "充能球系统",
    potion_belt: "可使用的药水及栏位系统", snecko_skull: "玩家中毒牌与中毒系统",
    fencing_manual: "铸造系统", bone_flute: "奥斯提攻击系统", data_disk: "集中与充能球系统",
    twisted_funnel: "中毒系统", reptile_trinket: "可使用的药水系统", petrified_toad: "药水形状的石头",
    tiny_mailbox: "可使用的药水系统", white_beast_statue: "药水掉落系统",
    galactic_dust: "辉星消费系统", regalite: "所有来源的生成牌事件（当前只有部分接口）",
    book_repair_knife: "灾厄与爪牙系统", funerary_mask: "灵魂牌与奥斯提系统",
    gold_plated_cables: "充能球系统", symbiotic_virus: "充能球系统",
    helical_dart: "小刀牌与静默猎手牌组", lunar_pastry: "辉星系统", mini_regent: "辉星系统",
    bookmark: "跨回合保留牌的独立费用下降", emotion_chip: "充能球系统", metronome: "充能球系统",
    cauldron: "可使用的药水系统", kifuda: "伶俐附魔", gnarled_hammer: "锋利附魔", punch_dagger: "动量附魔",
    mystic_lighter: "STS2 附魔系统（现有词缀不是网页附魔）", royal_stamp: "王室认证附魔",
    wing_charm: "迅捷附魔", belt_buckle: "可使用的药水系统", ninja_scroll: "小刀牌与静默猎手牌组",
    vitruvian_minion: "仆从牌与储君牌组", undying_sigil: "灾厄系统", runic_capacitor: "充能球系统",
    silken_tress: "华彩附魔", massive_scroll: "多人游戏牌池", scroll_boxes: "网页指定卡牌包",
    lost_coffer: "药水奖励系统", kaleidoscope: "其他四角色牌组", phial_holster: "药水系统",
    winged_boots: "路线越界选择和次数确认", electric_shrymp: "注能附魔", driftwood: "独立奖励重掷流程",
    archaic_tooth: "先古版本初始牌对应表", sea_glass: "其他四角色牌组", prismatic_gem: "其他四角色牌组",
    alchemical_coffer: "可使用的药水系统", touch_of_orobas: "初始遗物配置与替换选择",
    paels_growth: "克隆附魔", paels_wing: "奖励献祭流程", paels_claw: "黏糊附魔",
    golden_compass: "第二章特殊直道地图数据", toy_box: "蜡制遗物名单与融化规则", nutritious_soup: "特兹卡塔拉的余烬附魔",
    beautiful_bracelet: "迅捷附魔", delicate_frond: "药水系统", glitter: "华彩附魔",
    tri_boomerang: "本能附魔（不可替换成现有固有词缀）", whispering_earring: "瓦库接管第一回合的行动规则",
    sozu: "可使用的药水系统", fresnel_lens: "灵巧附魔", byrdpip: "幼年异鸟陪伴单位与行为",
    neows_sacrifice: "可使用的龙涎香药水",
    juzu_bracelet: "当前问号事件没有随机常规战斗入口，暂无作用",
    lasting_candy: "独立的额外能力牌奖励组", white_star: "独立的额外稀有卡奖励组",
    prayer_wheel: "独立的额外卡牌奖励组", lava_lamp: "奖励候选逐张升级与无伤结算记录",
    unsettling_lamp: "所有负面状态牌效果的单次翻倍接口", silver_crucible: "前三次卡牌奖励升级和空宝箱流程",
});
export const relicRules = Object.freeze(Object.fromEntries(Object.entries(rules).map(([id, rule]) => [id, Object.freeze(rule)])));

// Acquisition is enabled only when EVERY property has a real consumer. Adding a
// catalog entry or rule alone must never silently publish an unfinished reward.
export const supportedRuleKeys = new Set(`battleHeal replaces openingDraw earlyTurnDraw earlyTurns firstHpLossDraw turnDraw turnEvery shopHeal maxHp fullHeal strikeDamage openingVulnerable openingWeak firstTurnEnergy afterRestEnergy plating restHeal openingDamage openingStrength openingBlock gainUpgrade upgradeType thorns deckAddHealEvery deckAddHeal openingHeal openingDexterity battleGold lowHpStrength emptyBlock noAttackBlock vigor nthTurn nthTurnBlock killDraw killEnergy nthAttackDouble eventHeal exhaustDrawEvery tripleAttackBlock tripleSkillDamage nthTurnStrength nthTurnDexterity attackEnergyEvery turnDamage bossOpeningHeal tripleAttackDamage upgradedAttackDamage skillBlockEvery skillBlock firstPowerBlock restEntryHealPerFive goldMultiplier deckAddGold endBlockThreshold endBlockDamage nthTurnEnergy vulnerableMultiplier hpLossNextBlock keepEnergy lowHpBattleHeal upgradeAddedType endHandBlock gainGold restAction fewCardsDraw fewCardsLimit keepBlock tripleAttackDexterity endTurn endTurnDamage turnHpLossCap powerDraw tripleAttackStrength shopDiscount noAttackNextEnergy reduceHpLoss deathHealFraction weakMultiplier choice choiceCount optionalChoices xBonus goldGainMaxHp allRestOptions cardChoices eliteOpeningStrength gainRandomRarity cardChoiceRarity addCards normalBattleUpgradeEvery eliteOpeningDraw eliteFirstTurnEnergy gainLoseHp cardChoicePack choiceOfferCount restMaxHp randomRelics addStarters upgradeStarters randomRelicAncient randomCurse transformStarters cardChoiceRarities unspentNextEnergy fromTurn turnEnergy returnStored paidTurnEnergy paidTurnGold candleEnergy candleBattles fifthCardFree turnBlock powerTax cardDrawEvery eliteUpgrade blockGold transformAllStarters turnCardLimit openingEnemyStrength turnNumberDamage duplicateAdded restCardChoice minimumAttackDamage attackBlock addedCurseMaxHp nodeGold breaksOnPurchase gainHealFraction powerDamage noEffect battleMaxHp openingLoseHp limitedOpeningStrength limitedBattles`.split(" "));
for(const key of "retainHand firstTurnRetain eliteRelics eliteTransformAfter transformRelic afterBattles randomRelicsAfter actOneBossRelics".split(" "))supportedRuleKeys.add(key);
for(const key of "openingDrawCards oneBattleDrawCards openingRandom openingRandomFree openingRandomPack openingRandomEthereal openingUpgradeDraw openingUpgradeHand powerFreeRandom firstCardBlockDouble gainAncientCard".split(" "))supportedRuleKeys.add(key);
supportedRuleKeys.add("shuffleBlock");supportedRuleKeys.add("exhaustDamage");
export const unhandledRelicRule = rule => Object.keys(rule).filter(key=>!supportedRuleKeys.has(key));
