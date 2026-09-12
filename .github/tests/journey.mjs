import assert from 'node:assert/strict';
export async function exerciseJourney(page){
 const panel=page.locator('#agJourneyMission');
 async function active(id){await page.evaluate(async id=>{AGWorldJourney.close();const all=AGWorldProgression.getChapters().flatMap(c=>c.missions),index=all.findIndex(m=>m.id===id);accountTest.missions=all.slice(0,index).map(m=>({mission_id:m.id,status:'completed',completed_at:'2026-09-01',mission_state:{}}));await AGWorldProgression.reload();AGWorldJourney.start(id);},id);await panel.waitFor({state:'visible'});}
 await page.evaluate(()=>AGWorldJourney.start('c1-welcome'));
 assert.match(await panel.textContent(),/conquer the territory/);
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false);
 await panel.locator('[data-tour]').click();await panel.locator('h3').filter({hasText:'Meet your support team'}).waitFor();
 assert.match(await panel.textContent(),/Compliance.*Product.*Sales.*Operations.*Technical/s);
 await panel.locator('[data-tour]').click();await panel.locator('h3').filter({hasText:'Open your Player Hub'}).waitFor();
 assert.equal(await panel.locator('[data-tour]').isEnabled(),false);
 await page.locator('#agPlayerDrawerToggle').click();await page.locator('.sidebar [data-ag-screen=dashboard]').click();
 await panel.locator('[data-tour]').click();await panel.locator('h3').filter({hasText:'How a mission works'}).waitFor();
 assert.equal(await page.evaluate(()=>AGWorldProgression.getState().xp),0);
 await panel.locator('[data-close]').click();await page.evaluate(()=>AGWorldJourney.start('c1-welcome'));
 assert.match(await panel.locator('h3').textContent(),/How a mission works/,'Partial introduction resumes');
 await active('c1-documents');
 await panel.locator('[data-document]').setInputFiles({name:'fixture.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF fixture only')});
 await panel.getByText('Document submitted privately.',{exact:true}).waitFor();
 const uploaded=await page.evaluate(()=>accountTest.uploads.at(-1));
 assert.equal(uploaded.bucket,'agworld-player-private');assert.match(uploaded.path,/^00000000-0000-4000-8000-000000000001\/documents\//);
 await panel.locator('[data-check=documents]').check();
 await page.evaluate(()=>accountTest.completionError=true);await panel.locator('[data-finish]').click();
 await panel.getByText('Synthetic completion failure',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>!!AGWorldProgression.getState().completed['c1-documents']),false);
 assert.equal(await page.evaluate(()=>AGWorldProgression.getState().missionState['c1-documents'].documents.length),1,'Failed completion preserves uploads');
 await page.evaluate(()=>accountTest.completionError=false);await panel.locator('[data-finish]').click();await panel.waitFor({state:'hidden'});
 await page.evaluate(()=>AGWorldProgression.completeMission('c1-documents'));
 assert.equal(await page.evaluate(()=>accountTest.awards.filter(x=>x==='c1-documents').length),1);
 await active('c2-profile');
 await page.evaluate(()=>{window.cameraRestore=navigator.mediaDevices.getUserMedia;window.cameraStopped=false;navigator.mediaDevices.getUserMedia=()=>new Promise(r=>{window.cameraResolve=()=>r({getTracks:()=>[{stop(){cameraStopped=true;}}]});});});
 await panel.locator('[data-camera]').click();await page.waitForFunction(()=>!!window.cameraResolve);
 await panel.locator('[data-close]').click();await page.evaluate(()=>cameraResolve());await page.waitForFunction(()=>cameraStopped);
 assert.equal(await panel.isVisible(),false,'Late webcam permission cannot reopen the task');
 await page.evaluate(()=>navigator.mediaDevices.getUserMedia=cameraRestore);
 await active('c1-company-training');
 await panel.getByText(/administrator must approve/).waitFor();
 await page.evaluate(()=>accountTest.knowledge={approved:true,results:[{document_id:'fixture-manual',title:'Fixture source',locator:'Page 1',models:['T100'],content:'Synthetic source only. Use confirmed capacity for the client application. Check model conditions.'}]});
 await panel.locator('[data-close]').click();await page.evaluate(()=>AGWorldJourney.start('c1-company-training'));
 await panel.locator('[data-model]').selectOption('T100');await panel.locator('[data-load]').click();
 await panel.locator('.agj-slides summary').waitFor();assert.match(await panel.locator('.agj-slides').textContent(),/Fixture source/);
 await panel.locator('[data-field=benefit]').fill('Supported capacity fits the stated application.');await panel.locator('[data-field=limitation]').fill('Confirm model conditions before recommending it.');await panel.locator('[data-check=sources]').check();
 await panel.locator('[data-finish]').click();await panel.waitFor({state:'hidden'});
 assert.equal(await page.evaluate(()=>AGWorldProgression.getState().missionState['c1-company-training'].assessment),'self-attested');
 await active('c3-contractors');await panel.locator('[data-finish]').click();await panel.getByText('Complete the map action first.',{exact:true}).waitFor();
 await page.evaluate(()=>dispatchEvent(new CustomEvent('agworld:dynamic-layer-updated',{detail:{type:'contractor',id:'fixture-saved-contractor'}})));
 await panel.getByText('Map action saved. You can now complete the mission.',{exact:true}).waitFor();
 await panel.locator('[data-finish]').click();await panel.waitFor({state:'hidden'});
 // Experienced players with a heard mission briefing stay quiet on re-entry.
 await page.evaluate(async()=>{const m=AGWorldProgression.getActiveMission();await AGWorldProgression.saveMissionState(m.id,{briefed:true});AGWorldCompanions.hide();AGWorldJourney.arrive();});
 assert.equal(await page.locator('#agWorldSystemGuide').isVisible(),false);
 if(process.env.AG_TEST_ARTIFACTS){await active('c1-safety');await page.screenshot({path:process.env.AG_TEST_ARTIFACTS+'/development-v2-compliance.png'});}
 await page.evaluate(()=>AGWorldJourney.close());
}
