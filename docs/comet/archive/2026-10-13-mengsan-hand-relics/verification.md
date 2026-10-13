---
generated_from_state_version: 8
---

# Verification

## Current result

- Result: **Archived**
- Verification status: **Checks completed; result confirmed**
- Goal cycle: 1
- Iteration: 1
- Verifier attempt: 1
- Completed: 2026-10-13T09:58:45.226Z
- Summary: 独立只读验收A1–A5通过；复用绑定当前候选hand-relic-browser并补充hand-relic-dialog成功。

## Acceptance

| ID | Result | Source | Criterion | Reason |
| --- | --- | --- | --- | --- |
| A1 | passed | brief.md | 战斗开始后，手牌区最左侧展示当前持有遗物；每件遗物仅有一个图片条目，缺图显示名称。 | mountRelics复用heldRelics和createRelicIcon，逐件图片按钮；Runtime hand-relic-browser确认12条、缺图/加载失败名称替代与刷新。 |
| A2 | passed | brief.md | 点击区域48×48px，条目间距至少8px，与手牌间隔至少12px；窄屏和遗物较多时可滚动且不重叠手牌。 | CSS 48x48、gap8、64px条带与88px布局预留；Runtime hand-relic-browser在360/640/1280px确认尺寸、间距及局部滚动。 |
| A3 | passed | brief.md | 长按500ms显示对应名称、描述和当前状态；提前松开、滑动或取消不误触；键盘也可打开并关闭详情。 | 500ms定时器、提前松开/移动阈值/scroll/pointercancel/blur取消经源码和组件Runtime检查；hand-relic-dialog补充名称描述状态、屏内modal、Enter/Space打开、Escape/按钮关闭和焦点回归。 |
| A4 | passed | brief.md | 遗物界面不触发手牌选择、拖动或出牌；既有手牌交互和遗物详情入口仍可用。 | strip阻止交互冒泡，手牌入口仅接受属于手牌zone的.card；保留全量详情按钮，Runtime集成检查验证单项/全量入口及pointerdown不向手牌root冒泡。布局仅减可用宽度，未改手牌业务。 |
| A5 | passed | brief.md | 战斗结束或会话销毁后移除列表、浮层、监听器和定时器，恢复被占用的布局空间；再次进入不重复挂载。 | ownResource注册dispose，session逆序释放；strip销毁取消定时器、移除全部注册监听和DOM、恢复CSS变量。Runtime组件与集成检查验证销毁中断长按、重复dispose、modal清理及重挂载唯一条带。 |

## Checks

| Check | Command | Working directory | Status | Exit | Duration |
| --- | --- | --- | --- | ---: | ---: |
| hand-relic-browser | mengsan/tools/check-hand-relics.mjs C:/Users/111/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe | . | passed | 0 | 3919 ms |
| hand-relic-dialog | -e const fs=require('fs'); const assert=require('assert/strict'); const {chromium}=require('C:/Users/111/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); (async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});try{const page=await browser.newPage({viewport:{width:360,height:640}});await page.setContent('<div id="root" style="position:relative;height:156px"><div id="hand" class="mengsan-hand-scroll-shuying" style="position:absolute"></div></div>');await page.addStyleTag({content:fs.readFileSync('mengsan/ui/style.css','utf8')+fs.readFileSync('mengsan/ui/hand/style.css','utf8')});const source=fs.readFileSync('mengsan/ui/relic-strip.js','utf8')+'\n'+fs.readFileSync('mengsan/ui/relics.js','utf8').replace(/^import .*;$/gm,'');await page.evaluate(async source=>{const prelude='const ui=window.ui; const heldRelics=run=>run.relics; const createRelicIcon=()=>null;';window.ui={me:document.querySelector('#root'),window:document.body};window.run={relics:[{id:'a',name:'甲',description:'描述甲',pool:'常规',tier:'普通'},{id:'b',name:'乙',description:'描述乙',pool:'常规',tier:'普通'}]};window.session={active:true,ownResource:(key,dispose)=>window.cleanup=dispose};window.handEvents=0;ui.me.addEventListener('pointerdown',()=>window.handEvents++);const module=await import(URL.createObjectURL(new Blob([prelude+source],{type:'text/javascript'})));window.mount=module.mountRelics;window.instance=mount(session,run,{status:()=> '状态示例'});},source);const items=page.locator('.mengsan-hand-relics-shuying button');await items.first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('dialog').count(),1);assert.equal(await page.locator('dialog section').count(),1);assert.ok((await page.locator('dialog').innerText()).includes('描述甲'));assert.ok((await page.locator('dialog').innerText()).includes('状态示例'));const rect=await page.locator('dialog').boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=360&&rect.y+rect.height<=640);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),0);assert.equal(await items.first().evaluate(e=>document.activeElement===e),true);await page.locator('.mengsan-battle-relics-button-shuying').click();assert.equal(await page.locator('dialog section').count(),2);await page.getByRole('button',{name:'关闭',exact:true}).click();await items.first().click();assert.equal(await page.evaluate(()=>handEvents),0);await items.first().focus();await page.keyboard.press('Space');assert.equal(await page.locator('dialog').count(),1);await page.evaluate(()=>cleanup());assert.equal(await page.locator('dialog,.mengsan-hand-relics-shuying,.mengsan-battle-relics-button-shuying').count(),0);await page.evaluate(()=>{instance=mount(session,run,{status:()=> '状态示例'});});assert.equal(await page.locator('.mengsan-hand-relics-shuying').count(),1);await page.evaluate(()=>cleanup());console.log('PASS: integrated relic dialog selected/all contents, status, viewport bounds, Enter/Space/Escape, focus return, pointer bubbling isolation, session cleanup and remount');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1}); | . | passed | 0 | 1298 ms |

### Builder-reported evidence

These are Builder reports, not Runtime check receipts or independent verification results.

- focused-browser: passed — Edge测试360/640/1280px间距、缺图、长按及取消、键盘、刷新和清理通过
- syntax: passed — node --check relics.js/relic-strip.js通过
- Known limitation: 未在真实无名杀游戏或物理触摸设备上验收；浏览器为隔离组件检查。

## Blockers

_None._

## Risks and skipped work

- 验收采用隔离 Edge 浏览器组件及遗物详情集成、源码审查；没有运行完整无名杀引擎、物理触摸设备或真实缩放/手牌出牌回归，不代表实机验收通过。
- check-hand-relics.mjs被现有*.mjs忽略规则排除，当前Runtime使用本地文件；后续如提交或迁移必须确保检查文件随交付提供。
- 图索引所涉源码metadata_changed及CSS部分解析覆盖已直接读源码核实，结论以当前候选源码和Runtime证据为准。
- 旧全量check-sts2-relics.mjs因源图集burning_blood.png缺失ENOENT未通过，不能将该全量检查计为通过；此次UI定向Runtime检查不受影响。

## Previous iterations

| Goal cycle | Iteration | Attempt | Outcome | Unresolved | Summary | Completed |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 1 | 1 | pass | — | 独立只读验收A1–A5通过；复用绑定当前候选hand-relic-browser并补充hand-relic-dialog成功。 | 2026-10-13T09:58:45.226Z |



## Conclusion

独立只读验收A1–A5通过；复用绑定当前候选hand-relic-browser并补充hand-relic-dialog成功。
