import { lib, game, ui, get, ai, _status, getTianshuDifficulty } from "../../shared.js";

const skills = {
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


};

export default skills;
