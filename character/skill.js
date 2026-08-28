import { lib, game, ui, get, ai, _status } from "../../../noname.js";

const skills = {
    huashen_shuying: {
        audio: "ext:术樱包/character/audio/zuoci:2",
        inherit: "rehuashen",
        unique: true,
        init(player, skill) {
            if (!player.storage.rehuashen) {
                player.storage.rehuashen = {
                    character: [],
                    choosed: [],
                    map: {},
                };
            }
            player.storage[skill] = player.storage.rehuashen;
        },
        async content(event, trigger, player) {
            const oldCharacter = player.storage.rehuashen?.current;
            const oldSkill = player.storage.rehuashen?.current2;
            const transitionKey = "jihun_shuying_transition";

            // 单独处理重铸，保留本次实际移除的化身牌信息
            if (event.cost_data === "制衡其他化身") {
                _status.noclearcountdown = true;
                const id = lib.status.videoId++;
                const prompt = "化身：选择制衡至多两张武将牌";
                const cards = player.storage.rehuashen.character;

                if (player.isOnline2()) {
                    player.send(
                        (cards, prompt, id) => {
                            const dialog = ui.create.dialog(
                                prompt,
                                [cards, lib.skill.rehuashen.$createButton]
                            );
                            dialog.videoId = id;
                        },
                        cards,
                        prompt,
                        id
                    );
                }

                const dialog = ui.create.dialog(
                    prompt,
                    [cards, lib.skill.rehuashen.$createButton]
                );
                dialog.videoId = id;
                if (!event.isMine()) {
                    dialog.style.display = "none";
                }

                const result = await player
                    .chooseButton(true)
                    .set("dialog", id)
                    .set("selectButton", [1, 2])
                    .set(
                        "filterButton",
                        button => button.link !== get.event().current
                    )
                    .set("current", player.storage.rehuashen.current)
                    .forResult();

                if (player.isOnline2()) {
                    player.send("closeDialog", id);
                }
                dialog.close();
                delete _status.noclearcountdown;
                if (!_status.noclearcountdown) {
                    game.stopCountChoose();
                }

                const removedCharacters = result.links || [];
                lib.skill.rehuashen.removeHuashen(
                    player,
                    removedCharacters
                );

                if (
                    player.storage.jihun_shuying_retainedCharacter &&
                    removedCharacters.includes(
                        player.storage.jihun_shuying_retainedCharacter
                    )
                ) {
                    delete player.storage.jihun_shuying_retained;
                    delete player.storage.jihun_shuying_retainedCharacter;
                    delete player.storage.jihun_shuying_ignoredEvents;
                    await player.removeAdditionalSkills(
                        "jihun_shuying_retained"
                    );
                }

                lib.skill.rehuashen.addHuashens(
                    player,
                    removedCharacters.length
                );
                player.storage.huashen_shuying =
                    player.storage.rehuashen;
                player.syncStorage("huashen_shuying");
                player.updateMarks("huashen_shuying");
                return;
            }

            // 切换前为当前技能增加临时所有权。官方化身移除旧来源时，
            // getRemovableAdditionalSkills 会因此保留技能本体及全部状态。
            const protectOldSkill = Boolean(
                oldSkill && player.hasSkill("jihun_shuying")
            );
            if (
                protectOldSkill &&
                !player.additionalSkills[transitionKey]?.includes(oldSkill)
            ) {
                if (!Array.isArray(player.additionalSkills[transitionKey])) {
                    player.additionalSkills[transitionKey] = [];
                }
                player.additionalSkills[transitionKey].push(oldSkill);
                game.broadcast(
                    (player, map) => {
                        player.additionalSkills = map;
                    },
                    player,
                    player.additionalSkills
                );
                _status.event.clearStepCache();
            }

            await lib.skill.rehuashen.content(event, trigger, player);

            const storage = player.storage.rehuashen;
            const changed = Boolean(
                oldSkill &&
                (
                    oldCharacter !== storage?.current ||
                    oldSkill !== storage?.current2
                )
            );

            if (
                changed &&
                player.hasSkill("jihun_shuying")
            ) {
                // 过渡来源会阻止官方流程物理移除旧技能，因此这里仅删除
                // rehuashen 对旧技能的映射，不触发 removeSkill/onremove。
                if (
                    oldSkill !== storage.current2 &&
                    player.additionalSkills.rehuashen?.includes(oldSkill)
                ) {
                    player.$removeAdditionalSkills("rehuashen", oldSkill);
                    _status.event.clearStepCache();
                }

                // 新的当前技能已经登记完毕后，再结束上一次羁魂保留。
                if (player.additionalSkills.jihun_shuying_retained) {
                    await player.removeAdditionalSkills(
                        "jihun_shuying_retained"
                    );
                }
                delete player.storage.jihun_shuying_retained;
                delete player.storage.jihun_shuying_retainedCharacter;
                delete player.storage.jihun_shuying_ignoredEvents;

                player.logSkill("jihun_shuying");

                if (oldSkill && oldSkill !== storage.current2) {
                    const ignoredEvents = player
                        .getAllHistory("useSkill", history => {
                            return get.sourceSkillFor(history) === oldSkill;
                        })
                        .map(history => history.event)
                        .filter(Boolean);

                    let currentEvent = _status.event;
                    while (currentEvent) {
                        const eventSkill = currentEvent.sourceSkill ||
                            currentEvent.skill ||
                            (lib.skill[currentEvent.name] ? currentEvent.name : null);
                        if (
                            eventSkill &&
                            get.sourceSkillFor(eventSkill) === oldSkill &&
                            !ignoredEvents.includes(currentEvent)
                        ) {
                            ignoredEvents.push(currentEvent);
                        }
                        currentEvent = currentEvent.parent;
                    }

                    player.storage.jihun_shuying_retained = oldSkill;
                    player.storage.jihun_shuying_retainedCharacter =
                        oldCharacter;
                    player.storage.jihun_shuying_ignoredEvents = ignoredEvents;
                    // 此时 oldSkill 仍由过渡键持有，增加羁魂来源不会重新
                    // 初始化技能，也不会影响牌、标记和 storage。
                    const retainedKey = "jihun_shuying_retained";
                    if (!Array.isArray(player.additionalSkills[retainedKey])) {
                        player.additionalSkills[retainedKey] = [];
                    }
                    if (!player.additionalSkills[retainedKey].includes(oldSkill)) {
                        player.additionalSkills[retainedKey].push(oldSkill);
                    }
                    game.broadcast(
                        (player, map) => {
                            player.additionalSkills = map;
                        },
                        player,
                        player.additionalSkills
                    );
                    _status.event.clearStepCache();
                }
            }

            // 最终所有权建立完毕后再撤销过渡来源。
            if (player.additionalSkills[transitionKey]) {
                await player.removeAdditionalSkills(transitionKey);
            }

            player.storage.huashen_shuying = storage;
            player.syncStorage("huashen_shuying");
            player.updateMarks("huashen_shuying");
        },
        onremove(player) {
            player.removeAdditionalSkill("rehuashen");
            player.removeAdditionalSkill("jihun_shuying_retained");
            player.removeAdditionalSkill("jihun_shuying_transition");
            delete player.storage.rehuashen;
            delete player.storage.huashen_shuying;
            delete player.storage.jihun_shuying_retained;
            delete player.storage.jihun_shuying_retainedCharacter;
            delete player.storage.jihun_shuying_ignoredEvents;
        },
        ai: {
            threaten: 2,
        },
    },

    xinsheng_shuying: {
        audio: "ext:术樱包/character/audio/zuoci:2",
        unique: true,
        trigger: {
            player: "damageEnd",
        },
        filter(event, player) {
            return event.num > 0 &&
                player.hasSkill("huashen_shuying") &&
                player.storage.rehuashen;
        },
        async cost(event, trigger, player) {
            const controls = ["获得一张新化身"];
            if (player.storage.rehuashen.character?.length) {
                controls.push("更换所展示的化身");
            }
            controls.push("cancel2");

            const result = await player
                .chooseControl(controls)
                .set("prompt", get.prompt(event.skill))
                .set("prompt2", "获得一张新化身牌，或更换所展示的化身牌")
                .set("ai", () => {
                    const player = get.player();
                    const controls = get.event().controls;
                    if (!controls.includes("更换所展示的化身")) {
                        return "获得一张新化身";
                    }

                    const storage = player.storage.rehuashen;
                    const currentRank = storage.current2 ?
                        get.skillRank(storage.current2, "in") : 0;
                    const skills = storage.character
                        .flatMap(name => storage.map[name] || [])
                        .unique();
                    const bestRank = skills.reduce((max, skill) => {
                        return Math.max(max, get.skillRank(skill, "in"));
                    }, 0);

                    if (bestRank > currentRank + 1) {
                        return "更换所展示的化身";
                    }
                    return "获得一张新化身";
                })
                .forResult();

            event.result = {
                bool: result.control !== "cancel2",
                cost_data: result.control,
            };
        },
        async content(event, trigger, player) {
            if (event.cost_data === "获得一张新化身") {
                lib.skill.rehuashen.addHuashens(player, 1);
                player.storage.huashen_shuying = player.storage.rehuashen;
                player.syncStorage("huashen_shuying");
                player.updateMarks("huashen_shuying");
                return;
            }

            const next = game.createEvent("huashen_shuying_change");
            next.player = player;
            next.skill = "huashen_shuying";
            next.cost_data = "替换当前化身";
            next.setContent(lib.skill.huashen_shuying.content);
            await next;
        },
        ai: {
            combo: "huashen_shuying",
            maixie: true,
            maixie_hp: true,
            effect: {
                target(card, player, target) {
                    if (
                        get.tag(card, "damage") &&
                        target.hasSkill("huashen_shuying")
                    ) {
                        return [1, 0.7];
                    }
                },
            },
        },
    },

    jihun_shuying: {
        audio: "ext:术樱包/character/audio/zuoci:2",
        locked: true,
        group: "jihun_shuying_clear",
        onremove(player) {
            player.removeAdditionalSkill("jihun_shuying_retained");
            player.removeAdditionalSkill("jihun_shuying_transition");
            delete player.storage.jihun_shuying_retained;
            delete player.storage.jihun_shuying_retainedCharacter;
            delete player.storage.jihun_shuying_ignoredEvents;
        },
        ai: {
            combo: "huashen_shuying",
        },
        subSkill: {
            clear: {
                charlotte: true,
                silent: true,
                lastDo: true,
                priority: -Infinity,
                trigger: {
                    player: [
                        "useSkillAfter",
                        "useCardAfter",
                        "respondAfter",
                        "triggerAfter",
                        "skillAfter",
                    ],
                },
                hookTrigger: {
                    after(event, player) {
                        const retained =
                            player.storage.jihun_shuying_retained;
                        return Boolean(
                            retained &&
                            event.skill &&
                            get.sourceSkillFor(event.skill) === retained
                        );
                    },
                },
                filter(event, player) {
                    const retained =
                        player.storage.jihun_shuying_retained;
                    if (
                        !retained ||
                        !event.skill ||
                        get.sourceSkillFor(event.skill) !== retained
                    ) {
                        return false;
                    }

                    const ignoredEvents =
                        player.storage.jihun_shuying_ignoredEvents || [];
                    return !ignoredEvents.includes(event);
                },
                async content(event, trigger, player) {
                    delete player.storage.jihun_shuying_retained;
                    delete player.storage.jihun_shuying_retainedCharacter;
                    delete player.storage.jihun_shuying_ignoredEvents;
                    await player.removeAdditionalSkills(
                        "jihun_shuying_retained"
                    );
                },
            },
        },
    },

    qixi_shuying: {
        audio: "ext:术樱包/character/audio/ganning:2",
        enable: "chooseToUse",
        position: "hes",
        filterCard(card) {
            return get.color(card) == "black";
        },
        viewAs: {
            name: "guohe",
        },
        viewAsFilter(player) {
            return player.countCards("hes", card => get.color(card) == "black") > 0;
        },
        prompt: "将一张黑色牌当【过河拆桥】使用",
        check(card) {
            return 5 - get.value(card);
        },
        mark: true,
        intro: {
            content(storage, player) {
                let str = storage
                    ? `当前记录花色：${get.translation(storage)}`
                    : "尚未记录花色";

                if (player.storage.fenwei_shuying_upgraded) {
                    str += "<br>〖奋威〗已升级：摸牌与获得弃牌每回合各限一次";
                }
                return str;
            },
        },
        group: [
            "qixi_shuying_capture",
            "qixi_shuying_effect",
        ],
        subSkill: {
            capture: {
                charlotte: true,
                forced: true,
                silent: true,
                popup: false,
                trigger: {
                    global: ["loseAfter", "loseAsyncAfter"],
                },
                filter(event, player) {
                    if (
                        event.type != "discard" ||
                        event.getlx === false ||
                        event.position != ui.discardPile
                    ) {
                        return false;
                    }

                    const useEvent = event.getParent("useCard");
                    return (
                        useEvent?.player == player &&
                        get.name(useEvent.card) == "guohe" &&
                        event.cards?.length > 0
                    );
                },
                content(event, trigger, player) {
                    const useEvent = trigger.getParent("useCard");
                    if (!useEvent.qixi_shuying_discarded) {
                        useEvent.qixi_shuying_discarded = [];
                    }
                    useEvent.qixi_shuying_discarded.addArray(trigger.cards);
                },
            },

            effect: {
                charlotte: true,
                forced: true,
                popup: false,
                trigger: {
                    player: "useCardAfter",
                },
                filter(event, player) {
                    return (
                        get.name(event.card) == "guohe" &&
                        event.qixi_shuying_discarded?.length > 0
                    );
                },
                async content(event, trigger, player) {
                    const cards = trigger.qixi_shuying_discarded;
                    const card = cards[cards.length - 1];
                    delete trigger.qixi_shuying_discarded;

                    if (!card) {
                        return;
                    }

                    const suit = get.suit(card, false);
                    const previousSuit = player.storage.qixi_shuying;

                    player.storage.qixi_shuying = suit;
                    player.syncStorage("qixi_shuying");
                    player.markSkill("qixi_shuying");

                    if (
                        !previousSuit ||
                        previousSuit == suit ||
                        player.countCharge() <= 0
                    ) {
                        return;
                    }

                    const upgraded = !!player.storage.fenwei_shuying_upgraded;
                    const turn = game.phaseNumber;
                    let usage = player.storage.qixi_shuying_usage;
                    if (!usage || usage.turn != turn) {
                        usage = {
                            turn,
                            options: [],
                        };
                        player.storage.qixi_shuying_usage = usage;
                        player.syncStorage("qixi_shuying_usage");
                    }

                    const usedDraw = usage.options.includes("draw");
                    const usedGain = usage.options.includes("gain");
                    const canDraw = upgraded
                        ? !usedDraw
                        : !usedDraw && !usedGain;

                    const canGain =
                        get.position(card, true) == "d" &&
                        (upgraded
                            ? !usedGain
                            : !usedDraw && !usedGain);

                    if (!canDraw && !canGain) {
                        return;
                    }

                    const controls = [];
                    if (canDraw) {
                        controls.push("摸一张牌");
                    }
                    if (canGain) {
                        controls.push("获得弃置的牌");
                    }
                    controls.push("cancel2");

                    let choice = "cancel2";
                    if (canGain && get.value(card, player) > 2) {
                        choice = "获得弃置的牌";
                    } else if (canDraw) {
                        choice = "摸一张牌";
                    }

                    const result = await player
                        .chooseControl(controls)
                        .set(
                            "prompt",
                            `〖奇袭〗记录花色由${get.translation(previousSuit)}变为${get.translation(suit)}`,
                        )
                        .set(
                            "prompt2",
                            `你可以消耗1点蓄力点，摸一张牌或获得此次弃置的${get.translation(card)}`,
                        )
                        .set("choice", choice)
                        .set("ai", () => get.event().choice)
                        .forResult();

                    if (
                        result.control != "摸一张牌" &&
                        result.control != "获得弃置的牌"
                    ) {
                        return;
                    }

                    if (player.countCharge() <= 0) {
                        return;
                    }

                    // 先记录具体选项，再扣除蓄力，避免扣除蓄力触发奋威升级时发生嵌套重入。
                    const option = result.control == "摸一张牌" ? "draw" : "gain";
                    if (!usage.options.includes(option)) {
                        usage.options.push(option);
                    }
                    player.syncStorage("qixi_shuying_usage");
                    player.removeCharge(1);

                    if (result.control == "摸一张牌") {
                        await player.draw();
                        return;
                    }

                    if (get.position(card, true) == "d") {
                        await player.gain(card, "gain2");
                    }
                },
            },
        },
        ai: {
            order: 9,
            result: {
                player: 1,
            },
        },
    },

    fenwei_shuying: {
        audio: "ext:术樱包/character/audio/ganning:2",
        chargeSkill: 8,
        beginMarkCount: 2,
        trigger: {
            global: "useCardToPlayered",
        },
        filter(event, player) {
            return (
                event.isFirstTarget &&
                get.type(event.card) == "trick" &&
                event.targets?.length >= 2 &&
                player.countCharge() > 0 &&
                !player.hasSkill("fenwei_shuying_used")
            );
        },
        async cost(event, trigger, player) {
            const max = Math.min(
                player.countCharge(),
                trigger.targets.length,
            );

            event.result = await player
                .chooseTarget(
                    get.prompt(event.skill),
                    `消耗任意点蓄力点，令${get.translation(trigger.card)}对等量名目标角色无效`,
                    [1, max],
                    (card, player, target) => {
                        return get.event().targets.includes(target);
                    },
                )
                .set("targets", trigger.targets)
                .set("ai", target => {
                    const player = get.player();
                    const trigger = get.event().getTrigger();
                    return -get.effect(
                        target,
                        trigger.card,
                        trigger.player,
                        player,
                    );
                })
                .forResult();
        },
        async content(event, trigger, player) {
            const targets = event.targets;
            const num = targets.length;

            player.line(targets, "green");
            player.removeCharge(num);
            player.addTempSkill(
                "fenwei_shuying_used",
                { global: "phaseAfter" },
            );

            trigger.getParent().excluded.addArray(targets);
        },
        group: [
            "fenwei_shuying_init",
            "fenwei_shuying_charge",
            "fenwei_shuying_choice",
        ],
        subSkill: {
            init: {
                charlotte: true,
                forced: true,
                locked: false,
                audio: false,
                trigger: {
                    player: "enterGame",
                    global: "phaseBefore",
                },
                filter(event, player) {
                    if (!player.countCharge(true)) {
                        return false;
                    }
                    return event.name != "phase" || game.phaseNumber == 0;
                },
                async content(event, trigger, player) {
                    const num = get.info("fenwei_shuying").beginMarkCount;
                    player.addCharge(num);
                    await game.delayx();
                },
            },

            charge: {
                charlotte: true,
                forced: true,
                locked: true,
                audio: false,
                popup: false,
                usable: 1,
                trigger: {
                    global: [
                        "loseAfter",
                        "loseAsyncAfter",
                        "cardsDiscardAfter",
                    ],
                },
                filter(event, player) {
                    if (!player.countCharge(true)) {
                        return false;
                    }

                    if (event.name.indexOf("lose") == 0) {
                        if (
                            event.getlx === false ||
                            event.position != ui.discardPile
                        ) {
                            return false;
                        }
                    } else {
                        const parent = event.getParent();
                        if (parent?.relatedEvent?.name == "useCard") {
                            return false;
                        }
                    }

                    return event.cards?.length > 0;
                },
                async content(event, trigger, player) {
                    player.addCharge(1);
                    await game.delayx();
                },
            },

            choice: {
                charlotte: true,
                audio: false,
                trigger: {
                    player: "removeMark",
                },
                filter(event, player) {
                    const num = Math.ceil(game.countPlayer() / 2);
                    return (
                        event.markName == "charge" &&
                        event.num >= num &&
                        !player.hasSkill("fenwei_shuying_choice_used") &&
                        (
                            !player.storage.fenwei_shuying_upgraded ||
                            player.hasUseTarget({ name: "guohe", isCard: true })
                        )
                    );
                },
                async cost(event, trigger, player) {
                    const num = Math.ceil(game.countPlayer() / 2);
                    const canUse = player.hasUseTarget({
                        name: "guohe",
                        isCard: true,
                    });

                    if (player.storage.fenwei_shuying_upgraded) {
                        const result = await player
                            .chooseBool(
                                get.prompt(event.skill),
                                `你本次消耗了至少${num}点蓄力点，是否视为使用一张【过河拆桥】？`,
                            )
                            .set("ai", () => true)
                            .forResult();

                        event.result = {
                            bool: result.bool,
                            cost_data: "使用过河拆桥",
                        };
                        return;
                    }

                    const controls = [];
                    if (canUse) {
                        controls.push("使用过河拆桥");
                    }
                    controls.push("升级奇袭", "cancel2");

                    const result = await player
                        .chooseControl(controls)
                        .set(
                            "prompt",
                            `〖奋威〗：你本次消耗了至少${num}点蓄力点`,
                        )
                        .set("choice", "升级奇袭")
                        .set("ai", () => get.event().choice)
                        .forResult();

                    if (
                        result.control == "使用过河拆桥" ||
                        result.control == "升级奇袭"
                    ) {
                        event.result = {
                            bool: true,
                            cost_data: result.control,
                        };
                    }
                },
                async content(event, trigger, player) {
                    player.addTempSkill(
                        "fenwei_shuying_choice_used",
                        { global: "phaseAfter" },
                    );

                    if (event.cost_data == "升级奇袭") {
                        player.storage.fenwei_shuying_upgraded = true;
                        player.syncStorage("fenwei_shuying_upgraded");

                        game.log(player, "升级了技能", "#g【奇袭】");
                        player.popup("奇袭·改", "wood");

                        if (player.hasSkill("qixi_shuying")) {
                            player.markSkill("qixi_shuying");
                        }

                        await game.delayx();
                        return;
                    }

                    if (player.hasUseTarget({ name: "guohe", isCard: true })) {
                        await player.chooseUseTarget({
                            prompt: "〖奋威〗：视为使用一张【过河拆桥】",
                            card: get.autoViewAs({ name: "guohe", isCard: true }),
                            forced: true,
                        });
                    }
                },
            },

            used: {
                charlotte: true,
            },
            choice_used: {
                charlotte: true,
            },
        },
        ai: {
            expose: 0.2,
            threaten: 1.4,
        },
    },
};

export default skills;
