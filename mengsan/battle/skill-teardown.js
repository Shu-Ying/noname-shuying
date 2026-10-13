// Candidate-only engine-derived release. Never replaces Player.prototype or lib.skill.
// Protected gameplay skills stay guarded; whole-player disposal owns every source.
import { getDiagnostics } from "../../diagnostics/index.js";

const markerFields = new Set(["fixed", "superCharlotte", "charlotte", "forced",
    "unique", "popup", "silent", "ai", "skill_id", "_priority", "priority",
    "locked", "nopop"]);
const protectedMarker = info => Boolean((info?.fixed || info?.superCharlotte) &&
    Reflect.ownKeys(info).every(key => markerFields.has(key)));
export async function removeBattleSkill(player, skill, {lib,game,get,_status}, wholePlayer = false) {
    const names = Array.isArray(skill) ? skill.slice() : [skill];
    for (const name of names) {
        if (!wholePlayer && (lib.skill[name]?.fixed || lib.skill[name]?.superCharlotte)) throw new Error("Unsupported protected skill: " + name);
    }
    if (!wholePlayer && Object.values(player.additionalSkills || {}).some(list => list?.length)) throw new Error("Additional skill release adapter required");
    const remove = async function removeSkill(skill) {
    if (!skill) {
      return;
    }
    _status.event.clearStepCache();
    if (Array.isArray(skill)) {
      for (var i = 0; i < skill.length; i++) {
        await removeSkill.call(this, skill[i]);
      }
    } else {
      if (skill === "counttrigger") {
        this.stat[this.stat.length - 1].triggerSkill = {};
        return;
      } else {
        var info = lib.skill[skill];
        if (info?.fixed && !wholePlayer) {
          return skill;
        }
        this.unmarkSkill(skill);
        game.broadcastAll(
          function(player, skill2) {
            player.skills.remove(skill2);
            player.hiddenSkills.remove(skill2);
            player.invisibleSkills.remove(skill2);
            delete player.tempSkills[skill2];
            for (var i2 in player.additionalSkills) {
              player.additionalSkills[i2].remove(skill2);
            }
          },
          this,
          skill
        );
        this.checkConflict(skill);
        if (info) {
          if (info.onremove) {
            if (typeof info.onremove == "function") {
              await info.onremove(this, skill);
            } else if (typeof info.onremove == "string") {
              if (info.onremove == "storage") {
                delete this.storage[skill];
              } else {
                var cards = this.storage[skill];
                if (get.itemtype(cards) == "card") {
                  cards = [cards];
                }
                if (get.itemtype(cards) == "cards") {
                  if (info.onremove == "discard") {
                    this.$throw(cards);
                  }
                  if (info.onremove == "discard" || info.onremove == "lose") {
                    await game.cardsDiscard(cards);
                    delete this.storage[skill];
                  }
                }
              }
            } else if (Array.isArray(info.onremove)) {
              for (var i = 0; i < info.onremove.length; i++) {
                delete this.storage[info.onremove[i]];
              }
            } else if (info.onremove === true) {
              delete this.storage[skill];
            }
          }
          this.removeSkillTrigger(skill);
          if (!wholePlayer && !info.keepSkill) {
            this.removeAdditionalSkills(skill);
          }
        }
        this.enableSkill(skill + "_awake");
        game.callHook("removeSkillCheck", [skill, this]);
      }
    }
    return skill;
  };
    return remove.call(player, skill);
}

// Must be called after gameplay root drained, outside all engine event bodies.
export async function runSkillTeardown(releases, {lib,_status}) {
    if (_status.eventManager.eventStack.length || _status.eventManager.tempEvent) throw new Error("Gameplay must drain before skill release");
    if (!Array.isArray(releases) || releases.some(fn => typeof fn !== "function")) throw new TypeError("Explicit release callbacks required");
    const previous = _status.eventManager.rootEvent;
    const root = new lib.element.GameEvent("mengsanSkillTeardown", false, _status.eventManager);
    let releaseError, releaseFailed = false;
    root.setContent(async () => {
        try {
            for (const release of releases) {
                await release();
                await root.waitNext();
            }
        } catch (error) {
            releaseFailed = true;
            releaseError = error;
            // Let the engine drain any queued work and pop this root normally.
        }
    });
    // Natural start completion includes next/after and native stack pop. Failure stays fail-closed.
    await root.start();
    if (_status.eventManager.eventStack.includes(root)) throw new Error("Teardown event still active");
    if (_status.eventManager.rootEvent === root) _status.eventManager.rootEvent = previous;
    if (releaseFailed) throw releaseError;
}

// Whole-player disposal differs from removing one source during gameplay: every source is ending.
// Each callback runs at most once; failed/partially executed teardown is NOT replayed blindly.
export function createPlayerTeardown(players, env) {
    const captured = players.slice();
    const diagnostics = getDiagnostics().scope("mengsan.skillTeardown");
    let operation;
    const names = player => [...new Set([
        ...(player.skills || []), ...(player.hiddenSkills || []), ...(player.invisibleSkills || []),
        ...(player.initedSkills || []),
        ...Object.keys(player.tempSkills || {}),
        ...Object.values(player.additionalSkills || {}).flatMap(list => typeof list === "string" ? [list] : list || []),
    ])];
    return () => {
        if (operation) return operation;
        operation = (async () => {
            // Preflight ALL players before modifying any skill.
            for (const player of captured) {
                if (Object.values(player.additionalSkills || {}).some(value => !Array.isArray(value))) throw new Error("Unsupported additional skill source shape");
            }
            await runSkillTeardown(captured.map(player => async () => {
                const released = new Set();
                const retained = new Set();
                const equipmentSkills = new Set();
                for (const card of player.getVCards?.("e") || []) {
                    const context = { playerId: player.playerid,
                        character: player.name, cardName: card.name };
                    try {
                        const skills = env.get.info(card, false)?.skills || [];
                        for (const name of skills) equipmentSkills.add(name);
                        const root = env._status.event;
                        const existing = new Set(root.next);
                        player.removeEquipTrigger(card);
                        let callbackError, callbackFailed = false;
                        const guarded = new WeakSet();
                        const guard = child => {
                            if (guarded.has(child)) return;
                            guarded.add(child);
                            const content = child.content;
                            child.content = async event => {
                                try { await Reflect.apply(content, child, [event]); }
                                catch (error) {
                                    if (!callbackFailed) callbackError = error;
                                    callbackFailed = true;
                                    event.finish();
                                }
                            };
                            const waitNext = child.waitNext;
                            child.waitNext = function (...args) {
                                for (const next of [...this.next, ...this.after]) {
                                    guard(next);
                                }
                                return Reflect.apply(waitNext, this, args);
                            };
                        };
                        for (const child of root.next) {
                            if (!existing.has(child)) guard(child);
                        }
                        await root.waitNext();
                        if (callbackFailed) throw callbackError;
                        diagnostics.info("equipment.released", context);
                    } catch (error) {
                        diagnostics.error("equipment.release.failed", error, context);
                        throw error;
                    }
                }
                const candidates = () => [...new Set([
                    ...names(player), ...equipmentSkills,
                ])].filter(name => {
                    const info = env.lib.skill[name];
                    if (!protectedMarker(info)) return true;
                    if (!retained.has(name)) {
                        retained.add(name);
                        diagnostics.info("skill.retained", { skill: name,
                            playerId: player.playerid, character: player.name,
                            fixed: !!info.fixed, superCharlotte: !!info.superCharlotte,
                            reason: "metadataOnly" });
                    }
                    return false;
                });
                while (candidates().length) {
                    if (released.size >= 128) throw new Error("Skill teardown exceeded bounded expansion");
                    const name = candidates()[0];
                    if (released.has(name)) throw new Error("Released skill was re-added: " + name);
                    const info = env.lib.skill[name];
                    const context = { skill: name, playerId: player.playerid,
                        character: player.name, fixed: !!info?.fixed,
                        superCharlotte: !!info?.superCharlotte };
                    try {
                        await removeBattleSkill(player, name, env, true);
                        diagnostics.info("skill.released", context);
                    } catch (error) {
                        diagnostics.error("skill.release.failed", error, context);
                        throw error;
                    }
                    released.add(name);
                    equipmentSkills.delete(name);
                    // Children can add skills. Drain them before taking the next inventory.
                    await env._status.event.waitNext();
                }
                for (const [key,list] of Object.entries(player.additionalSkills || {})) {
                    if (Array.isArray(list) && !list.length) delete player.additionalSkills[key];
                }
            }), env);
        })();
        return operation;
    };
}
