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
};

export default skills;
