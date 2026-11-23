import { campEnemy } from "../battle/camps.js";
import { createOpeningEffects } from "../relics/combat.js";
import { getPotion, potionIds, potionSlots, removePotion } from "./state.js";

const selectedSlots = new WeakMap();
const skillId = id => "mengsan_use_" + id.toLowerCase() + "_shuying";
export const potionSkillIds = potionIds.map(skillId);
export const potionSkillTranslations = Object.fromEntries(
    potionIds.map(id => [skillId(id), getPotion(id).name]));
export const potionBlockType = "mengsanPotionBlock";

const openingEffects = {
    ENERGY_POTION: "energy",
    FIRE_POTION: "targetDamage",
    STRENGTH_POTION: "openingStrength",
};

function phaseChoice(event, player, battle) {
    return battle?.session.active && player === battle.owner && player.isAlive() &&
        event?.name === "chooseToUse" && event.type === "phase" &&
        event.player === player && event.parent?.name === "phaseUse" && !event.respondTo;
}

const legalEnemy = (game, player, enemy) => game.players.includes(enemy) &&
    enemy.isAlive() && campEnemy(player, enemy);

export function createPotionSkills(getBattle, game) {
    return Object.fromEntries(potionIds.map(id => {
        const { amount, enemy, name } = getPotion(id);
        const skill = {
            enable: "phaseUse",
            manualConfirm: true,
            discard: false,
            lose: false,
            log: false,
            filter(event, player) {
                const battle = getBattle();
                return phaseChoice(event, player, battle) && potionSlots(battle.run.player).includes(id) &&
                    (!enemy || game.players.some(target => legalEnemy(game, player, target)));
            },
            async content(event, trigger, player) {
                const battle = getBattle();
                const choice = event.getParent("chooseToUse");
                if (!phaseChoice(choice, player, battle)) return;
                const target = event.targets?.[0];
                if (enemy && !legalEnemy(game, player, target)) return;
                const inventory = battle.run.player;
                const request = selectedSlots.get(choice);
                selectedSlots.delete(choice);
                const index = request?.id === id ? request.index : potionSlots(inventory).indexOf(id);
                if (!removePotion(inventory, index, id)) return;
                battle.potionUI?.refresh();
                game.log(player, "使用了" + name);
                if (id === "SWIFT_POTION") {
                    await game.mengsanDraw_shuying(player, amount);
                } else if (id === "BLOCK_POTION") {
                    await player.changeHujia(amount, potionBlockType);
                } else {
                    const applyEffect = createOpeningEffects(game, player, () => battle.energyUI.get(player)?.());
                    await applyEffect({ effect: openingEffects[id], amount, target });
                }
            },
        };
        if (enemy) {
            skill.selectTarget = 1;
            skill.filterTarget = (card, player, target) => legalEnemy(game, player, target);
        }
        return [skillId(id), skill];
    }));
}

export function createPotionActions(battle, { lib, game, ui, _status }) {
    const { owner, run } = battle;
    const ready = () => {
        const event = _status.event;
        return phaseChoice(event, owner, battle) && event.isMine() && !event.finished &&
            !event.skill && !_status.paused2 && !ui.intro &&
            !ui.selected.cards.length && !ui.selected.targets.length && !ui.selected.buttons.length;
    };
    const canUse = (index, id) => ready() && potionSlots(run.player)[index] === id &&
        lib.filter.filterEnable(_status.event, owner, skillId(id));
    return {
        canUse,
        canDiscard: ready,
        use(index, id) {
            if (!canUse(index, id)) return;
            selectedSlots.set(_status.event, { index, id });
            ui.click.skill(skillId(id));
        },
        discard(index, id) {
            if (!ready() || !removePotion(run.player, index, id)) return;
            selectedSlots.delete(_status.event);
            battle.potionUI?.refresh();
            game.log(owner, "丢弃了" + getPotion(id).name);
            delete _status.event._skillChoice;
            game.check();
        },
    };
}
