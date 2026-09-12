import assert from 'node:assert/strict';

export async function exercisePlayerMenu(page){
  const nav=page.locator('.sidebar .nav');
  const choose=key=>nav.locator('[data-ag-screen="'+key+'"]').click();
  const active=()=>nav.locator('[aria-current="page"]').getAttribute('data-ag-screen');
  assert.equal(await nav.locator('button').first().getAttribute('data-ag-screen'),'dashboard');
  assert.equal(await active(),'dashboard');
  await page.evaluate(()=>{
    window.savedDashboard=['agPlayerMissionProfile','agPlayerProgressionStack','agAdvisorBay'].map(id=>document.getElementById(id));
    window.savedWorkspace=document.querySelector('.missions').getBoundingClientRect().toJSON();
  });
  await choose('profile');
  await page.getByRole('heading',{name:'Player Profile',exact:true}).waitFor();
  assert.equal(await active(),'profile');
  assert.equal(await page.locator('#agMenuPanel [data-badge]').count(),6);
  assert.equal(await page.locator('#agMenuPanel [data-badge].earned').count(),0);
  assert.equal(await page.locator('#agPlayerMissionProfile').getAttribute('aria-hidden'),'true');
  assert.equal(await page.locator('#agUserProfileModal').evaluate(el=>el.classList.contains('open')),false);
  // Actual account hydration must not wipe the selected screen or Dashboard nodes.
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('gamechanger:authenticated')));
  await page.waitForTimeout(500);
  assert.equal(await active(),'profile');
  assert.equal(await page.locator('#agMenuPanel').isVisible(),true);

  const routes={pipeline:'Sales Funnel',clients:'Client List',products:'Sales Products','after-sales':'After Sales','mission-history':'Missions','ai-assistant':'AI Assistant','territory-campaigns':'Territory Campaigns','territory-graphics':'Territory Graphics',settings:'Settings'};
  for(const [key,title]of Object.entries(routes)){
    await choose(key);
    assert.equal(await active(),key);
    assert.equal(await page.locator('#agMenuPanel h1').textContent(),title);
    assert.equal(await page.locator('#agMenuPanel .agmp-content').evaluate(el=>el.children.length>0),true);
    assert.equal(await page.locator('#agMissionHub').evaluate(el=>el.classList.contains('show')),false);
    assert.equal(await page.locator('#agUserProfileModal').evaluate(el=>el.classList.contains('open')),false);
  }
  await choose('profile');
  await page.evaluate(()=>{
    window.originalMenuState=window.AGWorldProgression.getState;
    window.AGWorldProgression.getState=()=>({...window.originalMenuState(),playerName:'Fixture <b>Commander</b>',xp:120,level:1,currentChapter:1,completed:{'c1-welcome':true}});
    window.dispatchEvent(new CustomEvent('agworld:player-state'));
  });
  await page.locator('#agMenuPanel [data-badge="c1-welcome"].earned').waitFor();
  assert.equal(await page.locator('#agMenuPanel [data-badge].earned').count(),1);
  assert.equal(await page.locator('#agMenuPanel .agmp-hero h2').textContent(),'Fixture <b>Commander</b>');
  assert.equal(await page.locator('#agMenuPanel .agmp-hero h2 b').count(),0,'Player text must not become HTML');
  assert.equal(await page.getByRole('progressbar',{name:'Progress to next level',exact:true}).getAttribute('aria-valuenow'),'48');
  assert.equal(await page.getByRole('progressbar',{name:'Company Knowledge',exact:true}).getAttribute('aria-valuenow'),'50');
  await page.evaluate(()=>{window.AGWorldProgression.getState=window.originalMenuState;window.dispatchEvent(new CustomEvent('agworld:player-state'));});

  // Exercise each menu using a keyboard and preserve the original Dashboard.
  await nav.locator('[data-ag-screen="dashboard"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await active(),'dashboard');
  assert.equal(await page.locator('#agMenuPanel').isVisible(),false);
  const preserved=await page.evaluate(()=>({
    nodes:window.savedDashboard.every(el=>el.isConnected&&el===document.getElementById(el.id)),
    bounds:document.querySelector('.missions').getBoundingClientRect().toJSON(),
    before:window.savedWorkspace,
    cardCount:document.querySelectorAll('#agCanonicalMissionCard').length
  }));
  assert.equal(preserved.nodes,true);assert.equal(preserved.cardCount,1);assert.deepEqual(preserved.bounds,preserved.before);

  for(const width of [1280,1600]){
    await page.setViewportSize({width,height:900});
    await choose('profile');
    const fit=await page.locator('#agMenuPanel').evaluate(el=>{
      const body=el.querySelector('.agmp-content'),badge=el.querySelector('.agmp-badge'),p=el.getBoundingClientRect(),m=el.parentElement.getBoundingClientRect();
      return {inside:p.x>=m.x-1&&p.right<=m.right+1,overflow:body.scrollWidth-body.clientWidth,scrolls:body.scrollHeight>body.clientHeight,badgeHeight:badge.getBoundingClientRect().height};
    });
    assert.equal(fit.inside,true);assert.ok(fit.overflow<=2);assert.equal(fit.scrolls,true);assert.ok(fit.badgeHeight<220,'Badges must not inherit stretched mission-card sizing');
  }
  await page.setViewportSize({width:1600,height:1000});await choose('dashboard');
}
