// 天书羁绊只通过技能表达具体效果；羁绊管理器负责决定当前应持有哪一级技能。
const skill = {
    shuYing_Tianshu_BondSha1: {
        charlotte: true,
        popup: false,
        nopop: true,
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") return num + 1;
            },
        },
    },
    shuYing_Tianshu_BondSha2: {
        charlotte: true,
        popup: false,
        nopop: true,
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") return num + 2;
            },
        },
    },

    //蜀中无大将
    shuYing_Tianshu_Skill_01: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_01_defend",
            "shuYing_Tianshu_Skill_01_damage",
        ],
        subSkill: {
            defend: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "damageBegin4" },
                filter(event, player) {
                    return event.num > 0 && !event.hasNature();
                },
                async content(event, trigger, player) {
                    trigger.cancel();
                },
            },
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return event.num > 0 && player.hp > 0;
                },
                async content(event, trigger, player) {
                    trigger.num += player.hp;
                },
            },
        },
        ai: {
            threaten: 4,
            effect: {
                target(card, player, target) {
                    if (
                        get.tag(card, "damage") &&
                        !get.tag(card, "natureDamage")
                    ) {
                        return "zeroplayertarget";
                    }
                },
            },
        },
    },

    //江东基业
    shuYing_Tianshu_Skill_02_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { player: "phaseDrawBegin2" },
        filter(event, player) {
            return !event.numFixed && player.getDamagedHp() > 0;
        },
        async content(event, trigger, player) {
            trigger.num += player.getDamagedHp();
        },
        ai: {
            threaten: 1.4,
        },
    },
    shuYing_Tianshu_Skill_02_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_02_Count2_draw",
            "shuYing_Tianshu_Skill_02_Count2_discard",
        ],
        subSkill: {
            draw: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "phaseDrawBegin2" },
                filter(event, player) {
                    return !event.numFixed && player.getDamagedHp() > 0;
                },
                async content(event, trigger, player) {
                    trigger.num += player.getDamagedHp();
                },
            },
            discard: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: {
                    global: ["loseAfter", "loseAsyncAfter"],
                },
                getIndex(event, player) {
                    if (
                        event.type != "discard" ||
                        (event.discarder ||
                            event.getParent(2)?.player) != player
                    ) {
                        return [];
                    }

                    const enemies = player.getEnemies(null, false);
                    return game.filterPlayer(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            event.getl?.(target)?.cards2?.length > 0
                        );
                    });
                },
                logTarget(event, player, name, target) {
                    return target;
                },
                filter(event, player, name, target) {
                    return target?.isIn();
                },
                async content(event, trigger, player) {
                    const target = event.indexedData;
                    if (!target?.isIn()) return;

                    player.line(target);
                    await target.damage(1, player);
                },
            },
        },
        ai: {
            threaten: 1.8,
        },
    },
    shuYing_Tianshu_Skill_02_Skill3: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_02_Count3_draw",
            "shuYing_Tianshu_Skill_02_Count3_discard",
            "shuYing_Tianshu_Skill_02_Count3_gain",
        ],
        subSkill: {
            draw: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "phaseDrawBegin2" },
                filter(event, player) {
                    return !event.numFixed && player.getDamagedHp() > 0;
                },
                async content(event, trigger, player) {
                    trigger.num += player.getDamagedHp();
                },
            },
            discard: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: {
                    global: ["loseAfter", "loseAsyncAfter"],
                },
                getIndex(event, player) {
                    if (
                        event.type != "discard" ||
                        (event.discarder ||
                            event.getParent(2)?.player) != player
                    ) {
                        return [];
                    }

                    const enemies = player.getEnemies(null, false);
                    return game.filterPlayer(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            event.getl?.(target)?.cards2?.length > 0
                        );
                    });
                },
                logTarget(event, player, name, target) {
                    return target;
                },
                filter(event, player, name, target) {
                    return (
                        target?.isIn() &&
                        event.getl?.(target)?.cards2?.length > 0
                    );
                },
                async content(event, trigger, player) {
                    const target = event.indexedData;
                    if (!target?.isIn()) return;

                    const num =
                        trigger.getl?.(target)?.cards2?.length || 0;
                    if (num <= 0) return;

                    player.line(target);
                    await target.damage(num, player);
                },
            },
            gain: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: {
                    global: ["gainAfter", "loseAsyncAfter"],
                },
                getIndex(event, player) {
                    if (
                        !event.getl ||
                        !event.getg ||
                        !event.getl(player)?.cards2?.length
                    ) {
                        return [];
                    }

                    const lostCards = event.getl(player).cards2;
                    const enemies = player.getEnemies(null, false);

                    return game.filterPlayer(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            event
                                .getg(target)
                                .some(card => lostCards.includes(card))
                        );
                    });
                },
                logTarget(event, player, name, target) {
                    return target;
                },
                filter(event, player, name, target) {
                    if (!target?.isIn()) return false;

                    const lostCards =
                        event.getl?.(player)?.cards2 || [];
                    return event
                        .getg?.(target)
                        ?.some(card => lostCards.includes(card));
                },
                async content(event, trigger, player) {
                    const target = event.indexedData;
                    if (!target?.isIn()) return;

                    const lostCards =
                        trigger.getl?.(player)?.cards2 || [];
                    const num = trigger
                        .getg(target)
                        .filter(card => lostCards.includes(card))
                        .length;

                    if (num <= 0) return;

                    player.line(target);
                    await target.damage(num, player);
                },
            },
        },
        ai: {
            threaten: 2.5,
        },
    },

    // 舌战群儒
    shuYing_Tianshu_Skill_03_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { player: "useCardToPlayered" },
        filter(event, player) {
            const target = event.target;
            return (
                target?.isIn() &&
                player.getEnemies(null, false).includes(target) &&
                target.countDiscardableCards(player, "he") > 0
            );
        },
        logTarget: "target",
        async content(event, trigger, player) {
            const target = trigger.target;
            const cards = target
                .getCards("he", card => {
                    return lib.filter.cardDiscardable(
                        card,
                        target,
                        event.name
                    );
                })
                .randomGets(1);

            if (!cards.length) return;

            player.line(target);
            const discardEvent = target.discard(cards);
            discardEvent.discarder = player;
            await discardEvent;
        },
    },
    shuYing_Tianshu_Skill_03_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { player: "useCardToPlayered" },
        filter(event, player) {
            const target = event.target;
            if (!target?.isIn()) return false;

            const isEnemy = player
                .getEnemies(null, false)
                .includes(target);

            return (
                !isEnemy ||
                target.countDiscardableCards(player, "he") > 0
            );
        },
        logTarget: "target",
        async content(event, trigger, player) {
            const target = trigger.target;
            const isEnemy = player
                .getEnemies(null, false)
                .includes(target);

            player.line(target);

            if (!isEnemy) {
                await target.draw();
                return;
            }

            const cards = target
                .getCards("he", card => {
                    return lib.filter.cardDiscardable(
                        card,
                        target,
                        event.name
                    );
                })
                .randomGets(2);

            if (!cards.length) return;

            const discardEvent = target.discard(cards);
            discardEvent.discarder = player;
            await discardEvent;
        },
    },

    // 天下无双
    shuYing_Tianshu_Skill_04_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageBegin1" },
        filter(event, player) {
            return (
                event.num > 0 &&
                player.hp > 0 &&
                event.card?.name == "juedou"
            );
        },
        async content(event, trigger, player) {
            trigger.num += player.hp;
        },
        ai: {
            damageBonus: true,
            threaten: 1.8,
        },
    },
    shuYing_Tianshu_Skill_04_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageBegin1" },
        filter(event, player) {
            return (
                event.num > 0 &&
                player.hp > 0 &&
                ["sha", "juedou"].includes(event.card?.name)
            );
        },
        async content(event, trigger, player) {
            trigger.num += player.hp;
        },
        ai: {
            damageBonus: true,
            threaten: 2.5,
        },
    },

    // 五虎上将
    shuYing_Tianshu_Skill_05_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageBegin1" },
        filter(event, player) {
            return event.num > 0 && event.card?.name == "sha";
        },
        async content(event, trigger, player) {
            trigger.num++;
        },
    },
    shuYing_Tianshu_Skill_05_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageBegin1" },
        filter(event, player) {
            return event.num > 0 && event.card?.name == "sha";
        },
        async content(event, trigger, player) {
            trigger.num++;
        },
        mod: {
            cardUsable(card, player, num) {
                if (card.name == "sha") return Infinity;
            },
            targetInRange(card, player, target) {
                if (card.name == "sha") return true;
            },
        },
    },
    shuYing_Tianshu_Skill_05_Skill3: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageBegin1" },
        filter(event, player) {
            return event.num > 0 && event.card?.name == "sha";
        },
        async content(event, trigger, player) {
            trigger.num++;
        },
        mod: {
            cardname(card, player) {
                if (get.position(card) == "h") return "sha";
            },
            cardnature(card, player) {
                if (get.position(card) == "h") return false;
            },
            cardUsable(card, player, num) {
                if (card.name == "sha") return Infinity;
            },
            targetInRange(card, player, target) {
                if (card.name == "sha") return true;
            },
        },
        ai: {
            respondSha: true,
            skillTagFilter(player) {
                return player.countCards("h") > 0;
            },
        },
    },

    // 南蛮入侵
    shuYing_Tianshu_Skill_06_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_06_Skill1_damage",
            "shuYing_Tianshu_Skill_06_Skill1_exclude",
        ],
        mod: {
            targetEnabled(card, player, target) {
                if (
                    get.name(card, player) == "nanman" &&
                    !player.getEnemies(null, false).includes(target)
                ) {
                    return false;
                }
            },
        },
        subSkill: {
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        event.card?.name == "nanman" &&
                        player.getDamagedHp() > 0 &&
                        player.getEnemies(null, false).includes(event.player)
                    );
                },
                async content(event, trigger, player) {
                    trigger.num += player.getDamagedHp();
                },
            },
            exclude: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCardToPlayered" },
                filter(event, player) {
                    return (
                        event.card.name == "nanman" &&
                        !player.getEnemies(null, false).includes(event.target)
                    );
                },
                async content(event, trigger, player) {
                    trigger.excluded.add(trigger.target);
                },
            },
        },
    },
    shuYing_Tianshu_Skill_06_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_06_Skill2_damage",
            "shuYing_Tianshu_Skill_06_Skill2_exclude",
        ],
        mod: {
            cardname(card, player) {
                if (get.type2(card, false) == "trick") {
                    return "nanman";
                }
            },
            targetEnabled(card, player, target) {
                if (
                    get.name(card, player) == "nanman" &&
                    !player.getEnemies(null, false).includes(target)
                ) {
                    return false;
                }
            },
        },
        subSkill: {
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        event.card?.name == "nanman" &&
                        player.getDamagedHp() > 0 &&
                        player.getEnemies(null, false).includes(event.player)
                    );
                },
                async content(event, trigger, player) {
                    trigger.num += player.getDamagedHp();
                },
            },
            exclude: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCardToPlayered" },
                filter(event, player) {
                    return (
                        event.card.name == "nanman" &&
                        !player.getEnemies(null, false).includes(event.target)
                    );
                },
                async content(event, trigger, player) {
                    trigger.excluded.add(trigger.target);
                },
            },
        },
    },
    shuYing_Tianshu_Skill_06_Skill3: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_06_Skill3_damage",
            "shuYing_Tianshu_Skill_06_Skill3_exclude",
        ],
        mod: {
            cardname(card, player) {
                if (get.position(card) == "h") return "nanman";
            },
            targetEnabled(card, player, target) {
                if (
                    get.name(card, player) == "nanman" &&
                    !player.getEnemies(null, false).includes(target)
                ) {
                    return false;
                }
            },
        },
        subSkill: {
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        event.card?.name == "nanman" &&
                        player.getDamagedHp() > 0 &&
                        player.getEnemies(null, false).includes(event.player)
                    );
                },
                async content(event, trigger, player) {
                    trigger.num += player.getDamagedHp();
                },
            },
            exclude: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCardToPlayered" },
                filter(event, player) {
                    return (
                        event.card.name == "nanman" &&
                        !player.getEnemies(null, false).includes(event.target)
                    );
                },
                async content(event, trigger, player) {
                    trigger.excluded.add(trigger.target);
                },
            },
        },
    },

    // 奇策智囊
    shuYing_Tianshu_Skill_07_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { player: "useCard1" },
        filter(event, player) {
            return get.type2(event.card) == "trick";
        },
        async content(event, trigger, player) {
            trigger.directHit.addArray(game.players);
        },
        ai: {
            directHit_ai: true,
        },
    },
    shuYing_Tianshu_Skill_07_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_07_Skill2_directHit",
            "shuYing_Tianshu_Skill_07_Skill2_damage",
        ],
        subSkill: {
            directHit: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCard1" },
                filter(event, player) {
                    return get.type2(event.card) == "trick";
                },
                async content(event, trigger, player) {
                    trigger.directHit.addArray(game.players);
                },
            },
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        get.type2(event.card) == "trick"
                    );
                },
                async content(event, trigger, player) {
                    trigger.num++;
                },
            },
        },
        ai: {
            directHit_ai: true,
        },
    },
    shuYing_Tianshu_Skill_07_Skill3: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_07_Skill3_directHit",
            "shuYing_Tianshu_Skill_07_Skill3_damage",
            "shuYing_Tianshu_Skill_07_Skill3_draw",
        ],
        subSkill: {
            directHit: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCard1" },
                filter(event, player) {
                    return get.type2(event.card) == "trick";
                },
                async content(event, trigger, player) {
                    trigger.directHit.addArray(game.players);
                },
            },
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        get.type2(event.card) == "trick"
                    );
                },
                async content(event, trigger, player) {
                    trigger.num++;
                },
            },
            draw: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageSource" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        get.type2(event.card) == "trick"
                    );
                },
                async content(event, trigger, player) {
                    await player.draw();
                },
            },
        },
        ai: {
            directHit_ai: true,
        },
    },

    // 天下归心
    shuYing_Tianshu_Skill_08_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { player: "damageEnd" },
        filter(event, player) {
            return (
                event.num > 0 &&
                event.source?.isIn() &&
                player.getEnemies(null, false).includes(event.source)
            );
        },
        async content(event, trigger, player) {
            const enemies = player
                .getEnemies(null, false)
                .filter(target => target.isIn());

            for (const target of enemies) {
                const cards = target
                    .getGainableCards(player, "h")
                    .randomGets(1);

                if (cards.length) {
                    player.line(target);
                    await player.gain(cards, target, "giveAuto");
                }
            }

            if (player.isTurnedOver()) {
                await player.turnOver();
            }
            if (player.isLinked()) {
                await player.link();
            }
        },
    },
    shuYing_Tianshu_Skill_08_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { player: "damageEnd" },
        filter(event, player) {
            return (
                event.num > 0 &&
                event.source?.isIn() &&
                player.getEnemies(null, false).includes(event.source)
            );
        },
        async content(event, trigger, player) {
            const enemies = player
                .getEnemies(null, false)
                .filter(target => target.isIn());

            for (const target of enemies) {
                const cards = target
                    .getGainableCards(player, "h")
                    .randomGets(trigger.num);

                if (cards.length) {
                    player.line(target);
                    await player.gain(cards, target, "giveAuto");
                }
            }

            if (trigger.source?.isIn()) {
                player.line(trigger.source);
                await trigger.source.damage(2, player);
            }

            if (player.isTurnedOver()) {
                await player.turnOver();
            }
            if (player.isLinked()) {
                await player.link();
            }
        },
    },

    // 神武再世
    shuYing_Tianshu_Skill_09_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageSource" },
        filter(event, player) {
            return (
                event.num > 0 &&
                event.player?.isIn() &&
                player.getEnemies(null, false).includes(event.player)
            );
        },
        async content(event, trigger, player) {
            await trigger.player.loseHp();
        },
    },
    shuYing_Tianshu_Skill_09_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageSource" },
        filter(event, player) {
            return (
                event.num > 0 &&
                event.player?.isIn() &&
                player.getEnemies(null, false).includes(event.player)
            );
        },
        async content(event, trigger, player) {
            await trigger.player.loseHp(trigger.num);
        },
    },
    shuYing_Tianshu_Skill_09_Skill3: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        trigger: { source: "damageSource" },
        filter(event, player) {
            return (
                event.num > 0 &&
                event.player?.isIn() &&
                player.getEnemies(null, false).includes(event.player)
            );
        },
        async content(event, trigger, player) {
            const target = trigger.player;
            const loseEvent = target.loseHp(trigger.num);
            loseEvent.shuYing_Tianshu_Skill_09_Skill3 = true;
            loseEvent.shuYing_source = player;
            await loseEvent;

            if (!target.isIn()) return;

            const loseHpNum = target
                .getHistory("loseHp", evt => {
                    return (
                        evt.shuYing_Tianshu_Skill_09_Skill3 &&
                        evt.shuYing_source == player
                    );
                })
                .reduce((sum, evt) => {
                    return sum + Math.max(0, -evt.num);
                }, 0);

            if (loseHpNum > player.hp && target.hp > 0) {
                await target.loseHp(target.hp);
            }
        },
    },

    // 群雄逐鹿
    shuYing_Tianshu_Skill_10_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: "shuYing_Tianshu_Skill_10_Skill1_exclude",
        mod: {
            cardname(card, player) {
                if (get.type2(card, false) == "trick") {
                    return "wanjian";
                }
            },
            targetEnabled(card, player, target) {
                if (
                    get.name(card, player) == "wanjian" &&
                    !player.getEnemies(null, false).includes(target)
                ) {
                    return false;
                }
            },
        },
        subSkill: {
            exclude: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCardToPlayered" },
                filter(event, player) {
                    return (
                        event.card.name == "wanjian" &&
                        !player.getEnemies(null, false).includes(event.target)
                    );
                },
                async content(event, trigger, player) {
                    trigger.excluded.add(trigger.target);
                },
            },
        },
    },
    shuYing_Tianshu_Skill_10_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_10_Skill2_exclude",
            "shuYing_Tianshu_Skill_10_Skill2_gain",
        ],
        mod: {
            cardname(card, player) {
                if (get.type2(card, false) == "trick") {
                    return "wanjian";
                }
            },
            targetEnabled(card, player, target) {
                if (
                    get.name(card, player) == "wanjian" &&
                    !player.getEnemies(null, false).includes(target)
                ) {
                    return false;
                }
            },
        },
        subSkill: {
            exclude: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCardToPlayered" },
                filter(event, player) {
                    return (
                        event.card.name == "wanjian" &&
                        !player.getEnemies(null, false).includes(event.target)
                    );
                },
                async content(event, trigger, player) {
                    trigger.excluded.add(trigger.target);
                },
            },
            gain: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCard2" },
                filter(event, player) {
                    if (event.card.name != "wanjian") return false;

                    const enemies = player.getEnemies(null, false);
                    return event.targets?.some(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            target.countGainableCards(player, "h") > 0
                        );
                    });
                },
                async content(event, trigger, player) {
                    const enemies = player.getEnemies(null, false);
                    const targets = trigger.targets
                        .filter(target => {
                            return (
                                target.isIn() &&
                                enemies.includes(target) &&
                                target.countGainableCards(player, "h") > 0
                            );
                        })
                        .sortBySeat();

                    for (const target of targets) {
                        const cards = target
                            .getGainableCards(player, "h")
                            .randomGets(1);

                        if (cards.length) {
                            player.line(target);
                            await player.gain(cards, target, "giveAuto");
                        }
                    }
                },
            },
        },
    },

    // 乱世佳人
    shuYing_Tianshu_Skill_11_Skill1: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_11_Skill1_directHit",
            "shuYing_Tianshu_Skill_11_Skill1_damage",
        ],
        subSkill: {
            directHit: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                usable: 1,
                trigger: { player: "useCard2" },
                filter(event, player) {
                    const enemies = player.getEnemies(null, false);
                    return event.targets?.some(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            target.sex != player.sex
                        );
                    });
                },
                async content(event, trigger, player) {
                    const enemies = player.getEnemies(null, false);
                    const targets = trigger.targets.filter(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            target.sex != player.sex
                        );
                    });

                    trigger.directHit.addArray(targets);
                },
            },
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                usable: 1,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        event.player?.isIn() &&
                        event.player.sex != player.sex &&
                        player.getEnemies(null, false).includes(event.player)
                    );
                },
                async content(event, trigger, player) {
                    trigger.num++;
                },
            },
        },
    },
    shuYing_Tianshu_Skill_11_Skill2: {
        mode: ["boss"],
        audio: false,
        charlotte: true,
        superCharlotte: true,
        fixed: true,
        forced: true,
        locked: true,
        popup: false,
        group: [
            "shuYing_Tianshu_Skill_11_Skill2_directHit",
            "shuYing_Tianshu_Skill_11_Skill2_damage",
        ],
        subSkill: {
            directHit: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { player: "useCard2" },
                filter(event, player) {
                    const enemies = player.getEnemies(null, false);
                    return event.targets?.some(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            target.sex != player.sex
                        );
                    });
                },
                async content(event, trigger, player) {
                    const enemies = player.getEnemies(null, false);
                    const targets = trigger.targets.filter(target => {
                        return (
                            target.isIn() &&
                            enemies.includes(target) &&
                            target.sex != player.sex
                        );
                    });

                    trigger.directHit.addArray(targets);
                },
            },
            damage: {
                audio: false,
                charlotte: true,
                forced: true,
                popup: false,
                trigger: { source: "damageBegin1" },
                filter(event, player) {
                    return (
                        event.num > 0 &&
                        event.player?.isIn() &&
                        event.player.sex != player.sex &&
                        player.getEnemies(null, false).includes(event.player)
                    );
                },
                async content(event, trigger, player) {
                    trigger.num++;
                },
            },
        },
    },
};

const translate = {
    shuYing_Tianshu_BondSha1: "杀伐·壹",
    shuYing_Tianshu_BondSha1_info: "锁定技。你于出牌阶段内使用【杀】的次数上限+1。",
    shuYing_Tianshu_BondSha2: "杀伐·贰",
    shuYing_Tianshu_BondSha2_info: "锁定技。你于出牌阶段内使用【杀】的次数上限+2。",
};

export default { skill, translate };
