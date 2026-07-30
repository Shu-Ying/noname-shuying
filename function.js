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
}
