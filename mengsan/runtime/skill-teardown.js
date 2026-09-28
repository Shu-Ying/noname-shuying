// Candidate-only engine-derived release. Never replaces Player.prototype or lib.skill.
// Restricted: additional/fixed/superCharlotte skills require a separate audited adapter.
export async function removeBattleSkill(player, skill, {lib,game,get,_status}, wholePlayer = false) {
    const names = Array.isArray(skill) ? skill.slice() : [skill];
    for (const name of names) {
        if (lib.skill[name]?.fixed || lib.skill[name]?.superCharlotte) throw new Error("Unsupported protected skill: " + name);
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
        if (info?.fixed && arguments[1] !== true) {
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
                  if (this.onremove == "discard") {
                    this.$throw(cards);
                  }
                  if (this.onremove == "discard" || this.onremove == "lose") {
                    game.cardsDiscard(cards);
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
    let releaseError;
    root.setContent(async () => {
        try {
            for (const release of releases) {
                await release();
                await root.waitNext();
            }
        } catch (error) {
            releaseError = error;
            // Let the engine drain any queued work and pop this root normally.
        }
    });
    // Natural start completion includes next/after and native stack pop. Failure stays fail-closed.
    await root.start();
    if (_status.eventManager.eventStack.includes(root)) throw new Error("Teardown event still active");
    if (_status.eventManager.rootEvent === root) _status.eventManager.rootEvent = previous;
    if (releaseError) throw releaseError;
}

// Whole-player disposal differs from removing one source during gameplay: every source is ending.
// Each callback runs at most once; failed/partially executed teardown is NOT replayed blindly.
export function createPlayerTeardown(players, env) {
    const captured = players.slice();
    let operation;
    const names = player => [...new Set([
        ...(player.skills || []), ...(player.hiddenSkills || []), ...(player.invisibleSkills || []),
        ...Object.keys(player.tempSkills || {}),
        ...Object.values(player.additionalSkills || {}).flatMap(list => typeof list === "string" ? [list] : list || []),
    ])];
    return () => {
        if (operation) return operation;
        operation = (async () => {
            // Preflight ALL players before modifying any skill.
            for (const player of captured) for (const name of names(player)) {
                if (env.lib.skill[name]?.fixed || env.lib.skill[name]?.superCharlotte) throw new Error("Protected skill requires adapter: " + name);
                if (Object.values(player.additionalSkills || {}).some(value => !Array.isArray(value))) throw new Error("Unsupported additional skill source shape");
            }
            await runSkillTeardown(captured.map(player => async () => {
                const released = new Set();
                while (names(player).length) {
                    if (released.size >= 128) throw new Error("Skill teardown exceeded bounded expansion");
                    const name = names(player)[0];
                    if (released.has(name)) throw new Error("Released skill was re-added: " + name);
                    await removeBattleSkill(player, name, env, true);
                    released.add(name);
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
