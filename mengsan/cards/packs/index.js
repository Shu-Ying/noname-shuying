import { LiuBeiCardPack } from "./liubei/index.js";
import { ColorlessCardPack } from "./colorless/index.js";

// 后续角色各有目录和牌组类，仅在此登记，不扩张 mode-cards.js。
const packTypes = Object.freeze([LiuBeiCardPack,ColorlessCardPack]);
export function createCardPackRuntime(context) {
    const result={cards:{},translate:{},skills:{},names:[]}, runtimes=[];
    for(const Pack of packTypes){
        const runtime=new Pack(context).createRuntime();runtimes.push(runtime);
        for(const key of ["cards","skills"]){
            for(const name of Object.keys(runtime[key] || {}))if(Object.hasOwn(result[key],name))throw new Error(`重复的牌组定义：${Pack.id}/${name}`);
            Object.assign(result[key],runtime[key]);
        }
        Object.assign(result.translate,runtime.translate);result.names.push(...runtime.names);
    }
    result.vulnerableBonus=(source,target)=>runtimes.reduce((sum,r)=>sum+(r.vulnerableBonus?.(source,target)||0),0);
    result.onDeath=async event=>{for(const runtime of runtimes)await runtime.onDeath?.(event);};
    return result;
}
