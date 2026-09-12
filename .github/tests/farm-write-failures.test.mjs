import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../AG WORLD/server/index.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').split('ensureV2RelationshipSchema().then')[0];
async function request(method,{body={},missing=false,unavailable=false}={}){
  const routes={},queries=[];let released=false,connected=0;
  const client={query:async sql=>{queries.push(sql);return {rows:missing?[]:[{state:{}}]};},release:()=>{released=true;}};
  const pool={connect:async()=>{connected++;if(unavailable)throw Error('private connection detail');return client;}};
  const app={use(){},get(){},post:(path,fn)=>routes['POST '+path]=fn,patch:(path,fn)=>routes['PATCH '+path]=fn};
  const express=Object.assign(()=>app,{json:()=>()=>{}});
  vm.runInNewContext(source,{express,cors:()=>()=>{},pg:{Pool:function(){return pool;}},process:{env:{}},playerAuthorization:()=>()=>{},registerV2RelationshipRoutes(){},console:{log(){},warn(){},error(){}}});
  const res={code:200,status(n){this.code=n;return this;},json(body){this.body=body;return this;}};
  await routes[method+' '+(method==='POST'?'/api/farms':'/api/farms/:id')]({body,params:{id:'missing'},get:()=> 'verified-player'},res);
  return {res,queries,released,connected};
}
const farm={id:'fixture',name:'Fixture',boundary:[{lat:-26,lng:27},{lat:-26,lng:28},{lat:-27,lng:28}]};
test('invalid farm requests return a client error before borrowing a database connection',async()=>{
  for(const method of ['POST','PATCH']){const r=await request(method);assert.equal(r.res.code,400);assert.equal(r.connected,0);}
});
test('missing farm updates roll back before returning their connection',async()=>{
  const r=await request('PATCH',{body:farm,missing:true});assert.equal(r.res.code,404);assert.equal(r.queries.at(-1),'ROLLBACK');assert.equal(r.released,true);assert.equal(r.queries.includes('COMMIT'),false);
});
test('unavailable database returns a recoverable response without connection details',async()=>{
  for(const method of ['POST','PATCH']){const r=await request(method,{body:farm,unavailable:true});assert.equal(r.res.code,503);assert.equal(r.res.body.error,'database unavailable');}
});
