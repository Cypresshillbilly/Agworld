import assert from 'node:assert/strict';
import {panels} from './drawers.mjs';
const rectangle=(west,south,east,north)=>({type:'Polygon',coordinates:[[[west,south],[east,south],[east,north],[west,north],[west,south]]]});
export async function installTerritoryFixtures(context){
 await context.route(/\/MapServer\/(109|115|130)\/query/,route=>{
  const kind=route.request().url().match(/MapServer\/(\d+)/)[1];
  const features=kind==='109'?[{type:'Feature',properties:{OBJECTID:1,PROVINCE:'Gauteng'},geometry:rectangle(27,-27,30,-24)}]:kind==='115'?[{type:'Feature',properties:{OBJECTID:101,MAP_TITLE:'Test North Municipality'},geometry:rectangle(27,-26.2,30,-24)},{type:'Feature',properties:{OBJECTID:102,MAP_TITLE:'Test South Municipality'},geometry:rectangle(27,-27,30,-26.2)}]:[];
  return route.fulfill({status:200,contentType:'application/geo+json',body:JSON.stringify({type:'FeatureCollection',features})});
 });
}
export async function exerciseTerritoryBoard(page){
 const start=await page.evaluate(()=>({zoom:map.getZoom(),center:map.getCenter().toJSON(),country:countries[0]._polygon.getMap()===map,flags:countries.filter(c=>c._marker?.getMap()===map).length,count:countries.length,selected:window.AGWorldTerritoryBoard.getSelection().level,provinceLayer:window.__AG_WORLD_PROVINCE_DATA}));
 assert.ok(start.zoom>2&&start.zoom<5.5,'SADC fills the initial country view');
 assert.ok(start.center.lat>-23&&start.center.lat<-10&&start.center.lng>25&&start.center.lng<40);
 assert.equal(start.country,true);assert.equal(start.flags,16);assert.equal(start.count,48);assert.equal(start.selected,'region');assert.equal(start.provinceLayer,undefined);
 await page.evaluate(()=>agWorldSetLayerVisibility('countries',false));
 assert.equal(await page.evaluate(()=>countries[0]._polygon.getMap()),null);
 assert.equal(await page.evaluate(()=>countries[0]._marker.getMap()===map),true,'Country symbols remain selectable with boundaries off');
 await page.evaluate(()=>{agWorldSetLayerVisibility('countries',true);agWorldSetLayerVisibility('country-icons',false);});
 assert.equal(await page.evaluate(()=>countries[0]._polygon.getMap()===map),true);
 assert.equal(await page.evaluate(()=>countries[0]._marker.getMap()),null);
 await page.evaluate(()=>agWorldSetLayerVisibility('country-icons',true));
 const flagSizes=await page.evaluate(()=>{
  const zoom=map.getZoom(),width=()=>countries[0]._marker.options.icon.scaledSize.width;
  const overview=width();map.setZoom(Math.min(5.4,zoom+.6));const closer=width();map.setZoom(zoom);
  return {overview,closer,restored:width()};
 });
 assert.equal(flagSizes.overview,64,'Regional flags are prominent at startup');
 assert.ok(flagSizes.closer<flagSizes.overview,'Flags shrink as the player zooms in');
 assert.equal(flagSizes.restored,flagSizes.overview,'Zooming back out restores flag size');
 assert.match(await page.evaluate(()=>countries[0]._marker.options.icon.url),/symbols/);
 const badges=await page.evaluate(async()=>Promise.all(countries.map(c=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src='data/gis/africa/symbols/'+c.iso2+'.svg';}))));
 assert.equal(badges.length,48);assert.ok(badges.every(Boolean),'Every polished national badge decodes in the browser');
 await panels(page,{map:true,territory:true});
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-level'),'region');
 await page.evaluate(async()=>{
  const boundary=(lat,lng)=>[{lat:lat-.01,lng:lng-.01},{lat:lat+.01,lng:lng-.01},{lat:lat+.01,lng:lng+.01},{lat:lat-.01,lng:lng+.01}];
  accountTest.worldRows={farms:[['north-company','Customer',-25.8],['north-open','Prospect',-25.9],['south-rival','Competitor',-26.5]].map(([id,status,lat])=>({id,name:id,status,source:'manual',details:{center:{lat,lng:28.2},boundary:boundary(lat,28.2),objects:[]}})),contractors:[{id:'board-contractor',name:'Board Contractor',status:'Prospect',location_lat:-25.8,location_lng:28.3,details:{}}]};
  await loadFarmDatabaseOverrides();await loadDynamicLayers();refreshTerritoryControl();
 });
 const country=await page.evaluate(()=>({summary:calculateTerritoryControl(countries[0]),color:countries[0]._polygon.options.fillColor,markers:[...farms.map(f=>f._marker),...contractors.map(c=>c._marker)].map(m=>!!m.getMap())}));
 assert.equal(country.summary.farms.total,3);assert.equal(country.summary.contractors.total,1);assert.equal(country.summary.control,25);assert.equal(country.summary.enemyControl,25);assert.equal(country.summary.neutralControl,50);assert.ok(country.markers.every(x=>!x));
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-company-control'),'25','SADC includes each market entity once');
 await page.evaluate(()=>google.maps.event.trigger(countries[0]._marker,'click'));
 await page.waitForFunction(()=>territories.filter(t=>t.countryCode==='ZAF'&&t._polygon).length===9);
 assert.equal(await page.evaluate(()=>territories.filter(t=>t.name==='Northern Cape').length),1,'Northern Cape keeps its canonical province identity');
 assert.ok(await page.evaluate(()=>territories.filter(t=>t.countryCode==='ZAF').every(t=>t._marker.options.icon.url.includes('symbols/provinces/'))),'South African provinces have sculpted symbols');
 assert.ok(await page.evaluate(()=>map.getZoom()>=5.5&&map.getZoom()<8),'Country flag drills into province view');
 await page.evaluate(()=>map.setZoom(6.5));
 await page.waitForFunction(()=>spatialLayerState.provinces.status==='loaded');
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-level'),'country','Zoom alone does not select a province');
 await page.evaluate(()=>{const province=territories.find(p=>p.regions?.includes('Gauteng'));window.boardProvinceId=province.id;google.maps.event.trigger(province._polygon,'click');});
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-id'),await page.evaluate(()=>boardProvinceId));
 assert.ok(await page.evaluate(()=>map.getZoom()>=8&&map.getZoom()<11),'A province click reveals its municipalities');
 await page.evaluate(()=>map.setZoom(9));await page.waitForFunction(()=>spatialLayerState.municipalities.status==='loaded');
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-level'),'province','Municipal zoom keeps the selected province until a click');
 assert.equal(await page.evaluate(()=>territories.every(p=>!p._polygon?.getMap())),true,'Provincial fill cannot obscure municipal clicks');
 await page.evaluate(()=>google.maps.event.trigger(municipalities[0]._polygon,'click'));
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-level'),'municipality');
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-company-control'),'33.3');
 const oldColor=await page.evaluate(()=>municipalities[0]._polygon.options.fillColor);
 await page.evaluate(async()=>{accountTest.worldRows.farms[1].status='Competitor';accountTest.worldRows.contractors[0].status='Competitor';await loadFarmDatabaseOverrides();await loadDynamicLayers();});
 await page.waitForFunction(()=>document.getElementById('territoryInfoPanel').dataset.enemyControl==='66.7');
 assert.notEqual(await page.evaluate(()=>municipalities[0]._polygon.options.fillColor),oldColor,'Live farm/contractor changes update the selected polygon color');
 for(const zoom of [5,7,9,12]){
  await page.evaluate(z=>map.setZoom(z),zoom);
  assert.equal(await page.evaluate(()=>[...farms,...contractors].some(e=>!!e._marker?.getMap())),false,'Farm and contractor icons hidden at zoom '+zoom);
 }
 await page.evaluate(()=>map.setZoom(13));
 assert.equal(await page.evaluate(()=>[...farms,...contractors].every(e=>e._marker?.getMap()===map)),true,'Farms and contractors appear together');
 await page.evaluate(()=>map.setZoom(5));
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-level'),'municipality','Zooming out also preserves explicit selection');
 await page.locator('[data-map-tab=settings]').click();
 await page.getByRole('button',{name:'NATIONAL',exact:true}).click();
 assert.equal(await page.locator('#territoryInfoPanel').getAttribute('data-territory-level'),'country');
 assert.equal(await page.evaluate(()=>countries[0]._polygon.getMap()===map),true);
 await page.evaluate(()=>google.maps.event.trigger(countries.find(c=>c.countryCode==='NAM')._polygon,'click'));
 await page.waitForFunction(()=>territories.filter(t=>t.countryCode==='NAM'&&t._polygon).length===14);
 assert.equal(await page.evaluate(()=>new Set(territories.filter(t=>t.countryCode==='NAM').map(t=>t.id)).size),14,'Each province has its own identity');
 assert.match(await page.locator('#territoryInfoPanel').textContent(),/Namibia/);
 assert.equal(await page.evaluate(()=>calculateTerritoryControl(countries.find(c=>c.countryCode==='NAM')).total),0,'South African data cannot leak into another country');
 assert.equal(await page.evaluate(()=>territories.filter(t=>t.countryCode==='ZAF').some(t=>!!t._polygon.getMap())),false);
 await page.getByRole('button',{name:'AFRICA',exact:true}).click();
 assert.equal(await page.evaluate(()=>countries.filter(c=>c._marker?.getMap()===map).length),48);
 await page.getByRole('button',{name:'SADC',exact:true}).click();
 assert.equal(await page.evaluate(()=>countries.filter(c=>c._marker?.getMap()===map).length),16);

}
