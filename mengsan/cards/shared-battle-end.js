import { upgradeRandomCard } from "./upgrades.js";
import { nextRandom } from "../progression/state.js";
// Called inside the existing receipt-guarded settlement transaction, once per battle.
export function applySharedBattleEndCards(run,outcome) {
    const effects=run.sharedBattleCardEffects;delete run.sharedBattleCardEffects;
    if(outcome!=="victory")return;
    run.player.deck=run.player.deck.filter(card=>{
        if(card.name!=="mengsan_curse_guilty")return true;
        const count=card.guiltyBattles??0;
        if(!Number.isSafeInteger(count)||count<0||count>4)throw new RangeError("愧疚战斗计数无效");
        card.guiltyBattles=count+1;return card.guiltyBattles<5;
    });
    const count=effects?.upgrades??0;
    if(!Number.isSafeInteger(count)||count<0||count>1024)throw new RangeError("战后卡牌强化次数无效");
    for(let n=0;n<count;n++)if(!upgradeRandomCard(run.player.deck,()=>nextRandom(run)))break;
}
