// Track only the turn created by this battle's cooperative loop.
const battleTurns = new WeakMap();
const turnStages = new Set(["phase", "phaseZhunbei", "phaseJudge", "phaseDraw", "phaseUse", "phaseDiscard", "phaseJieshu"]);

export function stopBattleTurn(session, eventManager) {
    const turn = battleTurns.get(session);
    if (!turn) return;
    const belongsToTurn = event => {
        const seen = new Set();
        while (event && !seen.has(event)) {
            if (event === turn) return true;
            seen.add(event);
            event = event.parent;
        }
        return false;
    };
    // Finish phase controllers, not the card/damage/death events currently resolving.
    // Those events must unwind before the session can safely dispose players.
    for (const event of eventManager.eventStack.slice().reverse()) {
        if (turnStages.has(event.name) && belongsToTurn(event)) event.finish();
    }
    turn.finish();
}

// Candidate derived from local engine phaseLoop; no global replacement.
export async function runPhaseLoop(event, player, session, { game, lib, _status, get, beforeTurn = async () => {} }) {
    let num = 1;
    let current = player;
    while (session.active && !event.finished && current.getSeatNum() === 0) {
      current.setSeatNum(num);
      current = current.next;
      num++;
    }
    while (session.active && !event.finished) {
      if (game.players.includes(event.player)) {
        await beforeTurn(event.player);
        if (!session.active || event.finished) return;
        lib.onphase.forEach((i) => i());
        if (!session.active || event.finished) return;
        const phase = event.player.phase();
        battleTurns.set(session, phase);
        try {
          event.next.remove(phase);
          let isRoundEnd = false;
          if (lib.onround.every((i) => i(phase, event.player))) {
            isRoundEnd = _status.roundSkipped;
            if (_status.isRoundFilter) {
              isRoundEnd = _status.isRoundFilter(phase, event.player);
            } else if (_status.seatNumSettled) {
              const seatNum = event.player.getSeatNum();
              if (seatNum != 0) {
                if (get.itemtype(_status.lastPhasedPlayer) != "player" || seatNum < _status.lastPhasedPlayer.getSeatNum()) {
                  isRoundEnd = true;
                }
              }
            } else if (event.player == _status.roundStart) {
              isRoundEnd = true;
            }
            if (isRoundEnd && _status.globalHistory.some((i) => i.isRound)) {
              game.log();
              await event.trigger("roundEnd");
            }
          }
          if (!session.active || event.finished) { phase.finish(); return; }
          event.next.push(phase);
          await phase;
        } finally {
          if (battleTurns.get(session) === phase) battleTurns.delete(session);
        }
      }
      if (!session.active || event.finished) return;
      await event.trigger("phaseOver");
      if (!session.active || event.finished) return;
      const findNext = (current2) => {
        const players = game.players.slice(0).concat(game.dead).sort((a, b) => parseInt(a.dataset.position) - parseInt(b.dataset.position));
        const position = parseInt(current2.dataset.position);
        for (const player2 of players) {
          if (parseInt(player2.dataset.position) > position) {
            return player2;
          }
        }
        return players[0];
      };
      event.player = findNext(event.player);
      if (!event.player) return;
    }
  }
