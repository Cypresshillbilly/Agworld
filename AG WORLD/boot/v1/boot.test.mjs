import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const auth=fs.readFileSync(new URL('login/v1/auth.js',root),'utf8');
const tags=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const loaderSource=tags.find(s=>s.includes('canonical deferred V1 game boot'));
const handoffSource=auth.slice(auth.indexOf('  async function bootPlayer('),auth.indexOf('  function showGate('));
class CustomEvent extends Event {constructor(name,options={}){super(name);this.detail=options.detail;}}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function sourceHarness({fail=false,executionError=false,parsing=false}={}){
  const window=new EventTarget();
  const document=new EventTarget();
  const order=[],appended=[],preloads=[];
  const nodes=[
    {src:'https://test.test/three.mjs',dataset:{agworldType:'module'}},
    {src:'https://test.test/core.js',dataset:{}},
    {textContent:'window.inlineRan=true;',dataset:{}},
    {src:'https://test.test/player.js',dataset:{}}
  ];
  nodes.forEach(node=>{node.getAttribute=()=>node.src;node.remove=()=>{node.removed=true;};});
  document.readyState=parsing?'loading':'complete';
  document.querySelectorAll=()=>nodes;
  document.createElement=tag=>({tag,dataset:{},remove(){this.removed=true;}});
  const context=vm.createContext({window,document,performance,CustomEvent,setTimeout:(fn,ms)=>setTimeout(fn,ms===20000?25:ms),clearTimeout});
  document.head={appendChild(script){
    if(script.tag==='link'){preloads.push(script);return;}
    appended.push(script);
    if(!script.src){vm.runInContext(script.text,context);order.push('inline');return;}
    setTimeout(()=>{
      if(script.removed)return;
      if(fail&&script.src.endsWith('core.js'))return script.onerror?.();
      if(executionError&&script.src.endsWith('core.js')){
        const e=new Event('error');e.filename=script.src;e.message='test runtime exception';window.dispatchEvent(e);return;
      }
      if(script.src.endsWith('player.js'))assert.equal(window.inlineRan,true);
      order.push(script.src);script.onload?.();
    },script.type==='module'?6:1);
  }};
  vm.runInContext(loaderSource,context);
  return {window,document,nodes,order,appended,preloads};
}

test('ordered module, classic and inline execution; one shared boot promise',async()=>{
  const h=sourceHarness();let ready=0;h.window.addEventListener('agworld:game-sources-ready',()=>ready++);
  const first=h.window.__AGWORLD_BOOT_GAME__();
  assert.equal(first,h.window.__AGWORLD_BOOT_GAME__());
  await first;
  assert.equal(h.appended[0].type,'module');
  assert.deepEqual(h.order,['https://test.test/three.mjs','https://test.test/core.js','inline','https://test.test/player.js']);
  assert.ok(h.nodes.every(n=>n.removed));assert.equal(ready,1);assert.equal(h.window.__AGWORLD_GAME_BOOTED__,true);
});
test('preloading starts all downloads without execution and is deduplicated',async()=>{
  const h=sourceHarness(),updates=[];
  h.window.__AGWORLD_PRELOAD_GAME__();h.window.__AGWORLD_PRELOAD_GAME__();
  assert.equal(h.preloads.length,3);assert.equal(h.appended.length,0);
  assert.equal(h.preloads[0].rel,'modulepreload');assert.equal(h.preloads[1].as,'script');
  h.window.addEventListener('agworld:source-progress',e=>updates.push(e.detail.completed));
  await h.window.__AGWORLD_BOOT_GAME__();
  assert.equal(h.preloads.length,3);assert.deepEqual(updates,[1,2,3,4]);
});
test('refresh waits for HTML parsing before taking the source inventory',async()=>{
  const h=sourceHarness({parsing:true});const boot=h.window.__AGWORLD_BOOT_GAME__();
  await pause(2);assert.equal(h.appended.length,0);
  h.document.readyState='complete';h.document.dispatchEvent(new Event('DOMContentLoaded'));await boot;
  assert.equal(h.order.length,4);
});
for(const [name,options] of [['download failure',{fail:true}],['execution exception',{executionError:true}]]){
  test(name+' rejects without executing later sources or signalling readiness',async()=>{
    const h=sourceHarness(options);await assert.rejects(h.window.__AGWORLD_BOOT_GAME__());
    assert.equal(h.window.__AGWORLD_GAME_BOOTED__,false);assert.equal(h.appended.length,2);assert.equal(h.nodes[1].removed,undefined);
  });
}
test('a stalled script download rejects instead of waiting forever',async()=>{
  const h=sourceHarness();h.document.head.appendChild=()=>{};
  await assert.rejects(h.window.__AGWORLD_BOOT_GAME__(),/Timed out/);
});

function handoffHarness({sourceFailure=false,worldFailure=false,stalled=false}={}){
  const window=new EventTarget(),document=new EventTarget(),history=[];
  const classes=()=>{const values=new Set();return {add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v),toggle:(v,on)=>on?values.add(v):values.delete(v)};};
  const element=()=>({style:{},classList:classes(),hidden:false,remove(){this.removed=true;}});
  const ids=Object.fromEntries(['agworld-game-loader','agworld-game-loader-bar','agworld-game-loader-percent','agworld-game-loader-status','agworld-game-loader-retry','ag-login-boot-shield'].map(id=>[id,element()]));
  Object.defineProperty(ids['agworld-game-loader-status'],'textContent',{set:text=>history.push(text),get:()=>history.at(-1)});
  const checks=['auth','interface','systems','map','world','populate','finalise'].map(stage=>({...element(),dataset:{loadStage:stage}}));
  document.body=element();document.getElementById=id=>ids[id];document.querySelectorAll=()=>checks;
  let eventCount=0;window.addEventListener('gamechanger:authenticated',()=>eventCount++);
  const stage=value=>window.dispatchEvent(new CustomEvent('agworld:load-checklist',{detail:{stage:value}}));
  window.__AGWORLD_BOOT_GAME__=async()=>{
    if(sourceFailure)throw Error('HTTP 404');
    stage('world');stage('map');stage('populate');stage('map');
    window.__AGWORLD_WORLD_READY__=stalled?new Promise(()=>{}):Promise.resolve();
    if(worldFailure)window.__AGWORLD_WORLD_READY__=Promise.reject(Error('map unavailable'));
    else if(!stalled)setTimeout(()=>document.dispatchEvent(new CustomEvent('agworld:landing-layout-ready')),3);
  };
  const context=vm.createContext({window,document,performance,CustomEvent,console:{error(){}},reveal(){},location:{reload(){window.retried=true;}},requestAnimationFrame:fn=>setTimeout(fn,0),setTimeout:(fn,ms)=>setTimeout(fn,ms===45000?15:ms),clearTimeout});
  vm.runInContext(handoffSource+'\nwindow.testBootPlayer=bootPlayer;',context);
  return {window,ids,history,checks,gate:element(),count:()=>eventCount};
}
for(const restored of [false,true])test((restored?'refresh':'fresh login')+' completes all stages in order and hides loader only at readiness',async()=>{
  const h=handoffHarness();await h.window.testBootPlayer({gate:restored?null:h.gate,username:'Test',role:'agriculture_sales',restored});
  assert.deepEqual(h.history,['AUTHENTICATION COMPLETE','LOADING GAME INTERFACE','INITIALISING GAME SYSTEMS','LOADING MAP ENGINE','LOADING SADC TERRITORIES','POPULATING MAP','FINALISING PLAYER SCREEN','AGWORLD READY']);
  assert.equal(h.ids['agworld-game-loader'].classList.contains('is-active'),false);
  assert.equal(h.ids['agworld-game-loader-retry'].hidden,true);
  assert.equal(h.ids['ag-login-boot-shield'].removed,true);
  assert.ok(h.checks.every(c=>c.classList.contains('is-complete')));assert.equal(h.count(),1);
});
for(const [name,options] of [['source failure',{sourceFailure:true}],['map failure',{worldFailure:true}],['readiness timeout',{stalled:true}]])test(name+' stays on the real loader and offers a clean reload',async()=>{
  const h=handoffHarness(options);await h.window.testBootPlayer({gate:h.gate,username:'Test',role:'agriculture_sales'});
  assert.equal(h.ids['agworld-game-loader'].classList.contains('is-active'),true);
  assert.equal(h.ids['agworld-game-loader-retry'].hidden,false);assert.ok(!h.history.includes('AGWORLD READY'));
  h.ids['agworld-game-loader-retry'].onclick();assert.equal(h.window.retried,true);
  const count=h.history.length;h.window.dispatchEvent(new CustomEvent('agworld:load-checklist',{detail:{stage:'finalise'}}));assert.equal(h.history.length,count,'listeners must be removed after failure');
});

test('a late map authorisation failure replaces a ready screen with retry',async()=>{
  const h=handoffHarness();await h.window.testBootPlayer({gate:h.gate,username:'Test',role:'agriculture_sales'});
  assert.equal(h.ids['agworld-game-loader'].classList.contains('is-active'),false);
  h.window.dispatchEvent(new CustomEvent('agworld:world-failed',{detail:{message:'Map key rejected'}}));
  assert.equal(h.ids['agworld-game-loader'].classList.contains('is-active'),true);
  assert.equal(h.ids['agworld-game-loader-retry'].hidden,false);
  assert.equal(h.history.at(-1),'UNABLE TO LOAD AGWORLD. PLEASE RETRY.');
});

test('player renderer stays idle until data or its content changes',()=>{
  const source=fs.readFileSync(new URL('agworld-mission-control-card-polish-v1.js',root),'utf8');
  const render=source.slice(source.indexOf('const renderedPlayers='),source.indexOf('const ADVISOR_ASSETS='));
  let writes=0;
  const card={dataset:{},firstElementChild:null,set innerHTML(value){writes++;this.firstElementChild={};}};
  const player={name:'PLAYER',role:'SALES',level:1,chapter:1,xp:0,next:1000,pct:0,initial:'P'};
  const context=vm.createContext({document:{getElementById:()=>card},PLAYER_CARD:'player',canonicalPlayer:()=>player,esc:String});
  vm.runInContext(render,context);
  vm.runInContext('for(let i=0;i<500;i++)renderPlayer()',context);
  assert.equal(writes,1);
  player.xp=120;vm.runInContext('renderPlayer()',context);assert.equal(writes,2);
  card.firstElementChild={};vm.runInContext('renderPlayer()',context);assert.equal(writes,3);
});
