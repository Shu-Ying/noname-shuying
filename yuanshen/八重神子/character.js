character =
{
  character:
  {
    shuYing_Bachongshenzi:["female", "qun", 3,
    ["shuYing_Shizuishi", "shuYing_Shashengying", "shuYing_Tianhuxianzhen"], 
    ['ext:术樱包/yuanshen/八重神子/1.jpg', 
    "die:true", "die:ext:术樱包/yuanshen/八重神子:true"]]
  },

  skill:
  {
    shuYing_Shizuishi:
    {
      audio:"ext:术樱包/yuanshen/八重神子:4",
      trigger:{player:"useCardBefore"},
      forced:true,
      filter:(event, player) => 
      {
        if (event.player != player && event.player.hasSkill('shuYing_Shizuishi')) return false;
        return event.player == player && event.card.isCard;
      },
      content:() => 
      {
        var num, sBool = false;
        var i = 0;

        while (true) {
          i++;
          num = player.shuYing_randomNum(game.players.length - 1, 0);
          if(game.players[num] != player && !game.players[num].hasSkill('shuYing_Shizuishi')) 
          {
            sBool = true;
            break;
          }
          if (i == game.players.length) break;
        }

        if (sBool) {
          trigger.player = game.players[num];
          player.line(game.players[num]);
          trigger.untrigger();
          trigger.trigger('useCardBefore');
        }

        if(trigger.card.name=='sha'){ player.getStat().card.sha++; } //限制出杀次数
      }
    },

  shuYing_Shashengying:{
    audio:"ext:术樱包/yuanshen/八重神子:2",
    trigger:{target:"useCardToTarget"},
    usable:2,
    check:(event, player, card) => 
    {
      if (event.card.name == 'shunshou' || event.card.name == 'guohe' || event.card.name == 'zhujinqiyuan' && event.player.isFriendOf(player) && player.countCards('j')) return false;
      if (get.type(event.card) == 'equip' || event.targets.length == game.players.length) return false;
      return true;
    },
    filter:(event, player) => 
    {
      var suit1 = event.card.suit;
      return player.countCards('h', function (card) 
      {
        return get.suit(card, player) == suit1;
      });
    },
    content:() => 
    {
      var suit1 = trigger.card.suit;
      'step 0';
      player.chooseControl('全部', '一张', '一张并选择一个目标').set('prompt', '请选择并弃置' + get.translation(suit1) + '花色').set('ai', function () {
        var suit1 = trigger.card.suit;
        var num = player.countCards('h', function (card) {
          return get.suit(card, player) == suit1;
        });
        var friend;

        for (var i = 0; i < game.players.length; i++) {
          if (game.players[i] == player) continue;
          if (game.players[i].isFriendOf(player)) {
            break;
            friend = true;
          }
          if (i == game.players.length) friend = false;
        }

        var trigger1 = _status.event.getTrigger();
        var card1 = get.effect(player, trigger1.card, trigger1.player, _status.event.player);

        if (get.type(trigger.card) == 'delay' && num == 1) return '全部';
        if (get.type(trigger.card) == 'delay' && num > 1) return '一张';
        if (card1 <= 1 && num == 1) return '全部';
        if (card1 >= 2 && num == 1 && friend) return '一张并选择一个目标';
        if (card1 <= 1 && num > 1) return '一张';
        if (card1 >= 2 && num > 1 && friend) return '一张并选择一个目标';
        if (card1 >= 2 && num > 1 && friend == false) return '一张';
      });
      'step 1';
      if (result.control == '全部') {
        player.discard(player.getCards('h', { suit: suit1 }));
        trigger.getParent().excluded.add(player);
        player.storage.cardName = trigger.card.name;
        player.storage.skillBool = true;
      } else if (result.control == '一张') {
        player.chooseToDiscard('h', 1, function (card) {
          return get.suit(card) == suit1;
        }, true);
        trigger.getParent().excluded.add(player);
      } else {
        player.chooseToDiscard('h', 1, function (card) {
          return get.suit(card) == suit1;
        }, true);
        player.storage.skillBool2 = true;
      }
    },
    group:['shuYing_Shashengying_Buff','shuYing_Shashengying_Buff1'],
    subSkill:{
        Buff:{
            auido:false,
            trigger:{global:'useCardAfter'},
            forced:true,
            sub:true,
            filter:function(event,player){
                return (player.storage.skillBool&&event.card.name==player.storage.cardName&&event.player!=player&&get.itemtype(event.cards)=='cards'&&get.position(event.cards[0],true)=='o');
            },
            content:function(){
                if(player.countCards('h')==0) player.draw(player.hp);
                player.gain(trigger.cards,'gain2');
                player.storage.skillBool=false;
                player.storage.cardName='';
            }
        },
        Buff1:{
            trigger:{target:"useCardToTargeted",},
            forced:true,
            popup:false,
            auido:false,
            sub:true,
            filter:function(event,player){
                return player.storage.skillBool2;
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
                }
                'step 2'
                if(event.targets){
                    player.logSkill(event.name,event.targets);
                    trigger.targets.addArray(event.targets);
                }
                player.storage.skillBool2=false;
            },
        },
    },
  },
  shuYing_Tianhuxianzhen:{
    audio:"ext:术樱包/yuanshen/八重神子:2",
    marktext:"狐",
    mark:true,
    intro:{
        content:function (storage,player,skill){
            var num=player.countMark('shuYing_Tianhuxianzhen');
            return '本回合手牌上限+'+num;
        },
    },
    locked:true,
    enable:"phaseUse",
    usable:2,
    content:function(){
        'step 0'
        player.chooseControl('黑桃','梅花','方块','红桃').set('prompt','选择一种花色并展示牌堆底的一张牌，如果花色相同则你获得之并可以重复执行').set('ai',function(){
            var randomNum = player.shuYing_randomNum(100,0);
            if(randomNum<=35){
                var card=get.bottomCards()[0];
                if(get.suit(card)=='spade'){
                    return '黑桃';
                }else if(get.suit(card)=='club'){
                    return '梅花';
                }else if(get.suit(card)=='diamond'){
                    return '方块';
                }else {
                    return '红桃';
                }
            } else {
                list=['黑桃','梅花','方块','红桃'].randomGet();
                return list;
            }
        });
        'step 1'
        if(result.control=='黑桃'){
            var card=get.bottomCards()[0];
            player.showCards(card);
            if(get.suit(card)=='spade'){
                if(player.countCards('h')==0) player.draw();
                player.gain(card,'gain2');
                event.goto(0);
            } else {
                game.log(player,'将',card,'放置牌堆顶');
                player.addMark('shuYing_Tianhuxianzhen',1);
                ui.cardPile.insertBefore(card,ui.cardPile.firstChild);
            }
        } else if(result.control=='梅花'){
            var card=get.bottomCards()[0];
            player.showCards(card);
            if(get.suit(card)=='club'){
                if(player.countCards('h')==0) player.draw();
                player.gain(card,'gain2');
                event.goto(0);
            } else {
                game.log(player,'将',card,'放置牌堆顶');
                player.addMark('shuYing_Tianhuxianzhen',1);
                ui.cardPile.insertBefore(card,ui.cardPile.firstChild);
            }
        } else if(result.control=='方块'){
            var card=get.bottomCards()[0];
            player.showCards(card);
            if(get.suit(card)=='diamond'){
                if(player.countCards('h')==0) player.draw();
                player.gain(card,'gain2');
                event.goto(0);
            } else {
                game.log(player,'将',card,'放置牌堆顶');
                player.addMark('shuYing_Tianhuxianzhen',1);
                ui.cardPile.insertBefore(card,ui.cardPile.firstChild);
            }
        } else {
            var card=get.bottomCards()[0];
            player.showCards(card);
            if(get.suit(card)=='heart'){
                if(player.countCards('h')==0) player.draw();
                player.gain(card,'gain2');
                event.goto(0);
            } else {
                game.log(player,'将',card,'放置牌堆顶');
                player.addMark('shuYing_Tianhuxianzhen',1);
                ui.cardPile.insertBefore(card,ui.cardPile.firstChild);
            }
        }
        game.updateRoundNumber();
    },
    mod:{
        maxHandcardBase:function(player,num){
            var num1=player.countMark('shuYing_Tianhuxianzhen');
            return num+num1;
        },
    },
    ai:{
        order:10,
        threaten:0.5,
        result:{
            player:function (player,target){
                return 1;
            },
        },
    },
    group:'shuYing_Tianhuxianzhen_Buff',
    subSkill:{
        Buff:{
            trigger:{player:"phaseJieshuBegin"},
            forced:true,
            priority:100,
            silent:true,
            sub:true,
            firstDo:true,
            frequent:true,
            popup:false,
            audio:false,
            filter:function(event,player){
                return player.countMark('shuYing_Tianhuxianzhen');
            },
            content:function(){
                var num=player.countMark('shuYing_Tianhuxianzhen');
                player.removeMark('shuYing_Tianhuxianzhen',num);
            },
        },
    },
  },
  },

  translate:
  {
    shuYing_Bachongshenzi:"八重神子",

    shuYing_Shizuishi:"食罪式",
    shuYing_Shizuishi_info:"锁定技，当你使用非转化牌指定目标后，将此牌使用者改为场上不拥有此技能的随机其他角色。",
    shuYing_Shashengying:"杀生樱",
    shuYing_Shashengying_Buff:"杀生樱",
    shuYing_Shashengying_Buff1:"杀生樱",
    shuYing_Shashengying_info:"每回合限两次。当你成为使用牌的目标后，若该牌花色与你手牌中的花色有相同，则你可以选择：1:弃置全部该花色的手牌使该牌对你无效，并在该牌结算后获得之，若你因此弃置全部手牌则你将手牌补充至当前体力值，2:弃置一张该花色的手牌，使该牌对你无效，3:弃置一张该花色的手牌并指定一名其他角色，令其也成为该牌的目标。",
    shuYing_Tianhuxianzhen:"天狐显真",
    shuYing_Tianhuxianzhen_info:"出牌阶段限两次，你声明一种花色并亮出牌堆底的一张牌，如果花色相同则你获得之，若在此之前你没有手牌则你从牌堆顶摸一张牌并重复此技能，如果花色不同则将该牌置于牌堆顶然后本回合你手牌上限+1。",
  }
}









