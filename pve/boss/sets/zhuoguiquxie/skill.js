import { lib, game, ui, get, ai, _status, getTianshuDifficulty } from "../../shared.js";

const skills = {
	//黑白无常 over
	mizui_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { source: "damageEnd" },
		forced: true,
		filter(event, player) {
			return event.player?.isIn() && event.player.countDiscardableCards(player, "he") > 0 && event.card && get.is.damageCard(event.card);
		},
		async content(event, trigger, player) {
			const num = getTianshuDifficulty() == "normal" ? 1 : 2;

			player.line(trigger.player);
			await player.discardPlayerCard(trigger.player, num, "he", true);
		},
		ai: { expose: 0.2 },
	},
	qiangzheng_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { global: "phaseEnd" },
		forced: true,
		logTarget: "player",
		filter(event, player) {
			let num = 2;
			if (getTianshuDifficulty() == "hard") num = 4;
			if (getTianshuDifficulty() == "nightmare") num = 6;

			return event.player?.isIn() && player.getEnemies(null, false).includes(event.player) && event.player.countCards("h") > 0 && event.player.countCards("h") < num;
		},
		async content(event, trigger, player) {
			player.line(trigger.player);
			await player.gain(trigger.player.getCards("h"), trigger.player, "giveAuto");
		},
	},
	xixing_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn());
		},
		async content(event, trigger, player) {
			const enemies = player.getEnemies(null, false).filter(target => target.isIn());

			if (difficulty == "nightmare") {
				for (const target of enemies) {
					player.line(target, "thunder");
					await target.damage(2, "thunder", player);
				}
			} else {
				const max = Math.max(...enemies.map(target => target.hp));
				const target = enemies.filter(target => target.hp == max).randomGet();
				player.line(target, "thunder");
				await target.damage(2, "thunder", player);
			}

			await player.recover(2);
		},
	},
	taiping_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "damageEnd" },
		forced: true,
		locked: true,
		logTarget: "source",
		filter(event, player) {
			return (
				event.num > 0 &&
				event.source?.isIn() &&
				player.getEnemies(null, false).includes(event.source)
			);
		},
		async content(event, trigger, player) {
			const source = trigger.source;
			player.line(source);

			const result = await source
				.chooseToDiscard("h", 2, `太平：弃置两张花色不同的手牌，否则失去1点体力`, card => {
					const cards = ui.selected.cards;
					return !cards.some(cardx => get.suit(cardx) == get.suit(card));
				})
				.set("ai", card => {
					const player = get.player();
					if (player.hp <= 1) return 8 - get.value(card);
					return 6 - get.value(card);
				})
				.forResult();

			if (!result.bool) {
				await source.loseHp();
			}
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage") && target.getEnemies(null, false).includes(player)) {
						if (player.countCards("h") < 2) return [1, -1];
						return [1, 0.4];
					}
				},
			},
		},
	},

	//牛头马面
	shiyv_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "phaseDrawBegin2" },
		forced: true,
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.num = 0;
			const cards = [];
			for (const suit of lib.suit) {
				const card = get.cardPile(card => get.suit(card) == suit, "cardPile", "random");
				if (card) cards.push(card);
			}
			if (cards.length) await player.gain(cards, "gain2");
		},
	},
	manji_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "useCardToPlayered" },
		filter(event, player) {
			return event.card.name == "sha" && event.targets?.length == 1 && player.getEnemies(null, false).includes(event.target) && event.target.countDiscardableCards(player, "h") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseBool(get.prompt(event.skill, trigger.target))
				.set("ai", () => get.attitude(get.player(), get.event().getTrigger().target) < 0)
				.forResult();
		},
		async content(event, trigger, player) {
			const target = trigger.target;
			player.line(target);
			const cards = target.getCards("h").randomGets(Math.min(2, target.countCards("h")));
			await target.discard(cards);
			if (cards.some(card => get.name(card, target) == "sha")) trigger.getParent().baseDamage++;
		},
		ai: { expose: 0.2 },
	},
	xiaoshou_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn());
		},
		async content(event, trigger, player) {
			const target = player.getEnemies(null, false).filter(target => target.isIn()).randomGet();
			player.line(target);
			await target.damage(2, player);
		},
	},

	//鱼鳃 over
	anchao_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		forced: true,
		locked: true,
		group: ["anchao_shuying_gain", "anchao_shuying_start"],
		marktext: "潮",
		intro: {
			name: "暗潮",
			content: "mark",
		},
		subSkill: {
			gain: {
				audio: "anchao_shuying",
				trigger: { global: "phaseJieshuBegin" },
				forced: true,
				logTarget: "player",
				filter(event, player) {
					return (
						event.player?.isIn() &&
						!player.getEnemies(null, false).includes(event.player) &&
						!event.player.getHistory("sourceDamage", evt => evt.num > 0).length
					);
				},
				async content(event, trigger, player) {
					trigger.player.addMark("anchao_shuying", 1);
				},
			},
			start: {
				audio: "anchao_shuying",
				trigger: { global: "phaseBegin" },
				forced: true,
				logTarget: "player",
				filter(event, player) {
					return (
						event.player?.isIn() &&
						!player.getEnemies(null, false).includes(event.player) &&
						event.player.countMark("anchao_shuying") > 0
					);
				},
				async content(event, trigger, player) {
					const target = trigger.player;
					target.storage.anchao_shuying_effect = target.countMark("anchao_shuying");
					target.addTempSkill("anchao_shuying_effect", { player: "phaseAfter" });
				},
			},
			effect: {
				charlotte: true,
				group: ["anchao_shuying_draw", "anchao_shuying_damage"],
				onremove(player) {
					delete player.storage.anchao_shuying_effect;
				},
			},
			draw: {
				audio: "anchao_shuying",
				trigger: { player: "phaseDrawBegin2" },
				forced: true,
				filter(event, player) {
					return !event.numFixed && player.storage.anchao_shuying_effect > 0;
				},
				async content(event, trigger, player) {
					trigger.num += player.storage.anchao_shuying_effect;
				},
			},
			damage: {
				audio: "anchao_shuying",
				trigger: { source: "damageBegin1" },
				forced: true,
				filter(event, player) {
					return (
						player.storage.anchao_shuying_effect > 0 &&
						event.player?.isIn() &&
						player.getEnemies(null, false).includes(event.player)
					);
				},
				async content(event, trigger, player) {
					trigger.num += player.storage.anchao_shuying_effect;
				},
			},
		},
		ai: {
			threaten: 2,
		},
	},
	guixi_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "damageEnd" },
		forced: true,
		locked: true,
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			const num = getTianshuDifficulty() == "nightmare" ? 2 : 1;
			const result = await player
				.judge(card => get.color(card) == "red" ? 2 : 0)
				.set("judge2", result => result.bool)
				.forResult();

			if (result.bool && player.isDamaged()) {
				await player.recover();
			}
			else {
				await player.draw(num);
			}
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) return [1, -1];
						return [1, 0.7];
					}
				},
			},
		},
	},

	//黄蜂 over
	mingchong_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "die" },
		forced: true,
		locked: true,
		forceDie: true,
		logTarget: "source",
		filter(event, player) {
			return event.source?.isIn() && event.source.countDiscardableCards(player, "he") > 0;
		},
		async content(event, trigger, player) {
			const source = trigger.source;
			player.line(source);

			const cards = source
				.getCards("he")
				.filter(card => lib.filter.cardDiscardable(card, source, "mingchong_shuying"));

			if (cards.length) {
				if (getTianshuDifficulty() == "nightmare") {
					await source.discard(cards);
				}
				else {
					await source.discard(cards.randomGets(Math.ceil(cards.length / 2)));
				}
			}
		},
		ai: {
			threaten: 0.8,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage") && target.hp <= 1 && player.countCards("he") > 2) {
						return [1, -0.8];
					}
				},
			},
		},
	},
	duzhen_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "useCardToPlayered" },
		forced: true,
		locked: true,
		logTarget: "target",
		filter(event, player) {
			return (
				event.targets?.length == 1 &&
				event.target?.isIn() &&
				player.getEnemies(null, false).includes(event.target) &&
				event.target.countDiscardableCards(player, "he") > 0
			);
		},
		async content(event, trigger, player) {
			const target = trigger.target;
			const num = getTianshuDifficulty() == "nightmare" ? 2 : 1;
			const cards = [];

			player.line(target);

			const equips = target
				.getCards("e")
				.filter(card => lib.filter.cardDiscardable(card, target, "duzhen_shuying"))
				.randomGets(num);
			cards.addArray(equips);

			if (cards.length < num) {
				const hands = target
					.getCards("h")
					.filter(card => lib.filter.cardDiscardable(card, target, "duzhen_shuying"))
					.randomGets(num - cards.length);
				cards.addArray(hands);
			}

			if (cards.length) {
				await target.discard(cards);
			}
		},
		ai: {
			threaten: 1.8,
			effect: {
				player_use(card, player, target) {
					if (target && player.getEnemies(null, false).includes(target) && target.countCards("he") > 0) {
						return [1, 0.5];
					}
				},
			},
		},
	},

	//日夜游神 over
	huiyun_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn() && target.countCards("h") > 0);
		},
		filterTarget(card, player, target) {
			return target.isIn() && player.getEnemies(null, false).includes(target) && target.countCards("h") > 0;
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			const hs = target.getCards("h");
			player.line(target);
			await target.showCards(hs, `${get.translation(player)}对${get.translation(target)}发动了【${get.translation(event.name)}】`);

			const result = await player
				.choosePlayerCard(target, "h", [1, 2], `弃置${get.translation(target)}至多两张手牌`)
				.set("filterButton", button => {
					const player = get.player();
					const target = get.event().target;
					return lib.filter.canBeDiscarded(button.link, player, target);
				})
				.set("ai", button => {
					const card = button.link;
					const player = get.player();
					const target = get.event().target;
					let value = get.value(card, target);
					if (get.name(card, target) == "tao") value += 3;
					if (get.name(card, target) == "shan") value += 1;
					return value;
				})
				.set("target", target)
				.forResult();

			if (!result.bool || !result.cards?.length) return;

			const names = result.cards.map(card => get.name(card, target)).unique();
			await target.discard(result.cards);

			if (!target.isIn()) return;

			const result2 = await player
				.chooseToDiscard("he", `是否弃置一张同名牌，对${get.translation(target)}造成2点伤害？`, card => {
					return get.event().names.includes(get.name(card));
				})
				.set("names", names)
				.set("ai", card => {
					const player = get.player();
					const target = get.event().target;
					if (!player.getEnemies(null, false).includes(target)) return 0;
					const effect = get.damageEffect(target, player, player);
					if (effect <= 0) return 0;
					return effect * 3 - get.value(card);
				})
				.set("target", target)
				.forResult();

			if (result2.bool) {
				const num = getTianshuDifficulty() == "normal" ? 1 : 2

				player.line(target);
				await target.damage(num, player);
			}
		},
		ai: {
			order: 5,
			result: {
				target(player, target) {
					if (!player.getEnemies(null, false).includes(target)) return 0;
					return -Math.min(2, target.countCards("h"));
				},
			},
			threaten: 1.6,
		},
	},
	yezhong_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "phaseJieshuBegin" },
		forced: true,
		locked: true,
		async content(event, trigger, player) {
			const result = await player
				.judge(card => get.color(card) == "black" ? 2 : -1)
				.set("judge2", result => result.bool)
				.forResult();

			if (result.card) {
				await player.gain(result.card, "gain2");
			}

			if (result.bool) {
				let num = 1;
				if (getTianshuDifficulty() == "hard") num = 2;
				if (getTianshuDifficulty() == "nightmare") num = 3;

				const targets = player.getEnemies(null, false).filter(target => target.isIn() && target.countCards("h") > 0);
				for (const target of targets) {
					player.line(target);
					const cards = target
						.getCards("h")
						.filter(card => lib.filter.cardDiscardable(card, target, "yezhong_shuying"))
						.randomGets(num);

					if (cards.length) {
						await target.discard(cards);
					}
				}
			}
		},
		ai: {
			threaten: 1.8,
		},
	},
	zhoucha_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		locked: true,
		async content(event, trigger, player) {
			const result = await player
				.judge(card => get.color(card) == "red" ? 2 : -1)
				.set("judge2", result => result.bool)
				.forResult();

			if (result.card) {
				await player.gain(result.card, "gain2");
			}

			if (result.bool) {
				player.addTempSkill("zhoucha_shuying_effect", { player: "phaseAfter" });
			}
		},
		subSkill: {
			effect: {
				charlotte: true,
				mod: {
					cardUsable(card, player, num) {
						let number = 1;
						if (getTianshuDifficulty() == "hard") number = 2;
						if (getTianshuDifficulty() == "nightmare") number = 3;

						if (card.name == "sha") return num + number;
					},
				},
			},
		},
		ai: {
			threaten: 1.4,
		},
	},
	duane_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: { global: "phaseDiscardEnd" },
		forced: true,
		locked: true,
		logTarget: "player",
		filter(event, player) {
			const target = event.player;
			return (
				target?.isIn() &&
				player.getEnemies(null, false).includes(target) &&
				target.getHistory("lose", evt => {
					return (
						evt.type == "discard" &&
						evt.getParent("phaseDiscard") == event &&
						evt.cards2?.some(card => get.color(card, target) == "black")
					);
				}).length
			);
		},
		async content(event, trigger, player) {
			const target = trigger.player;
			player.line(target);
			await target.loseHp(2);
		},
		ai: {
			threaten: 1.5,
		},
	},


};

export default skills;
