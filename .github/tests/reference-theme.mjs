import assert from 'node:assert/strict';

export async function exerciseReferenceTheme(page){
  assert.equal(await page.locator('html').getAttribute('data-ag-game-theme'),'reference');
  assert.equal(await page.evaluate(()=>document.fonts.check('500 14px AgWorldCondensed')),true,'Self-hosted font loaded');
  const art=await page.locator('.agpc-art img').evaluate(el=>({loaded:el.complete&&el.naturalWidth>0,width:el.getBoundingClientRect().width,parent:el.parentElement.getBoundingClientRect().width}));
  assert.ok(art.loaded&&art.width>=art.parent-3,'Mission artwork fills its card');
  const scores=await page.locator('.agps-track').evaluateAll(els=>els.map(el=>Number(el.getAttribute('aria-valuenow'))));
  assert.deepEqual(scores,[0,0,0,0,0],'New players have five real zero skill scores');
  assert.equal(await page.locator('.agps-radar-ring').count(),5);
  await page.locator('#agAdvisorBay [data-advisor="sales"]').click();
  assert.equal(await page.locator('#agAdvisorBay [data-advisor="sales"]').evaluate(el=>el.classList.contains('is-active')),true);
  await page.locator('#agAdvisorBay [data-advisor="sales"]').click();
  for(const size of [{width:1600,height:1000},{width:1280,height:900}]){
    await page.setViewportSize(size);
    await page.waitForTimeout(150);
    const g=await page.evaluate(()=>{
      const r=q=>document.querySelector(q).getBoundingClientRect().toJSON();
      return {shell:r('.app-shell'),side:r('.sidebar'),missions:r('.missions'),map:r('.map-area'),player:r('#agPlayerMissionProfile'),stack:r('#agPlayerProgressionStack'),advisor:r('#agAdvisorBay'),command:r('#entityInformationSection'),start:r('#agCanonicalMissionCard button'),mission:r('#agCanonicalMissionCard')};
    });
    assert.equal(g.side.width,Math.round(g.shell.width*180/1280));
    assert.equal(g.missions.width,Math.round(g.shell.width*285/1280));
    assert.ok(Math.abs(g.map.x-g.missions.right)<3,'Original main column geometry');
    assert.ok(Math.abs(g.stack.y-g.player.bottom-10)<3,'Protected player-to-progression gap');
    assert.ok(Math.abs(g.stack.bottom-g.advisor.y+14)<3,'Protected progression-to-advisor gap');
    assert.ok(Math.abs(g.advisor.y-g.command.y)<3,'Advisors remain aligned to the Command Center');
    assert.ok(g.start.bottom<=g.mission.bottom+1,'Mission action is visible within its card: '+JSON.stringify({size,mission:g.mission,start:g.start}));
    const portraits=await page.locator('.ag-advisor-portrait').evaluateAll(els=>els.map(el=>({loaded:el.complete&&el.naturalWidth>0,rect:el.getBoundingClientRect().toJSON()})));
    assert.equal(portraits.length,5);assert.ok(portraits.every(p=>p.loaded));
    assert.ok(Math.max(...portraits.map(p=>p.rect.y))-Math.min(...portraits.map(p=>p.rect.y))<2,'One aligned row of photographic advisors');
  }
  await page.setViewportSize({width:1600,height:1000});
  const routes=['profile','pipeline','clients','products','after-sales','mission-history','ai-assistant','territory-campaigns','territory-graphics','settings'];
  for(const route of routes){
    await page.locator('.sidebar .nav [data-ag-screen="'+route+'"]').click();
    const style=await page.locator('#agMenuPanel').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,font:getComputedStyle(el.querySelector('h1')).fontFamily,cards:[...el.querySelectorAll('.agmp-card')].map(card=>getComputedStyle(card).backgroundImage),overflow:el.scrollWidth>el.clientWidth+1}));
    assert.equal(style.bg,'rgb(0, 20, 27)',route+' workspace surface');assert.match(style.font,/AgWorldCondensed/);
    assert.ok(style.cards.every(bg=>bg.includes('gradient')),route+' themed cards');assert.equal(style.overflow,false,route+' fits its workspace');
  }
  await page.locator('.sidebar .nav [data-ag-screen="dashboard"]').click();
  await page.getByRole('button',{name:'Toggle Territory Stats',exact:true}).click();
  const territory=await page.locator('#territoryInfoPanel').evaluate(el=>({content:el.textContent,layout:getComputedStyle(el.querySelector('.territory-national-layout')).flexDirection,overflow:el.scrollWidth>el.clientWidth+1,ring:getComputedStyle(el.querySelector('.territory-info-control-value')).backgroundImage}));
  assert.match(territory.content,/TERRITORY STATS/);assert.equal(territory.layout,'column');assert.equal(territory.overflow,false);assert.match(territory.ring,/conic-gradient/);
  await page.getByRole('button',{name:'Toggle Territory Stats',exact:true}).click();
  await page.getByRole('button',{name:'Open Test Company Facility on map',exact:true}).click();
  await page.getByRole('button',{name:'UPDATE ENTITY INFO',exact:true}).click();
  const editor=await page.locator('.agworld-entity-editor').evaluate(el=>({bg:getComputedStyle(el.querySelector('input')).backgroundColor,text:getComputedStyle(el.querySelector('input')).color,summary:getComputedStyle(document.querySelector('.agworld-entity-command-summary')).backgroundImage}));
  assert.equal(editor.bg,'rgb(0, 21, 29)');assert.equal(editor.text,'rgb(229, 245, 249)');assert.match(editor.summary,/gradient/);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.reload();
  await page.waitForFunction(()=>window.AGWorldBootDiagnostics?.regression?.pass===true);
}
