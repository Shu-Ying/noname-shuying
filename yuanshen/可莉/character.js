character =
{
  character:
  {
    shuYing_Keli:["female", "qun", 4, 
    ["shuYing_Pengpeng", "shuYing_Honghong", "shuYing_Lieyan"], 
    ['ext:术樱包/yuanshen/可莉/1.jpg', 
    "die:true", "die:ext:术樱包/yuanshen/可莉:true"]],
  },

  skill:
  {
    shuYing_Pengpeng:{
      mark:true,
      marktext:'砰',
      intro:
      {
          content:(storage, player, skill) => 
          {
          var num = player.storage.shuYing_Pengpeng, num1;
          if (num >= 3 && parseInt(num % 3) == 0) 
          {
            return '下张伤害类牌就可以多丢一个炸弹';
          } else {
            num1 = num < 3 ? 3 - num : 3 - parseInt(num % 3);
            return '距离可莉的炸弹还有' + num1 + '张哦';
          }
        },
      },
      audio:"ext:术樱包/yuanshen/可莉:4",
      trigger:{player:"useCardToTargeted"},
      forced:true,
      firstDo:true,
      popup:false,
      init:function(player)
      {
          player.storage.shuYing_Pengpeng=0;
          player.storage.shuYing_Pengpeng_Damage=false;
          player.storage.shuYing_Pengpeng_Bool=false;
          player.storage.shuYing_Keli_Bool=false;
      },
      filter:function(event,player)
      {
          if(!get.tag(event.card,'damage')) return false;
          if(!event.isFirstTarget) return false;
          var info = get.info(event.card);
          if(info.allowMultiple==false) return false;
          if(event.targets&&!info.multitarget)
          {
              if(game.hasPlayer(function(current){return lib.filter.targetEnabled2(event.card,player,current)}))
              {
                return true;
              }
          }

          return false;
      },
      content:function()
      {
          var num = player.storage.shuYing_Pengpeng;
          var mp3 = num+1;
          if(mp3 >= 3 && parseInt(mp3 % 3) == 0){
              var list=[1,2,3].randomGet();
              game.playAudio('..','extension/术樱包/yuanshen/可莉','shuYing_Pengpeng' + list);
          }
          if(num>=3&&parseInt(num%3)==0){
              player.storage.shuYing_Pengpeng_Bool=true;
              player.storage.shuYing_Keli_Bool=true;
              player.storage.shuYing_Pengpeng++;
          } else {
              player.storage.shuYing_Pengpeng_Damage=false;
              player.storage.shuYing_Pengpeng_Bool=false;
              player.storage.shuYing_Keli_Bool=false;
              player.storage.shuYing_Pengpeng++;
          }
      },
      group:['shuYing_Pengpeng_Damage','shuYing_Pengpeng_Target'],
      subSkill:{
          Damage:{
              trigger:{source:"damageBefore"},
              forced:true,
              firstDo:true,
              popup:false,
              onremove:true,
              sub:true,
              filter:function(event,player){
                  return get.tag(event.card,'damage')&&player.storage.shuYing_Keli_Bool;
              },
              content:function(){
                  trigger.nature='fire';
                  if(player.storage.shuYing_Pengpeng_Damage) {
                      trigger.num++;
                  }
              }
          },
          Target:{
              trigger:{player:"useCardToTargeted"},
              forced:true,
              popup:false,
              sub:true,
              filter:function(event,player){
                  if(!get.tag(event.card,'damage')||event.targets.length!=1) return false;
                  if(!event.isFirstTarget) return false;
                  var info=get.info(event.card);
                  if(info.allowMultiple==false) return false;
                  if(event.targets&&!info.multitarget){
                      if(game.hasPlayer(function(current){
                          return lib.filter.targetEnabled2(event.card,player,current);
                      })){
                          return player.storage.shuYing_Pengpeng_Bool;
                      }
                  }
                  return false;
              },
              content:function(){
                  'step 0'
                  var prompt2='为'+get.translation(trigger.card)+'额外指定一个目标';
                  player.chooseTarget([1,player.storage.fumian_red],get.prompt(event.name),function(card,player,target){
                      var player=_status.event.player;
                      if(_status.event.targets.contains(target)) return false;
                      return lib.filter.targetEnabled2(_status.event.card,player,target);
                  }).set('prompt2',prompt2).set('ai',function(target){
                      var trigger=_status.event.getTrigger();
                      var player=_status.event.player;
                      return get.effect(target,trigger.card,player,player);
                  }).set('targets',trigger.targets).set('card',trigger.card);
                  'step 1'
                  if(result.bool){
                      if(!_status.connectMode&&!event.isMine()) game.delayx();
                      event.targets=result.targets;
                  } else {
                      event.finish();
                      player.storage.shuYing_Pengpeng_Bool=false;
                      player.storage.shuYing_Pengpeng_Damage=true;
                  }
                  'step 2'
                  if(event.targets){
                      player.logSkill(event.name,event.targets);
                      trigger.targets.addArray(event.targets);
                  }
                  player.storage.shuYing_Pengpeng_Bool=false;
              },
          },
      },
  },
  shuYing_Honghong:{
      audio:"ext:术樱包/yuanshen/可莉:3",
      enable:'phaseUse',
      usable:1,
      init:function(player){
          player.storage.shuYing_Honghong_Bool=false;
      },
      check:function(){
          return true;
      },
      filter:function(event,player){
          var hs=player.getCards('h',function(card){
              return get.tag(card,'damage');
          });
          if(!hs.length) return false;
          return true;
      },
      content:function(){
          'step 0'
          event.card=get.cardPile(function(card){
              return get.tag(card,'damage');
          });
          if(event.card) {
              player.showCards(event.card);
              player.chooseToDiscard('h',1,function(card){
                  return get.tag(card,'damage');
              },false).set('ai',function(card){
                  return 8-ai.get.value(card);
              });
          } else {
              game.log(player,'将',event.card,'置入弃牌堆');
              game.cardsDiscard(event.card);
              event.finish();
          }
          'step 1'
          if(result.bool){
              player.storage.shuYing_Honghong_Bool=true;
              player.chooseUseTarget(event.card,false);
          } 
          'step 2'
          if(!result.targets){
              game.log(player,'将',event.card,'置入弃牌堆');
              game.cardsDiscard(event.card);
          } else {
              event.finish();
          }
      },
      contentAfter:function(){
          player.storage.shuYing_Honghong_Bool=false;
      },
      group:['shuYing_Honghong_Damage','shuYing_Honghong_Jieshu'],
      subSkill:{
          Damage:{
              trigger:{source:"damageBefore"},
              forced:true,
              firstDo:true,
              popup:false,
              onremove:true,
              sub:true,
              filter:function(event,player){
                  return get.tag(event.card,'damage')&&player.storage.shuYing_Honghong_Bool;
              },
              content:function(){
                  trigger.nature='fire';
              }
          },
          Jieshu:{
              trigger:{player:"phaseJieshu"},
              frequent:true,
              filter:function(event,player){
                  var sourceDamage=player.getHistory('sourceDamage').length;
                  return sourceDamage==0&&!player.countCards('h',function(card){
                      return get.tag(card,'damage');
                  });
              },
              content:function(){
                  var card=get.cardPile2(function(card){
                      return get.tag(card,'damage');
                  });
                  if(card) player.gain(card,'gain2');
                  game.updateRoundNumber();
              },
          },
      },
      ai:{
          order:6,
          result:{
              player:1,
          },
          threaten:0.5,
      },
  },
  shuYing_Lieyan:
  {
    audio:"ext:术樱包/yuanshen/可莉:1",
    trigger:{player:'damageBegin4'},
    filter:function(event){
        return event.nature=='fire';
    },
    forced:true,
    content:function(){
        trigger.cancel();
    },
    ai:{
        nofire:true,
        effect:{
            target:function(card,player,target,current){
                if(get.tag(card,'fireDamage')) return 'zerotarget';
            }
        }
    },
    group:'shuYing_Lieyan_Damage',
    subSkill:{
        Damage:{
            audio:"ext:术樱包/yuanshen/可莉:3",
            trigger:{source:"damageBegin"},
            forced:true,
            sub:true,
            filter:function(event,player){
                return event.nature=='fire';
            },
            content:function(){
                if(player.countCards('h')!=player.hp){
                    player.draw(player.countCards('h')==0?2:1);
                } else {
                    trigger.num++;
                }          
            },
            ai:{
                effect:{
                    player:function(card,player,target){
                        if(card.name=='sha'||card.nature=='fire'||card.name=='zhuque') return [1,3];
                    },
                },
            },
        },
    },
  },
  },

  translate:
  {
    shuYing_Keli:"可莉",

    shuYing_Pengpeng:"砰砰",
    shuYing_Pengpeng_info:"锁定技: 你每使用三次伤害类型牌，下张伤害类型牌的伤害为火元素。若该牌目标唯一，则你可以选择一个额外的合法目标。若取消则该牌伤害+1",
    shuYing_Honghong:"轰轰",
    shuYing_Honghong_info:"出牌阶段限一次，你展示牌堆中一张可以造成伤害的牌，然后你可以弃置一张可以造成伤害的手牌并使用该牌(这张牌造成的伤害为火元素)否则将此牌置入弃牌堆。结束阶段，若你此回合没有造成伤害且手牌没有伤害类牌则你获得一张伤害类牌",
    shuYing_Lieyan:"烈焰",
    shuYing_Lieyan_info:"锁定技，你受到火元素伤害时，免疫此伤害；当你造成火元素伤害时, 若你手牌不等于当前体力, 则你摸一张牌, 若你没有手牌则额外摸一张手牌;若相等则该伤害+1",

  }
};

