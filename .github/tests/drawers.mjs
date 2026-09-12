import assert from 'node:assert/strict';
const handles={player:'#agPlayerDrawerToggle',workspace:'#agWorkspaceDrawerToggle',map:'#agMapDrawerToggle',territory:'#territoryStatsToggle',command:'#agCommandDrawerToggle'};
export async function panels(page,wanted={player:true,workspace:true,map:true,command:true,territory:false}){
 if(wanted.workspace===true&&wanted.player!==false)wanted={player:true,...wanted};
 for(const key of ['player','workspace','map','territory','command']){
  if(!(key in wanted))continue;
  if(key==='workspace'&&wanted.player===false)continue;
  const button=page.locator(handles[key]);
  if(await button.getAttribute('aria-expanded')!==String(wanted[key]))await button.click();
 }
 await page.waitForTimeout(340);
 await page.waitForFunction(()=>{const s=window.AGWorldDrawers?.getState(),g=window.AGWorldDrawers?.geometry();if(!s||!g)return false;const map=document.querySelector('.map-area').getBoundingClientRect();return Math.abs(map.left-g.leftStage)<1&&Math.abs(map.width-g.mapW)<1;});
}
const closed={player:false,workspace:false,map:false,territory:false,command:false};
export async function exerciseDrawers(page){
 assert.deepEqual(await page.evaluate(()=>window.AGWorldDrawers.getState()),closed,'Fresh login exposes the country');
 assert.equal(await page.locator('#agEnterWorldBtn').count(),0);
 assert.equal(await page.locator('#agGameModeControl').count(),0);
 await page.evaluate(()=>{window.drawerOriginalMap=document.getElementById('map');window.drawerOriginalProfile=document.getElementById('agPlayerMissionProfile');});
 // Three valid left states, each combined with all eight top/right/bottom states.
 for(const leftState of [0,1,2])for(let bits=0;bits<8;bits++){
  const wanted={player:leftState>0,workspace:leftState===2,map:!!(bits&1),territory:!!(bits&2),command:!!(bits&4)};
  await panels(page,wanted);
  const result=await page.evaluate(()=>{
   const g=window.AGWorldDrawers.geometry(),r=q=>document.querySelector(q).getBoundingClientRect().toJSON();
   return {state:window.AGWorldDrawers.getState(),g,map:r('.map-area'),command:r('#entityInformationSection'),header:r('.map-header'),inert:[document.querySelector('.sidebar').inert,document.querySelector('.missions').inert,document.querySelector('.map-header').inert,document.getElementById('territoryStatsDrawerContent').inert,document.getElementById('entityInformationSection').inert],sameMap:window.drawerOriginalMap===document.getElementById('map'),sameProfile:window.drawerOriginalProfile===document.getElementById('agPlayerMissionProfile')};
  });
  assert.deepEqual(result.state,wanted);assert.equal(result.sameMap,true);assert.equal(result.sameProfile,true);
  assert.equal(Math.round(result.map.left),leftState===0?0:result.g.sidebarW+(leftState===2?result.g.missionsW:0));
  assert.deepEqual(result.inert,[!wanted.player,!wanted.workspace,!wanted.map,!wanted.territory,!wanted.command]);
  if(wanted.command)assert.ok(result.command.left>=result.map.left&&result.command.right<=result.map.right);
  if(wanted.map)assert.ok(result.header.left>=result.map.left&&result.header.right<=result.map.right);
  assert.equal(await page.locator('.sidebar [aria-current=page]').count(),wanted.workspace?1:0);
 }
 await panels(page,{player:true,workspace:false});
 await page.locator('.sidebar [data-ag-screen=profile]').click();
 await panels(page,{workspace:true});
 assert.equal(await page.locator('#agMenuPanel h1').textContent(),'Player Profile');
 await panels(page,{workspace:false});
 assert.equal(await page.locator('.sidebar [aria-current=page]').count(),0);
 await page.locator(handles.workspace).focus();await page.keyboard.press('Enter');await panels(page,{workspace:true});
 assert.equal(await page.locator('#agMenuPanel h1').textContent(),'Player Profile','Panel survives sliding beneath the menu');
 await page.locator('.sidebar [data-ag-screen=profile]').click();
 assert.equal(await page.locator(handles.workspace).getAttribute('aria-expanded'),'false','Selected item toggles its information panel closed');
 await page.locator('.sidebar [data-ag-screen=dashboard]').click();
 await panels(page);
 assert.match(await page.locator('#entityInformationSection').evaluate(el=>getComputedStyle(el).backgroundImage),/brushed-aluminum.webp/);
 await panels(page,closed);await page.reload();await page.waitForFunction(()=>window.AGWorldBootDiagnostics?.regression?.pass);
 assert.deepEqual(await page.evaluate(()=>window.AGWorldDrawers.getState()),closed,'Refresh starts with both left drawers closed');
 await panels(page);
}
