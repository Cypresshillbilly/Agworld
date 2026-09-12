import assert from 'node:assert/strict';

export async function exerciseSidebarDiagnostics(page){
  const launcher=page.getByRole('button',{name:'Open Developer Mode diagnostics',exact:true});
  await launcher.waitFor();
  const shape=await page.evaluate(()=>{
    const sidebar=document.querySelector('.sidebar'),logo=sidebar.querySelector('.brand-logo'),nav=sidebar.querySelector('.nav'),style=getComputedStyle(logo);
    return {sidebar:sidebar.getBoundingClientRect().toJSON(),logo:logo.getBoundingClientRect().toJSON(),src:logo.getAttribute('src'),loaded:logo.complete&&logo.naturalWidth>0,filter:style.filter,nav:nav.getAttribute('aria-label'),developerInNav:nav.contains(document.getElementById('developerModeBtn'))};
  });
  assert.equal(shape.loaded,true);assert.match(shape.src,/AgWorld_Stacked_Vertical.png/);assert.equal(shape.filter,'none');
  assert.ok(shape.logo.width>=120);assert.ok(shape.logo.x>=shape.sidebar.x&&shape.logo.right<=shape.sidebar.right);
  assert.equal(shape.nav,'AgWorld player menu');assert.equal(shape.developerInNav,false);
  const geometry=await page.evaluate(()=>({shell:document.querySelector('.app-shell').clientWidth,side:document.querySelector('.sidebar').getBoundingClientRect().width,mission:document.querySelector('.missions').getBoundingClientRect().width}));
  assert.equal(geometry.side,Math.round(geometry.shell*180/1280));assert.equal(geometry.mission,Math.round(geometry.shell*285/1280));
  const popupPromise=page.waitForEvent('popup');await launcher.click();const dev=await popupPromise;
  await dev.locator('#connectionState').filter({hasText:'CONNECTED TO LIVE GAME'}).waitFor();
  assert.equal(await dev.locator('#appStatus').textContent(),'READY');
  for(const id of ['boot','map','player','navigation','dashboard','layout'])assert.equal(await dev.locator('[data-check="'+id+'"]').getAttribute('data-state'),'pass',id+' diagnostic');
  assert.equal(await dev.locator('#advancedDiagnostics').evaluate(el=>el.open),false);
  await page.evaluate(()=>window.dispatchEvent(new ErrorEvent('error',{message:'Diagnostic fixture failure for player@example.test token=do-not-export'})));
  await dev.getByRole('button',{name:'↻ REFRESH',exact:true}).click();
  assert.equal(await dev.locator('[data-check="runtime"]').getAttribute('data-state'),'fail');
  const report=await dev.evaluate(()=>window.AGWorldDeveloperDiagnostics.collect(window.opener));
  assert.ok(report.events.some(e=>e.message.includes('Diagnostic fixture failure')));
  assert.ok(!JSON.stringify(report).includes('player@example.test'));assert.ok(!JSON.stringify(report).includes('do-not-export'));
  await dev.locator('.toolbar').getByRole('button',{name:'FAIL',exact:true}).click();
  await dev.getByRole('button',{name:'↻ REFRESH',exact:true}).click();
  assert.equal(await dev.locator('[data-check="navigation"]').isVisible(),false,'Filter survives refresh');
  await dev.locator('.toolbar').getByRole('button',{name:'ALL',exact:true}).click();
  await dev.route('**/api/health',route=>route.fulfill({status:503,body:'unavailable'}));
  await dev.getByRole('button',{name:'CHECK API',exact:true}).click();
  await dev.locator('[data-check="backend"][data-state="fail"]').waitFor();
  await dev.unroute('**/api/health');await dev.route('**/api/health',route=>route.fulfill({status:200,body:'{"ok":true}'}));
  await dev.getByRole('button',{name:'CHECK API',exact:true}).click();
  await dev.locator('[data-check="backend"][data-state="pass"]').waitFor();
  await dev.close();
  assert.equal(await page.locator('.nav [aria-current="page"]').getAttribute('data-ag-screen'),'dashboard');
  const standalone=await page.context().newPage();await standalone.goto(new URL('developer-mode.html',page.url()).href);
  assert.equal(await standalone.locator('#connectionState').textContent(),'NO GAME CONNECTION');
  assert.equal(await standalone.locator('#diagnosticPanels [data-state="fail"]').count(),0);await standalone.close();
}
