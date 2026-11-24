const assert = require('node:assert/strict');
const path = require('node:path');

const surfaces = [
  ['选将', '.mengsan-character-overlay-shuying', '确认出征', 'mengsan_liubei_shuying'],
  ['地图', '.mengsan-map-overlay-shuying', /可前往$/, 'route'],
  ['事件选项', '.mengsan-flow-overlay-shuying', '继续', 'go'],
  ['商店', '.mengsan-shop-overlay-shuying', '离开商店', 'leave'],
  ['休息处', '.mengsan-rest-overlay-shuying', '离开休息处', 'done'],
  ['剧情', '.mengsan-dialogue-overlay-shuying', /跳过对话/, null],
  ['剧情分支', '.mengsan-dialogue-overlay-shuying', /剧情文本/, 'pledge'],
  ['奖励选牌', '.mengsan-card-choice-dialog-shuying', '跳过', null],
  ['战后选择', '.mengsan-victory-dialog-shuying', /领取战利品/, 'claim'],
  ['牌库', '.mengsan-deck-dialog-shuying', '关闭', null],
  ['牌堆', '.mengsan-deck-dialog-shuying', '关闭', null],
  ['遗物', '.mengsan-relic-dialog-shuying', '关闭', null],
  ['药水详情', '.mengsan-potion-dialog', '关闭', null],
  ['菜单确认', '.mengsan-menu-dialog-shuying', '保留', 'keep'],
  ['调试管理器', '.mengsan-gm-dialog-shuying', '关闭', null],
  ['战斗状态', '.mengsan-hud-dialog-shuying', '关闭', null],
];

async function mountSurface(page, origin, prefix, settings, surface) {
  await page.goto(origin+'/fixture');
  await page.addStyleTag({content:'#window,#arena{transition:none}'});
  for (const file of ['style','shop','rest','potions','character-select']) {
    await page.addStyleTag({url:origin+prefix+`/ui/${file}.css`});
  }
  await page.evaluate(async ({prefix,settings,surface}) => {
    const engine = await import('/noname.js');
    const imported = await import(prefix+'/progression/state.js');
    const updateZoom = settings.transform ? engine.UI.prototype.updatez.bind(engine.ui) :
      (await import('/extension/'+encodeURIComponent('十周年UI')+'/src/overrides/ui/update.js')).uiUpdatez;
    window.zoomReviewSetScale = zoom => {
      engine.game.documentZoom = zoom;
      updateZoom();
    };
    window.zoomReviewSetScale(settings.zoom);
    const ui = {window:document.getElementById('window'),arena:document.getElementById('arena'),create:{}};
    ui.create.div = (selector,...args) => {
      const element = document.createElement('div');
      element.className = selector.split('.').filter(Boolean).join(' ');
      element.setBackground = (name,type) => {element.style.backgroundImage=`url(/image/${type}/${name}.jpg)`;};
      for (const arg of args) {
        if (arg instanceof Node) arg.append(element);
        else if (typeof arg === 'string') element.textContent = arg;
      }
      return element;
    };
    engine.lib.config ??= {};
    engine.lib.assetURL = '/';
    engine.lib.card.sha ??= {type:'basic'};
    engine.lib.translate.sha = '杀';
    engine.lib.translate.sha_info = '对一名其他角色造成伤害。';
    engine.lib.translate.mengsan_liubei_shuying = '刘备';
    engine.setUI(ui);
    const run = imported.createRun('mengsan_liubei_shuying');
    Object.assign(run.player,{gold:99,hp:25,maxHp:50,potions:['ENERGY_POTION']});
    window.zoomReviewResult = null;
    function settled(value) {window.zoomReviewResult = value;}
    const modules = name => import(prefix+`/ui/${name}.js`);
    const choices = [{id:'go',name:'继续'},{id:'leave',name:'离开'}];
    if (surface==='选将') {
      const {chooseCharacterCards} = await modules('character-select');
      chooseCharacterCards([{id:run.player.character,name:'刘备',description:'出征武将'}],prefix,'返回').then(settled);
    } else if (surface==='地图') {
      const {showMap} = await modules('map/renderer');
      showMap(run).then(()=>settled('route'));
    } else if (surface==='事件选项') {
      const {chooseButtons} = await modules('flow-ui');
      chooseButtons('地图事件',choices,'选择一项继续前进').then(settled);
    } else if (surface==='商店') {
      const {chooseShop} = await modules('shop-ui');
      chooseShop(run.player,[{id:'supply:heal',name:'补给',description:'获得补给',price:30}]).then(settled);
    } else if (surface==='休息处') {
      const {chooseRest} = await modules('rest-ui');
      chooseRest([{id:'heal',name:'休息',description:'恢复生命'}],{tent:true}).then(settled);
    } else if (surface==='剧情' || surface==='剧情分支') {
      const {playDialogue} = await modules('dialogue');
      const branch = surface==='剧情分支';
      const lines = branch ? [{type:'choice',text:'如何回答？',speed:0,flag:'story.zoom',
        choices:[{id:'pledge',text:'结伴前行'},{id:'leave',text:'独自出发'}]}] :
        [{type:'narrator',text:'整备完毕，今日继续向前。',speed:0}];
      playDialogue(lines,{run}).then(()=>settled(branch ? run.storyFlags['story.zoom'] : null));
    } else if (surface==='奖励选牌') {
      const {chooseCardDialog} = await modules('reward-ui');
      chooseCardDialog([{id:'sha',card:{name:'sha'}}]).then(settled);
    } else if (surface==='战后选择') {
      const {chooseVictoryOptions} = await modules('reward-ui');
      chooseVictoryOptions([{id:'claim',label:'领取战利品'}]).then(settled);
    } else if (surface==='牌库') {
      const {openCardLibrary} = await modules('card-library');
      run.player.deck = Array.from({length:48},()=>({name:'sha',suit:'heart',number:5}));
      openCardLibrary(run);
    } else if (surface==='牌堆') {
      const {mountBattlePiles} = await modules('card-library');
      mountBattlePiles({active:true,ownResource(){}},{drawPile:run.player.deck,discardPile:[],exhaustPile:[]});
    } else if (surface==='遗物') {
      const {mountRelics} = await modules('relics');
      mountRelics({active:true,ownResource(){}},run,{status(){},counter:()=>({value:null,label:null})},{stripRoot:ui.arena});
    } else if (surface==='药水详情') {
      const {mountPotionSlots} = await modules('potions');
      const slots = mountPotionSlots(ui.arena,run.player,{use(){},canUse:()=>true});
      slots.layoutBattleSlots(ui);
    } else if (surface==='菜单确认') {
      const {askMenu} = await modules('navigation');
      askMenu('结束征程？','保留进度后可以继续。',[{id:'keep',name:'保留'}]).then(settled);
    } else if (surface==='调试管理器') {
      const {mountGMManager} = await modules('gm-manager');
      const game = {};
      mountGMManager({active:true,ownResource(){}},{getCards:()=>[]},{},{},
        {field:(target,key,value)=>{target[key]=value;}},game);
      game.mengsanGM_shuying();
    } else if (surface==='战斗状态') {
      const {mountBattleHUD} = await modules('hud/index');
      ui.me = document.getElementById('me');
      ui.control = document.getElementById('control');
      const player = ui.create.div('.player',ui.arena);
      Object.assign(player,{name:run.player.character,hp:25,maxHp:50,storage:{mengsanStrength_shuying:2},node:{}});
      mountBattleHUD(player,{session:{active:true,ownResource(){}}},{ui,get:engine.get,_status:engine._status,document,window,assetBase:prefix});
    }
  },{prefix,settings,surface});
}

async function checkMapDrag(page) {
  const viewport = page.locator('.mengsan-map-viewport-shuying');
  const scroll = await viewport.evaluate(element => {
    element.scrollTop = (element.scrollHeight-element.clientHeight)/2;
    const box = element.getBoundingClientRect();
    const y = Math.min(box.bottom-4,innerHeight-4);
    return {top:element.scrollTop,scale:box.height/element.offsetHeight,x:box.left+box.width/2,y,
      distance:Math.min(32,Math.floor((y-Math.max(0,box.top))/2))};
  });
  assert.ok(scroll.distance>=8,`the map still provides a draggable viewport: ${JSON.stringify(scroll)}`);
  await page.mouse.move(scroll.x,scroll.y);
  await page.mouse.down();
  await page.mouse.move(scroll.x,scroll.y-scroll.distance,{steps:4});
  await page.mouse.up();
  const moved = await viewport.evaluate(element=>element.scrollTop)-scroll.top;
  assert.ok(Math.abs(moved*scroll.scale-scroll.distance)<=2,`map drag follows the pointer: ${JSON.stringify({...scroll,moved})}`);
}

async function checkSurface(page, surface, settings, origin, prefix) {
  const [name,selector,buttonName,result] = surface;
  await mountSurface(page,origin,prefix,settings,name);
  const launcher = {'牌堆':'.mengsan-battle-piles-button-shuying','遗物':'.mengsan-battle-relics-button-shuying',
    '药水详情':'button.mengsan-potion-slot','战斗状态':'.mengsan-hud-status-shuying'}[name];
  if (launcher) await page.locator(launcher).first().tap({timeout:1800});
  const root = page.locator(selector);
  await root.waitFor({state:'visible',timeout:1800});
  if (settings.switchTo) {
    await page.evaluate(zoom => window.zoomReviewSetScale(zoom), settings.switchTo);
  }
  const box = await root.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box.x>=-2 && box.y>=-2 && box.x+box.width<=viewport.width+2 && box.y+box.height<=viewport.height+2,
    `surface within viewport: ${JSON.stringify({box,viewport})}`);
  if (name==='地图') {
    await checkMapDrag(page);
    await root.getByRole('button',{name:'菜单',exact:true}).tap({timeout:1800});
    const drawer = root.locator('.mengsan-map-menu-sheet-shuying');
    await drawer.getByRole('button',{name:/行囊/}).tap({timeout:1800});
    await drawer.getByRole('button',{name:'返回菜单',exact:true}).tap({timeout:1800});
    await drawer.getByRole('button',{name:'关闭菜单',exact:true}).tap({timeout:1800});
  }
  if (process.env.HUD_ARTIFACTS && settings.zoom===1.5 && !settings.transform && !settings.viewport) {
    await page.screenshot({path:path.join(process.env.HUD_ARTIFACTS,`zoom-${name}.png`)});
  }
  if (name==='剧情分支') await root.getByRole('button',{name:'结伴前行',exact:true}).tap({timeout:1800});
  const action = root.getByRole('button',{name:buttonName}).first();
  if(name==='牌库') {
    const card = root.locator('.ms-deck-card').first();
    await card.tap({timeout:1800});
    assert.ok(await root.locator('.ms-deck-detail').isVisible(),'a card opens its details');
  }
  await action.tap({timeout:1800});
  assert.equal(await root.count(),0,'the original action closes the surface');
  if (result!==null) assert.equal(await page.evaluate(()=>zoomReviewResult),result,'the original action returns the choice');
}

exports.testJourneyZoom = async function testJourneyZoom(browser,origin,prefix) {
  const failures = [];
  let checks = 0;
  const scenarios = [{zoom:.5},{zoom:.65},{zoom:1},{zoom:1.5},{zoom:2},{zoom:3},{zoom:1.5,transform:true},
    {zoom:1.5,viewport:{width:420,height:360}}, {zoom:.65,transform:true,viewport:{width:390,height:720}},
    {zoom:1,transform:true,viewport:{width:1280,height:720}}, {zoom:3,transform:true},
    {zoom:.65,switchTo:2}, {zoom:.65,switchTo:2,transform:true}];
  for (const settings of scenarios) {
    const page = await browser.newPage({viewport:settings.viewport??{width:812,height:375},hasTouch:true});
    for (const surface of surfaces) {
      try { await checkSurface(page,surface,settings,origin,prefix); checks++; }
      catch (error) { failures.push(`${surface[0]} ${JSON.stringify(settings)} ${error.message}`); }
    }
    await page.close();
  }
  if (failures.length) throw new Error(`${checks} passed\n${failures.join('\n')}`);
  console.log(`Journey UI zoom: ${checks} passed`);
};
