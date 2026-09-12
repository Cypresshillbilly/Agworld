import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {exercisePlayerMenu} from './menu-panels.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../AG WORLD');
const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/__test-events'){req.resume();res.writeHead(204).end();return;}
  if(url.pathname==='/__fixture.js'||url.pathname==='/__map-fixture.js'){
    res.writeHead(200,{'Content-Type':'application/javascript'});
    res.end(fs.readFileSync(path.join(here,url.pathname==='/__fixture.js'?'account-fixture.js':'map-fixture.js')));return;
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname).replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{
    if(!error&&file.endsWith('index.html'))data=data.toString().replace('<head>','<head><script src="/__fixture.js"></script><script src="/__map-fixture.js"></script>');
    res.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'Not found':data);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
const results=[];
async function newTest(){
  const context=await browser.newContext({viewport:{width:1600,height:1000}});
  // Fixture identity and map do not contact production auth or mutate game data.
  await context.route(/\/api\//,route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.bootStages=[];window.bootCounts={ready:0,sources:0};
    document.addEventListener('agworld:landing-layout-ready',()=>window.bootCounts.ready++);
    addEventListener('agworld:game-sources-ready',()=>window.bootCounts.sources++);
    addEventListener('agworld:player-visible',()=>window.bootStages.push('visible'));
  });
  return {context,page,errors};
}
async function login(page){
  await page.locator('#agUsername').fill('boot-test@example.test');
  await page.locator('#agPassword').fill('test-only-password');
  await page.locator('.ag-login-button').click();
}
async function ready(page){
  await page.waitForFunction(()=>window.AGWorldBootDiagnostics?.regression?.pass===true,{},{timeout:30000});
  const report=await page.evaluate(()=>({counts:window.bootCounts,shells:document.querySelectorAll('.app-shell').length,three:window.THREE?.REVISION,world:window.__AGWORLD_WORLD_BOOTED__,status:document.getElementById('agworld-game-loader-status').textContent,checks:[...document.querySelectorAll('.agl-check')].every(el=>el.classList.contains('is-complete')),card:!!document.querySelector('#farmCard .company-command-split')}));
  assert.equal(report.counts.sources,1);assert.equal(report.counts.ready,1);assert.equal(report.shells,1);assert.equal(report.three,'178');assert.equal(report.world,true);assert.equal(report.status,'AGWORLD READY');assert.equal(report.checks,true);assert.equal(report.card,true);
}
try{
  const progressTest=await newTest();
  let releaseFirst,releaseLast;
  const firstHeld=new Promise(resolve=>{releaseFirst=resolve;});
  const lastHeld=new Promise(resolve=>{releaseLast=resolve;});
  const downloads=new Set();
  progressTest.page.on('request',request=>{if(/\.m?js(?:\?|$)/.test(request.url()))downloads.add(request.url());});
  await progressTest.context.route('**/boot/v1/three.mjs*',async route=>{await firstHeld;await route.continue();});
  await progressTest.context.route('**/agworld-mission-control-card-polish-v1.js*',async route=>{await lastHeld;await route.continue();});
  await progressTest.page.goto(base+'/index.html');
  await progressTest.page.waitForFunction(()=>document.querySelectorAll('link[rel=preload][as=script]').length>40);
  assert.ok(downloads.size>20,'Later downloads must start while the first dependency is held');
  assert.equal(await progressTest.page.locator('script[data-agworld-boot-loaded]').count(),0);
  releaseFirst();await login(progressTest.page);
  await progressTest.page.waitForFunction(()=>parseInt(document.getElementById('agworld-game-loader-percent').textContent)>50);
  const partial=await progressTest.page.locator('#agworld-game-loader-percent').textContent();
  assert.ok(parseInt(partial)<70,'Progress must not claim source completion while the last source is held');
  assert.equal(await progressTest.page.locator('#agworld-game-loader').isVisible(),true);
  releaseLast();await ready(progressTest.page);
  assert.deepEqual(progressTest.errors,[]);
  results.push('Overlapping downloads without pre-auth execution; visible progress '+partial+' while final source is held; full readiness after release');
  await progressTest.context.close();
  for(const immediateSession of [false,true]){
    const signup=await newTest(),page=signup.page;
    await page.goto(base+'/index.html');
    await page.evaluate(session=>Object.assign(window.accountTest,{session,delay:350,facilityFailures:1}),immediateSession);
    await page.locator('.ag-create-account-button').click();
    const dialog=page.getByRole('dialog',{name:'Join the Company'});
    await dialog.waitFor({state:'visible'});
    await dialog.getByRole('button',{name:'RETRY FACILITY LIST',exact:true}).waitFor({state:'visible'});
    await dialog.getByRole('button',{name:'RETRY FACILITY LIST',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#agAccountDialog [type=submit]').disabled);
    assert.equal(await page.locator('script[data-agworld-boot-loaded]').count(),0,'Registration must not boot the game');
    await dialog.getByRole('button',{name:'CREATE ACCOUNT',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.accountTest.signups.length),0,'Missing fields must not reach signup');
    await dialog.getByLabel('FULL NAME',{exact:true}).fill('New Test Player');
    await dialog.getByLabel('EMAIL ADDRESS',{exact:true}).fill('new-player@example.test');
    await dialog.getByLabel('PASSWORD',{exact:true}).fill('test-only-password');
    await dialog.getByRole('combobox',{name:'COMPANY FACILITY',exact:true}).selectOption('fixture-facility');
    await page.evaluate(()=>window.accountTest.signupError='Test account error');
    await dialog.getByRole('button',{name:'CREATE ACCOUNT',exact:true}).click();
    await dialog.getByText('Test account error',{exact:true}).waitFor();
    await page.evaluate(()=>window.accountTest.signupError=null);
    await dialog.getByRole('button',{name:'CREATE ACCOUNT',exact:true}).click();
    if(immediateSession){await ready(page);}
    else{
      await dialog.getByText('Check your email to confirm your account, then return here and sign in.',{exact:true}).waitFor();
      assert.equal(await page.locator('script[data-agworld-boot-loaded]').count(),0);
      await dialog.getByRole('button',{name:'RESEND CONFIRMATION EMAIL',exact:true}).click();
      assert.equal(await page.evaluate(()=>window.accountTest.resends[0].email),'new-player@example.test');
      await dialog.getByRole('button',{name:'ALREADY HAVE AN ACCOUNT? SIGN IN',exact:true}).click();
      assert.equal(await page.locator('#agUsername').inputValue(),'new-player@example.test');
      await login(page);await ready(page);
    }
    assert.equal(await page.evaluate(()=>window.accountTest.signups.length),2,'One failed attempt and one successful attempt');
    assert.deepEqual(signup.errors,[]);
    await signup.context.close();
    results.push('Create Account before game boot: facility retry, validation, account error retry, '+(immediateSession?'authenticated signup enters game':'email confirmation, resend, return to sign-in'));
  }
  const good=await newTest();
  await good.page.goto(base+'/index.html');
  assert.equal(await good.page.locator('script[data-agworld-boot-loaded]').count(),0);
  await login(good.page);await ready(good.page);
  await exercisePlayerMenu(good.page);
  results.push('Dashboard default, all menu panel routes, Profile badges/skills, late hydration, keyboard navigation, preserved Dashboard nodes and responsive bounds');
  // Let late observers and timers run, then exercise a real control.
  await good.page.evaluate(()=>{
    window.navMutations=0;
    new MutationObserver(records=>window.navMutations+=records.length).observe(document.querySelector('.sidebar .nav'),{childList:true});
  });
  await good.page.waitForTimeout(5000);
  const navigationUpdates=await good.page.evaluate(()=>window.navMutations);
  assert.ok(navigationUpdates<10,'Navigation must settle after startup: '+navigationUpdates+' mutations');
  await good.page.getByRole('button',{name:'Toggle Territory Stats',exact:true}).click();
  assert.equal(await good.page.locator('#territoryStatsToggle').getAttribute('aria-expanded'),'true');
  await good.page.reload();await ready(good.page);
  await good.page.getByRole('button',{name:'Logout',exact:true}).click();
  try{await good.page.locator('#agUsername').waitFor({state:'visible',timeout:10000});}
  catch(error){
    console.error('Logout diagnostic',await good.page.evaluate(()=>({url:location.href,screen:document.querySelector('.missions')?.dataset.agScreen,explicitAuth:window.__AGWORLD_EXPLICIT_AUTH__,session:sessionStorage.getItem('gamechanger.authenticated'),accountLogout:window.agWorldLogout?.toString().includes('db.auth.signOut'),logout:document.querySelector('.nav [data-menu="logout"]')?.outerHTML,loader:document.querySelector('#agworld-game-loader')?.className})));throw error;
  }
  await login(good.page);await ready(good.page);
  assert.deepEqual(good.errors,[]);
  results.push('fresh login, responsive territory toggle, refresh, logout, second login');
  await good.context.close();

  const failed=await newTest();
  await failed.context.route('**/boot/v1/three.mjs*',route=>route.fulfill({status:404,body:'Missing dependency'}));
  await failed.page.goto(base+'/index.html');await login(failed.page);
  await failed.page.locator('#agworld-game-loader-retry').waitFor({state:'visible'});
  assert.equal(await failed.page.locator('.app-shell').isVisible(),false);
  assert.equal(await failed.page.evaluate(()=>window.__AGWORLD_GAME_BOOTED__),false);
  await failed.context.unroute('**/boot/v1/three.mjs*');
  await failed.page.locator('#agworld-game-loader-retry').click();await ready(failed.page);
  results.push('missing dependency remains hidden, shows retry, successful clean recovery');
  await failed.context.close();
  console.log('AGWORLD BROWSER BOOT PASS\n'+JSON.stringify(results,null,2));
}finally{await browser.close();server.close();}

