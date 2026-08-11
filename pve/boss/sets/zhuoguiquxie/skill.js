import { lib, game, ui, get, ai, _status, getTianshuDifficulty } from "../../shared.js";

const skills = {
	//孟婆 over
	aotang_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "phaseBegin",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => {
				if (!target.isIn()) return false;

				return target.getStockSkills(false, true).some(skill => {
					const info = get.info(skill);
					return info && !info.charlotte && !info.temp && !info.sub;
				});
			});
		},
		async content(event, trigger, player) {
			const difficulty = getTianshuDifficulty();
			const enemies = player.getEnemies(null, false).filter(target => {
				if (!target.isIn()) return false;

				return target.getStockSkills(false, true).some(skill => {
					const info = get.info(skill);
					return info && !info.charlotte && !info.temp && !info.sub;
				});
			});
			if (!enemies.length) return;

			const targetNum = difficulty == "nightmare" ? 2 : 1;
			const targets = enemies.randomGets(Math.min(targetNum, enemies.length));
			const disableKey = `aotang_shuying_${player.playerid}`;

			player.addSkill("aotang_shuying_clear");
			player.storage.aotang_shuying_disabled = [];

			for (const target of targets) {
				let skills = target.getStockSkills(false, true).filter(skill => {
					const info = get.info(skill);
					return info && !info.charlotte && !info.temp && !info.sub;
				});
				if (!skills.length) continue;

				if (difficulty == "normal") {
					skills = [skills.randomGet()];
				}

				player.line(target);
				target.disableSkill(disableKey, skills);
				player.storage.aotang_shuying_disabled.push({
					target,
					disableKey,
				});

				game.log(
					target,
					"暂时遗忘了技能",
					`#g${get.translation(skills)}`
				);
			}
		},
		onremove(player) {
			player.removeSkill("aotang_shuying_clear");
		},
		ai: {
			threaten: 2,
		},
		subSkill: {
			clear: {
				charlotte: true,
				forced: true,
				forceDie: true,
				popup: false,
				firstDo: true,
				priority: 100,
				trigger: {
					player: ["phaseBegin", "dieAfter"],
				},
				async content(event, trigger, player) {
					player.removeSkill("aotang_shuying_clear");
				},
				onremove(player) {
					for (const record of player.getStorage("aotang_shuying_disabled")) {
						record.target?.enableSkill(record.disableKey);
					}
					delete player.storage.aotang_shuying_disabled;
				},
			},
		},
	},
	yunju_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		locked: true,
		logTarget: "player",
		filter(event, player) {
			return (
				event.player?.isIn() &&
				event.player.countCards("h") > 0 &&
				player.getEnemies(null, false).includes(event.player)
			);
		},
		async content(event, trigger, player) {
			const difficulty = getTianshuDifficulty();
			let num = 1;

			if (difficulty == "hard") {
				num = 2;
			} else if (difficulty == "nightmare") {
				num = 3;
			}

			player.line(trigger.player);
			await trigger.player.randomDiscard(num, "h");
		},
		ai: {
			threaten: 1.5,
		},
	},
	guimei_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		forced: true,
		locked: true,
		group: [
			"guimei_shuying_turn",
			"guimei_shuying_redirect",
		],
		subSkill: {
			turn: {
				audio: "guimei_shuying",
				trigger: {
					player: "turnOverBefore",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return (
						getTianshuDifficulty() == "nightmare" &&
						!player.isTurnedOver()
					);
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
			},
			redirect: {
				audio: "guimei_shuying",
				trigger: {
					global: "useCardToPlayer",
				},
				forced: true,
				locked: true,
				usable: 1,
				filter(event, player) {
					return (
						getTianshuDifficulty() == "nightmare" &&
						event.player != player &&
						event.target == player &&
						event.isFirstTarget &&
						event.targets?.length == 1
					);
				},
				async content(event, trigger, player) {
					const source = trigger.player;
					const originalTarget = trigger.target;
					let targets;

					if (get.type(trigger.card) == "delay") {
						targets = game.filterPlayer(target => {
							return lib.filter.judge(trigger.card, source, target);
						});
					} else {
						targets = game.filterPlayer(target => {
							return (
								lib.filter.targetEnabled2(trigger.card, source, target) &&
								lib.filter.targetInRange(trigger.card, source, target)
							);
						});
					}

					targets.add(originalTarget);
					const target = targets.randomGet();

					trigger.targets.remove(originalTarget);
					trigger.getParent().triggeredTargets1?.remove(originalTarget);
					trigger.getParent().triggeredTargets2?.remove(originalTarget);
					trigger.untrigger();
					trigger.targets.add(target);

					source.line(target, "thunder");
					game.log(trigger.card, "的目标被改为了", target);

					if (target == player) {
						await source.loseHp();
					} else {
						await player.recover();
					}
				},
			},
		},
		ai: {
			threaten: 1.8,
			effect: {
				target(card, source, target) {
					if (
						getTianshuDifficulty() == "nightmare" &&
						source != target
					) {
						return [1, 0.5];
					}
				},
			},
		},
	},

	//豹尾 over
	eli_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			source: "damageBegin1",
		},
		forced: true,
		locked: true,
		usable(skill, player) {
			return getTianshuDifficulty() == "nightmare" ? Infinity : 1;
		},
		filter(event, player) {
			return (
				event.num > 0 &&
				event.player?.isIn() &&
				player.getEnemies(null, false).includes(event.player)
			);
		},
		async content(event, trigger, player) {
			const difficulty = getTianshuDifficulty();
			const result = await player.judge(card => {
				return get.color(card) == "red" ? 2 : 1;
			}).forResult();

			if (result.color == "red") {
				trigger.num++;
				return;
			}

			if (difficulty == "nightmare") {
				await player.draw();
			}
			player.addTempSkill("wansha", {
				global: "phaseAfter",
			});
		},
		ai: {
			threaten: 1.7,
			damageBonus: true,
		},
	},
	yinsha_shuying: {
		mode: ["boss"],
		audio: false,
		forced: true,
		locked: true,
		mod: {
			targetEnabled(card, source, target) {
				if (
					getTianshuDifficulty() != "normal" &&
					source != target &&
					!source.inRange(target)
				) {
					return false;
				}
			},
		},
		group: "yinsha_shuying_response",
		subSkill: {
			response: {
				audio: "yinsha_shuying",
				trigger: {
					player: "useCard",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return (
						getTianshuDifficulty() != "normal" &&
						game.hasPlayer(target => {
							return target != player && !target.inRange(player);
						})
					);
				},
				async content(event, trigger, player) {
					const targets = game.filterPlayer(target => {
						return target != player && !target.inRange(player);
					});

					trigger.directHit.addArray(targets);
					game.log(targets, "不能响应", player, "使用的", trigger.card);
				},
			},
		},
		ai: {
			threaten: 1.8,
		},
	},

	//鸟嘴 over
	suoxue_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "useCardToPlayered",
		},
		usable(skill, player) {
			const difficulty = getTianshuDifficulty();

			if (difficulty == "nightmare") return 3;
			if (difficulty == "hard") return 2;
			return 1;
		},
		filter(event, player) {
			if (
				!event.target?.isIn() ||
				event.targets?.length != 1 ||
				!get.tag(event.card, "damage") ||
				!player.getEnemies(null, false).includes(event.target)
			) {
				return false;
			}

			const playerCount = player.countCards("h");
			const targetCount = event.target.countCards("h");

			if (targetCount > playerCount) return true;
			if (targetCount >= playerCount) return false;

			return player.hasCard(card => {
				return lib.filter.cardDiscardable(card, player);
			}, "h");
		},
		async cost(event, trigger, player) {
			const target = trigger.target;
			const playerCount = player.countCards("h");
			const targetCount = target.countCards("h");

			if (targetCount > playerCount) {
				const num = Math.min(5, targetCount - playerCount);
				const result = await player
					.chooseBool(
						get.prompt(event.skill, target),
						`将手牌摸至与${get.translation(target)}相同，至多摸${get.cnNumber(num)}张牌`
					)
					.set("ai", () => true)
					.forResult();

				if (result.bool) {
					result.cost_data = "draw";
				}
				event.result = result;
				return;
			}

			const result = await player
				.chooseToDiscard(
					"h",
					1,
					get.prompt(event.skill, target),
					`弃置一张手牌，令${get.translation(trigger.card)}不能被${get.translation(target)}响应`
				)
				.set("filterCard", lib.filter.cardDiscardable)
				.set("ai", card => {
					const player = get.player();
					const trigger = get.event().getTrigger();

					if (
						get.damageEffect(
							trigger.target,
							player,
							player
						) <= 0
					) {
						return 0;
					}
					return 7 - get.value(card);
				})
				.forResult();

			if (result.bool) {
				result.cost_data = "directHit";
			}
			event.result = result;
		},
		async content(event, trigger, player) {
			const target = trigger.target;
			player.line(target);

			if (event.cost_data == "draw") {
				const num = Math.min(
					5,
					target.countCards("h") - player.countCards("h")
				);
				if (num > 0) {
					await player.draw(num);
				}
				return;
			}

			trigger.getParent().directHit.add(target);
			game.log(target, "不能响应", trigger.card);
		},
		ai: {
			threaten: 1.4,
		},
	},
	bingyi_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "loseAfter",
			global: [
				"equipAfter",
				"addJudgeAfter",
				"gainAfter",
				"loseAsyncAfter",
				"addToExpansionAfter",
			],
		},
		usable: 1,
		forced: true,
		locked: true,
		filter(event, player) {
			if (
				getTianshuDifficulty() == "normal" ||
				player.countCards("h") > 0
			) {
				return false;
			}

			const evt = event.getl(player);
			return evt?.player == player && evt.hs?.length > 0;
		},
		async content(event, trigger, player) {
			const num = getTianshuDifficulty() == "nightmare" ? 8 : 5;
			await player.draw(num);
		},
		ai: {
			threaten: 1.5,
			effect: {
				target(card, source, target) {
					if (
						get.tag(card, "loseCard") &&
						target.countCards("h") == 1
					) {
						return [1, 0.6];
					}
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

	//牛头马面 over
	manji_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "useCardToPlayered",
		},
		filter(event, player) {
			return (
				event.card.name == "sha" &&
				event.targets?.length == 1 &&
				event.target?.isIn() &&
				player.getEnemies(null, false).includes(event.target) &&
				event.target.countDiscardableCards(player, "h") > 0
			);
		},
		async cost(event, trigger, player) {
			const difficulty = getTianshuDifficulty();
			const target = trigger.target;
			let num = 1;

			if (difficulty == "hard") {
				num = 2;
			} else if (difficulty == "nightmare") {
				num = 3;
			}

			num = Math.min(
				num,
				target.countDiscardableCards(player, "h")
			);

			event.result = await player
				.discardPlayerCard(
					target,
					"h",
					get.prompt2(event.skill, target),
					num
				)
				.set("chooseonly", true)
				.set("ai", button => {
					const card = button.link;
					if (get.name(card, false) == "sha") {
						return 12 - get.value(card);
					}
					return 6 - get.value(card);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			const target = trigger.target;
			const cards = event.cards;

			player.line(target);
			await target.modedDiscard(cards, player);

			if (!cards.some(card => get.name(card, false) == "sha")) {
				return;
			}

			trigger.getParent().baseDamage++;

			if (getTianshuDifficulty() == "nightmare") {
				player.addTempSkill(
					"manji_shuying_sha",
					"phaseUseAfter"
				);
				player.addMark("manji_shuying_sha", 1, false);
			}
		},
		ai: {
			threaten: 1.5,
		},
		subSkill: {
			sha: {
				charlotte: true,
				onremove: true,
				mark: true,
				marktext: "杀",
				intro: {
					content: "本阶段使用【杀】的次数上限+#",
				},
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") {
							return num + player.countMark("manji_shuying_sha");
						}
					},
				},
			},
		},
	},
	shiyu_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "phaseDrawBegin1",
		},
		forced: true,
		locked: true,
		async content(event, trigger, player) {
			trigger.changeToZero();

			const pileCards = Array.from(ui.cardPile.childNodes);
			const cards = [];

			for (const suit of lib.suit) {
				const list = pileCards.filter(card => {
					return get.suit(card, false) == suit;
				});
				if (list.length) {
					cards.push(list.randomGet());
				}
			}

			if (cards.length) {
				await player.gain(cards, "gain2");
			}
		},
		ai: {
			threaten: 1.4,
		},
	},
	xiaoshou_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return (
				getTianshuDifficulty() != "normal" &&
				player.getEnemies(null, false).some(target => target.isIn())
			);
		},
		async content(event, trigger, player) {
			const enemies = player
				.getEnemies(null, false)
				.filter(target => target.isIn());
			if (!enemies.length) return;

			const target = enemies.randomGet();
			const num = getTianshuDifficulty() == "nightmare" ? 3 : 2;

			player.line(target);
			await target.damage(num, player);
		},
		ai: {
			threaten: 1.8,
		},
	},
	guizhao_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "useCard",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			if (
				getTianshuDifficulty() != "nightmare" ||
				_status.currentPhase != player
			) {
				return false;
			}

			const type = get.type2(event.card, false);
			return !player.getHistory("useCard").some(evt => {
				return (
					evt !== event &&
					get.type2(evt.card, false) == type
				);
			});
		},
		async content(event, trigger, player) {
			await player.draw();
		},
		ai: {
			threaten: 1.3,
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

	//鬼王 over
	jizhou_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			global: "phaseUseBegin",
		},
		forced: true,
		locked: true,
		logTarget: "player",
		filter(event, player) {
			return (
				event.player?.isIn() &&
				player.getEnemies(null, false).includes(event.player)
			);
		},
		async content(event, trigger, player) {
			const target = trigger.player;
			const difficulty = getTianshuDifficulty();
			const num = difficulty == "nightmare" ? 2 : 1;
			const result = await player.judge().forResult();
			const judgeNumber = result.number;

			const cards = target.getCards("he", card => {
				return lib.filter.cardDiscardable(card, target);
			});
			const canDiscard =
				cards.reduce((sum, card) => {
					return sum + get.number(card, false);
				}, 0) > judgeNumber;

			let discarded = false;

			if (canDiscard) {
				const discardResult = await target
					.chooseToDiscard(
						"he",
						`疾咒：弃置任意张点数之和大于${get.cnNumber(judgeNumber)}的牌，或取消并失去${get.cnNumber(num)}点体力`
					)
					.set("complexCard", true)
					.set("judgeNumber", judgeNumber)
					.set("selectCard", () => {
						const sum = ui.selected.cards.reduce((total, card) => {
							return total + get.number(card, false);
						}, 0);

						if (sum > get.event().judgeNumber) {
							return ui.selected.cards.length;
						}
						return ui.selected.cards.length + 1;
					})
					.set("ai", card => {
						const target = get.player();
						const selected = ui.selected.cards.reduce((sum, current) => {
							return sum + get.number(current, false);
						}, 0);

						if (selected > get.event().judgeNumber) return 0;

						const urgency = target.hp <= num ? 4 : target.hp <= 2 ? 2 : 1;
						return get.number(card, false) * urgency - get.value(card);
					})
					.set("num", num)
					.forResult();

				discarded = discardResult.bool;
			}

			if (discarded) {
				target.line(player);
				player.addMark("jizhou_shuying", num, false);
			} else {
				player.line(target);
				await target.loseHp(num);
			}
		},
		marktext: "噬",
		intro: {
			name: "噬",
			content: "mark",
		},
		ai: {
			threaten: 1.7,
		},
	},
	danshi_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "damageBegin1",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			const difficulty = getTianshuDifficulty();
			let num = 1;

			if (difficulty == "hard") {
				num = 2;
			} else if (difficulty == "nightmare") {
				num = 3;
			}

			trigger.num++;
			await player.draw(num);

			if (player.countMark("jizhou_shuying") > 0) {
				player.removeMark("jizhou_shuying", 1, false);
			}
		},
		ai: {
			threaten: 0.8,
			maixie: true,
			effect: {
				target(card, source, target) {
					if (get.tag(card, "damage")) {
						return [1, -1.3, 0, 0.4];
					}
				},
			},
		},
	},
	chihu_shuying: {
		mode: ["boss"],
		audio: false,
		forced: true,
		locked: true,
		group: [
			"chihu_shuying_draw",
			"chihu_shuying_damage",
		],
		subSkill: {
			draw: {
				audio: "chihu_shuying",
				trigger: {
					player: "phaseDrawBegin2",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return (
						getTianshuDifficulty() == "nightmare" &&
						!event.numFixed &&
						!player.isMaxHandcard()
					);
				},
				async content(event, trigger, player) {
					trigger.num += 4;
				},
			},
			damage: {
				audio: "chihu_shuying",
				trigger: {
					source: "damageBegin1",
				},
				forced: true,
				locked: true,
				filter(event, player) {
					return (
						getTianshuDifficulty() == "nightmare" &&
						event.num > 0 &&
						event.player?.isIn() &&
						player.getEnemies(null, false).includes(event.player) &&
						!player.isMaxHp()
					);
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
			},
		},
		ai: {
			threaten: 1.8,
		},
	},

	//阎罗王 over
	dianwei_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn());
		},
		async content(event, trigger, player) {
			let enemies = player
				.getEnemies(null, false)
				.filter(target => target.isIn());

			const sha = {
				name: "sha",
				isCard: true,
			};
			const shaTargets = enemies.filter(target => {
				return (
					target.countCards("e") == 0 &&
					player.canUse(sha, target, false)
				);
			});

			if (shaTargets.length) {
				await player.useCard(sha, shaTargets, false);
			}

			enemies = player
				.getEnemies(null, false)
				.filter(target => {
					return target.isIn() && target.countCards("e") > 0;
				});

			for (const target of enemies) {
				player.line(target);
				await target.randomDiscard("e", player);
			}
		},
		ai: {
			threaten: 1.7,
		},
	},
	xingpan_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:1",
		trigger: {
			player: "phaseUseBegin",
		},
		forced: true,
		locked: true,
		filter(event, player) {
			return player.getEnemies(null, false).some(target => target.isIn());
		},
		async content(event, trigger, player) {
			const enemies = player
				.getEnemies(null, false)
				.filter(target => target.isIn());
			if (!enemies.length) return;

			const result = await player.judge().forResult();

			if (result.color == "red") {
				const target = enemies.find(current => {
					return enemies.every(other => {
						return (
							other == current ||
							other.countCards("h") < current.countCards("h")
						);
					});
				});
				if (!target) return;

				const num = Math.floor(target.countCards("h") / 2);
				if (num <= 0) return;

				target.line(player);
				await target
					.chooseToGive(
						player,
						"h",
						num,
						true,
						`刑判：将${get.cnNumber(num)}张手牌交给${get.translation(player)}`
					)
					.set("ai", card => 7 - get.value(card));
				return;
			}

			const target = enemies.find(current => {
				return enemies.every(other => {
					return (
						other == current ||
						other.getHp() < current.getHp()
					);
				});
			});
			if (!target) return;

			player.line(target);
			await target.loseHp();
		},
		ai: {
			threaten: 1.6,
		},
	},
	zhennu_shuying: {
		mode: ["boss"],
		audio: false,
		trigger: {
			player: "changeHp",
		},
		forced: true,
		locked: true,
		mark: true,
		filter(event, player) {
			return (
				getTianshuDifficulty() != "normal" &&
				!player.storage.zhennu_shuying_used &&
				event.changedHp < 0 &&
				player.hp <= player.maxHp / 2 &&
				player.hp - event.changedHp > player.maxHp / 2
			);
		},
		async content(event, trigger, player) {
			player.storage.zhennu_shuying_used = true;
			player.markSkill("zhennu_shuying");

			await player.draw(4);
			player.insertPhase();
		},
		intro: {
			content(storage, player) {
				return player.storage.zhennu_shuying_used
					? "本局游戏已经发动"
					: "本局游戏尚未发动";
			},
		},
		ai: {
			threaten: 1.8,
		},
	},
	xuanpan_shuying: {
		mode: ["boss"],
		audio: "ext:术樱包/pve/audio/skill/驱鬼逐邪:2",
		trigger: {
			global: "phaseAfter",
		},
		filter(event, player) {
			if (
				getTianshuDifficulty() != "nightmare" ||
				!event.player?.isIn() ||
				!player.getEnemies(null, false).includes(event.player)
			) {
				return false;
			}

			const target = event.player;
			const damage = target
				.getHistory("sourceDamage", evt => {
					return evt.player == player;
				})
				.reduce((sum, evt) => sum + evt.num, 0);

			const draw = target
				.getHistory("gain", evt => {
					return evt.getParent()?.name == "draw";
				})
				.reduce((sum, evt) => sum + evt.cards.length, 0);

			const recover = game
				.getGlobalHistory("changeHp", evt => {
					return (
						evt.player == target &&
						evt.getParent()?.name == "recover"
					);
				})
				.reduce((sum, evt) => sum + evt.num, 0);

			const discard = player
				.getHistory("lose", evt => {
					return (
						evt.type == "discard" &&
						evt.position == ui.discardPile &&
						evt.getlx !== false
					);
				})
				.reduce((sum, evt) => sum + (evt.cards2?.length || 0), 0);

			return (
				damage >= 4 ||
				draw >= 8 ||
				recover >= 3 ||
				discard >= 4
			);
		},
		async cost(event, trigger, player) {
			const target = trigger.player;
			const data = {
				damage:
					target
						.getHistory("sourceDamage", evt => {
							return evt.player == player;
						})
						.reduce((sum, evt) => sum + evt.num, 0) >= 4,
				draw:
					target
						.getHistory("gain", evt => {
							return evt.getParent()?.name == "draw";
						})
						.reduce((sum, evt) => sum + evt.cards.length, 0) >= 8,
				recover:
					game
						.getGlobalHistory("changeHp", evt => {
							return (
								evt.player == target &&
								evt.getParent()?.name == "recover"
							);
						})
						.reduce((sum, evt) => sum + evt.num, 0) >= 3,
				discard:
					player
						.getHistory("lose", evt => {
							return (
								evt.type == "discard" &&
								evt.position == ui.discardPile &&
								evt.getlx !== false
							);
						})
						.reduce((sum, evt) => {
							return sum + (evt.cards2?.length || 0);
						}, 0) >= 4,
			};

			const list = [];
			if (data.damage) list.push("对其造成1至3点伤害");
			if (data.draw) list.push("随机摸1至4张牌");
			if (data.recover) list.push("随机回复1至3点体力");
			if (data.discard) list.push(`令其随机弃置1至3张手牌`);

			const result = await player
				.chooseBool(
					get.prompt(event.skill, target),
					`依次执行：${list.join("；")}`
				)
				.set("ai", () => true)
				.forResult();

			if (result.bool) {
				result.cost_data = data;
			}
			event.result = result;
		},
		async content(event, trigger, player) {
			const target = trigger.player;
			const data = event.cost_data;

			if (data.damage && target.isIn()) {
				player.line(target);
				await target.damage(get.rand(1, 3), player);
			}

			if (data.draw && player.isIn()) {
				await player.draw(get.rand(1, 4));
			}

			if (data.recover && player.isIn() && player.isDamaged()) {
				await player.recover(get.rand(1, 3));
			}

			if (
				data.discard &&
				target.isIn() &&
				target.countCards("h") > 0
			) {
				player.line(target);
				await target.randomDiscard(get.rand(1, 3), "h");
			}
		},
		ai: {
			threaten: 1.5,
		},
	},
};

export default skills;
