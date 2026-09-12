import assert from 'node:assert/strict';
import {panels} from './drawers.mjs';
export async function exerciseCompanions(page){
 await page.locator('#agWorldSystemGuide.show').waitFor();
 assert.equal(await page.locator('#agWorldSystemGuide').getAttribute('data-commander'),'portrait','Rejected procedural model stays out of production until the rigged assets are ready');
 assert.equal(await page.locator('.ag-companion-stage canvas').count(),0);
 assert.equal(await page.locator('.ag-companion-stage img').count(),1);
 await page.waitForFunction(()=>{const r=document.getElementById('agWorldSystemGuide').getBoundingClientRect();return r.right<innerWidth&&r.bottom<=innerHeight;});
 if(process.env.AG_TEST_ARTIFACTS){await page.screenshot({path:process.env.AG_TEST_ARTIFACTS+'/commander-arrival.png'});}
 await page.evaluate(()=>{
  window.speechFake={said:[],finish(){const a=document.getElementById('agWorldGuideAudio');a.pause();a.dispatchEvent(new Event('ended'));}};
  const originalFetch=window.fetch;window.fetch=(url,options)=>{if(String(url).includes('ag-world-commanders')&&JSON.parse(options?.body||'{}').action==='speak')speechFake.said.push(JSON.parse(options.body).text);return originalFetch(url,options);};
  window.AG_WORLD_GUIDE.stopBriefing();window.AG_WORLD_GUIDE.play();
 });
 await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='playing');
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false,'Arrival starts speaking with dialogue closed');
 assert.equal(await page.locator('.ag-guide-card').evaluate(e=>e.inert),true);
 await page.locator('.ag-guide-hologram').click();
 const before=await page.evaluate(()=>speechFake.said.length);
 await page.locator('.ag-guide-hologram').click();
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false);
 assert.equal(await page.locator('#agWorldSystemGuide').getAttribute('data-playback'),'playing','Hiding dialogue keeps speech running');
 await page.locator('.ag-guide-hologram').click();
 assert.equal(await page.locator('.ag-guide-card').isVisible(),true);
 assert.equal(await page.evaluate(()=>speechFake.said.length),before,'Showing dialogue does not restart the sentence');
 await page.locator('.ag-guide-play').click();assert.equal(await page.locator('#agWorldSystemGuide').getAttribute('data-playback'),'paused');
 await page.locator('.ag-guide-play').click();await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='playing');
 await page.evaluate(()=>speechFake.finish());
 await page.locator('.ag-guide-hologram').click();
 for(const [selector,next]of [['#agPlayerDrawerToggle','Your Dashboard'],['.sidebar [data-ag-screen=dashboard]','Map controls'],['#agMapDrawerToggle','Territory intelligence'],['#territoryStatsToggle','The Command Center'],['#agCommandDrawerToggle','Ready to take command.']]){
  await page.locator(selector).click();await page.waitForFunction(title=>document.querySelector('.ag-guide-title').textContent.includes(title),next);
  assert.equal(await page.locator('.ag-guide-card').isVisible(),false,'Tour speech preserves closed dialogue');
  assert.equal(await page.locator('#agWorldSystemGuide').isVisible(),true,'Guide stays with the player while discovering panels');
  await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='playing');await page.evaluate(()=>speechFake.finish());
 }
 await panels(page,{player:false,map:false,command:false,territory:false});
 await page.evaluate(()=>{AGWorldCompanions.show('system-administrator',{speak:false,compact:false,walk:false});window.voiceStarts=0;window.SpeechRecognition=class{start(){voiceStarts++;this.onresult({results:[[{transcript:'Where are the map layers?'}]]});this.onend();}abort(){}stop(){this.onend();}};});
 assert.equal(await page.evaluate(()=>voiceStarts),0,'Microphone is not started on arrival');
 await page.locator('.ag-guide-mic').click();
 await page.locator('.ag-companion-status').filter({hasText:'Game guide'}).waitFor();
 assert.match(await page.locator('.ag-guide-copy').textContent(),/MAP MENU/);
 assert.equal(await page.evaluate(()=>voiceStarts),1);
 // A permission prompt may resolve after the advisor is dismissed.
 await page.route('**/functions/v1/ag-world-commanders',route=>route.request().postDataJSON().action==='status'?route.fulfill({status:200,contentType:'application/json',body:'{"configured":true}'}):route.fallback());
 await page.evaluate(()=>{
  window.restoreMic={recognition:window.SpeechRecognition,webkit:window.webkitSpeechRecognition,get:navigator.mediaDevices.getUserMedia};
  window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;window.stoppedLateTrack=false;
  navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.resolveLateMic=()=>resolve({getTracks:()=>[{stop(){stoppedLateTrack=true;}}]});});
 });
 await page.locator('.ag-guide-mic').click();await page.waitForFunction(()=>!!window.resolveLateMic);
 await page.locator('.ag-guide-close').click();await page.evaluate(()=>resolveLateMic());
 await page.waitForFunction(()=>window.stoppedLateTrack);
 assert.equal(await page.locator('#agWorldSystemGuide').isVisible(),false,'Late microphone permission cannot revive a dismissed advisor');
 await page.evaluate(()=>{window.SpeechRecognition=restoreMic.recognition;window.webkitSpeechRecognition=restoreMic.webkit;navigator.mediaDevices.getUserMedia=restoreMic.get;});
 await page.unroute('**/functions/v1/ag-world-commanders');
 await page.evaluate(()=>{accountTest.knowledge={approved:true,calls:[],results:[{title:'Synthetic T100 manual',locator:'Page 7',content:'The synthetic model has a test capacity of 100 units.',source_reference:'test-only'}]};AGWorldCompanions.show('product',{speak:false,compact:false,walk:false});});
 await page.locator('#agCommanderQuestion').fill('T100 capacity');await page.locator('.ag-companion-send').click();
 await page.locator('.ag-guide-sources summary').waitFor();assert.match(await page.locator('.ag-guide-copy').textContent(),/Synthetic T100/);
 assert.equal(await page.evaluate(()=>accountTest.knowledge.calls.at(-1).args.p_collection),'product');
 await page.locator('#agCommanderQuestion').fill('and the battery?');await page.locator('.ag-companion-send').click();await page.locator('.ag-companion-status').filter({hasText:'Source extract'}).waitFor();
 assert.match(await page.evaluate(()=>accountTest.knowledge.calls.at(-1).args.p_query),/T100.*battery/,'Follow-up keeps the product context');
 await page.evaluate(()=>{accountTest.knowledge.approved=false;AGWorldCompanions.show('technical',{speak:false,compact:false,walk:false});});
 await page.locator('#agCommanderQuestion').fill('T100 fault');await page.locator('.ag-companion-send').click();await page.locator('.ag-guide-copy').filter({hasText:'approved company staff'}).waitFor();
 assert.equal(await page.locator('.ag-guide-sources details').count(),0,'Technical access denial clears Product evidence');
 await page.evaluate(()=>{
  AGWorldCompanions.show('system-administrator',{speak:false});
  window.realMediaPlay=HTMLMediaElement.prototype.play;let block=true;
  HTMLMediaElement.prototype.play=function(){if(block){block=false;return Promise.reject(new DOMException('Synthetic autoplay restriction','NotAllowedError'));}return realMediaPlay.call(this);};
  AG_WORLD_GUIDE.play();
 });
 await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='blocked');
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false);
 const generatedBeforeRetry=await page.evaluate(()=>speechFake.said.length);
 await page.locator('.ag-companion-audio').filter({hasText:'ENABLE VOICE'}).click();
 await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='playing');
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false,'Enabling audio does not open dialogue');
 assert.equal(await page.evaluate(()=>speechFake.said.length),generatedBeforeRetry,'Autoplay retry reuses downloaded audio');
 await page.evaluate(()=>{HTMLMediaElement.prototype.play=realMediaPlay;AG_WORLD_GUIDE.stopBriefing();});
 await page.route('**/functions/v1/ag-world-commanders',route=>route.request().postDataJSON().action==='speak'?route.fulfill({status:502,contentType:'application/json',body:'{"message":"OpenAI API credits or billing need attention."}'}):route.fallback());
 await page.evaluate(()=>AGWorldCompanions.show('operations'));
 await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='error');
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false,'Service failures never open dialogue automatically');
 assert.match(await page.locator('.ag-companion-audio').getAttribute('title'),/credits or billing/);
 await page.unroute('**/functions/v1/ag-world-commanders');
 await page.locator('.ag-companion-audio').click();
 await page.waitForFunction(()=>document.getElementById('agWorldSystemGuide').dataset.playback==='playing');
 assert.equal(await page.locator('.ag-guide-card').isVisible(),false,'Retry after funding keeps dialogue closed');
 await page.evaluate(()=>{AGWorldCompanions.hide();accountTest.knowledge={approved:true,calls:[]};});
}
