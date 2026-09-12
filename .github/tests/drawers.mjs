import assert from 'node:assert/strict';
const handles={player:'#agPlayerDrawerToggle',map:'#agMapDrawerToggle',territory:'#territoryStatsToggle',command:'#agCommandDrawerToggle'};
export async function panels(page,wanted={player:true,map:true,command:true,territory:false}){
 for(const [key,open]of Object.entries(wanted)){const button=page.locator(handles[key]);if(await button.getAttribute('aria-expanded')!==String(open))await button.click();}
 await page.waitForTimeout(320);
 await page.waitForFunction(()=>{const s=window.AGWorldDrawers?.getState(),g=window.AGWorldDrawers?.geometry();if(!s||!g)return false;const map=document.querySelector('.map-area').getBoundingClientRect();return Math.abs(map.left-g.leftStage)<1&&Math.abs(map.width-g.mapW)<1;});
}
export async function exerciseDrawers(page){
 assert.deepEqual(await page.evaluate(()=>window.AGWorldDrawers.getState()),{player:false,map:false,territory:false,command:false},'Fresh login starts with the map exposed');
 assert.equal(await page.locator('#agEnterWorldBtn').count(),0);
 assert.equal(await page.locator('#agGameModeControl').count(),0);
 await page.evaluate(()=>{window.drawerOriginalMap=document.getElementById('map');window.drawerOriginalProfile=document.getElementById('agPlayerMissionProfile');});
 // Gray-code sequence covers every independent open/closed combination with one click per step.
 let previous=0;
 for(let i=0;i<16;i++){
   const bits=i^(i>>1);
   if(i){const changed=previous^bits,key=['player','map','territory','command'][Math.log2(changed)];await page.locator(handles[key]).click();}
   previous=bits;
   await page.waitForTimeout(320);
   const result=await page.evaluate(()=>{
     const s=window.AGWorldDrawers.getState(),g=window.AGWorldDrawers.geometry(),r=q=>document.querySelector(q).getBoundingClientRect().toJSON();
     return {state:s,g,map:r('.map-area'),command:r('#entityInformationSection'),header:r('.map-header'),sidebarInert:document.querySelector('.sidebar').inert,commandInert:document.getElementById('entityInformationSection').inert,headerInert:document.querySelector('.map-header').inert,statsInert:document.getElementById('territoryStatsDrawerContent').inert,sameMap:window.drawerOriginalMap===document.getElementById('map'),sameProfile:window.drawerOriginalProfile===document.getElementById('agPlayerMissionProfile')};
   });
   assert.equal(result.sameMap,true);assert.equal(result.sameProfile,true);
   assert.equal(Math.round(result.map.left),result.g.leftStage);
   assert.equal(Math.round(result.map.width),result.g.mapW);
   for(const [j,key]of ['player','map','territory','command'].entries())assert.equal(result.state[key],!!(bits&(1<<j)));
   assert.equal(result.sidebarInert,!result.state.player);assert.equal(result.commandInert,!result.state.command);assert.equal(result.headerInert,!result.state.map);assert.equal(result.statsInert,!result.state.territory);
   if(result.state.command)assert.ok(result.command.left>=result.map.left&&result.command.right<=result.map.right);
   if(result.state.map)assert.ok(result.header.left>=result.map.left&&result.header.right<=result.map.right);
   if(!bits)assert.equal(await page.locator('body').getAttribute('data-ag-immersive'),'true');
 }
 await panels(page);
 const material=await page.locator('#entityInformationSection').evaluate(el=>getComputedStyle(el).backgroundImage);
 assert.match(material,/brushed-aluminum.webp/);
 await page.locator(handles.map).focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator(handles.map).getAttribute('aria-expanded'),'false','Keyboard closes a drawer');
 await page.keyboard.press('Enter');
 assert.equal(await page.locator(handles.map).getAttribute('aria-expanded'),'true','Keyboard reopens a drawer');
 await page.locator('.sidebar [data-ag-screen="profile"]').click();
 await panels(page,{player:false});await panels(page,{player:true});
 assert.equal(await page.locator('#agMenuPanel h1').textContent(),'Player Profile','Selected workspace survives drawer toggling');
 await page.locator('.sidebar [data-ag-screen="dashboard"]').click();
 await panels(page,{map:false,command:false,territory:false,player:false});
 await page.reload();await page.waitForFunction(()=>window.AGWorldBootDiagnostics?.regression?.pass);
 assert.deepEqual(await page.evaluate(()=>window.AGWorldDrawers.getState()),{player:false,map:false,territory:false,command:false},'Refresh also starts immersive');
 await panels(page);
}
