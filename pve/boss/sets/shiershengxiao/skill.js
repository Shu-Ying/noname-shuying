import { lib, game, ui, get, ai, _status, getTianshuDifficulty } from "../../shared.js";

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

	//丑牛
	chouniu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: {
			player: "phaseJieshuBegin",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return player.isDamaged() && player.isMinHp();
		},
		async content(event, trigger, player) {
			await player.recover();
		},
		ai: {
			threaten: 1.2,
		},
	},

	//寅虎
	yinhu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		enable: "phaseUse",
		position: "he",
		filter(event, player) {
			const enemies = player.getEnemies(null, false);
			return (
				enemies.some(target => target.isIn()) &&
				player.hasCard(card => lib.skill.yinhu_shuying.filterCard(card, player), "he")
			);
		},
		filterCard(card, player) {
			if (!lib.filter.cardDiscardable(card, player)) return false;
			return !player.getStorage("yinhu_shuying_used").some(cardx => {
				return get.type2(cardx[2]) == get.type2(card);
			});
		},
		filterTarget(card, player, target) {
			return (
				target != player &&
				target.isIn() &&
				player.getEnemies(null, false).includes(target)
			);
		},
		check(card) {
			return 8 - get.value(card);
		},
		async content(event, trigger, player) {
			const card = event.cards[0];
			const target = event.target;

			player.addTempSkill("yinhu_shuying_used", "phaseUseAfter");
			player.markAuto("yinhu_shuying_used", [
				[get.translation(get.type2(card)), "", card.name],
			]);

			player.line(target);
			const damageEvent = target.damage(1, player);
			await damageEvent;

			const causedDying = game.getGlobalHistory("everything", evt => {
				return evt.name == "dying" && evt.getParent(damageEvent.name) === damageEvent;
			}).length > 0;

			if (causedDying) {
				player.tempBanSkill("yinhu_shuying");
			}
		},
		ai: {
			order: 7,
			result: {
				target(player, target) {
					if (!player.getEnemies(null, false).includes(target)) return 0;
					return get.damageEffect(target, player, target);
				},
			},
		},
		subSkill: {
			used: {
				charlotte: true,
				onremove: true,
				intro: {
					name: "已弃置的牌类型",
					mark(dialog, content = []) {
						if (content.length) {
							dialog.addSmall([content, "vcard"]);
						}
					},
				},
			},
		},
	},

	//卯兔
	maotu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: {
			global: "dieAfter",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return !player.hasSkill("maotu_shuying_effect", null, false, false);
		},
		async content(event, trigger, player) {
			player.addTempSkill("maotu_shuying_effect", {
				player: "phaseBegin",
			});
		},
		subSkill: {
			effect: {
				charlotte: true,
				mark: true,
				marktext: "兔",
				intro: {
					content: "你不是体力值大于等于你的其他角色使用牌的合法目标",
				},
				mod: {
					targetEnabled(card, source, target) {
						if (source != target && source.getHp() >= target.getHp()) {
							return false;
						}
					},
				},
			},
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

	//巳蛇
	sishe_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: {
			player: "damageEnd",
		},
		logTarget: "source",
		filter(event, player) {
			return (
				event.num > 0 &&
				event.source?.isIn() &&
				player.getEnemies(null, false).includes(event.source)
			);
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseBool(get.prompt2(event.skill, trigger.source))
				.set("ai", () => {
					const player = get.player();
					const trigger = get.event().getTrigger();
					return (
						player.getEnemies(null, false).includes(trigger.source) &&
						get.damageEffect(trigger.source, player, player) > 0
					);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const source = trigger.source;
			player.line(source);
			await source.damage(trigger.num, player);
		},
		ai: {
			threaten: 0.6,
			maixie: true,
			effect: {
				target(card, source, target) {
					if (
						get.tag(card, "damage") &&
						target.getEnemies(null, false).includes(source)
					) {
						return [1, 0, 0, -0.7];
					}
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

	//酉鸡
	youji_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: {
			player: "phaseDrawBegin2",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return game.roundNumber > 0 && !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.num += Math.min(5, game.roundNumber);
		},
		ai: {
			threaten: 1.4,
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

	//亥猪
	haizhu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/十二生肖:1",
		trigger: {
			player: "phaseZhunbeiBegin",
			global: ["loseAfter", "loseAsyncAfter"],
		},
		forced: true,
		locked: true,
		filter(event, player) {
			if (event.name == "phaseZhunbei") {
				return player.isMaxHandcard();
			}

			if (event.type != "discard" || event.getlx === false) {
				return false;
			}

			return game.hasPlayer(target => {
				if (target == player) return false;

				return event.getl?.(target)?.cards2?.some(card => {
					return (
						get.color(card) == "black" &&
						get.position(card, true) == "d"
					);
				});
			});
		},
		async content(event, trigger, player) {
			if (trigger.name == "phaseZhunbei") {
				await player.loseHp();
				return;
			}

			const cards = game
				.filterPlayer(target => {
					if (target == player) return false;

					return trigger.getl?.(target)?.cards2?.some(card => {
						return (
							get.color(card) == "black" &&
							get.position(card, true) == "d"
						);
					});
				})
				.reduce((list, target) => {
					return list.addArray(
						trigger
							.getl(target)
							.cards2.filter(card => {
								return (
									get.color(card) == "black" &&
									get.position(card, true) == "d"
								);
							})
					);
				}, []);

			if (!cards.length) return;

			if (trigger.delay === false) {
				await game.delay();
			}
			await player.gain(cards, "gain2");
		},
		ai: {
			threaten: 1.6,
		},
	},
};

export default skills;
