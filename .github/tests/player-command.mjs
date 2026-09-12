import assert from 'node:assert/strict';
import {panels} from './drawers.mjs';

export async function exercisePlayerCommand(page){
  await page.goto(new URL('/index.html?returning-player',page.url()).href);
  await page.waitForFunction(()=>window.AGWorldBootDiagnostics?.regression?.pass===true);
  await panels(page);
  for(const size of [{width:1280,height:720},{width:1600,height:1000}]){
    await page.setViewportSize(size);await page.waitForTimeout(350);
    const card=page.locator('#agCanonicalMissionCard');
    assert.match(await card.textContent(),/Complete Mandatory Safety Training/i);
    assert.match(await card.locator('img').getAttribute('src'),/safety-training.webp/);
    assert.equal(await card.evaluate(el=>el.scrollHeight<=el.clientHeight+1),true,'Safety card never scrolls');
    assert.equal(await card.locator('.agpc-copy').evaluate(el=>el.scrollHeight<=el.clientHeight+1),true,'Entire safety brief fits');
    const placement=await page.evaluate(()=>{const r=q=>document.querySelector(q).getBoundingClientRect().toJSON();return {footer:r('.ag-sidebar-landscape'),nav:r('.sidebar .nav'),brand:r('.sidebar .brand')};});
    assert.ok(placement.footer.top>=placement.nav.bottom-24,'Farmland stays below navigation');
    assert.ok(placement.brand.bottom<=placement.nav.top+2,'Logo stays above navigation');
  }
  assert.match(await page.locator('#agPlayerMissionProfile').textContent(),/460/);
  assert.equal(await page.locator('.ag-player-xp-track').getAttribute('aria-valuenow'),'84');
  await page.locator('.sidebar [data-ag-screen="profile"]').click();
  assert.deepEqual(await page.locator('#agCanonicalSkillProfile .agps-track').evaluateAll(els=>els.map(el=>Number(el.getAttribute('aria-valuenow')))),[16,12,0,4,0],'Three mission rewards produce five canonical skill scores');
  assert.equal(await page.locator('#agMenuPanel .agmp-stat').filter({hasText:'Missions'}).locator('b').textContent(),'3');
  await page.locator('.sidebar [data-ag-screen="dashboard"]').click();
  await page.locator('#agCanonicalMissionCard button').click();
  await page.locator('#agInteractiveMissionModal.show').waitFor();
  assert.equal(await page.evaluate(()=>window.AGWorldProgression.getState().xp),460,'Start must never award completion');
  assert.equal(await page.locator('#agInteractiveFinish').isEnabled(),false);
  await page.locator('input[name=q1][value=b]').check();await page.locator('input[name=q2][value=b]').check();await page.locator('input[name=q3][value=a]').check();
  assert.equal(await page.locator('#agInteractiveFinish').isEnabled(),false,'Wrong training answer cannot complete');
  await page.locator('input[name=q1][value=a]').check();
  assert.equal(await page.locator('#agInteractiveFinish').isEnabled(),true);
  await page.locator('.ag-interactive-close').click();
  await page.locator('#agAdvisorBay [data-advisor="system-administrator"]').click();
  await page.waitForFunction(()=>document.getElementById('agWorldGuideAudio').currentTime>0);
  assert.equal(await page.locator('#agWorldSystemGuide').getAttribute('data-playback'),'playing');
  assert.match(await page.locator('.ag-guide-copy').textContent(),/level 2.*460 XP.*3 completed missions/);
  await page.locator('.ag-guide-play').click();assert.equal(await page.locator('#agWorldSystemGuide').getAttribute('data-playback'),'paused');
  await page.locator('.ag-guide-play').click();await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='playing');
  await page.locator('#agAdvisorBay [data-advisor="sales"]').click();
  assert.equal(await page.locator('#agWorldSystemGuide').isVisible(),false,'Sales does not own the Administrator hologram');
  assert.equal(await page.locator('#agWorldGuideAudio').evaluate(el=>el.paused),true);
  await page.locator('#agAdvisorBay [data-advisor="sales"]').click();
  for(let i=0;i<2;i++){
    await page.locator('#territoryStatsToggle').click();
    await page.waitForFunction(()=>{const el=document.getElementById('territoryStatsDrawer');return Math.abs(el.getBoundingClientRect().width-parseFloat(el.style.width))<1;});
    assert.ok(await page.locator('#territoryStatsDrawer').evaluate(el=>el.getBoundingClientRect().width>200));
    await page.locator('#territoryStatsToggle').click();
    await page.waitForFunction(()=>Math.round(window.innerWidth-document.getElementById('territoryStatsDrawer').getBoundingClientRect().left)===28);
    assert.equal(await page.locator('#territoryStatsDrawer').evaluate(el=>Math.round(window.innerWidth-el.getBoundingClientRect().left)),28,'Collapsed drawer leaves only its handle');
  }
  assert.equal(await page.locator('#agEnterWorldBtn').count(),0);
  await panels(page,{player:false,map:false,command:false,territory:false});
  assert.equal(await page.locator('body').getAttribute('data-ag-immersive'),'true');
  await page.goto(new URL('/index.html',page.url()).href);
  await page.waitForFunction(()=>window.AGWorldBootDiagnostics?.regression?.pass===true);
  await panels(page);
}
