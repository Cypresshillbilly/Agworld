import assert from 'node:assert/strict';
import {panels} from './drawers.mjs';
export async function exerciseExplorationTools(page){
 await panels(page,{player:false,map:false,territory:false,command:false});
 assert.equal(await page.locator('#developerModeBtn').isVisible(),false,'Developer mode stays inside its closed drawer');
 await page.getByRole('button',{name:'Toggle AgWorld advisors',exact:true}).click();
 assert.equal(await page.locator('#agMapAdvisors [data-map-advisor]').count(),6);
 await page.locator('#agMapAdvisors [data-map-advisor=system-administrator]').click();
 await page.locator('#agWorldSystemGuide.show').waitFor();
 assert.equal(await page.locator('#agMapAdvisors [aria-pressed=true]').getAttribute('data-map-advisor'),'system-administrator');
 await panels(page,{player:true});
 assert.equal(await page.locator('#agMapAdvisors').isVisible(),false);
 assert.equal(await page.locator('#agMapAdvisorsToggle').isVisible(),false);
 assert.equal(await page.locator('#agWorldSystemGuide').isVisible(),false);
 await panels(page,{workspace:true,map:true});
 assert.equal(await page.locator('#developerModeBtn').isVisible(),true);
 assert.equal(await page.locator('.map-header #developerModeBtn').count(),1);
 for(const id of ['createFarmBtn','createContractorBtn','createCompetitorBtn','createCompanyFacilityBtn'])assert.equal(await page.locator('#'+id).isVisible(),true,id+' is in Map Menu');
 await page.locator('#agMapLayers summary').click();
 assert.equal(await page.locator('#agMapLayers input').count(),16);
 await page.locator('[data-map-layer=contractors]').uncheck();
 assert.equal(await page.evaluate(()=>agWorldGetLayerState().contractors),false);
 await page.locator('[data-map-layer=contractors]').check();
 await page.locator('#agMapLayers summary').click();
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
 assert.ok(center<2,'Territory stats sits on the vertical screen center');
 await panels(page,{map:true,command:true});
 const layout=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {top:r('#territoryStatsDrawer').top,header:r('.map-header').bottom,bottom:r('#territoryStatsDrawer').bottom,command:r('#entityInformationSection').top};});
 assert.ok(layout.top>=layout.header&&layout.bottom<=layout.command,'Stats fits between open top and bottom drawers');
 await panels(page,{player:false,map:false,territory:false,command:false});
}
