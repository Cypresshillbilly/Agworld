import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../AG WORLD/player-sales-dashboard.js',import.meta.url),'utf8');
async function harness(rows,{fail=false}={}){
 const calls=[],user={id:'player-a'},farms=[{id:'a',name:'Farm <img>',control:'company'},{id:'b',name:'Open farm',control:'neutral'}];
 const db={from(table){let start=0,end=499,owner;const q={select(){return q},eq(field,id){assert.equal(field,'player_id');owner=id;return q},order(){return q},range(a,b){start=a;end=b;return q},then(resolve){calls.push({table,owner,start,end});return Promise.resolve(resolve({data:fail?null:rows.slice(start,end+1),error:fail?{message:'unavailable'}:null}));}};return q;}};
 const window={AGWorldBackend:{getUser:()=>user,getClient:()=>db},AG_WORLD_WORLD:{farms},AGWorldTerritoryControl:{control:f=>f.control},dispatchEvent(){}};
 const context={window,document:{addEventListener(){}},addEventListener(){},CustomEvent:class{},console};vm.runInNewContext(source,context);
 await new Promise(setImmediate);await new Promise(setImmediate);
 return {api:window.AGWorldSalesDashboard,user,calls};
}
test('sales funnel uses unique farms and only the current player query',async()=>{
 const h=await harness([{farm_id:'a'},{farm_id:'a'},{farm_id:'b'}]);const m=h.api.getModel();
 assert.equal(m.status,'ready');assert.equal(m.engaged,2);assert.equal(m.actions,3);assert.equal(m.clients,1);assert.equal(m.open,1);assert.equal(m.percent,50);
 assert.ok(h.calls.every(c=>c.owner==='player-a'&&c.table==='ag_farm_events'));
 assert.ok(h.api.workspaceMarkup().includes('Farm &lt;img&gt;'));
 h.user.id='player-b';assert.equal(h.api.getModel().engaged,0);assert.equal(h.api.getModel().status,'loading','Previous player activity is never shown after account switch');
});
test('sales activity paginates instead of silently truncating',async()=>{
 const h=await harness(Array.from({length:503},()=>({farm_id:'a'})));
 assert.equal(h.api.getModel().actions,503);assert.equal(h.api.getModel().engaged,1);assert.ok(h.calls.some(c=>c.start===500));
});
test('sales failure is distinct from an empty player funnel',async()=>{
 const h=await harness([],{fail:true});assert.equal(h.api.getModel().status,'error');assert.ok(h.api.cardMarkup().includes('could not be loaded'));assert.ok(h.api.cardMarkup().includes('data-sales-retry'));
 const fresh=await harness([]);assert.equal(fresh.api.getModel().status,'ready');assert.equal(fresh.api.getModel().engaged,0);assert.ok(fresh.api.workspaceMarkup().includes('first farm interaction'));
});
