/* Player-aware administrator. The five skill advisors do not own this guide. */
(()=>{
 'use strict';
 const ID='agWorldSystemGuide',SECTIONS=['welcome','player','mission','game'];
 const WELCOME="Welcome to AgWorld. I'm your System Administrator, your guide to the game. Your dashboard brings together your progress, sales activity and next mission. Open your profile to explore your skills and badges. Use the Command Center to investigate the Company and the places you select on the map. Your five specialist advisors are here to help you grow. When you're ready, start your next mission. Let's build your territory, one step at a time.";
 let root,audio,section='welcome',speech=null,sequence=0,custom=null;
 const state=()=>window.AGWorldProgression?.getState?.()||{};
 function nextMission(){const s=state(),ch=window.AGWorldProgression?.getChapters?.().find(c=>Number(c.id)===Number(s.currentChapter||1));return ch?.missions?.find(m=>!s.completed?.[m.id]);}
 function briefing(key){
   const s=state(),player=window.AGWorldPlayer||{},name=s.playerName||player.display_name||'Commander',level=Math.max(1,Number(s.playerName?s.level:player.level)||1),xp=Math.max(0,Number(s.playerName?s.xp:player.xp)||0),completed=Object.values(s.completed||{}).filter(Boolean).length,m=nextMission();
   const library={
     welcome:{title:'Welcome back, '+name.split(' ')[0]+'.',copy:'I’m your System Administrator. You’re level '+level+' with '+xp.toLocaleString()+' XP and '+completed+' completed mission'+(completed===1?'':'s')+'. '+(m?'Your next assignment is '+m.title+'. ':'Your chapter record is up to date. ')+'I’ll help you find your way around AgWorld.',audio:'assets/audio/system-administrator-welcome.mp3',spoken:WELCOME},
     player:{title:'Your player command point.',copy:'Your Dashboard shows your progress, your recorded sales activity and your next mission. Open Profile for your five skills, badges and completed milestones. The System Administrator guides you; Compliance, Sales, Product, Operations and Technical are your five specialist advisors.'},
     mission:{title:m?.title||'Your mission record.',copy:m?m.objective+' This mission awards '+Number(m.xp||0)+' XP. Start it from the Dashboard and complete its requirements to earn the reward.':'You have completed the available missions in this chapter. Open Missions to review your achievements.'},
     game:{title:'Take command of your territory.',copy:'Select a location on the map to bring its information into the Command Center. Open Territory Stats from the right edge for the selected area. Your Player Hub slides from the left, Map Menu from the top and Command Center from the bottom. Use the floating AgWorld icon to open your advisors when the Player Hub is closed. Close the drawers to immerse yourself in the game; your map and progress remain in place.'}
   };
   return key==='custom'&&custom?custom:library[key]||library.welcome;
 }
 const query=s=>root?.querySelector(s);
 function playback(status){
   if(!root)return;root.dataset.playback=status;root.classList.toggle('is-talking',status==='playing');
   query('.ag-guide-status span').textContent=({playing:'SPEAKING',paused:'PAUSED',loading:'CONNECTING VOICE',error:'TEXT GUIDE AVAILABLE'})[status]||'READY TO GUIDE';
   query('.ag-guide-play').innerHTML=status==='playing'?'<span>Ⅱ</span><span>PAUSE BRIEFING</span>':status==='paused'?'<span>▶</span><span>RESUME BRIEFING</span>':'<span>▶</span><span>PLAY BRIEFING</span>';
 }
 function stop(){sequence++;speech=null;window.speechSynthesis?.cancel();if(audio){audio.pause();audio.currentTime=0;}playback('idle');}
 function place(){
   if(!root)return;const map=document.querySelector('.map-area')?.getBoundingClientRect();if(!map)return;
   const header=document.querySelector('.map-header')?.getBoundingClientRect();
   const advisor=document.getElementById('agMapAdvisors');const advisorRight=advisor&&!advisor.hidden?advisor.getBoundingClientRect().right+12:map.left+20;
   root.style.left=Math.round(Math.min(advisorRight,map.right-320))+'px';root.style.top=Math.round(Math.max(map.top+84,(header?.bottom||map.top)+12))+'px';root.style.maxWidth=Math.min(500,Math.max(260,map.width-60))+'px';
 }
 function render(){
   const b=briefing(section);query('.ag-guide-title').textContent=b.title;query('.ag-guide-copy').textContent=b.copy;
   root.setAttribute('aria-label','System Administrator guide');
   root.querySelectorAll('[data-guide-section]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.guideSection===section)));
   query('.ag-guide-step-label').textContent='SYSTEM ADMINISTRATOR · YOUR GAME GUIDE';
 }
 function show({compact=false}={}){ensure();place();root.classList.add('show');root.classList.toggle('avatar-only',compact);render();}
 function hide(){stop();root?.classList.remove('show','avatar-only');}
 function dismiss(){hide();window.AGWorldAdvisorState=null;document.querySelectorAll('#agAdvisorBay .ag-advisor').forEach(el=>{el.classList.remove('is-active');el.setAttribute('aria-pressed','false');});window.dispatchEvent(new CustomEvent('agworld:advisor-deselected',{detail:{id:'system-administrator'}}));}
 function speakText(text,token){
   if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){playback('error');return;}
   const utterance=new SpeechSynthesisUtterance(text);speech=utterance;
   const voices=window.speechSynthesis.getVoices(),english=voices.filter(v=>/^en/i.test(v.lang));
   const female=['product','compliance'].includes(root.dataset.advisor);utterance.voice=english.find(v=>(female?/Samantha|Sonia|Susan|Zira|Victoria/i:/David|Ryan|Daniel|Mark|Guy|George/i).test(v.name))||english.find(v=>v.lang==='en-ZA')||english[0]||null;
   utterance.lang=utterance.voice?.lang||'en-ZA';utterance.rate=.95;utterance.pitch=female?1.04:.93;
   utterance.onstart=()=>{if(sequence===token)playback('playing');};
   utterance.onend=()=>{if(sequence===token){speech=null;playback('idle');}};
   utterance.onerror=()=>{if(sequence===token){speech=null;playback('error');}};
   window.speechSynthesis.speak(utterance);
 }
 function play(){
   if(root.dataset.playback==='playing'){if(speech)window.speechSynthesis.pause();else audio.pause();playback('paused');return;}
   if(root.dataset.playback==='paused'){if(speech){window.speechSynthesis.resume();playback('playing');}else audio.play().catch(()=>playback('error'));return;}
   stop();const token=sequence,b=briefing(section);playback('loading');
   if(b.audio){audio.src=b.audio;audio.play().catch(()=>{if(sequence===token&&root.classList.contains('show'))speakText(b.spoken||b.copy,token);});}
   else if(window.AGWorldCompanions?.speakBriefing)window.AGWorldCompanions.speakBriefing(b.spoken||b.copy,token);else speakText(b.spoken||b.copy,token);
 }
 function select(key,options={}){ensure();stop();section=SECTIONS.includes(key)?key:'welcome';render();if(options.show!==false)show();if(options.autoplay)play();}
 function ensure(){
   if(root)return;root=document.createElement('aside');root.id=ID;root.style.display='none';root.dataset.playback='idle';
   root.innerHTML='<button type="button" class="ag-guide-hologram" aria-label="Open System Administrator briefing"><span class="ag-admin-portrait"><img src="assets/advisors/system-administrator.webp" alt="System Administrator"><i class="ag-guide-scan"></i></span><span class="ag-guide-ring"></span><span class="ag-guide-label">SYSTEM<br>ADMINISTRATOR</span></button><section class="ag-guide-card" role="dialog" aria-labelledby="agAdminTitle"><header class="ag-guide-card-head"><div><span class="ag-guide-eyebrow">AGWORLD · SYSTEM ADMINISTRATOR</span><div class="ag-guide-status" role="status"><i></i><span>READY TO GUIDE</span></div></div><button type="button" class="ag-guide-close" aria-label="Close System Administrator">×</button></header><div class="ag-guide-body"><h2 id="agAdminTitle" class="ag-guide-title"></h2><p class="ag-guide-copy"></p><nav class="ag-guide-nav" aria-label="Administrator guide sections">'+[['welcome','WELCOME'],['player','PROFILE'],['mission','MISSION'],['game','TERRITORY']].map(([id,label])=>'<button type="button" data-guide-section="'+id+'">'+label+'</button>').join('')+'</nav><div class="ag-guide-step-label"></div><div class="ag-guide-controls"><button class="ag-guide-play" type="button"><span>▶</span><span>PLAY BRIEFING</span></button><button class="ag-guide-minimise" type="button">MINIMISE</button></div></div></section>';
   audio=document.createElement('audio');audio.id='agWorldGuideAudio';audio.preload='none';document.body.append(root,audio);
   query('.ag-guide-close').onclick=dismiss;
   query('.ag-guide-hologram').onclick=()=>{show();play();};
   query('.ag-guide-play').onclick=play;
   query('.ag-guide-minimise').onclick=()=>{stop();show({compact:true});};
   root.querySelectorAll('[data-guide-section]').forEach(b=>b.onclick=()=>select(b.dataset.guideSection,{autoplay:true}));
   audio.addEventListener('playing',()=>playback('playing'));audio.addEventListener('ended',()=>playback('idle'));
   audio.addEventListener('error',()=>{if(root.dataset.playback==='loading'&&!speech)playback('error');});
   render();
 }
 window.AGWorldVoiceBridge={isCurrent:token=>sequence===token&&root?.classList.contains('show'),load:(url,token)=>{if(sequence!==token||!root?.classList.contains('show'))return;audio.src=url;audio.play().catch(()=>{if(sequence===token)playback('error');});},error:token=>{if(sequence===token)playback('error');}};
 window.AGWorldStrategicCommander={show:()=>show({compact:true}),hide,isVisible:()=>!!root?.classList.contains('show')};
 window.AG_WORLD_GUIDE={show:()=>show(),showAvatar:()=>show({compact:true}),hide,select,welcome:({speak=false}={})=>select('welcome',{autoplay:speak}),current:()=>section,stopBriefing:stop,play,
   briefMission:({title,copy,audioSrc}={})=>{ensure();stop();custom={title:title||'Mission briefing',copy:copy||'',audio:audioSrc};section='custom';show();},
   setBriefing:({title,copy,audioSrc,show:visible=true}={})=>{ensure();stop();custom={title:title||'Administrator briefing',copy:copy||'',audio:audioSrc};section='custom';render();if(visible)show();}
 };
 addEventListener('resize',place,{passive:true});addEventListener('agworld:game-mode-changed',place);
 addEventListener('agworld:advisor-selected',e=>{if(e.detail?.id!=='system-administrator')hide();});
 addEventListener('agworld:advisor-deselected',hide);
 addEventListener('agworld:player-state',()=>{if(root?.classList.contains('show'))render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
})();
