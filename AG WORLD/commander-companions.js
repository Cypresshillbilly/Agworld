/* Animated companions share the existing briefing voice and staff source library. */
(()=>{
 'use strict';
 const skin=document.querySelector('link[href^="immersive-map-controls.css"]');if(skin)document.head.append(skin);
 const names={'system-administrator':'System Administrator',product:'Product Commander',technical:'Technical Commander',sales:'Sales Commander',compliance:'Compliance Commander',operations:'Operations Commander'};
 const intros={product:'Let’s find the right tool. Ask me about a model, its specifications or applications. I’ll search your approved product sources.',technical:'Let’s work through it carefully. Tell me the exact model and fault or error message. I’ll search your approved service and troubleshooting sources.',sales:'Let’s grow your territory. Your sales funnel tracks recorded leads, opportunities and sales. Open Sales Funnel for your next move.',compliance:'Good decisions start with good information. Review your assigned training before a mission. Your Profile shows your compliance progress.',operations:'Let’s make your next move count. Inspect farms, contractors and facilities on the map, then open the Command Center for their details.'};
 const topics=[
  ['dashboard player hub menu panels','Open MENU at the left edge, then Dashboard. It shows your progress, sales funnel, current mission and six advisors. Select a menu item to open its complete workspace.'],
  ['profile skills badges level xp experience','Open MENU → Profile for your five skills, badges and mission milestones. Completed missions update your saved XP and skills. The System Administrator is your guide, not a sixth skill.'],
  ['sales funnel pipeline leads opportunities revenue','Open MENU → Sales Funnel. The figures come from recorded leads, opportunities and sales for your player. The Dashboard contains a compact view of the same activity.'],
  ['map layers settings hide show satellite terrain elevation relief icons farms contractors','Open MAP MENU at the top. Layers controls territory boundaries, symbols, market colours, businesses and farm assets. Visibility also follows zoom: farms and contractors appear together at farm level. Your layer choices remain active as you explore. Settings & info → Elevation Relief adds shaded terrain; Satellite restores imagery.'],
  ['sadc countries country africa provinces province municipalities municipality zoom','The board starts with the 16 SADC countries. Click a country or its symbol to select its statistics and reveal provinces. Click a South African province to select its statistics and reveal municipalities. Click a municipality for its totals. Zooming alone preserves the selected statistics.'],
  ['territory stats control percentage market influence colours color','Open TERRITORY STATS on the right. Control uses recorded farms and contractors in the selected area, weighted by drone quantities and recorded business relationships or status. It represents the recorded market, not a census of all farms. Green shows Company influence; red shows competitors.'],
  ['command center centre inspect entity details','Open COMMAND CENTER at the bottom. Select a farm, contractor or other supported entity on the map to inspect its details and connected business information.'],
  ['create farm contractor competitor facility import export','Open MAP MENU → Actions. Choose Create Farm, Contractor, Competitor or Company Facility and complete its form. Farm creation includes drawing a boundary. Import and export are in the same section.'],
  ['advisor commander product technical question voice microphone talk','Use the AgWorld icon at the top-right, or the Dashboard advisory bay. Click a character to show or hide its dialogue without stopping its speech. Ask by voice starts your microphone; you can also type. Product and Technical search their approved staff libraries.'],
  ['developer diagnostic diagnostics errors troubleshooting system','Open MAP MENU → Settings & info → Developer Mode for component diagnostics. Note the exact error and the action that triggered it when reporting a problem.'],
  ['access approved staff library permission repair documents','A company administrator must approve access to each staff library. Signing in or changing your profile role does not grant access to dealer-only source documents.'],
  ['sound mute stop pause speaking audio','Use Pause or Stop voice in the character dialogue. Clicking the character only shows or hides that dialogue. Turn off Speak on arrival to disable the automatic welcome. Browser audio permissions may require a click on Speak.']
 ];
 const steps=[
  ['Your Player Hub','First, open MENU at the middle of the left edge. Your navigation opens while keeping the map in view.','#agPlayerDrawerToggle',()=>drawers().player],
  ['Your Dashboard','Choose Dashboard in the left menu. Here are your player progress, sales activity, next mission and advisory bay. Profile contains your complete skills and badges.','.sidebar [data-ag-screen=dashboard]',()=>drawers().workspace&&document.querySelector('.missions')?.dataset.agScreen==='dashboard'],
  ['Map controls','Open MAP MENU on the top edge. Layers controls what you see; Actions contains creation tools; Settings & info contains region views and diagnostics.','#agMapDrawerToggle',()=>drawers().map],
  ['Territory intelligence','Open TERRITORY STATS on the right edge. It begins with SADC. Country and province clicks change these statistics and move into the next map level.','#territoryStatsToggle',()=>drawers().territory],
  ['The Command Center','Open COMMAND CENTER at the bottom. Inspect entities on the map to see their details here. Close the drawers whenever you want more space to explore.','#agCommandDrawerToggle',()=>drawers().command]
 ];
 const $=id=>document.getElementById(id),state=()=>window.AGWorldProgression?.getState?.()||{},drawers=()=>window.AGWorldDrawers?.getState()||{},client=()=>window.__AGWORLD_SUPABASE_DB__||window.AGWorldBackend?.getClient?.();
 let wander=0,micGeneration=0,pendingMic=false,lastVoiceError='';
 let root,guide,originalHide,originalWelcome,avatar,active='system-administrator',visible=false,tour=-1,sequence=0,recognition,stream,recorder,micTimer,walkTimer,arrived=false,history=[],modelContext='',advance=false,stopCapture=false;
 const q=s=>root.querySelector(s);
 function welcome(){const s=state(),name=s.playerName||window.AGWorldPlayer?.display_name||'Commander';return 'Welcome back, '+name.split(' ')[0]+'. I’m your System Administrator. You’re level '+Math.max(1,Number(s.level)||1)+' with '+Number(s.xp||0).toLocaleString()+' XP and '+Object.values(s.completed||{}).filter(Boolean).length+' completed missions. Let’s discover your command panels together. Open MENU on the left when you’re ready, or ask me a question.';}
 function status(text){q('.ag-companion-status').textContent=text;}
 function toggleDialogue(open){root.classList.toggle('avatar-only',!open);q('.ag-guide-hologram').setAttribute('aria-expanded',String(open));q('.ag-guide-card').inert=!open;}
 function tell(title,text,speak=true,sources=[]){guide.setBriefing({title,copy:text,show:false});root.classList.add('show');root.setAttribute('aria-label',names[active]);q('.ag-guide-eyebrow').textContent=names[active].toUpperCase();q('.ag-guide-step-label').textContent='AGWORLD · YOUR '+names[active].toUpperCase();q('.ag-guide-sources').replaceChildren();for(const [i,s]of sources.entries()){const d=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent='['+(i+1)+'] '+s.title+' · '+s.locator;p.textContent=s.content;d.append(summary,p);q('.ag-guide-sources').append(d);}place();if(speak)guide.play();}
 function place(walk=false){if(!root||!visible)return;const g=window.AGWorldDrawers?.geometry(),left=g?.leftStage||0,w=innerWidth-left;
  const x=Math.min(innerWidth-198,Math.max(left+30,left+(w-(drawers().territory?300:0)-530)*.17+wander)),floor=drawers().command?Math.min(innerHeight-260,(g?.commandTop||innerHeight)-10):innerHeight-44;
  root.style.setProperty('--ag-companion-x',Math.round(x)+'px');root.style.setProperty('left',Math.round(x)+'px','important');root.style.setProperty('top',Math.max(70,Math.round(floor-244))+'px','important');root.style.setProperty('max-width',Math.max(180,innerWidth-x-18)+'px','important');root.classList.toggle('ag-dialogue-above',innerWidth-x<530);
  if(walk&&avatar){root.classList.add('ag-walking');avatar?.setMode('walk');clearTimeout(walkTimer);walkTimer=setTimeout(()=>{root.classList.remove('ag-walking');pose();},2300);}
 }
 function pose(){avatar?.setVisible(visible);avatar?.setMode(root.classList.contains('ag-walking')?'walk':root.dataset.playback==='playing'?'talk':'idle');}
 function voiceStatus(){
  const button=q('.ag-companion-audio'),phase=root.dataset.playback;if(!button)return;
  button.hidden=!['loading','paused','blocked','error'].includes(phase);button.disabled=phase==='loading';
  button.textContent=({loading:'PREPARING VOICE…',paused:'▶ RESUME VOICE',blocked:'▶ ENABLE VOICE',error:'VOICE UNAVAILABLE · RETRY'})[phase]||'';
  button.title=root.dataset.voiceError||'';
  if(phase==='blocked'||phase==='error'){lastVoiceError=root.dataset.voiceError||'The character voice is unavailable. Please try again.';status(lastVoiceError);}
  else if(lastVoiceError){if(q('.ag-companion-status').textContent===lastVoiceError)status('');lastVoiceError='';}
 }
 function clearHighlight(){document.querySelectorAll('.ag-tour-target').forEach(e=>e.classList.remove('ag-tour-target'));}
 function highlight(){clearHighlight();if(tour>=0)document.querySelector(steps[tour]?.[2])?.classList.add('ag-tour-target');}
 function endTour(){tour=-1;advance=false;clearHighlight();q('.ag-tour-progress').textContent='';q('.ag-tour-skip').hidden=true;}
 function step(n){if(n>=steps.length){endTour();tell('Ready to take command.','You’ve explored the main panels. Close them for an immersive map, or ask me where to go next.');return;}tour=n;tell(steps[n][0],steps[n][1]);q('.ag-tour-progress').textContent='DISCOVERY '+(n+1)+' / '+steps.length+' · Open the highlighted panel';q('.ag-tour-skip').hidden=false;highlight();}
 function checkTour(){if(!visible||tour<0||advance)return;highlight();if(steps[tour][3]()&&!['playing','loading','paused','blocked'].includes(root.dataset.playback)){advance=true;setTimeout(()=>{advance=false;if(tour>=0)step(tour+1);},400);}}
 function stopListening(discard=true){if(discard)micGeneration++;pendingMic=false;clearTimeout(micTimer);stopCapture=discard;if(recognition){const r=recognition;recognition=null;r.abort();}if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());stream=null;if(root){q('.ag-guide-mic').textContent='● ASK BY VOICE';q('.ag-guide-mic').setAttribute('aria-pressed','false');}}
 function hide(){if(!root)return;sequence++;stopListening();endTour();visible=false;originalHide();avatar?.setVisible(false);q('.ag-companion-send').disabled=false;}
 function show(id='system-administrator',{speak=true,compact=true,walk=true,title='',copy=''}={}){ensure();if(!names[id])return;sequence++;stopListening();endTour();guide.stopBriefing();const changed=id!==active||!avatar;active=id;visible=true;wander=0;history=[];modelContext='';q('.ag-companion-send').disabled=false;
  if(changed){avatar?.dispose();avatar=null;root.dataset.commander='portrait';const img=document.createElement('img');img.src=id==='system-administrator'?'assets/advisors/system-administrator.webp':'assets/advisors/agworld_'+id+'_commander_round(1).png';img.alt=names[id];q('.ag-companion-stage').replaceChildren(img);}
  root.dataset.advisor=id;q('.ag-companion-name').textContent=names[id];q('.ag-guide-question label').textContent='ASK '+names[id].toUpperCase();q('.ag-guide-library').hidden=!['product','technical'].includes(id);q('.ag-guide-tour').hidden=id!=='system-administrator';
  tell(title||names[id],copy||(id==='system-administrator'?welcome():intros[id]),speak);toggleDialogue(!compact);status('');pose();
  if(walk&&avatar){root.classList.add('ag-entering');root.style.setProperty('left',(innerWidth+10)+'px','important');requestAnimationFrame(()=>requestAnimationFrame(()=>{root.classList.remove('ag-entering');place(true);}));}else place();
 }
 async function service(payload){const session=await client()?.auth?.getSession?.(),token=session?.data?.session?.access_token;if(!token)throw Error('Sign in again to connect your commander.');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),payload.action==='speak'?45000:30000);try{const r=await fetch('https://vcnkspaljmsjvonftfcw.supabase.co/functions/v1/ag-world-commanders',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload),signal:controller.signal});const data=await r.json();if(!r.ok)throw Error(data.message||'The conversation service is unavailable.');return data;}finally{clearTimeout(timer);}}
 const voiceCache=new Map();
 async function speakBriefing(text,token){
  const id=active,spoken=String(text).replace(/\[\d+\]/g,'').slice(0,2400),key=id+':'+spoken;
  try{let pending=voiceCache.get(key);if(!pending){pending=service({action:'speak',commander:id,text:spoken});voiceCache.set(key,pending);while(voiceCache.size>8)voiceCache.delete(voiceCache.keys().next().value);}
   const result=await pending;if(!result.audio)throw Error('No character audio');if(window.AGWorldVoiceBridge.isCurrent(token)&&id===active)window.AGWorldVoiceBridge.load('data:audio/mpeg;base64,'+result.audio,token);
  }catch(error){voiceCache.delete(key);if(window.AGWorldVoiceBridge.isCurrent(token)){window.AGWorldVoiceBridge.error(token,error.message);status(error.message||'CHARACTER VOICE UNAVAILABLE — CLICK SPEAK TO RETRY');}}
 }
 function localAnswer(question){const s=state();if(/\b(my|next|current)\b.*\b(mission|assignment)\b|what.*mission/i.test(question)){const c=window.AGWorldProgression?.getChapters?.().find(c=>Number(c.id)===Number(s.currentChapter||1)),m=c?.missions?.find(m=>!s.completed?.[m.id]);return m?'Your next mission is '+m.title+'. '+m.objective+' Open MENU → Missions to begin.':'Open MENU → Missions to review your saved mission record.';}if(/\b(my|am i)\b.*\b(level|xp|progress)|what level/i.test(question))return welcome();const words=question.toLowerCase().match(/[a-z]+/g)||[],ranked=topics.map(([keys,answer])=>({answer,score:words.reduce((n,w)=>n+(w.length>2&&keys.split(' ').includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score);return ranked[0]?.score?ranked[0].answer:'I couldn’t find a reliable answer in the game guide. Ask about a panel, map layers, missions or territory control. Product and Technical can search their approved source libraries.';}
 async function ask(question){ensure();question=String(question||'').trim().slice(0,500);if(question.length<2)return;endTour();guide.stopBriefing();stopListening();toggleDialogue(true);const token=++sequence,id=active;q('.ag-companion-send').disabled=true;status('SEARCHING…');q('#agCommanderQuestion').value=question;
  try{let answer,sources=[],mode='Game guide',serviceIssue='';
   if(['product','technical'].includes(id)){const db=client(),catalog=await db?.rpc('ag_knowledge_catalog',{p_collection:id});if(catalog?.error)throw Error('The staff library could not connect. Please try again.');if(!catalog?.data?.approved)throw Error('This library is available to approved company staff. Ask your company administrator for access.');const model=question.match(/\b(?:T\s?\d{2,3}|Matrice\s?\d+|Mavic\s?\d+)\b/i)?.[0];if(model)modelContext=model;const result=await db.rpc('ag_knowledge_search',{p_collection:id,p_query:model?question:modelContext+' '+question,p_model:'',p_limit:5});if(result.error)throw Error('The library search could not complete.');sources=result.data||[];answer=sources.length?'I found this in '+sources[0].title+', '+sources[0].locator+': '+sources[0].content.slice(0,1300)+(sources[0].content.length>1300?'… Open the source below for the complete passage.':''):'I couldn’t find a matching source. Please include the exact model and feature, part or error message. I won’t guess a specification or repair instruction.';mode=sources.length?'Source extract':'No matching source';
   }else answer=localAnswer(question);
   try{const result=await service({action:'chat',commander:id,question,history:history.slice(-4),searchContext:modelContext,context:{level:state().level,xp:state().xp,currentMission:(window.AGWorldProgression?.getActiveMission?.()?.title||'')+' · '+(window.AGWorldProgression?.getActiveMission?.()?.owner||''),selected:window.AGWorldTerritoryBoard?.getSelection()?.name}});if(result.answer){answer=result.answer;sources=result.sources||[];mode='AI answer · source references';}}catch(error){serviceIssue=error.message;}
   if(token!==sequence||!visible)return;window.dispatchEvent(new CustomEvent('agworld:commander-question',{detail:{owner:id}}));history.push({role:'user',content:question},{role:'assistant',content:answer});history=history.slice(-6);tell('You asked: '+question,answer,true,sources);status(mode+(serviceIssue?' · '+serviceIssue:''));
  }catch(error){if(token===sequence&&visible){tell('Let’s resolve that.',error.message);status('QUESTION NOT ANSWERED');}}
  finally{if(token===sequence)q('.ag-companion-send').disabled=false;}
 }
 async function recordQuestion(generation){
  pendingMic=true;status('CONNECTING MICROPHONE…');
  const current=()=>generation===micGeneration&&visible;
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('VOICE RECORDING UNAVAILABLE — TYPE BELOW');
   const available=await service({action:'status'});if(!current())return;
   if(!available.configured)throw Error('Voice recording needs the conversation service connected. Type below.');
   const capture=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!current()){capture.getTracks().forEach(t=>t.stop());return;}
   stream=capture;pendingMic=false;const chunks=[];recorder=new MediaRecorder(capture);const recording=recorder;
   recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recording.onstop=async()=>{capture.getTracks().forEach(t=>t.stop());if(stream===capture)stream=null;if(stopCapture||!current())return;
    try{status('TRANSCRIBING…');const blob=new Blob(chunks,{type:recording.mimeType});if(blob.size>5000000)throw Error('Please record a shorter question.');if(!blob.size)throw Error('No speech recorded. Please try again.');
     const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
     const result=await service({action:'transcribe',audio:btoa(binary),mime:blob.type});if(current()){if(result.text?.trim())ask(result.text);else status('NO SPEECH HEARD — PLEASE TRY AGAIN');}
    }catch(e){if(current())status(e.message);}
   };
   recording.start();status('LISTENING — ASK YOUR QUESTION');micTimer=setTimeout(()=>stopListening(false),20000);
  }catch(error){if(current()){stopListening();status(error.name==='NotAllowedError'?'MICROPHONE PERMISSION NEEDED — OR TYPE BELOW':error.message);}}
 }
 async function listen(){
  if(pendingMic){stopListening();status('RECORDING CANCELLED');return;}
  if(recognition||recorder?.state==='recording'){if(recognition)recognition.stop();else stopListening(false);return;}
  guide.stopBriefing();endTour();toggleDialogue(true);stopCapture=false;const generation=++micGeneration;
  q('.ag-guide-mic').textContent='■ FINISH QUESTION';q('.ag-guide-mic').setAttribute('aria-pressed','true');status('LISTENING — ASK YOUR QUESTION');
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){await recordQuestion(generation);return;}
  const r=new Recognition();recognition=r;r.lang='en-ZA';r.interimResults=true;r.continuous=false;let transcript='',failed=false;
  r.onresult=e=>{if(recognition!==r)return;transcript=Array.from(e.results).map(x=>x[0].transcript).join(' ');q('#agCommanderQuestion').value=transcript;};
  r.onerror=e=>{if(recognition!==r)return;failed=true;if(e.error==='network'||e.error==='service-not-allowed'){recognition=null;clearTimeout(micTimer);r.abort();recordQuestion(generation);}else status(e.error==='not-allowed'?'MICROPHONE PERMISSION NEEDED — OR TYPE BELOW':'NO SPEECH HEARD — PLEASE TRY AGAIN');};
  r.onend=()=>{if(recognition!==r)return;recognition=null;clearTimeout(micTimer);q('.ag-guide-mic').textContent='● ASK BY VOICE';q('.ag-guide-mic').setAttribute('aria-pressed','false');if(transcript.trim())ask(transcript);else if(!failed)status('NO SPEECH HEARD — PLEASE TRY AGAIN');};
  try{r.start();if(recognition===r)micTimer=setTimeout(()=>r.stop(),20000);}catch(_){stopListening();status('VOICE UNAVAILABLE — TYPE YOUR QUESTION');}
 }
 function ensure(){if(root)return;root=$('agWorldSystemGuide');if(!root)throw Error('Briefing surface unavailable');guide=window.AG_WORLD_GUIDE;originalHide=guide.hide;originalWelcome=guide.welcome;
  q('.ag-guide-hologram').innerHTML='<span class="ag-companion-stage"></span><span class="ag-companion-name"></span>';q('.ag-guide-hologram').setAttribute('aria-label','Toggle commander dialogue');q('.ag-guide-nav').hidden=true;
  const voiceButton=document.createElement('button');voiceButton.type='button';voiceButton.className='ag-companion-audio';voiceButton.hidden=true;voiceButton.onclick=()=>guide.play();root.append(voiceButton);
  const body=q('.ag-guide-body');const extra=document.createElement('div');extra.className='ag-companion-conversation';extra.innerHTML='<div class="ag-guide-sources"></div><div class="ag-tour-progress"></div><button type="button" class="ag-tour-skip" hidden>SKIP TOUR</button><form class="ag-guide-question"><label for="agCommanderQuestion">ASK YOUR COMMANDER</label><div><input id="agCommanderQuestion" maxlength="500" placeholder="Ask a question…" autocomplete="off"><button class="ag-companion-send" type="submit">SEND</button></div><button type="button" class="ag-guide-mic" aria-pressed="false">● ASK BY VOICE</button></form><p class="ag-companion-status" role="status" aria-live="polite"></p><div class="ag-companion-options"><button type="button" class="ag-guide-library">SOURCE LIBRARY</button><button type="button" class="ag-guide-tour">RESTART TOUR</button><label><input type="checkbox" class="ag-guide-arrival" checked> Speak on arrival</label></div><small>Expressive AI-generated voice. The microphone starts only when you ask; your browser may process speech online.</small>';
  body.append(extra);const stop=document.createElement('button');stop.type='button';stop.textContent='STOP VOICE';stop.onclick=()=>guide.stopBriefing();q('.ag-guide-controls').append(stop);
  document.getElementById('agWorldGuideAudio')?.addEventListener('ended',()=>{if(visible)window.dispatchEvent(new CustomEvent('agworld:commander-briefing-ended',{detail:{owner:active}}));});
  q('.ag-guide-hologram').onclick=()=>toggleDialogue(root.classList.contains('avatar-only'));q('.ag-guide-minimise').textContent='HIDE DIALOGUE';q('.ag-guide-minimise').onclick=()=>toggleDialogue(false);q('.ag-guide-close').onclick=hide;
  q('.ag-guide-question').onsubmit=e=>{e.preventDefault();ask(q('#agCommanderQuestion').value);};q('.ag-guide-mic').onclick=listen;q('.ag-guide-library').onclick=()=>window.AGWorldKnowledge?.open(active);q('.ag-guide-tour').onclick=()=>{show('system-administrator',{speak:false});step(0);};q('.ag-tour-skip').onclick=()=>{guide.stopBriefing();endTour();};
  try{q('.ag-guide-arrival').checked=localStorage.getItem('agworld.commander.arrival')!=='off';}catch(_){}q('.ag-guide-arrival').onchange=e=>{try{localStorage.setItem('agworld.commander.arrival',e.target.checked?'on':'off');}catch(_){}};
  new MutationObserver(()=>{pose();voiceStatus();checkTour();}).observe(root,{attributes:true,attributeFilter:['data-playback']});
  toggleDialogue(false);voiceStatus();
  guide.hide=hide;guide.welcome=({speak=false}={})=>show('system-administrator',{speak});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleDialogue(false);q('.ag-guide-hologram').focus();}});
 }
 window.AGWorldCompanions={show,hide,ask,speakBriefing,brief:(id,options)=>show(id,options),arrivalEnabled:()=>{ensure();return q('.ag-guide-arrival').checked;},tourActive:()=>tour>=0,getState:()=>({active,visible,tour,dialogue:!!root&&!root.classList.contains('avatar-only'),playback:root?.dataset.playback}),startTour:()=>{show('system-administrator',{speak:false});step(0);}};
 addEventListener('agworld:advisor-selected',e=>{if(names[e.detail?.id]&&e.detail.id!=='system-administrator')show(e.detail.id);});
 addEventListener('agworld:advisor-deselected',hide);
 // The persisted player journey chooses the arriving commander.
 for(const event of ['resize','agworld:drawers-changed','agworld:panel-changed'])addEventListener(event,()=>{if(visible){place();checkTour();}});
 setInterval(()=>{if(avatar&&visible&&!document.hidden&&tour<0&&root.classList.contains('avatar-only')&&innerWidth>700&&!matchMedia('(prefers-reduced-motion: reduce)').matches){wander=wander?0:85;place(true);}},18000);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){guide?.stopBriefing();stopListening();}});
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ensure,{once:true}):ensure();
})();
