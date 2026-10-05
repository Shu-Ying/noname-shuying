export default function initFunction(lib, game, ui, get, ai, _status, shuYing = {}) {
    game.shuying_getDiscardNamesNum = function () {
        return Array.from(ui.discardPile.childNodes)
            .map(card => get.name(card))
            .unique()
            .length;
    };

    game.shuying_getDiscardNum = function () {
        return game
            .getGlobalHistory("cardMove", evt => evt.name == "cardsDiscard" || evt.name == "lose" && evt.position == ui.discardPile)
            .reduce((num, evt) => num + (evt.cards?.length || 0), 0);
    };

    lib.element.player.shuYing_randomNum = function (max, min = 0) {
        const upper = Number(max);
        const lower = Number(min);
        if (!Number.isFinite(upper) || !Number.isFinite(lower) || upper <= lower) return lower || 0;
        return Math.floor(Math.random() * (upper - lower)) + lower;
    };

    lib.element.player.shuYing_numRandom = function () {
        return this.shuYing_randomNum(100, 1);
    };

    const getCharacterPack = id => {
        for (const packName in lib.characterPack) {
            if (id in lib.characterPack[packName]) return packName;
        }
        return "unknown";
    };

    const getCharacterName = id => get.translation(id) || id;

    const normalizeCharacterDialogItems = list => {
        return (list || []).map(item => {
            if (typeof item == "string") {
                return {
                    key: item,
                    id: item,
                    name: getCharacterName(item),
                    group: getCharacterPack(item),
                };
            }
            const id = item.id || item.name || item.key;
            return {
                key: item.key || id,
                id,
                name: item.name || getCharacterName(id),
                group: item.group || getCharacterPack(id),
            };
        }).filter(item => item.key && item.id);
    };

    const getGroupText = group => {
        if (group == "unknown") return "未知";
        return lib.translate[`${group}_character_config`] || get.translation(group) || group;
    };

    const makeSearchMatcher = text => {
        const value = String(text || "").trim();
        if (!value) return () => true;
        try {
            const regexp = new RegExp(value, "i");
            return item => regexp.test(item.key) || regexp.test(item.id) || regexp.test(item.name) || regexp.test(get.translation(item.id));
        } catch (e) {
            return item => [item.key, item.id, item.name, get.translation(item.id)].some(str => String(str || "").includes(value));
        }
    };

    shuYing.chooseCharacterPoolDialog = ({ title = "请选择角色", intro = "", list = [], selected = [] } = {}) => {
        return new Promise(resolve => {
            const items = normalizeCharacterDialogItems(list);
            const selectedSet = new Set(selected);
            const activeGroups = new Set(items.map(item => item.group));
            const createNode = (tag, className, text, parent) => {
                const node = document.createElement(tag);
                if (className) node.className = className;
                if (text !== undefined && text !== null) node.textContent = text;
                if (parent) parent.appendChild(node);
                return node;
            };
            const mask = createNode("div", "shuYing-character-dialog-mask", null, document.body);
            const dialog = createNode("div", "shuYing-character-dialog", null, mask);
            const header = createNode("div", "shuYing-character-dialog-header", null, dialog);
            createNode("div", "shuYing-character-dialog-title", title, header);
            const countNode = createNode("div", "shuYing-character-dialog-count", "", header);
            if (intro) createNode("div", "shuYing-character-dialog-intro", intro, dialog);
            const searchInput = createNode("input", "shuYing-character-dialog-search", null, dialog);
            searchInput.type = "text";
            searchInput.placeholder = "搜索武将名 / ID / 正则";
            searchInput.autocomplete = "off";
            searchInput.spellcheck = false;
            const toolbar = createNode("div", "shuYing-character-dialog-toolbar", null, dialog);
            const groupBox = createNode("div", "shuYing-character-dialog-groups", null, toolbar);
            const gridWrap = createNode("div", "shuYing-character-dialog-grid-wrap", null, dialog);
            const grid = createNode("div", "shuYing-character-dialog-grid", null, gridWrap);
            const controls = createNode("div", "shuYing-character-dialog-controls", null, dialog);
            let closed = false;
            let visibleItems = items.slice();

            const close = result => {
                if (closed) return;
                closed = true;
                mask.remove();
                resolve(result);
            };

            const refreshCard = card => {
                card.classList.toggle("selected", selectedSet.has(card.dataset.key));
            };

            const updateCount = () => {
                countNode.textContent = `已选择 ${selectedSet.size}/${items.length}`;
                confirmNode.classList.toggle("disabled", selectedSet.size == 0);
                confirmNode.disabled = selectedSet.size == 0;
            };

            const renderGrid = () => {
                grid.innerHTML = "";
                const matcher = makeSearchMatcher(searchInput.value);
                visibleItems = items.filter(item => activeGroups.has(item.group) && matcher(item));
                if (!visibleItems.length) {
                    createNode("div", "shuYing-character-dialog-empty", "没有符合条件的武将", grid);
                    updateCount();
                    return;
                }
                visibleItems.forEach(item => {
                    const card = createNode("div", "shuYing-character-dialog-card", null, grid);
                    card.tabIndex = 0;
                    card.dataset.key = item.key;
                    const avatar = createNode("div", "shuYing-character-dialog-avatar", null, card);
                    avatar.setBackground(item.id, "character");
                    createNode("span", "shuYing-character-dialog-name", item.name || getCharacterName(item.id), card);
                    card.addEventListener("click", event => {
                        event.stopPropagation();
                        if (selectedSet.has(item.key)) selectedSet.delete(item.key);
                        else selectedSet.add(item.key);
                        refreshCard(card);
                        updateCount();
                    });
                    refreshCard(card);
                });
                updateCount();
            };

            const makeControl = (text, handler) => {
                const button = createNode("div", "shuYing-character-dialog-button", text, controls);
                button.tabIndex = 0;
                button.addEventListener("click", event => {
                    event.stopPropagation();
                    handler();
                });
                button.addEventListener("keydown", event => {
                    event.stopPropagation();
                    if (event.key == "Enter" || event.key == " ") {
                        event.preventDefault();
                        handler();
                    }
                });
                return button;
            };

            mask.addEventListener("click", event => {
                event.stopPropagation();
                close(false);
            });
            dialog.addEventListener("click", event => event.stopPropagation());
            searchInput.addEventListener("click", event => event.stopPropagation());
            searchInput.addEventListener("input", renderGrid);
            searchInput.addEventListener("keydown", event => {
                event.stopPropagation();
                if (event.key == "Escape") close(false);
                if (event.key == "Enter") {
                    event.preventDefault();
                    renderGrid();
                }
            });

            items.map(item => item.group).unique().forEach(group => {
                const label = createNode("div", "shuYing-character-dialog-group selected", null, groupBox);
                label.tabIndex = 0;
                label.dataset.group = group;
                createNode("span", "shuYing-character-dialog-check", "", label);
                createNode("span", "shuYing-character-dialog-group-text", getGroupText(group), label);
                label.addEventListener("click", event => {
                    event.stopPropagation();
                    const checked = !label.classList.contains("selected");
                    label.classList.toggle("selected", checked);
                    if (checked) activeGroups.add(group);
                    else activeGroups.delete(group);
                    renderGrid();
                });
                label.addEventListener("keydown", event => {
                    event.stopPropagation();
                    if (event.key == "Enter" || event.key == " ") {
                        event.preventDefault();
                        label.click();
                    }
                });
            });

            makeControl("全选", () => {
                visibleItems.forEach(item => selectedSet.add(item.key));
                grid.querySelectorAll(".shuYing-character-dialog-card").forEach(refreshCard);
                updateCount();
            });
            makeControl("清空", () => {
                visibleItems.forEach(item => selectedSet.delete(item.key));
                grid.querySelectorAll(".shuYing-character-dialog-card").forEach(refreshCard);
                updateCount();
            });
            makeControl("反选", () => {
                visibleItems.forEach(item => selectedSet.has(item.key) ? selectedSet.delete(item.key) : selectedSet.add(item.key));
                grid.querySelectorAll(".shuYing-character-dialog-card").forEach(refreshCard);
                updateCount();
            });
            const confirmNode = makeControl("确定", () => {
                if (!selectedSet.size) return;
                close(items.map(item => item.key).filter(key => selectedSet.has(key)));
            });
            makeControl("取消", () => close(false));
            renderGrid();
        });
    };

    // 创建可复用的对局单选界面；单击选中卡片，确认后返回对应键值。
    shuYing.chooseSingleOptionDialog = ({ title = "请选择", intro = "", options = [], defaultKey = null,
        currentKey = null, cancelable = false, variant = "default", confirmText = "确定" } = {}) => {
        return new Promise(resolve => {
            const items = options.map(option => typeof option == "string" ? { key: option, name: option } : option)
                .filter(option => option?.key);
            if (!items.length) {
                resolve(null);
                return;
            }
            const createNode = (tag, className, text, parent) => {
                const node = document.createElement(tag);
                if (className) node.className = className;
                if (text !== undefined && text !== null) node.textContent = text;
                if (parent) parent.appendChild(node);
                return node;
            };
            const previousFocus = document.activeElement;
            const mask = createNode("div", "shuYing-option-dialog-mask", null, document.body);
            mask.dataset.variant = variant;
            const dialog = createNode("div", "shuYing-option-dialog", null, mask);
            dialog.setAttribute("role", "dialog");
            dialog.setAttribute("aria-modal", "true");
            dialog.setAttribute("aria-label", title);
            createNode("div", "shuYing-option-dialog-title", title, dialog);
            if (intro) createNode("div", "shuYing-option-dialog-intro", intro, dialog);
            const optionArea = createNode("div", "shuYing-option-dialog-options", null, dialog);
            const controls = createNode("div", "shuYing-option-dialog-controls", null, dialog);
            let closed = false;
            let onKeydown = null;
            let selectedKey = defaultKey && items.some(item => item.key == defaultKey) ? defaultKey : items[0].key;
            const finish = key => {
                if (closed) return;
                closed = true;
                if (onKeydown) document.removeEventListener("keydown", onKeydown, true);
                mask.remove();
                if (cancelable && previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
                resolve(key);
            };
            const refreshSelection = () => {
                optionArea.querySelectorAll(".shuYing-option-dialog-card").forEach(card => {
                    const selected = card.dataset.key == selectedKey;
                    card.classList.toggle("selected", selected);
                    card.setAttribute("aria-pressed", String(selected));
                });
                confirm.disabled = currentKey != null && selectedKey == currentKey;
            };
            items.forEach((option, index) => {
                const card = createNode("button", "shuYing-option-dialog-card", null, optionArea);
                card.type = "button";
                card.dataset.key = option.key;
                card.dataset.tone = option.tone || option.key;
                createNode("span", "shuYing-option-dialog-order", String(index + 1).padStart(2, "0"), card);
                createNode("span", "shuYing-option-dialog-name", option.name || option.key, card);
                if (option.tag) createNode("span", "shuYing-option-dialog-tag", option.tag, card);
                if (option.description) createNode("span", "shuYing-option-dialog-description", option.description, card);
                card.addEventListener("click", event => {
                    event.stopPropagation();
                    selectedKey = option.key;
                    refreshSelection();
                });
            });
            if (cancelable) {
                const cancel = createNode("button", "shuYing-option-dialog-confirm shuYing-option-dialog-cancel", "取消", controls);
                cancel.type = "button";
                cancel.addEventListener("click", event => { event.stopPropagation(); finish(null); });
            }
            const confirm = createNode("button", "shuYing-option-dialog-confirm", confirmText, controls);
            confirm.type = "button";
            confirm.addEventListener("click", event => {
                event.stopPropagation();
                if (!confirm.disabled) finish(selectedKey);
            });
            mask.addEventListener("click", event => {
                event.stopPropagation();
                if (cancelable && event.target == mask) finish(null);
            });
            dialog.addEventListener("click", event => event.stopPropagation());
            if (cancelable) {
                dialog.addEventListener("keydown", event => event.stopPropagation());
                onKeydown = event => {
                    if (event.key == "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        finish(null);
                    }
                    else if (event.key == "Tab") {
                        const buttons = Array.from(dialog.querySelectorAll("button:not(:disabled)"));
                        const first = buttons[0], last = buttons[buttons.length - 1];
                        if (!dialog.contains(document.activeElement)
                            || event.shiftKey && document.activeElement == first
                            || !event.shiftKey && document.activeElement == last) {
                            event.preventDefault();
                            (event.shiftKey ? last : first)?.focus();
                        }
                        event.stopPropagation();
                    }
                };
                document.addEventListener("keydown", onKeydown, true);
            }
            refreshSelection();
            const initial = Array.from(optionArea.querySelectorAll(".shuYing-option-dialog-card")).find(node => node.dataset.key == selectedKey)
                || optionArea.querySelector(".shuYing-option-dialog-card");
            initial?.focus({ preventScroll: true });
        });
    };

    // 创建可复用的技能奖励选择界面；悬停预览，单击选中，确认后返回技能。
    shuYing.chooseSkillRewardDialog = ({ title = "请选择技能", highlightText = "", choices = [], selectedSkills = [], bonds = [], player = null, canRefresh = false } = {}) => {
        return new Promise(resolve => {
            const skills = choices.filter(skill => typeof skill == "string" && skill);
            if (!skills.length) {
                resolve(null);
                return;
            }
            const createNode = (tag, className, text, parent) => {
                const node = document.createElement(tag);
                if (className) node.className = className;
                if (text !== undefined && text !== null) node.textContent = text;
                if (parent) parent.appendChild(node);
                return node;
            };
            const getSkillInfo = skill => {
                if (typeof get.skillInfoTranslation == "function") {
                    const info = get.skillInfoTranslation(skill, player);
                    if (info) return info;
                }
                return lib.translate[`${skill}_info`] || "暂无技能描述";
            };
            const getPreviewSkills = previewSkill => Array.from(new Set(selectedSkills.concat(previewSkill || []).filter(Boolean)));
            const getUniqueSkillNames = currentSkills => Array.from(new Set(
                currentSkills.map(skill => lib.translate[skill]).filter(name => typeof name == "string" && name)
            ));
            const getCharacterNames = () => Array.from(new Set(
                [player?.name, player?.name1, player?.name2]
                    .filter(name => typeof name == "string" && name)
                    .map(name => lib.translate[name] || get.translation(name))
                    .filter(name => typeof name == "string" && name)
            ));
            const getKeywordCount = (keyword, currentSkills) => {
                const marker = `【${keyword}】`;
                const matchedNames = new Set();
                currentSkills.forEach(skill => {
                    if (getSkillInfo(skill).includes(marker)) matchedNames.add(lib.translate[skill] || skill);
                });
                return matchedNames.size;
            };
            const getLevelCondition = (bond, level) => {
                const source = level?.condition || bond?.condition;
                if (source) {
                    const condition = { ...source };
                    if (condition.count == null && level?.count != null) condition.count = level.count;
                    return condition;
                }
                return bond?.keyword ? { type: "keyword", keyword: bond.keyword, count: level?.count } : null;
            };
            const matchesCondition = (condition, currentSkills) => {
                if (!condition || typeof condition != "object") return false;
                if (!condition.type && Array.isArray(condition.all)) return condition.all.every(item => matchesCondition(item, currentSkills));
                if (!condition.type && Array.isArray(condition.any)) return condition.any.some(item => matchesCondition(item, currentSkills));
                if (!condition.type && condition.not) return !matchesCondition(condition.not, currentSkills);
                if (condition.type == "keyword") return getKeywordCount(condition.keyword, currentSkills) >= Math.max(1, Number(condition.count) || 1);
                if (condition.type == "skill") return currentSkills.includes(condition.skill);
                if (condition.type == "skillName") return currentSkills.some(skill => lib.translate[skill] == condition.name);
                if (condition.type == "skills") {
                    const all = Array.isArray(condition.all) ? condition.all : [];
                    const any = Array.isArray(condition.any) ? condition.any : [];
                    if (all.length && !all.every(skill => currentSkills.includes(skill))) return false;
                    if (any.length && !any.some(skill => currentSkills.includes(skill))) return false;
                    return Boolean(all.length || any.length);
                }
                if (condition.type == "skillNames") {
                    const names = new Set(getUniqueSkillNames(currentSkills));
                    const all = Array.from(new Set(Array.isArray(condition.all) ? condition.all.filter(Boolean) : []));
                    const any = Array.from(new Set(Array.isArray(condition.any) ? condition.any.filter(Boolean) : []));
                    if (all.length && !all.every(name => names.has(name))) return false;
                    const matchedAny = any.filter(name => names.has(name));
                    const need = Number(condition.count);
                    if (Number.isFinite(need) && need > 0) {
                        const matched = new Set(all.filter(name => names.has(name)).concat(matchedAny));
                        return matched.size >= Math.max(1, Math.floor(need));
                    }
                    if (any.length && !matchedAny.length) return false;
                    return Boolean(all.length || any.length);
                }
                if (condition.type == "characterSkillNames") {
                    const characters = Array.from(new Set((Array.isArray(condition.characters) ? condition.characters : [condition.character]).filter(Boolean)));
                    if (!characters.some(keyword => getCharacterNames().some(name => name.includes(keyword)))) return false;
                    const names = new Set(getUniqueSkillNames(currentSkills));
                    const all = Array.from(new Set(Array.isArray(condition.all) ? condition.all.filter(Boolean) : []));
                    const any = Array.from(new Set(Array.isArray(condition.any) ? condition.any.filter(Boolean) : []));
                    if (all.length && !all.every(name => names.has(name))) return false;
                    if (any.length && !any.some(name => names.has(name))) return false;
                    return Boolean(all.length || any.length);
                }
                return false;
            };
            const isConditionRelevant = (condition, currentSkills) => {
                if (!condition || typeof condition != "object") return false;
                if (!condition.type && Array.isArray(condition.all)) return condition.all.some(item => isConditionRelevant(item, currentSkills));
                if (!condition.type && Array.isArray(condition.any)) return condition.any.some(item => isConditionRelevant(item, currentSkills));
                if (!condition.type && condition.not) return false;
                if (condition.type == "keyword") return getKeywordCount(condition.keyword, currentSkills) > 0;
                if (condition.type == "skill") return currentSkills.includes(condition.skill);
                if (condition.type == "skillName") return currentSkills.some(skill => lib.translate[skill] == condition.name);
                if (condition.type == "skills") return [...(condition.all || []), ...(condition.any || [])].some(skill => currentSkills.includes(skill));
                if (condition.type == "skillNames") {
                    const names = new Set(getUniqueSkillNames(currentSkills));
                    return [...(condition.all || []), ...(condition.any || [])].some(name => names.has(name));
                }
                if (condition.type == "characterSkillNames") {
                    const characters = Array.isArray(condition.characters) ? condition.characters : [condition.character];
                    return characters.some(keyword => getCharacterNames().some(name => name.includes(keyword)))
                        && [...(condition.all || []), ...(condition.any || [])].some(name => getUniqueSkillNames(currentSkills).includes(name));
                }
                return false;
            };
            const getConditionText = (condition, currentSkills) => {
                if (!condition || typeof condition != "object") return "未配置激活条件";
                if (!condition.type && Array.isArray(condition.all)) return condition.all.map(item => getConditionText(item, currentSkills)).join("；");
                if (!condition.type && Array.isArray(condition.any)) return `满足任意一项：${condition.any.map(item => getConditionText(item, currentSkills)).join("；")}`;
                if (!condition.type && condition.not) return `排除：${getConditionText(condition.not, currentSkills)}`;
                if (condition.type == "keyword") {
                    const count = getKeywordCount(condition.keyword, currentSkills);
                    const need = Math.max(1, Number(condition.count) || 1);
                    return `包含【${condition.keyword}】的技能 ${Math.min(count, need)}/${need}`;
                }
                if (condition.type == "skill") return `${currentSkills.includes(condition.skill) ? "已" : "未"}选择【${get.translation(condition.skill)}】`;
                if (condition.type == "skillName") return `${currentSkills.some(skill => lib.translate[skill] == condition.name) ? "已" : "未"}选择任意版本的【${condition.name}】`;
                if (condition.type == "skills") {
                    const all = Array.isArray(condition.all) ? condition.all : [];
                    const any = Array.isArray(condition.any) ? condition.any : [];
                    if (all.length) return `指定技能 ${all.filter(skill => currentSkills.includes(skill)).length}/${all.length}`;
                    if (any.length) return `任选其一：${any.map(skill => `【${get.translation(skill)}】`).join("、")}`;
                }
                if (condition.type == "skillNames") {
                    const names = new Set(getUniqueSkillNames(currentSkills));
                    const all = Array.from(new Set(Array.isArray(condition.all) ? condition.all.filter(Boolean) : []));
                    const any = Array.from(new Set(Array.isArray(condition.any) ? condition.any.filter(Boolean) : []));
                    const candidates = Array.from(new Set(all.concat(any)));
                    const matched = candidates.filter(name => names.has(name)).length;
                    const need = Number(condition.count);
                    if (Number.isFinite(need) && need > 0) return `不同技能名称 ${Math.min(matched, Math.floor(need))}/${Math.floor(need)}`;
                    if (all.length) return `同名技能 ${all.filter(name => names.has(name)).length}/${all.length}`;
                    if (any.length) return `任选任意版本：${any.map(name => `【${name}】`).join("、")}`;
                }
                if (condition.type == "characterSkillNames") {
                    const characters = Array.from(new Set((Array.isArray(condition.characters) ? condition.characters : [condition.character]).filter(Boolean)));
                    const names = new Set(getUniqueSkillNames(currentSkills));
                    const all = Array.from(new Set(Array.isArray(condition.all) ? condition.all.filter(Boolean) : []));
                    const any = Array.from(new Set(Array.isArray(condition.any) ? condition.any.filter(Boolean) : []));
                    const characterReady = characters.some(keyword => getCharacterNames().some(name => name.includes(keyword)));
                    const skillText = all.length
                        ? `指定技能 ${all.filter(name => names.has(name)).length}/${all.length}`
                        : `任选技能：${any.map(name => `【${name}】`).join("、")}`;
                    return `${characterReady ? "武将名称已匹配" : `武将名称需包含【${characters.join("】或【")}】`}；${skillText}`;
                }
                return "未配置激活条件";
            };
            const getLevelSkills = level => {
                if (Array.isArray(level?.skills)) return level.skills.filter(Boolean);
                return level?.skill ? [level.skill] : [];
            };
            const getLevelText = level => {
                if (level?.text) return level.text;
                const rewardSkills = getLevelSkills(level);
                if (rewardSkills.length) return `获得技能【${rewardSkills.map(skill => get.translation(skill)).join("、")}】`;
                return "羁绊效果待配置";
            };

            const mask = createNode("div", "shuYing-skill-reward-mask", null, document.body);
            const dialog = createNode("div", "shuYing-skill-reward-dialog", null, mask);
            const titleNode = createNode("div", "shuYing-skill-reward-title", null, dialog);
            const highlightIndex = highlightText ? title.indexOf(highlightText) : -1;
            if (highlightIndex < 0) titleNode.textContent = title;
            else {
                titleNode.append(document.createTextNode(title.slice(0, highlightIndex)));
                createNode("span", "shuYing-skill-reward-title-character", highlightText, titleNode);
                titleNode.append(document.createTextNode(title.slice(highlightIndex + highlightText.length)));
            }
            const content = createNode("div", "shuYing-skill-reward-content", null, dialog);
            const preview = createNode("section", "shuYing-skill-reward-preview", null, content);
            const previewName = createNode("div", "shuYing-skill-reward-name", "", preview);
            const previewInfo = createNode("div", "shuYing-skill-reward-info", "", preview);
            const bondPanel = createNode("aside", "shuYing-skill-reward-bonds", null, content);
            createNode("div", "shuYing-skill-reward-bond-title", "羁绊", bondPanel);
            const bondList = createNode("div", "shuYing-skill-reward-bond-list", null, bondPanel);
            const choiceArea = createNode("div", "shuYing-skill-reward-choices", null, dialog);
            const controls = createNode("div", "shuYing-skill-reward-controls", null, dialog);
            let closed = false;
            let previewSkill = skills[0];
            let selectedSkill = skills[0];

            const renderBonds = () => {
                bondList.innerHTML = "";
                if (!bonds.length) {
                    createNode("div", "shuYing-skill-reward-bond-empty", "暂无可激活羁绊", bondList);
                    return;
                }
                bonds.forEach(bond => {
                    const levels = (bond.levels || []).map((level, index) => ({
                        ...level,
                        rank: Number(level.level ?? level.count ?? index + 1) || index + 1,
                    })).sort((a, b) => a.rank - b.rank);
                    if (!levels.length) return;
                    const currentSkills = getPreviewSkills(previewSkill);
                    if (!levels.some(level => isConditionRelevant(getLevelCondition(bond, level), currentSkills))) return;
                    const reached = levels.filter(level => matchesCondition(getLevelCondition(bond, level), currentSkills));
                    const active = reached[reached.length - 1] || null;
                    const next = levels.find(level => level.rank > (active?.rank || 0)) || null;
                    const item = createNode("div", `shuYing-skill-reward-bond${active ? " active" : ""}`, null, bondList);
                    const head = createNode("div", "shuYing-skill-reward-bond-head", null, item);
                    createNode("span", "shuYing-skill-reward-bond-name", bond.name || (bond.keyword ? `【${bond.keyword}】羁绊` : bond.id || "未命名羁绊"), head);
                    createNode("span", "shuYing-skill-reward-bond-count", active ? `第${active.rank}级` : "待激活", head);
                    const status = active ? `已激活：${getLevelText(active)}` : getConditionText(getLevelCondition(bond, next), currentSkills);
                    createNode("div", "shuYing-skill-reward-bond-status", status, item);
                    if (next) {
                        createNode("div", "shuYing-skill-reward-bond-effect", `下一阶段：${getLevelText(next)}`, item);
                        if (active) createNode("div", "shuYing-skill-reward-bond-effect", getConditionText(getLevelCondition(bond, next), currentSkills), item);
                    }
                });
                if (!bondList.childNodes.length) createNode("div", "shuYing-skill-reward-bond-empty", "该技能暂无相关羁绊", bondList);
            };

            const renderPreview = skill => {
                previewSkill = skill;
                previewName.textContent = `【${get.translation(skill)}】`;
                previewInfo.innerHTML = getSkillInfo(skill);
                choiceArea.querySelectorAll(".shuYing-skill-reward-choice").forEach(node => {
                    node.classList.toggle("previewing", node.dataset.skill == skill);
                    node.classList.toggle("selected", node.dataset.skill == selectedSkill);
                    node.setAttribute("aria-pressed", String(node.dataset.skill == selectedSkill));
                });
                renderBonds();
            };
            const finish = skill => {
                if (closed) return;
                closed = true;
                mask.remove();
                resolve(skill);
            };

            skills.forEach(skill => {
                const button = createNode("button", "shuYing-skill-reward-choice", get.translation(skill), choiceArea);
                button.type = "button";
                button.dataset.skill = skill;
                button.addEventListener("mouseenter", () => renderPreview(skill));
                button.addEventListener("focus", () => renderPreview(skill));
                button.addEventListener("click", event => {
                    event.stopPropagation();
                    selectedSkill = skill;
                    renderPreview(skill);
                });
            });
            const confirm = createNode("button", "shuYing-skill-reward-confirm", "确定", controls);
            confirm.type = "button";
            confirm.addEventListener("click", event => {
                event.stopPropagation();
                finish(selectedSkill);
            });
            if (canRefresh) {
                const handCount = player?.countCards?.("h") || 0;
                const discardCount = Math.ceil(handCount / 2);
                const refresh = createNode("button", "shuYing-skill-reward-refresh", `刷新（弃${discardCount}张）`, controls);
                refresh.type = "button";
                refresh.title = "随机弃置一半手牌（向上取整），重新生成技能选项；本次只能使用一次";
                refresh.addEventListener("click", event => {
                    event.stopPropagation();
                    finish({ refresh: true });
                });
            }
            mask.addEventListener("click", event => event.stopPropagation());
            dialog.addEventListener("click", event => event.stopPropagation());
            renderPreview(previewSkill);
            choiceArea.querySelector(".shuYing-skill-reward-choice")?.focus({ preventScroll: true });
        });
    };
}
