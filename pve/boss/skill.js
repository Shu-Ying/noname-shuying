import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import tianshuConfig from "../../tianshu/config.js";

const getTianshuDifficulty = () => {
	return _status[tianshuConfig.settings.difficultyStatusKey] || "normal";
};

const isTianshuDifficultyAtLeast = difficulty => {
	return tianshuDifficultyRank[getTianshuDifficulty()] >= tianshuDifficultyRank[difficulty];
};

const skills = {
	//子鼠
	zishu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		enable: "phaseUse",
		usable: 1,
		filter(event, player) {
			return game.hasPlayer(current => {
				return current != player && current.countCards("h") > player.countCards("h");
			});
		},
		async content(event, trigger, player) {
			while (player.isIn()) {
				const max = Math.max(...game.players.map(current => current.countCards("h")));
				if (player.countCards("h") >= max) break;

				const targets = game.filterPlayer(current => {
					return current != player && current.countCards("h") > player.countCards("h");
				});
				if (!targets.length) break;

				const hasEnemy = targets.some(target => player.getEnemies(null, false).includes(target));

				const result = await player
					.chooseTarget("恣疏：获得一名手牌数大于你的角色一张手牌", (card, player, target) => {
						return target != player && target.countCards("h") > player.countCards("h");
					})
					.set("ai", target => {
						const player = get.player();
						const enemies = player.getEnemies(null, false);
						const isEnemy = enemies.includes(target);
						const hasEnemy = game.hasPlayer(current => {
							return current != player && current.countCards("h") > player.countCards("h") && enemies.includes(current);
						});

						if (hasEnemy && !isEnemy) return 0;
						if (isEnemy) return 8 + target.countCards("h") - get.attitude(player, target);
						return 1 + target.countCards("h") / 10;
					})
					.forResult();

				if (!result.bool) break;

				const target = result.targets[0];
				player.line(target);
				await player.gainPlayerCard({
					target,
					position: "h",
					forced: true,
				});
			}
		},
		ai: {
			order: 4.5,
			result: {
				player(player) {
					const enemies = player.getEnemies(null, false);
					if (game.hasPlayer(current => current != player && current.countCards("h") > player.countCards("h") && enemies.includes(current))) {
						return 1;
					}
					if (game.hasPlayer(current => current != player && current.countCards("h") > player.countCards("h") && !enemies.includes(current))) {
						return 0.2;
					}
					return 0;
				},
			},
			threaten: 1.4,
		},
	},

	//辰龙
	chenlong_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		enable: "phaseUse",
		limited: true,
		skillAnimation: true,
		animationColor: "fire",
		selectTarget: 1,
		filter(event, player) {
			return !player.storage.chenlong_shuying_used && game.hasPlayer(current => current != player && player.getEnemies(null, false).includes(current));
		},
		filterTarget(card, player, target) {
			return target != player && player.getEnemies(null, false).includes(target);
		},
		async content(event, trigger, player) {
			const target = event.targets[0];
			const result = await player.chooseControl([1, 2, 3, 4, 5])
				.set("prompt", "失去任意点体力，然后对一名其他角色造成等量伤害")
				.set("ai", () => 4)
				.forResult();
			const num = result.control;
			if (!num) return;
			player.storage.chenlong_shuying_used = true;
			player.storage.chenlong_shuying_dying = true;
			await player.loseHp(num);
			delete player.storage.chenlong_shuying_dying;
			player.awakenSkill(event.name);
			if (target.isIn()) {
				player.line(target);
				await target.damage(num, player);
			}
		},
		ai: {
			order: 4,
			result: {
				target(player, target) {
					if (!player.getEnemies(null, false).includes(target)) return 0;
					const effect = get.damageEffect(target, player, target);
					if (effect >= 0) return 0;
					return target.hp <= 2 ? effect * 2 : effect;
				},
			},
		},
		group: "chenlong_shuying_dying",
		subSkill: {
			dying: {
				trigger: { player: ["dying", "dyingAfter"] },
				forced: true,
				popup: false,
				charlotte: true,
				filter(event, player) {
					return player.storage.chenlong_shuying_dying && player.hp <= 0;
				},
				async content(event, trigger, player) {
					await player.recoverTo(1);
					if (player.maxHp > 0) await player.loseMaxHp();
				},
			},
		},
	},

	//午马
	wuma_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: { target: "useCardToTargeted" },
		forced: true,
		locked: true,
		filter(event, player) {
			return event.player != player && get.type2(event.card) == "trick";
		},
		async content(event, trigger, player) {
			await player.draw();
		},
		group: ["wuma_shuying_turn", "wuma_shuying_skip"],
		subSkill: {
			turn: {
				audio: "wuma_shuying",
				trigger: { player: "turnOverBefore" },
				forced: true,
				filter(event, player) {
					return !player.isTurnedOver();
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
			},
			skip: {
				audio: "wuma_shuying",
				trigger: { player: ["phaseAnySkipped", "phaseAnyCancelled"] },
				forced: true,
				async content(event, trigger, player) {
					game.log(player, "恢复了", trigger.name);
					await player[trigger.name]();
				},
			},
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (player != target && get.type2(card) == "trick") return [1, 0.5];
				},
			},
		},
	},
	//未羊
	weiyang_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		enable: "phaseUse",
		usable: 1,
		position: "he",
		selectCard: [1, Infinity],
		filter(event, player) {
			return game.hasPlayer(current => current.isDamaged() && !player.getEnemies(null, false).includes(current));
		},
		filterCard(card, player) {
			const type = get.type(card);
			const friends = game.countPlayer(current => current.isDamaged() && !player.getEnemies(null, false).includes(current));
			return ui.selected.cards.length < friends && !ui.selected.cards.some(cardx => get.type(cardx) == type);
		},
		check(card) {
			return 6 - get.value(card);
		},
		async content(event, trigger, player) {
			const num = event.cards.length;
			const friends = game.filterPlayer(current => current.isDamaged() && !player.getEnemies(null, false).includes(current));
			if (!friends.length) return;
			const result = await player.chooseTarget(`令至多${get.cnNumber(num)}名角色回复1点体力`, [1, Math.min(num, friends.length)], (card, player, target) => {
				return target.isDamaged() && !player.getEnemies(null, false).includes(target);
			}).set("ai", target => get.recoverEffect(target, get.player(), get.player())).forResult();
			if (result.bool) {
				for (const target of result.targets) {
					player.line(target);
					await target.recover();
				}
			}
		},
		ai: {
			order: 6,
			result: {
				player(player) {
					return game.hasPlayer(current => current.isDamaged() && !player.getEnemies(null, false).includes(current) && get.recoverEffect(current, player, player) > 0) ? 1 : 0;
				},
			},
		},
	},

	//申猴
	shenhou_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: { target: "useCardToTargeted" },
		filter(event, player) {
			return event.card.name == "sha";
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseBool(get.prompt2(event.skill))
				.set("ai", () => {
					const player = get.player();
					const trigger = get.event().getTrigger();
					return get.effect(player, trigger.card, trigger.player, player) < 0;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const result = await player
				.judge(card => get.color(card) == "red" ? 2 : -1)
				.set("judge2", result => result.bool)
				.forResult();

			if (result.bool) {
				trigger.getParent().excluded.add(player);
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (card.name == "sha") return [1, 0.6];
				},
			},
		},
	},

	//戌狗
	xvgou_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		forced: true,
		group: ["xvgou_shuying_cancel", "xvgou_shuying_damage"],
		mod: {
			targetInRange(card, player, target) {
				if (card.name == "sha" && get.color(card) == "red") return true;
			},
		},
		subSkill: {
			cancel: {
				trigger: { target: "useCardToTargeted" },
				forced: true,
				filter(event, player) {
					return event.card.name == "sha" && get.color(event.card) == "red";
				},
				async content(event, trigger, player) {
					trigger.getParent().excluded.add(player);
				},
			},
			damage: {
				trigger: { source: "damageBegin1" },
				forced: true,
				filter(event, player) {
					return event.card?.name == "sha" && get.color(event.card) == "red";
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
			},
		},
	},

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


	//曹操 over
	jianxiong_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return event.num > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseBool(get.prompt2(event.skill))
				.set("ai", () => true)
				.forResult();
		},
		async content(event, trigger, player) {
			if (get.itemtype(trigger.cards) == "cards" && get.position(trigger.cards[0], true) == "o") {
				await player.gain(trigger.cards, "gain2");
			}
			await player.draw();
		},
		ai: {
			maixie: true,
			maixie_hp: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) return [1, -1];
					if (get.tag(card, "damage")) return [1, 0.6];
				},
			},
		},
	},
	lingba_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "phaseBegin" },
		forced: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn()) && game.players.every(current => player.countCards("h") >= current.countCards("h"));
		},
		async content(event, trigger, player) {
			const num = getTianshuDifficulty() == "nightmare" ? 2 : 1
			const enemies = player.getEnemies(null, false).filter(target => target.isIn());
			if (player.countCards("h") >= player.hp * 2) {
				for (const target of enemies) {
					player.line(target);
					await target.damage(num, player);
				}
			}
			else {
				const target = enemies.randomGet();
				player.line(target);
				await target.damage(num, player);
			}
		},
	},
	yishen_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "recoverBegin" },
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.countGainableCards(player, "e") > 0);
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseBool(get.prompt2(event.skill))
				.set("ai", () => {
					const player = get.player();
					const trigger = get.event().getTrigger();

					if (player.hp <= 1) return false;
					if (player.hp + trigger.num <= 2) return false;

					const enemies = player.getEnemies(null, false).filter(target => {
						return target.isIn() && target.countGainableCards(player, "e") > 0;
					});
					if (!enemies.length) return false;

					const recoverEffect = get.recoverEffect(player, player, player);
					const difficulty = getTianshuDifficulty();

					if (difficulty == "nightmare") {
						let total = 0;
						let max = 0;
						for (const target of enemies) {
							for (const card of target.getCards("e")) {
								const value = get.value(card, target);
								total += value;
								if (value > max) max = value;
							}
						}
						if (max < 5) return false;
						return total >= recoverEffect + 4;
					}

					let best = 0;
					for (const target of enemies) {
						for (const card of target.getCards("e")) {
							const value = get.value(card, target);
							if (value > best) best = value;
						}
					}

					if (best < 5) return false;
					return best >= recoverEffect;
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const enemies = player.getEnemies(null, false).filter(target => target.countGainableCards(player, "e") > 0);
			const difficulty = getTianshuDifficulty();

			trigger.cancel();

			if (difficulty == "nightmare") {
				for (const target of enemies) {
					player.line(target);
					await player.gainPlayerCard({ target, position: "e", forced: true });
				}
			}
			else {
				const target = enemies.randomGet();
				player.line(target);
				await player.gainPlayerCard({ target, position: "e", forced: true });
			}
		},
		ai: {
			threaten: 1.4,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "recover") && target.hasSkill("yishen_shuying")) {
						if (target.hp <= 1) return [1, 1.2];
						if (target.hp <= 2) return [1, 0.8];

						const enemies = target.getEnemies(null, false).filter(current => {
							return current.isIn() && current.countGainableCards(target, "e") > 0;
						});
						if (!enemies.length) return;

						let best = 0;
						for (const enemy of enemies) {
							for (const equip of enemy.getCards("e")) {
								best = Math.max(best, get.value(equip, enemy));
							}
						}

						if (best >= 5) return [1, 0.4];
					}
				},
			},
		},
	},

	//司马懿 over
	fankui_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "damageEnd" },
		logTarget: "source",
		filter(event, player) {
			return (
				event.num > 0 &&
				event.source?.isIn() &&
				player.getEnemies(null, false).includes(event.source) &&
				event.source.hasGainableCards(player, "he")
			);
		},
		async content(event, trigger, player) {
			await player.gainPlayerCard({
				target: trigger.source,
				position: "he",
				forced: true,
			});
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.countCards("he") > 1 && get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) return [1, -1.5];
						if (target.getEnemies(null, false).includes(player)) return [1, 1];
					}
				},
			},
		},
	},
	guicai_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { global: "judge" },
		filter(event, player) {
			return player.countCards("hes") > 0;
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseCard(`${get.translation(trigger.player)}的${trigger.judgestr || ""}判定为${get.translation(trigger.player.judging[0])}，${get.prompt(event.skill)}`, "hes", card => {
				const player = get.player();
				const mod2 = game.checkMod(card, player, "unchanged", "cardEnabled2", player);
				if (mod2 != "unchanged") return mod2;
				const mod = game.checkMod(card, player, "unchanged", "cardRespondable", player);
				if (mod != "unchanged") return mod;
				return true;
			}).set("ai", card => {
				const trigger = get.event().getTrigger(), player = get.player(), judging = trigger.player.judging[0];
				const result = trigger.judge(card) - trigger.judge(judging);
				const attitude = player.getEnemies(null, false).includes(trigger.player) ? -1 : 1;
				let value = get.value(card, player);
				value /= get.subtype(card) == "equip2" ? 2 : 4;
				if (result == 0) return 0;
				return attitude > 0 ? result - value : -result - value;
			}).set("judging", trigger.player.judging[0]).forResult();
		},
		popup: false,
		async content(event, trigger, player) {
			const next = player.respond(event.cards, event.name, "highlight", "noOrdering");
			await next;
			const { cards } = next;
			if (cards?.length) {
				if (trigger.player.judging[0].clone) {
					trigger.player.judging[0].clone.classList.remove("thrownhighlight");
					game.broadcast(card => {
						if (card.clone) card.clone.classList.remove("thrownhighlight");
					}, trigger.player.judging[0]);
					game.addVideo("deletenode", player, get.cardsInfo([trigger.player.judging[0].clone]));
				}
				await game.cardsDiscard(trigger.player.judging[0]);
				trigger.player.judging[0] = cards[0];
				trigger.orderingCards.addArray(cards);
				game.log(trigger.player, "的判定牌改为", cards);
				await game.delay(2);
			}
		},
		ai: { rejudge: true, tag: { rejudge: 1 } },
	},
	langgu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "gainAfter" },
		forced: true,
		filter(event, player) {
			if (player.hasSkill("langgu_shuying_used")) return false;
			return game.hasPlayer(current => {
				return (
					current != player &&
					player.getEnemies(null, false).includes(current) &&
					event.getl?.(current)?.cards2?.length
				);
			});
		},
		async content(event, trigger, player) {
			const source = game.findPlayer(current => {
				return (
					current != player &&
					player.getEnemies(null, false).includes(current) &&
					trigger.getl?.(current)?.cards2?.length
				);
			});
			if (!source) return;

			player.addTempSkill("langgu_shuying_used", "roundStart");

			const result = await player.judge(card => get.suit(card) == "spade" ? 2 : 0).forResult();
			if (result.bool && source.isIn() && source.countDiscardableCards(player, "h") > 0) {
				player.removeSkill("langgu_shuying_used");
				player.line(source);
				const card = source.getCards("h").randomGet();
				await source.discard(card);
			}
		},
		subSkill: {
			used: { charlotte: true },
		},
	},
	yuanlv_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { source: "damageBegin4" },
		filter(event, player) {
			return event.card && get.type2(event.card) == "trick" && event.player?.isIn() && player.getEnemies(null, false).includes(event.player);
		},
		async cost(event, trigger, player) {
			event.result = await player.chooseBool(get.prompt(event.skill, trigger.player))
				.set("ai", () => true)
				.forResult();
		},
		async content(event, trigger, player) {
			const target = trigger.player;
			trigger.cancel();
			await player.draw();
			target.line(player);
			if (getTianshuDifficulty() == "nightmare") {
				await player.damage(1, target, "unreal");
			}
			else {
				await player.damage(1, target);
			}
		},
	},

	//吕布 over
	wushuang_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:2",
		trigger: { source: "damageBegin1" },
		forced: true,
		locked: true,
		usable(skill, player) {
			return getTianshuDifficulty() == "nightmare" ? 2 : 1;
		},
		logTarget: "player",
		filter(event, player) {
			const target = event.player;
			const evtx = event.getParent(2);
			const card = event.card;
			if (!card || !["sha", "juedou"].includes(card.name)) return false;

			if (card.name == "sha") {
				return !target.hasHistory("useCard", evt => {
					return evt.card.name == "shan" && evt.respondTo && evt.getParent(3) == evtx;
				});
			}

			return !target.hasHistory("respond", evt => {
				return evt.card.name == "sha" && evt.respondTo && evt.getParent(3) == evtx;
			});
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
		group: ["wushuang_shuying_1", "wushuang_shuying_2"],
		subSkill: {
			1: {
				audio: "wushuang_shuying",
				sourceSkill: "wushuang_shuying",
				trigger: { player: "useCardToPlayered" },
				forced: true,
				logTarget: "target",
				filter(event, player) {
					return event.card.name == "sha" && !event.getParent().directHit.includes(event.target);
				},
				async content(event, trigger, player) {
					const id = trigger.target.playerid;
					const map = trigger.getParent().customArgs;
					if (!map[id]) map[id] = {};

					if (typeof map[id].shanRequired == "number") map[id].shanRequired++;
					else map[id].shanRequired = 2;
				},
				ai: {
					directHit_ai: true,
					skillTagFilter(player, tag, arg) {
						if (arg.card.name != "sha" || arg.target.countCards("h", "shan") > 1) return false;
					},
				},
			},
			2: {
				audio: "wushuang_shuying",
				sourceSkill: "wushuang_shuying",
				trigger: { player: "useCardToPlayered", target: "useCardToTargeted" },
				forced: true,
				logTarget(trigger, player) {
					return player == trigger.player ? trigger.target : trigger.player;
				},
				filter(event, player) {
					return event.card.name == "juedou";
				},
				async content(event, trigger, player) {
					const id = (player == trigger.player ? trigger.target : trigger.player).playerid;
					const idt = trigger.target.playerid;
					const map = trigger.getParent().customArgs;

					if (!map[idt]) map[idt] = {};
					if (!map[idt].shaReq) map[idt].shaReq = {};
					if (!map[idt].shaReq[id]) map[idt].shaReq[id] = 1;

					map[idt].shaReq[id]++;
				},
				ai: {
					directHit_ai: true,
					skillTagFilter(player, tag, arg) {
						if (
							arg.card.name != "juedou" ||
							Math.floor(arg.target.countCards("h", "sha") / 2) > player.countCards("h", "sha")
						) {
							return false;
						}
					},
				},
			},
		},
		ai: {
			threaten: 1.8,
			directHit_ai: true,
		},
	},
	shenij_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:2",
		group: [
			"shenij_shuying_judge",
			"shenij_shuying_draw",
			"shenij_shuying_sha",
			"shenij_shuying_target",
		],
		subSkill: {
			judge: {
				audio: "shenij_shuying",
				trigger: { player: "phaseJudgeBegin" },
				filter(event, player) {
					return player.countCards("h") >= 2 && player.countCards("j") > 0;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseToDiscard("h", 2, get.prompt2(event.skill))
						.set("ai", card => {
							const player = get.player();
							if (!player.countCards("j")) return 0;
							return 7 - get.value(card);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					const cards = player.getCards("j");
					await player.discard(cards);
				},
				ai: {
					effect: {
						target(card, player, target) {
							if (get.type(card) == "delay") return [0, 2];
						},
					},
				},
			},
			draw: {
				audio: "shenij_shuying",
				trigger: { player: "phaseDrawBegin2" },
				forced: true,
				filter(event, player) {
					return !event.numFixed;
				},
				async content(event, trigger, player) {
					let num = 2;
					if (getTianshuDifficulty() == "hard") num = 3;
					if (getTianshuDifficulty() == "nightmare") num = 4;

					trigger.num += num;
				},
			},
			sha: {
				audio: "shenij_shuying",
				forced: true,
				mod: {
					cardUsable(card, player, num) {
						let shaNum = 2;
						if (getTianshuDifficulty() == "normal") shaNum = 1;

						if (card.name == "sha") return num + shaNum;
					},
				},
			},
			target: {
				audio: "shenij_shuying",
				trigger: { player: "useCard2" },
				filter(event, player) {
					if (event.card.name != "sha") return false;

					const info = get.info(event.card);
					if (info.allowMultiple == false || info.multitarget || !event.targets) return false;

					const num = getTianshuDifficulty() == "nightmare" ? 2 : 1;
					return game.countPlayer(current => {
						return !event.targets.includes(current) &&
							lib.filter.targetEnabled2(event.card, player, current) &&
							lib.filter.targetInRange(event.card, player, current);
					}) > 0;
				},
				async cost(event, trigger, player) {
					const num = getTianshuDifficulty() == "nightmare" ? 2 : 1;

					event.result = await player
						.chooseTarget(
							get.prompt(event.skill),
							`为此【杀】额外指定至多${get.cnNumber(num)}名目标`,
							[1, num],
							(card, player, target) => {
								const trigger = get.event().getTrigger();
								return !trigger.targets.includes(target) &&
									lib.filter.targetEnabled2(trigger.card, player, target) &&
									lib.filter.targetInRange(trigger.card, player, target);
							}
						)
						.set("ai", target => {
							const player = get.player();
							if (!player.getEnemies(null, false).includes(target)) return 0;
							return get.effect(target, get.event().getTrigger().card, player, player);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					for (const target of event.targets) {
						player.line(target);
						trigger.targets.add(target);
						game.log(target, "成为了", trigger.card, "的额外目标");
					}
				},
				ai: {
					effect: {
						player_use(card, player, target) {
							if (card.name == "sha" && player.getEnemies(null, false).includes(target)) return [1, 0.5];
						},
					},
				},
			},
		},
	},
	zhanjia_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:2",
		trigger: { player: "damageBegin4" },
		forced: true,
		locked: true,
		usable: 1,
		filter(event, player) {
			return event.num > 2;
		},
		async content(event, trigger, player) {
			trigger.num = 2;
			await player.draw(getTianshuDifficulty() == "nightmare" ? 3 : 2);
		},
		ai: {
			filterDamage: true,
			effect: {
				target(card, player, target) {
					if (get.tag(card, "damage")) {
						if (player.hasSkillTag("jueqing", false, target)) return;
						return [1, 0.8];
					}
				},
			},
		},
	},

	//董卓 over
	jiuchi_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		enable: "chooseToUse",
		filterCard(card, player) {
			return get.suit(card, player) == "spade";
		},
		position: "h",
		viewAs: { name: "jiu" },
		viewAsFilter(player) {
			return player.countCards("h", card => get.suit(card, player) == "spade") > 0;
		},
		prompt: "将一张黑桃手牌当【酒】使用",
		check(card) {
			return 6 - get.value(card);
		},
		ai: {
			order: 3.5,
			respondJiu: true,
			skillTagFilter(player) {
				return player.countCards("h", card => get.suit(card, player) == "spade") > 0;
			},
		},
	},
	roulin_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "useCardToPlayered", target: "useCardToTargeted" },
		forced: true,
		locked: true,
		logTarget(trigger, player) {
			return player == trigger.player ? trigger.target : trigger.player;
		},
		filter(event, player) {
			if (event.card.name != "sha") return false;
			if (player == event.player) return event.target.hasSex("female");
			return event.player.hasSex("female");
		},
		async content(event, trigger, player) {
			const id = (player == trigger.player ? trigger.target : player).playerid;
			const map = trigger.getParent().customArgs;
			if (!map[id]) map[id] = {};

			if (typeof map[id].shanRequired == "number") map[id].shanRequired++;
			else map[id].shanRequired = 2;
		},
		ai: {
			halfneg: true,
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (tag === "directHit_ai") return;
				if (arg.card.name != "sha" || !arg.target.hasSex("female") || arg.target.countCards("h", "shan") > 1) {
					return false;
				}
			},
		},
	},
	baonue_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { player: "phaseBegin" },
		forced: true,
		locked: true,
		filter(event, player) {
			return player.getDamagedHp() > 0;
		},
		async content(event, trigger, player) {
			let maxNum = 3;
			if (getTianshuDifficulty() == "hard") maxNum = 4;
			if (getTianshuDifficulty() == "nightmare") maxNum = 5;

			const num = Math.min(maxNum, player.getDamagedHp());
			await player.draw(num);

			const result = await player
				.chooseTarget(`对至多${get.cnNumber(num)}名角色造成1点伤害`, [1, num], (card, player, target) => {
					return target.isIn() && player.getEnemies(null, false).includes(target);
				})
				.set("ai", target => {
					const player = get.player();
					return get.damageEffect(target, player, player);
				})
				.forResult();

			if (result.bool) {
				for (const target of result.targets) {
					player.line(target);
					await target.damage(1, player);
				}
			}

			await player.loseHp();
		},
		ai: {
			threaten: 2,
		},
	},
	qubu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/青青子衿:1",
		trigger: { global: "useCardToPlayered" },
		forced: true,
		locked: true,
		filter(event, player) {
			return (
				event.card.name == "sha" &&
				event.player?.isIn() &&
				!player.getEnemies(null, false).includes(event.player) &&
				event.targets?.length > 0
			);
		},
		async content(event, trigger, player) {
			const result = await player
				.judge(card => get.color(card) == "black" ? 2 : -1)
				.set("judge2", result => result.bool)
				.forResult();

			if (result.bool) {
				const targets = trigger.targets.filter(target => target.isIn());
				for (const target of targets) {
					player.line(target);
					await target.damage(1, player);
				}
			}
		},
		ai: {
			threaten: 1.8,
		},
	},


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
