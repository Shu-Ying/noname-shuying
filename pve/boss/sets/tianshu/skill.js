import { lib, game, ui, get, ai, _status, getTianshuDifficulty } from "../../shared.js";

const skills = {
	//水神共工 over
	shuishen_shuying: {
		mode: ["boss"],
		forced: true,
		group: ["shuishen_shuying_recover", "shuishen_shuying_draw", "shuishen_shuying_damage"],
		subSkill: {
			recover: {
				trigger: { player: "recoverBegin" },
				audio: false,
				forced: true,
				filter(event, player) {
					return game.shuying_getDiscardNamesNum() >= 4;
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
			},
			draw: {
				trigger: { player: "phaseDrawBegin2" },
				audio: false,
				forced: true,
				filter(event, player) {
					return !event.numFixed && game.shuying_getDiscardNamesNum() >= 5;
				},
				async content(event, trigger, player) {
					trigger.num += 5;
				},
			},
			damage: {
				trigger: { source: "damageBegin1" },
				audio: false,
				forced: true,
				filter(event, player) {
					return game.shuying_getDiscardNamesNum() >= 9;
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
			},
		},
	},
	tuanliu_shuying: {
		mode: ["boss"],
		trigger: { player: "phaseJieshuBegin" },
		audio: false,
		forced: true,
		filter(event, player) {
			return game.shuying_getDiscardNum() > 4;
		},
		async content(event, trigger, player) {
			let hp = 2;
			let card = 4;
			let damage = 1;

			if (getTianshuDifficulty() == "nightmare") {
				hp = 3;
				card = 6;
			}


			const num = game.shuying_getDiscardNum();
			if (num > 4) await player.recover(hp);
			if (num > 5) await player.draw(card);
			if (num > 9) {
				for (const target of player.getEnemies(null, false).filter(target => target.isIn())) {
					player.line(target);
					await target.damage(player, damage);
				}
			}
		},
	},
	juehong_shuying: {
		mode: ["boss"],
		trigger: { player: "phaseZhunbeiBegin" },
		audio: false,
		forced: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn());
		},
		async content(event, trigger, player) {
			for (const target of player.getEnemies(null, false).filter(target => target.isIn())) {
				player.line(target);
				if (target.countCards("e")) await target.chooseToDiscard("e", true, target.countCards("e"));
				else if (target.countCards("h")) await target.discard(target.getCards("h").randomGets(Math.min(2, target.countCards("h"))));
			}
		},
	},

	//白起
	changsheng_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		forced: true,
		mod: {
			targetInRange(card, player, target) {
				if (card.name == "sha") return true;
			},
		},
	},
	shashen_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		enable: ["chooseToUse", "chooseToRespond"],
		filterCard: true,
		position: "h",
		viewAs: { name: "sha" },
		viewAsFilter(player) {
			return player.countCards("h") > 0;
		},
		prompt: "将一张手牌当【杀】使用或打出",
		check(card) {
			return 6 - get.value(card);
		},
		group: "shashen_shuying_draw",
		subSkill: {
			draw: {
				trigger: { source: "damageEnd" },
				filter(event, player) {
					return event.card?.name == "sha";
				},
				async content(event, trigger, player) {
					await player.draw(3);
				},
			},
		},
		ai: {
			respondSha: true,
			skillTagFilter(player) {
				return player.countCards("h") > 0;
			},
			order: 4,
		},
	},
	wuan_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		forced: true,
		mod: {
			cardUsable(card, player, num) {
				if (card.name == "sha") return num + 3;
			},
		},
		trigger: { source: "damageBegin1" },
		filter(event, player) {
			return event.card?.name == "sha";
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
	},

	//盘古
	shenqu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		trigger: { player: "damageEnd" },
		forced: true,
		filter(event, player) {
			return player.countCards("h", card => get.color(card) == "red") > 0;
		},
		async content(event, trigger, player) {
			const cards = player.getCards("h", card => get.color(card) == "red");
			await player.lose(cards, ui.cardPile, "insert");
			await player.draw(cards.length);
		},
	},
	lieben_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		trigger: { player: "useCardToPlayered" },
		forced: true,
		filter(event, player) {
			return event.card.name == "sha" && ui.cardPile.lastChild;
		},
		async content(event, trigger, player) {
			const judge = player.judge(card => get.color(card) == "red" ? 2 : -1);
			judge.directresult = ui.cardPile.lastChild;
			judge.judge2 = result => result.bool;
			const result = await judge.forResult();
			if (result.bool) {
				trigger.getParent().addCount = false;
				trigger.getParent().baseDamage++;
			}
		},
	},
	yinjiang_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		trigger: { player: "drawEnd" },
		forced: true,
		filter(event, player) {
			return player.isPhaseUsing() && !player.hasSkill("yinjiang_shuying_disabled") && ui.cardPile.lastChild;
		},
		async content(event, trigger, player) {
			const card = ui.cardPile.lastChild;
			await player.gain(card, "gain2");
			if (get.color(card) == "red") {
				let count = 0;
				for (const target of player.getEnemies(null, false).filter(target => target.isIn())) {
					player.line(target);
					await target.damage(player);
					count++;
				}
				player.storage.yinjiang_shuying_count = (player.storage.yinjiang_shuying_count || 0) + count;
				if (player.storage.yinjiang_shuying_count >= 2) player.addTempSkill("yinjiang_shuying_disabled", { player: "phaseUseEnd" });
			}
		},
		group: "yinjiang_shuying_clear",
		subSkill: {
			clear: {
				trigger: { player: "phaseUseEnd" },
				silent: true,
				async content(event, trigger, player) {
					delete player.storage.yinjiang_shuying_count;
				},
			},
			disabled: { charlotte: true },
		},
	},
	zhuri_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill:1",
		forced: true,
		group: ["zhuri_shuying_draw", "zhuri_shuying_bottom"],
		subSkill: {
			draw: {
				trigger: { player: "useCard" },
				forced: true,
				filter(event, player) {
					return get.color(event.card) == "red";
				},
				async content(event, trigger, player) {
					await player.draw();
				},
			},
			bottom: {
				trigger: { global: "useCardAfter" },
				forced: true,
				filter(event, player) {
					return event.targets?.includes(player) && (event.card.name == "sha" || get.type(event.card) == "trick") && event.cards?.filterInD("d").length;
				},
				async content(event, trigger, player) {
					const cards = trigger.cards.filterInD("d");
					game.log(cards, "被置于牌堆底");
					for (const card of cards) ui.cardPile.appendChild(card);
				},
			},
		},
	},

	//少昊 over
	baiyi_shuying: {
		mode: ["boss"],
		trigger: { global: "phaseBegin" },
		forced: true,
		logTarget: "player",
		filter(event, player) {
			return (
				game.roundNumber < 7 &&
				event.player?.isIn() &&
				player.getEnemies(null, false).includes(event.player)
			);
		},
		async content(event, trigger, player) {
			let num = 1;
			const target = trigger.player;
			player.line(target);

			const difficulty = getTianshuDifficulty();

			if (difficulty == "hard") {
				num = 2;
			} else if (difficulty == "nightmare") {
				num = 3;
			}

			if (game.roundNumber < 3 && target.countGainableCards(player, "he") > 0) {
				const cards = target.getCards("he").randomGets(Math.min(num, target.countCards("he")));
				await player.gain(cards, target, "giveAuto");
			}

			if (game.roundNumber < 5 && target.isIn()) {
				await target.damage(num, "thunder", player);
			}

			if (game.roundNumber < 7 && target.isIn()) {
				const cards = target
					.getCards("he")
					.filter(card => lib.filter.cardDiscardable(card, target, "baiyi_shuying"))
					.randomGets(num);

				if (cards.length) {
					await target.discard(cards);
				}
			}
		},
		ai: {
			threaten: 3,
		},
	},
	shenen_shuying: {
		mode: ["boss"],
		forced: true,
		global: "shenen_shuying_global",
		subSkill: {
			global: {
				mod: {
					targetInRange(card, player, target) {
						const owner = game.findPlayer(current => current.hasSkill("shenen_shuying"));
						if (owner && !owner.getEnemies(null, false).includes(player)) return true;
					},
				},
			},
		},
		ai: {
			threaten: 1.5,
		},
	},

	//玄女 over
	xuanlie_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/天书乱斗:1",
		trigger: { player: "phaseJieshuBegin" },
		forced: true,
		locked: true,
		filter(event, player) {
			return game.hasPlayer(current => {
				return (
					current.isIn() &&
					player.getEnemies(null, false).includes(current) &&
					player.getHistory("gain", evt => evt.getl?.(current)?.cards2?.length).length
				);
			});
		},
		async content(event, trigger, player) {
			const targets = game.filterPlayer(current => {
				return (
					current.isIn() &&
					player.getEnemies(null, false).includes(current) &&
					player.getHistory("gain", evt => evt.getl?.(current)?.cards2?.length).length
				);
			});

			let num = 2;
			if (getTianshuDifficulty() == "normal") num = 1;

			for (const target of targets) {
				player.line(target);
				await target.damage(num, player);
			}
		},
		ai: {
			threaten: 2,
		},
	},
	jiutian_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/天书乱斗:1",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		locked: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn() && target.countGainableCards(player, "h") > 0);
		},
		async content(event, trigger, player) {
			let num = 2;
			const difficulty = getTianshuDifficulty();
			if (difficulty == "normal") num = 1;

			const targets = player.getEnemies(null, false).filter(target => target.isIn() && target.countGainableCards(player, "h") > 0);
			const gained = [];

			for (const target of targets) {
				const cards = target.getCards("h").randomGets(Math.min(num, target.countCards("h")));
				if (cards.length) {
					player.line(target);
					await player.gain(cards, target, "giveAuto");
					gained.addArray(cards);
				}
			}

			if (!gained.length) return;

			const colors = gained.map(card => get.color(card, player)).unique();
			const suits = gained.map(card => get.suit(card, player)).unique();

			if (colors.length >= 2) {
				for (const target of targets) {
					if (!target.isIn()) continue;
					player.line(target);

					target.damage(1, player);
				}
			}

			if (difficulty == "nightmare" && suits.length >= 4) {
				for (const target of targets) {
					if (!target.isIn()) continue;
					player.line(target);
					await target.loseHp();
				}
			}
		},
		ai: {
			threaten: 3,
		},
	},
	dishi_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/天书乱斗:1",
		trigger: { player: "useCard2" },
		filter(event, player) {
			if (!event.targets?.length) return false;
			if (event.card.name != "sha" && get.type(event.card) != "trick") return false;

			const info = get.info(event.card);
			if (event.targets.length == 1) {
				if (info.allowMultiple == false || info.multitarget) return false;
				return game.hasPlayer(current => {
					return (
						!event.targets.includes(current) &&
						lib.filter.targetEnabled2(event.card, player, current) &&
						lib.filter.targetInRange(event.card, player, current)
					);
				});
			}

			return event.targets.length > 1;
		},
		async cost(event, trigger, player) {
			if (trigger.targets.length == 1) {
				event.result = await player
					.chooseTarget(get.prompt(event.skill), `为${get.translation(trigger.card)}增加一个目标`, (card, player, target) => {
						const trigger = get.event().getTrigger();
						return (
							!trigger.targets.includes(target) &&
							lib.filter.targetEnabled2(trigger.card, player, target) &&
							lib.filter.targetInRange(trigger.card, player, target)
						);
					})
					.set("ai", target => {
						const player = get.player();
						const trigger = get.event().getTrigger();
						const effect = get.effect(target, trigger.card, player, player);
						if (player.getEnemies(null, false).includes(target)) return effect;
						return Math.min(0, effect);
					})
					.forResult();
			}
			else {
				event.result = await player
					.chooseTarget(get.prompt(event.skill), `令${get.translation(trigger.card)}减少一个目标`, (card, player, target) => {
						return get.event().getTrigger().targets.includes(target);
					})
					.set("ai", target => {
						const player = get.player();
						const trigger = get.event().getTrigger();
						return -get.effect(target, trigger.card, player, player);
					})
					.forResult();
			}
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			player.line(target);

			if (trigger.targets.includes(target)) {
				trigger.targets.remove(target);
				game.log(target, "不再是", trigger.card, "的目标");
			}
			else {
				trigger.targets.add(target);
				game.log(target, "成为了", trigger.card, "的额外目标");
			}
		},
		ai: {
			threaten: 1.6,
		},
	},

	//旱魃
	xinji_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/天书乱斗:2",
		trigger: { global: "loseAfter" },
		forced: true,
		locked: true,
		filter(event, player) {
			return (
				_status.currentPhase &&
				_status.currentPhase.isIn() &&
				event.player?.isIn() &&
				event.player != _status.currentPhase &&
				!player.getEnemies(null, false).includes(event.player) &&
				event.type == "discard" &&
				event.cards2?.some(card => get.position(card, true) == "d" && event.hs?.includes(card))
			);
		},
		async content(event, trigger, player) {
			const difficulty = getTianshuDifficulty();
			const num = difficulty == "nightmare" ? 2 : 1;
			const target = _status.currentPhase;
			player.line(target);
			await target.damage(num, player);
		},
		ai: {
			threaten: 1.6,
		},
	},
	zhiri_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/天书乱斗:2",
		trigger: { global: "useCardToPlayered" },
		forced: true,
		locked: true,
		filter(event, player) {
			return (
				event.isFirstTarget &&
				event.player?.isIn() &&
				player.getEnemies(null, false).includes(event.player) &&
				get.type2(event.card) == "trick" &&
				get.color(event.card) == "red"
			);
		},
		async content(event, trigger, player) {
			let num = 1;
			const difficulty = getTianshuDifficulty();
			if (difficulty == "hard") {
				num = 2;
			} else if (difficulty == "nightmare") {
				num = 3;
			}

			await player.draw(num);
		},
		ai: {
			threaten: 1.4,
		},
	},
	fenshi_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/天书乱斗:2",
		trigger: { player: "phaseZhunbeiBegin" },
		forced: true,
		locked: true,
		filter(event, player) {
			const num = player.countCards("h") - player.hp;
			if (num < 0) return true;
			if (num > 0) return player.getEnemies(null, false).some(target => target.isIn());
			return false;
		},
		async content(event, trigger, player) {
			const num = player.countCards("h") - player.hp;

			if (num < 0) {
				await player.draw(-num);
				return;
			}

			const enemies = player.getEnemies(null, false).filter(target => target.isIn());
			const map = new Map();

			for (let i = 0; i < num && enemies.length; i++) {
				const target = enemies.randomGet();
				map.set(target, (map.get(target) || 0) + 1);
			}

			for (const [target, damage] of map) {
				if (!target.isIn()) continue;
				player.line(target);
				await target.damage(damage, player);
			}
		},
		ai: {
			threaten: 2,
		},
	},
};

export default skills;
