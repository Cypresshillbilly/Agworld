import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../../AG WORLD/territory-board-v1.js',import.meta.url),'utf8');
function runtime(){
 const ctx={console,Map,Set,Number,Math,Date,JSON,Array,Object,String,setTimeout(){},setInterval(){},addEventListener(){},dispatchEvent(){},CustomEvent:class{},document:{getElementById:()=>null},farms:[],countries:[],territories:[],municipalities:[],towns:[],map:null,MASTER_PLAYER:{name:'The Company'}};
 ctx.window=ctx;ctx.$=()=>null;ctx.__AG_WORLD_CONTRACTORS=[];
 ctx.AG_WORLD_WORLD={farms:ctx.farms,getContractors:()=>ctx.__AG_WORLD_CONTRACTORS};
 vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;
}
test('Status-only farms and open market contribute to the same weighted denominator',()=>{
 const r=runtime();r.farms.push({id:'a',status:'Customer'},{id:'b',status:'Competitor'},{id:'c',status:'Prospect'});
 const s=r.calculateTerritoryControl({level:'country'});
 assert.equal(s.control,33.3);assert.equal(s.enemyControl,33.3);assert.equal(s.neutralControl,33.3);assert.equal(s.farms.total,3);
});
test('Competitor dominance paints red even when Company influence is nonzero',()=>{
 const r=runtime();const style=r.territoryControlStyle({game:{control:10,enemyControl:70}});
 assert.equal(style.fillColor,'#df5252');
});
test('Contractors and farms share provincial and municipal geography',()=>{
 const r=runtime();const boundary=[{lat:-27,lng:27},{lat:-24,lng:27},{lat:-24,lng:30},{lat:-27,lng:30}];
 r.territories.push({id:'p',level:'province',boundary});r.municipalities.push({id:'m',level:'municipality',boundary,center:{lat:-26,lng:28}});
 r.farms.push({id:'f',status:'Customer',center:{lat:-26,lng:28}});r.__AG_WORLD_CONTRACTORS.push({id:'c',lat:-26,lng:28,status:'Prospect'});
 r.linkHierarchySpatialParents();
 assert.equal(r.farms[0].territoryId,'p');assert.equal(r.farms[0].municipalityId,'m');
 assert.equal(r.calculateTerritoryControl(r.territories[0]).total,2);
 assert.equal(r.calculateTerritoryControl(r.municipalities[0]).control,50);
});
test('Drone quantities remain weighted without dropping neutral farms',()=>{
 const r=runtime();r.farms.push({id:'a',dronePortfolio:[{supplierType:'companyFacility',supplierId:'s',quantity:3}]},{id:'b',status:'Prospect'});
 assert.equal(r.calculateTerritoryControl({level:'country'}).control,75);
});
test('Countries keep their own records and exclude holes while including islands',()=>{
 const r=runtime();const square=(x,y,n=2)=>[[x,y],[x+n,y],[x+n,y+n],[x,y+n],[x,y]];
 const a={id:'a',countryCode:'A',level:'country',geometry:{type:'MultiPolygon',coordinates:[[square(20,-30),square(20.5,-29.5,.2)],[square(25,-30)]]}};
 const b={id:'b',countryCode:'B',level:'country',geometry:{type:'Polygon',coordinates:[square(30,-30)]}};
 r.countries.push(a,b);r.farms.push({id:'mainland',center:{lng:20.2,lat:-29},status:'Customer'},{id:'island',center:{lng:25.5,lat:-29},status:'Customer'},{id:'hole',center:{lng:20.6,lat:-29.4},status:'Competitor'},{id:'other-country',center:{lng:31,lat:-29},status:'Prospect'});
 assert.equal(r.calculateTerritoryControl(a).farms.total,2);assert.equal(r.calculateTerritoryControl(a).control,100);
 assert.equal(r.calculateTerritoryControl(b).farms.total,1);assert.equal(r.calculateTerritoryControl(b).control,0);
});
test('All country divisions and flag files exist with valid closed rings',()=>{
 const base=new URL('../../AG WORLD/data/gis/africa/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('index.json',base),'utf8'));
 assert.equal(manifest.countries.length,48);let count=0;
 for(const country of manifest.countries){
  assert.ok(fs.readFileSync(new URL('flags/'+country.iso2+'.svg',base),'utf8').includes('<svg'));
  const features=country.provinceFiles.flatMap(file=>JSON.parse(fs.readFileSync(new URL(file,base),'utf8')).features);
  assert.equal(features.length,country.provinceCount,country.iso);
  for(const f of features){assert.equal(f.properties.iso,country.iso);assert.ok(f.properties.name);const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const rings of polygons)for(const ring of rings){assert.ok(ring.length>=4);assert.deepEqual(ring[0],ring.at(-1));assert.ok(ring.every(p=>p.length===2&&p.every(Number.isFinite)));}}
  count+=features.length;
 }
 assert.equal(count,640);
});
