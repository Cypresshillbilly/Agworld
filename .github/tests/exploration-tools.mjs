import assert from 'node:assert/strict';
import {panels} from './drawers.mjs';
export async function exerciseExplorationTools(page){
 await panels(page,{player:false,map:false,territory:false,command:false});
 assert.equal(await page.locator('#agMapAdvisorsToggle span').count(),0,'The AgWorld advisor launcher is icon-only');
 assert.ok(await page.locator('#agMapAdvisorsToggle img').evaluate(e=>e.getBoundingClientRect().width)>=88);
 assert.ok(await page.locator('#agMapAdvisorsToggle').evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs(innerWidth-r.right-18)<2&&Math.abs(r.top-18)<2;}),'AgWorld icon owns the top-right corner');
 assert.equal(await page.locator('.map-header #agBoundaryCredits').count(),1);
 assert.equal(await page.locator('#agBoundaryCredits').isVisible(),false,'Boundary credits stay inside the closed map menu');
 const handleCenter=await page.locator('#agPlayerDrawerToggle').evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs(r.top+r.height/2-innerHeight/2);});
 assert.ok(handleCenter<2,'Main menu handle is vertically centered');
 await panels(page,{player:true});
 assert.equal(await page.locator('.missions').evaluate(e=>e.inert),true,'Opening MENU only reveals gray navigation');
 assert.equal(await page.locator('.sidebar [aria-current=page]').count(),0);
 await panels(page,{player:false});
 for(let i=0;i<2;i++){
  await panels(page,{map:true});
  const clear=await page.evaluate(()=>document.getElementById('agMapAdvisorsToggle').getBoundingClientRect().left>=document.querySelector('.map-header').getBoundingClientRect().right+10);
  assert.equal(clear,true,'Advisor control stays below the map menu after each open animation');
  await panels(page,{map:false});
 }
 assert.equal(await page.locator('#developerModeBtn').isVisible(),false,'Developer mode stays inside its closed drawer');
 await page.getByRole('button',{name:'Toggle AgWorld advisors',exact:true}).click();
 await page.waitForFunction(()=>document.getElementById('agMapAdvisors').getBoundingClientRect().right<document.getElementById('agMapAdvisorsToggle').getBoundingClientRect().left);
 assert.ok(await page.evaluate(()=>document.getElementById('agMapAdvisors').getBoundingClientRect().right<document.getElementById('agMapAdvisorsToggle').getBoundingClientRect().left),'Advisor bay opens leftward');
 assert.equal(await page.locator('#agMapAdvisors [data-map-advisor]').count(),6);
 await page.locator('#agMapAdvisors [data-map-advisor=system-administrator]').click();
 await page.locator('#agWorldSystemGuide.show').waitFor();
 assert.equal(await page.locator('#agMapAdvisors [aria-pressed=true]').getAttribute('data-map-advisor'),'system-administrator');
 await panels(page,{player:true});
 assert.equal(await page.locator('#agMapAdvisors').isVisible(),false);
 assert.equal(await page.locator('#agMapAdvisorsToggle').isVisible(),false);
 assert.equal(await page.locator('#agWorldSystemGuide').isVisible(),false);
 await panels(page,{workspace:true,map:true});
 await page.locator('[data-map-tab=settings]').click();
 await page.locator('[data-map-surface=terrain]').click();
 assert.equal(await page.evaluate(()=>map.getMapTypeId()),'terrain');
 assert.equal(await page.evaluate(()=>localStorage.getItem('agworld.map.surface')),'terrain');
 await page.locator('[data-map-surface=satellite]').click();
 assert.equal(await page.evaluate(()=>map.getMapTypeId()),'satellite');
 assert.equal(await page.locator('#developerModeBtn').isVisible(),true);
 assert.equal(await page.locator('.map-header #developerModeBtn').count(),1);
 await page.locator('[data-map-tab=actions]').click();
 for(const id of ['createFarmBtn','createContractorBtn','createCompetitorBtn','createCompanyFacilityBtn'])assert.equal(await page.locator('#'+id).isVisible(),true,id+' is in Map Menu');
 await page.locator('[data-map-tab=layers]').click();
 assert.equal(await page.locator('#agMapLayers input').count(),20);
 await page.locator('[data-map-layer=contractors]').uncheck();
 assert.equal(await page.evaluate(()=>agWorldGetLayerState().contractors),false);
 await page.locator('[data-map-layer=contractors]').check();
 await page.locator('[data-map-tab=settings]').click();
 for(const [id,route,title] of [['agPlayerMissionProfile','profile','Player Profile'],['agPlayerSalesFunnel','pipeline','Sales Funnel'],['agCanonicalMissionCard','mission-history','Missions']]){
  await page.evaluate(()=>AGWorldPlayerMenu.select('dashboard'));
  assert.equal(await page.locator('.missions').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  await page.locator('#'+id).focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.missions').getAttribute('data-ag-screen'),route);
  assert.equal(await page.locator('#agMenuPanel h1').textContent(),title);
 }
 await page.evaluate(()=>AGWorldPlayerMenu.select('dashboard'));
 await panels(page,{player:false,map:false,territory:true,command:false});
 const center=await page.locator('#territoryStatsDrawer').evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs((r.top+r.bottom)/2-innerHeight/2);});
 const screenLayout=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],state:AGWorldDrawers.getState(),geometry:AGWorldDrawers.geometry(),elements:['html','body','.app-shell','.map-area','#territoryStatsDrawer'].map(s=>{const e=document.querySelector(s);return {selector:s,rect:e.getBoundingClientRect().toJSON(),scroll:[e.scrollLeft,e.scrollTop],style:e.getAttribute('style')};})}));
 assert.ok(center<2,'Territory stats sits on the vertical screen center; offset '+center+'; '+JSON.stringify(screenLayout));
 await panels(page,{map:true,command:true});
 const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {top:r('#territoryStatsDrawer').top,header:r('.map-header').bottom,bottom:r('#territoryStatsDrawer').bottom,command:r('#entityInformationSection').top};});
 assert.ok(layout.top>=layout.header&&layout.bottom<=layout.command,'Stats fits between open top and bottom drawers');
 assert.doesNotMatch(await page.locator('#territoryStatsDrawerContent').evaluate(e=>getComputedStyle(e).backgroundImage),/aluminum/,'Territory stats uses a dashboard card surface');
 await panels(page,{player:false,map:false,territory:false,command:false});
}
