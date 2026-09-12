import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(process.cwd(),'AG WORLD');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=message=>{throw new Error(message)};
const assert=(condition,message)=>{if(!condition) fail(message)};

const index=read('index.html');
const auth=read('login/v1/auth.js');
const loginPanel=read('login/v1/login-panel.js');
const performanceModule=read('boot/v1/performance.js');
const expectedSources=JSON.parse(read('boot/v1/source-order.json'));

const scriptTags=[...index.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(match=>match[0]);
const external=scriptTags.map(tag=>({
  src:(tag.match(/\bsrc=["']([^"']+)["']/i)||[])[1]||null,
  deferred:/type=["']text\/agworld-deferred-script["']/i.test(tag)
})).filter(item=>item.src);

assert(external.length===expectedSources.length,`External source count changed: ${external.length} !== ${expectedSources.length}`);
expectedSources.forEach((src,index)=>assert(external[index]?.src===src,`Source order changed at ${index}: expected ${src}, got ${external[index]?.src}`));

const active=external.filter(item=>!item.deferred).map(item=>item.src);
assert(active.length===2,`Only Login V1 scripts may execute before authentication. Active=${active.join(', ')}`);
assert(active[0].includes('login/v1/login-panel.js'),'Login panel must be first active source');
assert(active[1].includes('login/v1/auth.js'),'Auth must be second active source');
assert(external.filter(item=>item.deferred).length===expectedSources.length-2,'Every non-login source must remain deferred');

assert(index.includes('id="agworld-game-loader"'),'Loading V0 overlay missing');
['auth','interface','systems','map','world','populate','finalise'].forEach(stage=>assert(index.includes(`data-load-stage="${stage}"`),`Loading stage missing: ${stage}`));
assert(index.includes('if(bootPromise) return bootPromise'),'One-shot boot promise missing');
assert(index.includes("document.querySelectorAll('script[type=\"'+TYPE+'\"]')")||index.includes("document.querySelectorAll('script[type=\"'+TYPE+'\"]')"),'Deferred source selector missing');
assert(!index.includes("createElement('main')"),'Boot code must not create a replacement app shell');

assert(auth.includes("if(loader) loader.classList.add('is-active')"),'Auth must activate Loading V0');
assert(auth.includes('await window.__AGWORLD_BOOT_GAME__()'),'Auth must call canonical deferred V1 boot');
assert(auth.includes('Promise.all([window.__AGWORLD_WORLD_READY__,playerReady])'),'Auth must wait for world and canonical Player V1 readiness');
assert(auth.indexOf('await window.__AGWORLD_BOOT_GAME__()')<auth.indexOf("window.dispatchEvent(new CustomEvent('gamechanger:authenticated'"),'V1 sources must exist before authenticated lifecycle is emitted');

assert(loginPanel.includes('boot/v1/performance.js?v=africa-board-20260912'),'Performance module is not wired into Login V1 boundary');
assert(loginPanel.includes('// Performance code is isolated from the approved V1 presentation above.'),'Performance isolation marker missing');
assert(performanceModule.includes('AGWorldBootDiagnostics'),'Boot diagnostics API missing');
assert(performanceModule.includes('agworld:boot-regression-pass'),'Runtime regression pass event missing');
assert(performanceModule.includes('agworld:boot-regression-fail'),'Runtime regression fail event missing');

const syntaxSources=new Map(external.filter(item=>!item.src.startsWith('https:')&&!item.src.split('?')[0].endsWith('.mjs')).map(item=>{const name=item.src.split('?')[0];return [name,read(name)];}));
syntaxSources.set('boot/v1/performance.js',performanceModule);
for(const name of ['developer-mode.js','developer-diagnostics.js'])syntaxSources.set(name,read(name));
scriptTags.filter(tag=>!/<script\b[^>]*\bsrc=/i.test(tag)).forEach((tag,i)=>syntaxSources.set('inline-'+i,tag.replace(/^<script\b[^>]*>/i,'').replace(/<\/script>$/i,'')));
for(const [name,source] of syntaxSources){
  try{new vm.Script(source,{filename:name});}
  catch(error){fail(`Syntax failure in ${name}: ${error.message}`)}
}

for(const file of [
  'main-game-layout-v1.js',
  'agworld-player-surface-final-v1.js',
  'agworld-landing-game-layer-v1.js',
  'agworld-final-layer-cleanup-v2.js',
  'agworld-player-progression-stack-v1.js',
  'agworld-mission-control-card-polish-v1.js'
]){
  assert(fs.existsSync(path.join(root,file)),`Locked Player V1 owner missing: ${file}`);
}

const result={
  pass:true,
  externalSources:external.length,
  deferredSources:external.filter(item=>item.deferred).length,
  activePreAuthSources:active,
  requiredStages:7,
  checkedSources:syntaxSources.size
};
console.log('AG WORLD V1 BOOT REGRESSION PASS');
console.log(JSON.stringify(result,null,2));
