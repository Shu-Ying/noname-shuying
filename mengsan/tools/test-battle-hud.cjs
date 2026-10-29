// Real browser DOM/CSS with engine services isolated; this is not a full-game test.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const app = path.resolve(__dirname, '../../../..');
const packages = process.env.CODEX_NODE_MODULES || 'C:/Users/Diuse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(path.join(packages, 'playwright'));
const prefix = '/extension/' + encodeURIComponent('术樱包') + '/mengsan';
const holdStatus = async (page, locator, pointerType = 'mouse') => {
  const box = await locator.boundingBox();
  const point = {x:box.x + box.width / 2,y:box.y + box.height / 2};
  if (pointerType === 'touch') {
    await locator.dispatchEvent('pointerdown', {button:0,pointerId:44,
      pointerType,clientX:point.x,clientY:point.y});
    await page.waitForTimeout(550);
    await page.evaluate(() => window.dispatchEvent(
      new PointerEvent('pointerup', {pointerId:44,pointerType:'touch'})));
  } else {
    await page.mouse.move(point.x,point.y); await page.mouse.down();
    await page.waitForTimeout(550); await page.mouse.up();
  }
};
// Native themes use different button sizes. Drag onto an exposed point on the
// original player, rather than assuming its center is clear in the dense fixture.
const exposedTarget = (page,index) => page.evaluate(index => {
  const player=game.players[index],rect=player.getBoundingClientRect();
  for(const y of [.5,.15,.85,.05,.95])for(const x of [.5,.15,.85]) {
    const px=rect.left+rect.width*x,py=rect.top+rect.height*y;
    if(document.elementFromPoint(px,py)?.closest('.player')===player)return {x:px,y:py,width:0,height:0};
  }
  throw new Error('Native target has no exposed drag point: '+index);
},index);
const fixture = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/layout/default/layout.css"><div id="window"><div id="arena"><div id="mebg"></div><div id="me" class="mengsan-hand-root-shuying"><div id="handcards1" class="mengsan-hand-scroll-shuying"><div class="handcards mengsan-hand-zone-shuying mengsan-hand-layout-shuying"></div></div><div id="handcards2"><div class="handcards"></div></div></div><div id="control"><div class="control"><div>测试技能</div><div>结束出牌</div></div></div></div></div><style>html,body,#window{margin:0;width:100%;height:100%;position:absolute}#arena{inset:0;width:100%;height:100%;position:absolute}#arena>.player{position:absolute;width:100px;height:130px;background:#345;color:#fff}#arena>.player .avatar{height:100%;width:100%;background:linear-gradient(#334f4b,#172d29)}#arena>.player .name{position:absolute;top:4px;left:4px}#me{position:absolute;bottom:0;width:100%;height:160px}#handcards1,#handcards2{position:absolute;width:100%;height:100%}.handcards{height:100%}.card{background:#e8d7b2;color:#263b35;position:absolute}.mengsan-intent-shuying{position:absolute}</style>`;
const server = http.createServer((req, res) => {
  if (req.url === '/fixture') { res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fixture);return; }
  if(req.url==='/noname.js'){res.setHeader('Content-Type','text/javascript');res.end('export const _status={};');return;}
  if(decodeURIComponent(new URL(req.url,'http://localhost').pathname)==='/extension/术樱包/diagnostics/index.js') {
    res.setHeader('Content-Type','text/javascript');res.end('export const getDiagnostics=()=>({status:()=>({enabled:false}),scope:()=>({info(){},error(){}})});');return;
  }
  const target = path.resolve(app, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!target.startsWith(app + path.sep)) { res.writeHead(403);res.end();return; }
  const types = { '.js':'text/javascript', '.css':'text/css', '.png':'image/png' };
  fs.readFile(target, (error, bytes) => { if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(target)]||'text/plain');res.end(bytes); });
});
(async () => {
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await chromium.launch({channel:'msedge',headless:true});
 let checks = 0;
 try {
  for (const skin of process.env.HUD_TEST_SKIN?[process.env.HUD_TEST_SKIN]:['native','shousha','shizhounian','xinsha']) {
   for (const viewport of [{width:1280,height:720},{width:1234,height:920},{width:812,height:600},{width:812,height:375},{width:667,height:375},{width:375,height:500},{width:540,height:900}]) {
    const page = await browser.newPage({viewport,hasTouch:true});
    await page.goto(origin+'/fixture');
    await page.addStyleTag({content:'body{background:#161e29 url("/image/background/lanting_bg.jpg") center/cover no-repeat}'});
    await page.addStyleTag({url:origin+prefix+'/ui/style.css'});
    if(skin!=='native') {
      for(const css of ['/extension/'+encodeURIComponent('十周年UI')+'/src/styles/layout.css','/extension/'+encodeURIComponent('十周年UI')+'/ui/styles/base.css','/extension/'+encodeURIComponent('十周年UI')+'/ui/styles/skill/'+skin+'.css','/extension/'+encodeURIComponent('十周年UI')+'/ui/styles/lbtn/'+skin+'.css'])await page.addStyleTag({url:origin+css});
      await page.addStyleTag({url:origin+'/extension/'+encodeURIComponent('十周年UI')+'/src/styles/player'+({shousha:2,shizhounian:1,xinsha:3}[skin])+'.css'});
      await page.addStyleTag({url:origin+'/extension/'+encodeURIComponent('十周年UI')+'/src/styles/equip.css'});
    }
    await page.addStyleTag({url:origin+prefix+'/ui/hand/style.css'});
    const initial = await page.evaluate(async ({prefix,skin}) => {
      const mod = await import(prefix+'/ui/hud/index.js').catch(error=>({error:String(error)}));
      if(typeof mod.mountBattleHUD!=='function')return {module:false,error:mod.error};
      const releases=[];window.session={id:'hud-test',active:true,ownResource:(_,f)=>releases.push(f)};
      window.releaseAll=()=>releases.reverse().forEach(f=>f());
      const arena=document.getElementById('arena'), hand=document.getElementById('me'), control=document.getElementById('control');
      if(skin!=='native') {
        // Match create.js and player-element.js, including the renamed container and nested wraps.
        control.id='dui-controls';hand.classList.add('hand-wrap');arena.classList.add('decadeUI');
        arena.dataset.mode='identity';arena.dataset.outcropSkin='shizhounian';arena.dataset.playerHeight='default';
        if(window.innerHeight<=500||window.innerWidth<=600)arena.classList.add('dui-mobile');
        control.firstElementChild.classList.add('stayleft');
      }
      document.body.classList.add('mengsan-hand-ui-shuying');control.firstElementChild.style.opacity='1';
      [...control.firstElementChild.children].forEach((node,index)=>{
        node.classList.add(index?'primary2':'primary');
        const label=index?'回合结束':'确定';
        if(skin==='native')node.textContent=label;else {const span=document.createElement('span');span.textContent=label;node.replaceChildren(span);}
        node.addEventListener('click',()=>{window.nativeActionClicks=(window.nativeActionClicks||0)+1;});
      });
      const players=[];
      for(let i=0;i<8;i++) {
        const player=document.createElement('div');player.className='player';player.dataset.position=String(i);player.playerid=String(i);player.name=i?'enemy'+i:'liubei';player.hp=40;player.maxHp=60;player.hujia=8;
        player.storage={mengsanCamp_shuying:i?'enemy':'ally',mengsanStrength_shuying:i===1?3:0,mengsanVulnerable_shuying:i===2?2:0,mengsanEnergy_shuying:3,mengsanMaxEnergy_shuying:3};
        player.innerHTML=skin==='native' ? '<div class="avatar"></div><div class="name">'+(i?'敌人'+i:'刘备')+'</div><div class="hp">40/60</div><div class="marks"></div>' : '<div class="primary-avatar has-outcrop"><div class="action">回合开始</div></div><div class="framebg"></div><div class="identity">汉</div><div class="camp-wrap"><div class="camp-border"></div><div class="avatar-name">'+(i?'敌人'+i:'刘备')+'</div></div><div class="hp-wrap"><div class="hp">40/60</div></div><div class="card-count">8</div><div class="dui-marks"></div>';
        if(i)player.insertAdjacentHTML('beforeend','<div class="mengsan-intent-shuying">攻击 8×2</div>');
        player.node={avatar:player.querySelector('.avatar,.primary-avatar'),hp:player.querySelector('.hp'),hpWrap:player.querySelector('.hp-wrap'),campWrap:player.querySelector('.camp-wrap'),name:player.querySelector('.name,.avatar-name'),identity:player.querySelector('.identity'),framebg:player.querySelector('.framebg'),count:player.querySelector('.card-count'),marks:player.querySelector('.marks,.dui-marks')};
        player.node.avatar.style.backgroundImage='url("/image/character/'+(i?'caocao':'liubei')+'.jpg")';
        if(i){player.style.cssText=`left:${(i-1)%4*21+5}%;top:${68+Math.floor((i-1)/4)*96}px;width:68px;height:82px;transform:none`;}
        const equips=document.createElement('div');equips.className='equips';player.node.equips=equips;player.appendChild(equips);
        if(i===0||i===1)for(let j=0;j<(i===0?5:2);j++){
          const equip=document.createElement('div');equip.className='card equip'+(j+1);equip.innerHTML='<div class="name2"><span>♠2 </span><span>'+(['八卦阵','的卢','青釭剑','赤兔','木牛'][j])+'</span></div>';
          equip.addEventListener('click',e=>{e.stopPropagation();window.equipClicks=(window.equipClicks||0)+1;});equips.appendChild(equip);
        }
        player.getCards=zone=>zone==='e'?[...equips.children]:[];
        player.marks={};player.hasSkill=()=>false;player.getSkills=()=>[];player.isAlive=()=>player.hp>0;arena.appendChild(player);players.push(player);
      }
      const me=players[0];window.game={me,players,dead:[]};window.battle={session,players:new Set(players),owner:me};
      const nativeMark=document.createElement('div');nativeMark.className='mark';nativeMark.textContent='义';me.node.marks.appendChild(nativeMark);window.testNativeMark=nativeMark;
      nativeMark.addEventListener('click',event=>{
        event.stopPropagation();window.markIntroOpens=(window.markIntroOpens||0)+1;
        const box=me.getBoundingClientRect(),tip=document.createElement('div');tip.className='dialog popped static';
        tip.style.cssText=`position:absolute;left:${box.right-20}px;top:${box.top-30}px;width:236px;height:160px;padding:16px;z-index:21`;
        tip.innerHTML='<div class="content-container"><div class="content"><div class="caption">桃园羁绊</div><div>先天结识关羽、张飞。保留原生标记说明内容与关闭回调。</div></div></div>';
        const layer=document.createElement('div');layer.className='poplayer';layer.style.cssText='position:absolute;inset:0';
        const close=()=>{tip.remove();layer.remove();window.markIntroClosed=true;};layer.addEventListener('click',close);tip._close=close;
        ui.window.append(tip,layer);window.testMarkIntro=tip;
      });
      window.hudEventState={currentPhase:me,event:{name:'chooseToUse',player:me,isMine:()=>true}};
      window.ui={arena,me:hand,mebg:document.getElementById('mebg'),control,window:document.getElementById('window'),handcards1Container:document.getElementById('handcards1'),handcards2Container:document.getElementById('handcards2'),selected:{cards:[],targets:[],buttons:[]},click:{}};
      if(skin==='xinsha') {
        const host=document.createElement('div');host.className='equips-wrap';host.style.cssText='position:absolute;left:150px;top:0;width:130px;height:100%';
        host.innerHTML='<div class="equips-back"><div>装备槽</div></div>';arena.insertBefore(host,hand);host.appendChild(me.node.equips);ui.equipSolts=host;
      }
      window.originalEquipParent=me.node.equips.parentNode;
      me.node.handcards1=ui.handcards1Container.firstElementChild;me.node.handcards2=ui.handcards2Container.firstElementChild;
      const get={translation:value=>value==='liubei'?'刘备':String(value).replace(/^enemy/,'敌人'),select:value=>value};
      const card=document.createElement('div');card.className='card selectable';card.textContent='杀';card.name='sha';me.node.handcards1.appendChild(card);window.card=card;
      card.addEventListener('contextmenu',event=>{
        event.preventDefault();window.introOpens=(window.introOpens||0)+1;
        const tip=document.createElement('div');tip.className='dialog popped static';
        const rect=card.getBoundingClientRect();tip.style.cssText=`position:absolute;left:${rect.left}px;top:${rect.top-30}px;width:236px;height:160px;z-index:21;padding:16px`;
        tip.innerHTML='<div class="content-container"><div class="content"><div class="caption">杀 · 卡牌说明</div><div>对选定敌人造成伤害。说明保留原生内容与关闭操作。</div></div></div>';
        const layer=document.createElement('div');layer.className='poplayer';layer.style.cssText='position:absolute;inset:0';
        layer.addEventListener('click',()=>{tip.remove();layer.remove();window.nativeIntroClosed=true;});
        ui.window.append(tip,layer);window.testIntro=tip;
      });
      window.oldParents={hand:hand.parentNode,control:control.parentNode,card:card.parentNode};
      window.nativeActionGroup=control.firstElementChild;window.nativeActionButtons=[...nativeActionGroup.children];
      window.actionPaint=node=>{const s=getComputedStyle(node);return Object.fromEntries(['backgroundImage','backgroundColor','borderImageSource','borderTopColor','borderTopStyle','borderTopWidth','borderTopLeftRadius','color','fontFamily','fontSize','fontWeight','textShadow','boxShadow','filter','paddingTop','paddingRight','paddingBottom','paddingLeft'].map(key=>[key,s[key]]));};
      // Decade animates the initial class/theme change; compare settled native styles.
      await new Promise(resolve=>setTimeout(resolve,650));
      window.originalActionPaint=[nativeActionGroup,...nativeActionButtons].map(actionPaint);
      window.originalActionHTML=nativeActionGroup.innerHTML;
      window.originalEnemyPresentation=players.slice(1).map(p=>({style:p.style.cssText,classes:p.className,html:p.innerHTML}));
      window.hud=mod.mountBattleHUD(me,battle,{ui,game,get,lib:{skill:{},translate:{}},_status:hudEventState,document,window,assetBase:prefix});
      const {mountRelicStrip}=await import(prefix+'/ui/relic-strip.js');
      window.testRelics=[];window.testStrip=mountRelicStrip(arena,()=>testRelics,relic=>{window.lastRelicOpened=relic.id;},()=>{
        const icon=document.createElement('img');icon.src=prefix+'/assets/status/strength_power.png';return icon;
      },document,window);releases.push(()=>testStrip.dispose());
      let submitted=0;game.check=()=>ui.selected.cards.length===1&&ui.selected.targets.length===1;game.uncheck=()=>{ui.selected.cards=[];ui.selected.targets=[];};
      ui.click.card=function(){ui.selected.cards=[this];players.slice(1).forEach(p=>p.classList.add('selectable'));};ui.click.target=function(){ui.selected.targets=[this];};ui.click.ok=()=>{submitted++;game.uncheck();};
      game.isSubmitted=()=>submitted;const event=hudEventState.event;event.selectTarget=[1,1];event.selectCard=[1,1];
      const {mountHandUI}=await import(prefix+'/ui/hand/index.js');
      window.testHandUI=await mountHandUI(me,session,{ui,game,get,lib:{card:{},translate:{}},_status:hudEventState,document,window,isActiveCardUse:()=>true,canPayCard:()=>true,cardCost:()=>1,styleURL:prefix+'/ui/hand/style.css'});
      window.testInput={owns:()=>false};hud.refresh();window.testFan={sync:()=>testHandUI.refresh()};
      return {module:true,parentKept:hand.parentNode===oldParents.hand&&control.parentNode===oldParents.control&&card.parentNode===oldParents.card,skin};
    },{prefix,skin});
    assert.equal(initial.module,true,initial.error||'HUD mount module must exist');checks++;
    assert.equal(initial.parentKept,true);checks++;
    await page.waitForTimeout(70);
    await page.evaluate(()=>testFan.sync(true));
    const corners=await page.evaluate(()=>({portrait:parseFloat(getComputedStyle(game.me.node.avatar).borderTopLeftRadius)}));
    assert.ok(corners.portrait>=12,'portrait retains rounded edges: '+JSON.stringify(corners));checks++;
    const glass=await page.locator('.mengsan-hud-shuying').evaluate(n=>{const s=getComputedStyle(n);return {background:s.backgroundColor,opacity:s.opacity,blur:s.backdropFilter};});
    assert.equal(glass.background,'rgba(0, 0, 0, 0)','footer is completely transparent');checks++;
    assert.equal(glass.blur,'none','footer has no background blur');checks++;
    assert.equal(glass.opacity,'1','text and buttons retain full opacity');checks++;
    const equipLayout=await page.evaluate(()=>{
      const p=game.me.getBoundingClientRect(),e=game.me.node.equips.getBoundingClientRect(),enemy=game.players[1],p2=enemy.getBoundingClientRect(),e2=enemy.node.equips.getBoundingClientRect();
      return {self:p.toJSON(),selfEquips:e.toJSON(),enemy:p2.toJSON(),enemyEquips:e2.toJSON()};
    });
    assert.ok(equipLayout.selfEquips.top>=equipLayout.self.top&&equipLayout.selfEquips.bottom<=equipLayout.self.bottom&&equipLayout.selfEquips.left>=equipLayout.self.left&&equipLayout.selfEquips.right<=equipLayout.self.right,'equipment overlays the enlarged portrait: '+JSON.stringify(equipLayout));checks++;
    assert.ok(equipLayout.selfEquips.bottom<=viewport.height-8,'equipment stays inside the player portrait');checks++;
    assert.equal(await page.evaluate(()=>getComputedStyle(game.me.node.equips).flexDirection),'column','equipment is stacked vertically over the portrait');checks++;
    try { await page.locator('.mengsan-hud-self-equips-shuying>.card').first().click({timeout:3000}); }
    catch(error) { console.log(await page.evaluate(()=>[game.me.node.equips.firstElementChild,game.me.node.equips,game.me.node.equips.parentNode,ui.arena].map(n=>({cls:n.className,rect:n.getBoundingClientRect().toJSON(),style:n.style.cssText,overflow:getComputedStyle(n).overflow,scroll:[n.scrollLeft,n.scrollTop]}))));throw error; }
    assert.equal(await page.evaluate(()=>window.equipClicks),1,'real equipment callback is preserved');checks++;
    assert.equal(await page.evaluate(()=>game.me.node.equips.parentNode===originalEquipParent),true,'optional separate equipment wrapper keeps its real parent');checks++;
    await page.evaluate(()=>{const cards=game.me.node.equips.children;cards[4].classList.add('selectable');cards[4].scrollIntoView({block:'nearest',inline:'nearest'});});
    await page.locator('.mengsan-hud-self-equips-shuying>.card').last().click();
    assert.equal(await page.evaluate(()=>window.equipClicks),2,'last of five equipped cards remains reachable');checks++;
    const layout=await page.evaluate(()=>{
      const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {hud:rect(document.querySelector('.mengsan-hud-shuying')),hand:rect(ui.me),control:rect(ui.control),players:game.players.slice(1).map(rect),statusCount:document.querySelectorAll('.mengsan-unit-status-shuying').length,
        statusRow:rect(document.querySelector('.mengsan-hud-statuses-shuying'))};
    });
    assert.equal(layout.statusCount,0,'enemy information is not replaced by the player HUD');checks++;
    assert.ok(layout.control.bottom<=layout.hand.y-7,'horizontal actions sit above the hand area');checks++;
    assert.equal(await page.evaluate(()=>game.players.slice(1).every((p,i)=>p.style.cssText===originalEnemyPresentation[i].style&&p.innerHTML===originalEnemyPresentation[i].html&&p.className===originalEnemyPresentation[i].classes)),true,'enemy and ally DOM, inline positions and classes stay native');checks++;
    assert.equal(await page.evaluate(()=>{const p=game.me.getBoundingClientRect(),s=document.querySelector('.mengsan-hud-info-shuying').getBoundingClientRect();return p.right<=s.left||p.bottom<=s.top||p.left>=s.right||p.top>=s.bottom;}),true,'enlarged portrait clears the vertical statistics');checks++;
    assert.equal(await page.evaluate(()=>{const p=game.me.getBoundingClientRect(),s=document.querySelector('.mengsan-hud-info-shuying').getBoundingClientRect();return ui.arena.dataset.mengsanHudLayout==='narrow'?p.bottom<=s.top&&s.top-p.bottom<32:s.left-p.right>=0&&s.left-p.right<=16;}),true,'statistics stay close to the portrait');checks++;
    assert.equal(await page.locator('.mengsan-hud-center-shuying').isVisible(),false,'empty status area is hidden');checks++;
    assert.equal(await page.locator('.mengsan-hud-shuying').innerText().then(t=>/当前状态|暂无状态|选择行动|等待行动/.test(t)),false,'status headings and action filler text are absent');checks++;
    assert.deepEqual(await page.evaluate(()=>[nativeActionGroup,...nativeActionButtons].map(actionPaint)),await page.evaluate(()=>originalActionPaint),'native action group and button paint, typography and padding stay unchanged');checks++;
    assert.equal(await page.evaluate(()=>ui.control.firstElementChild===nativeActionGroup&&nativeActionGroup.innerHTML===originalActionHTML&&nativeActionButtons.every((node,i)=>nativeActionGroup.children[i]===node)),true,'real native action nodes and contents are retained');checks++;
    assert.equal(await page.locator('.mengsan-hud-inspect-shuying').count(),0,'skills and equipment proxy button is removed');checks++;
    await page.locator('.mengsan-hud-controls-shuying>.control>div').first().click();
    await page.locator('.mengsan-hud-controls-shuying>.control>div').nth(1).click();
    assert.equal(await page.evaluate(()=>nativeActionClicks),2,'both real native confirm and end-turn callbacks remain usable');checks++;
    assert.equal(await page.evaluate(()=>nativeActionButtons.every(n=>n.getBoundingClientRect().bottom<=ui.me.getBoundingClientRect().top-4)),true,'native button dimensions remain fully above the hand');checks++;
    await page.evaluate(()=>{for(let i=0;i<6;i++)testNativeMark.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));});
    await page.waitForTimeout(60);
    await page.evaluate(()=>{for(let i=0;i<3;i++)testNativeMark.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));});
    const markIntro=await page.evaluate(()=>({opens:markIntroOpens,count:ui.window.querySelectorAll('.dialog.popped').length,layers:ui.window.querySelectorAll('.poplayer').length,layerClass:ui.window.querySelector('.poplayer').className,layerStyle:ui.window.querySelector('.poplayer').style.cssText,box:testMarkIntro.getBoundingClientRect().toJSON(),portrait:game.me.getBoundingClientRect().toJSON(),info:document.querySelector('.mengsan-hud-info-shuying').getBoundingClientRect().toJSON(),z:getComputedStyle(testMarkIntro).zIndex,layerZ:getComputedStyle(ui.window.querySelector('.poplayer')).zIndex}));
    assert.ok(markIntro.opens===1&&markIntro.count===1&&markIntro.layers===1,'rapid mark clicks keep one native popup and one backdrop: '+JSON.stringify(markIntro));checks++;
    assert.ok(markIntro.box.bottom<=Math.min(markIntro.portrait.top,markIntro.info.top)&&markIntro.box.x>=8&&markIntro.box.right<=viewport.width-8,'mark details clear the player portrait and statistics: '+JSON.stringify(markIntro));checks++;
    assert.ok(Number(markIntro.z)>Number(markIntro.layerZ)&&Number(markIntro.layerZ)>31,'native mark popup and backdrop draw above player and skills: '+JSON.stringify(markIntro));checks++;
    if(viewport.width===1234){await page.waitForTimeout(350);await page.screenshot({path:path.join(process.env.HUD_ARTIFACTS||__dirname,'hud-mark-description-'+skin+'.png')});}
    await page.locator('.poplayer').click({position:{x:4,y:4}});
    assert.equal(await page.evaluate(()=>markIntroClosed),true,'native mark close callback is preserved');checks++;
    await page.evaluate(()=>testNativeMark.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
    await page.waitForTimeout(30);
    assert.equal(await page.evaluate(()=>markIntroOpens),2,'mark details can reopen after closing');checks++;
    await page.locator('.poplayer').click({position:{x:4,y:4}});
    assert.equal(await page.locator('.mengsan-hand-relics-shuying').isVisible(),false,'empty relic strip stays hidden');checks++;
    const nativeSkills=await page.evaluate(()=>{
      const skills=document.createElement('div');skills.className='control';skills.innerHTML='<div>原生技能甲</div><div>原生技能乙</div>';
      ui.control.appendChild(skills);ui.skills=skills;window.testNativeSkills=skills;
      skills.firstElementChild.addEventListener('click',()=>window.nativeSkillUsed=true);hud.refresh();
      const boxes=[...skills.children].map(n=>n.getBoundingClientRect());
      const rail=skills.getBoundingClientRect();return {vertical:boxes[0].bottom<=boxes[1].top,right:rail.left>=ui.me.getBoundingClientRect().right,contained:boxes.every(r=>r.left>=rail.left-1&&r.right<=rail.right+1)};
    });
    assert.ok(nativeSkills.vertical&&nativeSkills.right&&nativeSkills.contained,'native skill references stay vertically on the right without moving their parent or clipping buttons: '+JSON.stringify(nativeSkills));checks++;
    await page.getByText('原生技能甲',{exact:true}).click();
    assert.equal(await page.evaluate(()=>window.nativeSkillUsed),true,'native skill callbacks survive the separate rail');checks++;
    await page.evaluate(()=>{testNativeSkills.remove();delete ui.skills;hud.refresh();});
    const relicGeometry=await page.evaluate(()=>{
      testRelics=[{id:'test',name:'遗物'}];testStrip.refresh();
      const strip=document.querySelector('.mengsan-hand-relics-shuying').getBoundingClientRect(),icon=document.querySelector('.mengsan-hand-relics-shuying button').getBoundingClientRect();
      return {strip:strip.toJSON(),icon:icon.toJSON()};
    });
    assert.ok(relicGeometry.icon.y>=relicGeometry.strip.y&&relicGeometry.icon.bottom<=relicGeometry.strip.bottom,'top relic icon fits without clipping');checks++;
    assert.ok(relicGeometry.strip.width<=142,'relic area stays compact above the right skill rail');checks++;
    assert.ok(relicGeometry.strip.x>=viewport.width-166,'relic area is on the right');checks++;
    assert.ok(Math.abs(relicGeometry.strip.bottom-(viewport.height-Number.parseFloat(await page.locator('#arena').evaluate(n=>n.style.getPropertyValue('--mengsan-relic-dock-bottom')))))<2,'relic area aligns with the side dock, with a compact narrow-screen offset');checks++;
    await page.evaluate(()=>{testRelics=Array.from({length:10},(_,i)=>({id:'r'+i,name:'遗物'+i}));testStrip.refresh();hud.refresh();});
    const battlefieldClear=await page.evaluate(()=>{
      const strip=document.querySelector('.mengsan-hand-relics-shuying').getBoundingClientRect();
      const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      return {clear:[...document.querySelectorAll('.player>.mengsan-intent-shuying')].every(n=>!intersects(n.getBoundingClientRect(),strip)),strip:strip.toJSON(),intents:[...document.querySelectorAll('.player>.mengsan-intent-shuying')].map(n=>n.getBoundingClientRect().toJSON())};
    });
    assert.equal(battlefieldClear.clear,true,'a full relic strip must not cover enemy intent: '+JSON.stringify(battlefieldClear));checks++;
    await page.locator('.mengsan-hand-relics-shuying button').last().focus();
    await page.locator('.mengsan-hand-relics-shuying button').last().press('Enter');
    assert.equal(await page.evaluate(()=>lastRelicOpened),'r9','overflow relics retain keyboard access to details');checks++;
    await page.evaluate(()=>{testRelics=[{id:'test',name:'遗物'}];testStrip.refresh();});
    const start=await page.locator('.handcards>.card').boundingBox(),target=await exposedTarget(page,3);
    await page.mouse.move(start.x+start.width/2,start.y+30);await page.mouse.down();
    await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:8});await page.mouse.up();
    assert.equal(await page.evaluate(()=>game.isSubmitted()),1,'single target drag submits once');checks++;
    if(skin!=='native') {
      await page.evaluate(()=>{
        const skills=document.createElement('div');skills.className='skill-control';skills.innerHTML='<div class="enable"><div class="skillitem usable">主动技能</div></div>';ui.arena.appendChild(skills);ui.skillControl=skills;
        skills.querySelector('.skillitem').addEventListener('click',()=>{hudEventState.event.skill='test-skill';});hud.refresh();
      });
      await page.locator('.skillitem').click();
      assert.equal(await page.evaluate(()=>hudEventState.event.skill),'test-skill');checks++;
      assert.notEqual(await page.locator('.skillitem').evaluate(n=>getComputedStyle(n).webkitTextFillColor),'rgba(0, 0, 0, 0)','skin gradient text remains readable after reskinning');checks++;
      assert.equal(await page.evaluate(()=>ui.skillControl.getBoundingClientRect().left>=ui.me.getBoundingClientRect().right),true,'vertical skills stay to the right of the hand');checks++;
      await page.evaluate(()=>{
        const globalSkills=document.createElement('div');globalSkills.className='gskill-control';globalSkills.innerHTML='<div class="trigger"><div class="skillitem">仁德</div></div>';
        ui.arena.appendChild(globalSkills);ui.gskillControl=globalSkills;hud.refresh();
      });
      const rails=await page.evaluate(()=>({skills:ui.skillControl.getBoundingClientRect().toJSON(),global:ui.gskillControl.getBoundingClientRect().toJSON(),native:ui.control.getBoundingClientRect().toJSON(),hud:document.querySelector('.mengsan-hud-shuying').getBoundingClientRect().toJSON()}));
      assert.ok(rails.global.bottom<=rails.skills.top-4&&rails.global.top>=rails.hud.top,'optional global skill controls stay inside the HUD without overlap: '+JSON.stringify(rails));checks++;
      await page.evaluate(()=>{delete hudEventState.event.skill;});
      assert.equal(await page.evaluate(()=>ui.arena.scrollLeft===0&&ui.arena.scrollTop===0),true,'skill controls must not scroll the arena');checks++;
    }
    const beforeTouch = await page.evaluate(()=>game.isSubmitted());
    const touchCard = await page.locator('.handcards>.card').boundingBox();
    await page.evaluate(({start,target})=>{
      const send=(host,type,x,y)=>host.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:17,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y}));
      const x=start.x+start.width/2,y=start.y+25,tx=target.x+target.width/2,ty=target.y+target.height/2;
      send(card,'pointerdown',x,y);send(window,'pointermove',tx,ty);send(window,'pointerup',tx,ty);
    },{start:touchCard,target:await exposedTarget(page,2)});
    const afterTouch=await page.evaluate(()=>({submitted:game.isSubmitted(),selected:ui.selected.cards.length,targets:ui.selected.targets.length,eventSkill:hudEventState.event.skill,classes:card.className,owns:testInput.owns(),hand:ui.me.getBoundingClientRect().toJSON(),card:card.getBoundingClientRect().toJSON()}));
    if(afterTouch.submitted!==beforeTouch+1){afterTouch.geometry=await page.evaluate(()=>['window','arena','me','control'].map(id=>{const n=id==='control'?ui.control:document.getElementById(id),s=getComputedStyle(n);return {id,rect:n.getBoundingClientRect().toJSON(),css:{transform:s.transform,zoom:s.zoom,left:s.left,top:s.top,width:s.width,height:s.height,translate:s.translate},inline:n.style.cssText};}));await page.screenshot({path:path.join(process.env.HUD_ARTIFACTS||__dirname,'hud-failure.png')});}
    assert.equal(afterTouch.submitted,beforeTouch+1,'touch pointer drag submits once: '+JSON.stringify(afterTouch));checks++;
    await page.evaluate(()=>{
      const group=document.createElement('div');group.className='control';group.style.opacity='1';
      const button=document.createElement('div');button.textContent='动态技能';button.addEventListener('click',()=>{window.dynamicSkillUsed=true;});group.appendChild(button);ui.control.replaceChildren(group);hud.refresh();
    });
    await page.getByText('动态技能',{exact:true}).click();
    assert.equal(await page.evaluate(()=>window.dynamicSkillUsed),true,'new native controls retain their callbacks');checks++;
    await page.evaluate(()=>{game.players[7].hp=0;hud.refresh();});
    assert.equal(await page.evaluate(()=>game.players[7].style.cssText===originalEnemyPresentation[6].style&&!game.players[7].classList.contains('mengsan-hud-defeated-shuying')),true,'death keeps the original battlefield presentation');checks++;
    await page.evaluate(()=>{game.players[7].hp=40;game.me.storage.mengsanVulnerable_shuying=3;hud.refresh();});
    assert.equal(await page.locator('.mengsan-hud-statuses-shuying').innerText(),'','status chips contain icons only');checks++;
    const heldStatus = page.locator('.mengsan-hud-statuses-shuying button').first();
    await heldStatus.dispatchEvent('pointerdown', {button:0,pointerId:45,
      pointerType:'touch',clientX:10,clientY:10});
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      game.me.storage.mengsanWeak_shuying=1; hud.refresh();
    });
    await page.waitForTimeout(450);
    assert.equal(await page.locator('dialog.mengsan-hud-dialog-shuying').count(),1,'unrelated status update preserves an active hold');checks++;
    await page.evaluate(() => window.dispatchEvent(
      new PointerEvent('pointerup', {pointerId:45,pointerType:'touch'})));
    await page.evaluate(() => {
      game.me.storage.mengsanVulnerable_shuying=5; hud.refresh();
    });
    assert.match(await page.locator('dialog.mengsan-hud-dialog-shuying').innerText(),/易伤 5/,'open details show the current value');checks++;
    await page.evaluate(() => {
      delete game.me.storage.mengsanVulnerable_shuying; hud.refresh();
    });
    assert.match(await page.locator('dialog.mengsan-hud-dialog-shuying').innerText(),/已失效/,'removed state is explicitly expired');checks++;
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    await page.evaluate(() => {
      delete game.me.storage.mengsanWeak_shuying;
      game.me.storage.mengsanVulnerable_shuying=3; hud.refresh();
    });
    await page.evaluate(()=>{for(const key of ['Weak','Frail','Artifact','Constrict','Tangled','Shrink','Plow','Slippery'])game.me.storage['mengsan'+key+'_shuying']=2;hud.refresh();});
    assert.equal(await page.evaluate(()=>{const row=document.querySelector('.mengsan-hud-statuses-shuying').getBoundingClientRect();return [...document.querySelectorAll('.mengsan-hud-statuses-shuying button')].every(n=>{const r=n.getBoundingClientRect();return r.bottom<=row.bottom+1&&r.right<=row.right+1;});}),true,'matrix overflow keeps the visible statuses and more button inside the grid');checks++;
    // Compact icon chips fit more states; register enough real display fields
    // to exercise overflow on wide screens as well as phones.
    await page.evaluate(async prefix => {
      const {bindCombatStatusSource} = await import(prefix+'/battle/status-sources.js');
      const keys=['turnStrength','turnEnergy','turnBlock','turnLoseHp',
        'infernoLoseHp','lossDamage','lossStrength','vulnerableBonus',
        'attackBlock','retaliation','colossus','freeAttack','noDraw',
        'noEnergy','doubleTap','plating','exhaustBlock','exhaustDraw',
        'vulnerableDraw','juggle','endAttack','retrieveAttack','bodyguard',
        'autoStrike','firstBlock','blockDamage','barricade','corruption'];
      bindCombatStatusSource(game.me,session,'overflow-test',() => ({
        powers:Object.fromEntries(keys.map(key => [key,1])),
      }));
      hud.refresh();
    },prefix);
    await holdStatus(page,page.getByRole('button',{
      name:'点击查看全部状态',exact:true}));
    assert.ok(await page.getByRole('dialog').isVisible(),'overflow states remain available in the details');checks++;
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    assert.equal(await page.evaluate(()=>{const s=document.querySelector('.mengsan-hud-center-shuying').getBoundingClientRect(),p=game.me.getBoundingClientRect();return s.bottom<=p.top&&p.top-s.bottom<=13;}),true,'status chips automatically appear just above the portrait');checks++;
    await page.locator('.mengsan-hud-statuses-shuying button').first().tap();
    assert.equal(await page.locator('dialog.mengsan-hud-dialog-shuying').count(),1,'short tap opens the status list');checks++;
    const statusList = await page.locator('.mengsan-hud-detail-body-shuying').evaluate(body => ({
      rows:body.querySelectorAll('details').length,
      position:getComputedStyle(body).position,
      minHeight:Math.min(...[...body.querySelectorAll('summary')].map(row=>row.getBoundingClientRect().height)),
      height:body.getBoundingClientRect().height,
      scrollable:body.scrollHeight>body.clientHeight,
    }));
    assert.ok(statusList.rows>20&&statusList.position!=='absolute'&&statusList.minHeight>=48&&statusList.height>0&&statusList.scrollable,'status list keeps all entries in normal flow with large tap targets: '+JSON.stringify(statusList));checks++;
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    await holdStatus(page,page.locator('.mengsan-hud-statuses-shuying button').first());
    assert.ok(await page.locator('dialog.mengsan-hud-dialog-shuying').isVisible());checks++;
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    await holdStatus(page,page.locator('.mengsan-hud-statuses-shuying button').first(),'touch');
    assert.ok(await page.locator('dialog.mengsan-hud-dialog-shuying').isVisible(),'touch opens the player status details');checks++;
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    await page.evaluate(()=>game.uncheck());
    const prompt=await page.evaluate(()=>{
      const n=document.createElement('div');n.className='dialog';n.innerHTML='<div class="content-container"><div class="content"><div class="caption">请弃置两张手牌</div></div></div>';ui.arena.appendChild(n);ui.dialog=n;hudEventState.event.dialog=n;window.testPrompt=n;hud.refresh();
      return {r:n.getBoundingClientRect().toJSON(),control:ui.control.getBoundingClientRect().toJSON()};
    });
    assert.ok(prompt.r.bottom<=prompt.control.top-5,'native selection prompt stays above the horizontal action row');checks++;
    await page.locator('.handcards>.card').first().click({button:'right'});
    await page.waitForTimeout(80);
    const intro=await page.evaluate(()=>({opened:introOpens,box:testIntro.getBoundingClientRect().toJSON(),content:testIntro.querySelector('.content').getBoundingClientRect().toJSON(),hand:ui.me.getBoundingClientRect().toJSON(),prompt:testPrompt.getBoundingClientRect().toJSON(),z:Number(getComputedStyle(testIntro).zIndex),scroll:getComputedStyle(testIntro).overflowY}));
    assert.equal(intro.opened,1,'right click still invokes the original card introduction');checks++;
    assert.ok(intro.box.height>=40,'native absolute content wrapper does not collapse the description');checks++;
    assert.ok(intro.content.height>20&&intro.content.top>=intro.box.top&&intro.content.top<intro.box.bottom,'description content starts inside its scrollable popup');checks++;
    assert.ok(intro.box.bottom<=intro.hand.y-8&&intro.box.bottom<=intro.prompt.top&&intro.box.x>=8&&intro.box.right<=viewport.width-8,'description stays above hand and prompt, inside the viewport: '+JSON.stringify(intro));checks++;
    assert.ok(intro.z>24&&intro.scroll==='auto','description draws above cards and scrolls when height is limited');checks++;
    if(viewport.width===1234){await page.waitForTimeout(350);await page.screenshot({path:path.join(process.env.HUD_ARTIFACTS||__dirname,'hud-card-description-'+skin+'.png')});}
    await page.locator('.poplayer').click({position:{x:4,y:4}});
    assert.equal(await page.evaluate(()=>window.nativeIntroClosed),true,'original popup backdrop still closes the description');checks++;
    await page.evaluate(()=>{testPrompt.remove();delete ui.dialog;delete hudEventState.event.dialog;hud.refresh();});
    if(viewport.width===1234||skin==='native'&&viewport.width===812) {
      await page.evaluate(()=>{
        for(let i=0;i<6;i++) {
          const c=i===0?card:card.cloneNode(true);c.textContent=['杀','八卦阵','杀','桃','杀','无懈可击'][i];c.style.background='#e9dfc9 url("/image/card/'+(['sha','bagua','sha','tao','sha','wuxie'][i])+'.png") center/100% 100%';
          if(i)game.me.node.handcards1.appendChild(c);
        }
        if(ui.arena.clientWidth>1000){game.players.slice(4).forEach(p=>{p.hp=0;p.remove();battle.players.delete(p);});delete game.me.storage.mengsanVulnerable_shuying;}
        testFan.sync(true);hud.refresh();
      });
      await page.waitForTimeout(180);
      const fullCards=await page.locator('.handcards>.card').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
      assert.ok(fullCards.every(r=>r.bottom<=viewport.height-8),'rotated hand cards remain fully above the bottom edge: '+JSON.stringify(fullCards));checks++;
      await page.screenshot({path:path.join(process.env.HUD_ARTIFACTS||__dirname,'hud-transparent-'+skin+'-'+viewport.width+'x'+viewport.height+'.png')});
    }
    const popup=await page.evaluate(()=>{
      const n=document.createElement('div');n.className='damage skill-popup';n.style.cssText=`position:absolute;left:${game.me.offsetLeft}px;top:${game.me.offsetTop+80}px;width:${game.me.offsetWidth}px;z-index:9999`;
      for(const char of '回合开始'){const s=document.createElement('span');s.textContent=char;n.appendChild(s);}window.testPopup=n;window.testPopupTop=n.style.top;ui.arena.appendChild(n);hud.refresh();
      const rect=n.getBoundingClientRect(),footer=document.querySelector('.mengsan-hud-shuying').getBoundingClientRect();
      return {bottom:rect.bottom,footer:footer.top};
    });
    assert.ok(popup.bottom<=popup.footer-4,'skin notification stays above the command footer: '+JSON.stringify(popup));checks++;
    await page.evaluate(()=>{testHandUI.freeze();hud.freeze();session.active=false;testHandUI.refresh();hud.refresh();});
    await page.waitForTimeout(240);
    assert.equal(await page.evaluate(()=>document.querySelector('.mengsan-hud-shuying')!==null&&game.me.classList.contains('mengsan-hud-self-shuying')&&game.me.node.handcards1.classList.contains('mengsan-hand-layout-shuying')),true,'stopped battle retains player HUD and fan until reward cleanup');checks++;
    await page.evaluate(()=>{hud.dispose();hud.dispose();});
    assert.equal(await page.evaluate(()=>game.me.node.equips.parentNode===originalEquipParent&&!game.me.node.equips.classList.contains('mengsan-hud-equips-shuying')&&!game.me.node.equips.style.getPropertyValue('top')),true,'equipment ownership and styles restore');checks++;
    assert.equal(await page.evaluate(()=>!testPopup.classList.contains('mengsan-hud-notification-shuying')&&testPopup.style.top===testPopupTop),true,'notification placement is restored when HUD ends');checks++;
    assert.equal(await page.locator('.mengsan-hud-shuying').count(),0);checks++;
    assert.equal(await page.evaluate(()=>ui.me.parentNode===oldParents.hand&&ui.control.parentNode===oldParents.control&&!document.body.classList.contains('mengsan-hud-active-shuying')),true);checks++;
    assert.equal(await page.evaluate(()=>game.players.slice(1).every((p,i)=>p.style.cssText===originalEnemyPresentation[i].style)),true,'native actor styles survive final cleanup');checks++;
    await page.evaluate(()=>releaseAll());
    console.log(skin+' '+viewport.width+'x'+viewport.height+' passed');
    await page.close();
   }
  }
  console.log('HUD browser checks: '+checks);
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
