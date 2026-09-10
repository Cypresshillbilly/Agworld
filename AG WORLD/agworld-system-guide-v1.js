/* AG WORLD — isolated System Guide / Hologram test layer.
   Intentionally does not read, modify, replace, or re-parent GIS/map elements. */
(()=>{
  'use strict';

  const STATE_KEY='agworld.guide.welcome.seen.v1';
  const GUIDE_ID='agWorldSystemGuide';
  const AUDIO_ID='agWorldGuideAudio';
  let welcomeTimer=null;
  const GUIDE_LIBRARY={
    welcome:{
      title:'Welcome to AgWorld.',
      copy:'I’m your System Guide. I’ll help you understand your missions, your territory and the systems that shape your progress. This player view is your command point. Take a moment to orient yourself, then enter AgWorld when you’re ready to operate on the full map.',
      audioSrc:'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/30bcb615-a24a-425b-a9ac-1987e511764e.mp3'
    },
    player:{
      title:'Your Player View.',
      copy:'Your profile, missions and territory intelligence are brought together here, while the live AgWorld map remains directly beneath the surface. The Command Center gives you a quick operational overview. Use this screen to assess your position before moving into the full game environment.',
      audioSrc:'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/fa082a66-d8bd-40a2-b59b-e30b900468a3.mp3'
    },
    mission:{
      title:'Mission Briefing.',
      copy:'This is where I’ll give you the context behind your objective, explain what matters and point you toward the next decision. Mission briefings will change as your objectives change, so listen carefully before committing resources or moving to the next stage.',
      audioSrc:'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/d0d8bc7b-1623-4691-86ef-5dfefb67f98d.mp3'
    },
    game:{
      title:'Entering AgWorld.',
      copy:'The full territory is now your operational space. Explore the map, inspect the live intelligence around you and use the Command Center as your heads-up display. I’ll remain available whenever you need a briefing or a reminder of what matters next.',
      audioSrc:'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/cc3ee80b-d7a5-43e0-9077-eee34a6f6d8c.mp3'
    }
  };

  const css=`
#${GUIDE_ID}{position:fixed;left:0;top:0;right:auto;bottom:auto;z-index:2147482000;display:none;align-items:flex-end;gap:12px;pointer-events:none;font-family:Arial,Helvetica,sans-serif}
#${GUIDE_ID}.show{display:flex}
#${GUIDE_ID} *{box-sizing:border-box}
.ag-guide-hologram{position:relative;width:132px;height:150px;flex:0 0 132px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 18px 24px rgba(0,0,0,.28))}
.ag-guide-core{position:absolute;left:50%;top:11px;width:92px;height:112px;transform:translateX(-50%);border-radius:48% 48% 38% 38%;background:radial-gradient(circle at 50% 25%,rgba(244,243,237,.94) 0 5%,rgba(184,230,32,.28) 6% 20%,rgba(13,106,56,.18) 21% 42%,rgba(11,44,32,.78) 68%,rgba(5,22,16,.94) 100%);border:1px solid rgba(184,230,32,.56);box-shadow:0 0 0 1px rgba(13,106,56,.28),0 0 24px rgba(184,230,32,.24),inset 0 0 28px rgba(184,230,32,.12);overflow:hidden}
.ag-guide-core:before{content:'';position:absolute;left:50%;top:14px;width:31px;height:31px;transform:translateX(-50%);border-radius:50%;border:2px solid rgba(244,243,237,.72);box-shadow:0 0 16px rgba(184,230,32,.36)}
.ag-guide-core:after{content:'';position:absolute;left:50%;bottom:12px;width:55px;height:55px;transform:translateX(-50%);border-radius:46% 46% 18% 18%;border:1px solid rgba(244,243,237,.42);border-bottom:0;box-shadow:0 -12px 22px rgba(184,230,32,.12)}
.ag-guide-scan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 5px,rgba(184,230,32,.06) 6px 7px);mix-blend-mode:screen;animation:agGuideScan 3.8s linear infinite}
.ag-guide-ring{position:absolute;left:50%;bottom:7px;width:122px;height:24px;transform:translateX(-50%);border:1px solid rgba(184,230,32,.58);border-radius:50%;box-shadow:0 0 20px rgba(184,230,32,.22);animation:agGuidePulse 2.2s ease-in-out infinite}
.ag-guide-ring:before{content:'';position:absolute;inset:5px 12px;border:1px solid rgba(13,106,56,.78);border-radius:50%}
.ag-guide-label{position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);white-space:nowrap;color:#F4F3ED;font-size:8px;font-weight:900;letter-spacing:1.3px;text-shadow:0 2px 7px rgba(0,0,0,.7)}
.ag-guide-card{width:min(360px,calc(100vw - 190px));pointer-events:auto;transition:opacity .2s ease,transform .24s ease;border:1px solid rgba(184,230,32,.32);border-radius:14px;background:linear-gradient(145deg,rgba(11,44,32,.97),rgba(7,28,22,.97));color:#F4F3ED;box-shadow:0 20px 46px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden;transform-origin:bottom right}
.ag-guide-card-head{display:flex;align-items:center;justify-content:space-between;padding:11px 13px 9px;border-bottom:1px solid rgba(244,243,237,.08)}
.ag-guide-eyebrow{color:#B8E620;font-size:8px;font-weight:900;letter-spacing:1.4px}
.ag-guide-status{display:inline-flex;align-items:center;gap:5px;color:#D9DAD5;font-size:7px;font-weight:800;letter-spacing:.8px}
.ag-guide-status i{display:block;width:6px;height:6px;border-radius:50%;background:#B8E620;box-shadow:0 0 10px rgba(184,230,32,.8)}
.ag-guide-close{width:26px;height:26px;border:0;border-radius:7px;background:rgba(244,243,237,.06);color:#F4F3ED;font-size:16px;cursor:pointer}
.ag-guide-body{padding:13px 14px 14px}
.ag-guide-title{margin:0;color:#F4F3ED;font-size:18px;line-height:1.05;letter-spacing:.2px}
.ag-guide-copy{margin:7px 0 12px;color:#D9DAD5;font-size:11px;line-height:1.5}
.ag-guide-nav{display:flex;gap:5px;flex-wrap:wrap;margin:0 0 11px}
.ag-guide-nav button{border:1px solid rgba(244,243,237,.11);border-radius:999px;background:rgba(244,243,237,.045);color:#D9DAD5;padding:5px 8px;font-size:7px;font-weight:900;letter-spacing:.65px;cursor:pointer}
.ag-guide-nav button.active{border-color:rgba(184,230,32,.5);background:rgba(184,230,32,.12);color:#B8E620}
.ag-guide-progress{height:3px;margin:0 0 11px;border-radius:999px;background:rgba(244,243,237,.08);overflow:hidden}
.ag-guide-progress i{display:block;width:0%;height:100%;background:#B8E620;box-shadow:0 0 12px rgba(184,230,32,.7);transition:width .12s linear}
.ag-guide-step{display:flex;align-items:center;justify-content:space-between;margin:0 0 8px;color:#8FA49A;font-size:7px;font-weight:900;letter-spacing:1px}
.ag-guide-sequence{display:flex;align-items:center;gap:5px}
.ag-guide-sequence button{min-height:26px;padding:0 8px;border:1px solid rgba(244,243,237,.11);border-radius:7px;background:rgba(244,243,237,.045);color:#D9DAD5;font-size:7px;font-weight:900;letter-spacing:.7px;cursor:pointer}
.ag-guide-sequence button:disabled{opacity:.35;cursor:default}
.ag-guide-sequence .ag-guide-next{border-color:rgba(184,230,32,.42);color:#B8E620}
.ag-guide-controls{display:flex;align-items:center;gap:7px}
.ag-guide-play{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:0 12px;border:1px solid rgba(184,230,32,.52);border-radius:8px;background:#0D6A38;color:#F4F3ED;font-size:8px;font-weight:900;letter-spacing:.8px;cursor:pointer}
.ag-guide-play:hover{background:#0b5a31}
.ag-guide-minimise{margin-left:auto;border:0;background:transparent;color:#D9DAD5;font-size:8px;font-weight:800;letter-spacing:.5px;cursor:pointer}
.ag-guide-reopen{position:fixed;right:18px;bottom:18px;z-index:2147481999;display:none;width:42px;height:42px;border-radius:50%;border:1px solid rgba(184,230,32,.55);background:#0B2C20;color:#B8E620;box-shadow:0 10px 25px rgba(0,0,0,.28),0 0 18px rgba(184,230,32,.16);font-size:17px;cursor:pointer}
#${GUIDE_ID}.avatar-only .ag-guide-card{display:none}
#${GUIDE_ID}.avatar-only{pointer-events:none}
#${GUIDE_ID}.avatar-only .ag-guide-hologram{pointer-events:auto}
.ag-guide-reopen.show{display:block}
/* Guide sits in the open map space below the territory summary and alongside the My Missions pull-tab. */
/* The System Guide belongs in the upper-left open space of the live map, directly beneath the map controls. It is positioned from the actual map rectangle in JS, so it remains correct in both Player View and full-screen AgWorld mode. */
body.ag-full-game-mode #${GUIDE_ID}{left:18px;top:118px;right:auto;bottom:auto}
body.ag-full-game-mode .ag-guide-reopen{left:18px;top:118px;right:auto;bottom:auto}
@keyframes agGuideScan{0%{transform:translateY(-8px)}100%{transform:translateY(8px)}}
@keyframes agGuidePulse{0%,100%{opacity:.62;transform:translateX(-50%) scale(.94)}50%{opacity:1;transform:translateX(-50%) scale(1.03)}}
@media(max-width:700px){#${GUIDE_ID}{right:10px;bottom:10px;gap:7px}.ag-guide-hologram{width:74px;height:106px;flex-basis:74px}.ag-guide-core{width:66px;height:82px}.ag-guide-card{width:min(310px,calc(100vw - 96px))}.ag-guide-ring{width:70px}.ag-guide-label{font-size:6px}}
`;

  function ensure(){
    if(document.getElementById(GUIDE_ID)) return;
    const style=document.createElement('style');
    style.id='ag-world-system-guide-style';
    style.textContent=css;
    document.head.appendChild(style);

    const root=document.createElement('section');
    root.id=GUIDE_ID;
    root.setAttribute('aria-label','AgWorld System Guide');
    root.innerHTML=`
      <button class="ag-guide-hologram" type="button" aria-label="Open System Guide">
        <span class="ag-guide-core"><span class="ag-guide-scan"></span></span>
        <span class="ag-guide-ring"></span>
        <span class="ag-guide-label">SYSTEM GUIDE</span>
      </button>
      <div class="ag-guide-card" role="dialog" aria-live="polite">
        <div class="ag-guide-card-head">
          <div>
            <div class="ag-guide-eyebrow">AGWORLD SYSTEM GUIDE</div>
            <div class="ag-guide-status"><i></i><span>LINK ACTIVE</span></div>
          </div>
          <button class="ag-guide-close" type="button" aria-label="Close conversation bubble">×</button>
        </div>
        <div class="ag-guide-body">
          <h2 class="ag-guide-title">Welcome to AgWorld.</h2>
          <p class="ag-guide-copy"></p>
          <div class="ag-guide-nav" aria-label="Guide sections">
            <button type="button" data-guide-section="welcome">WELCOME</button>
            <button type="button" data-guide-section="player">PLAYER VIEW</button>
            <button type="button" data-guide-section="mission">MISSIONS</button>
            <button type="button" data-guide-section="game">AGWORLD</button>
          </div>
          <div class="ag-guide-progress" aria-hidden="true"><i></i></div>
          <div class="ag-guide-step"><span class="ag-guide-step-label">STEP 1 OF 4</span><span>GUIDED ORIENTATION</span></div>
          <div class="ag-guide-controls">
            <button class="ag-guide-play" type="button"><span>▶</span><span>PLAY BRIEFING</span></button>
            <div class="ag-guide-sequence">
              <button class="ag-guide-prev" type="button">PREV</button>
              <button class="ag-guide-next" type="button">NEXT</button>
            </div>
            <button class="ag-guide-minimise" type="button">MINIMISE</button>
          </div>
        </div>
      </div>`;

    const reopen=document.createElement('button');
    reopen.type='button';
    reopen.className='ag-guide-reopen';
    reopen.setAttribute('aria-label','Open System Guide');
    reopen.textContent='✦';

    const audio=document.createElement('audio');
    audio.id=AUDIO_ID;
    audio.preload='metadata';

    document.body.append(root,reopen,audio);

    const placeGuide=()=>{
      const area=document.querySelector('.map-area');
      if(!area) return;
      const r=area.getBoundingClientRect();
      if(!r.width||!r.height) return;
      const full=document.body.classList.contains('ag-full-game-mode');
      const left=Math.round(r.left+(full?18:24));
      const top=Math.round(r.top+(full?118:112));
      root.style.left=left+'px';
      root.style.top=top+'px';
      root.style.right='auto';
      root.style.bottom='auto';
      reopen.style.left=left+'px';
      reopen.style.top=top+'px';
      reopen.style.right='auto';
      reopen.style.bottom='auto';
    };
    const openFullGuide=()=>{placeGuide();root.classList.remove('avatar-only');root.classList.add('show');reopen.classList.remove('show');};
    const showAvatarOnly=()=>{placeGuide();root.classList.add('show','avatar-only');reopen.classList.remove('show');};
    const collapseGuide=()=>{root.classList.remove('show','avatar-only');reopen.classList.add('show');};
    root.querySelector('.ag-guide-hologram').addEventListener('click',()=>{
      if(root.classList.contains('avatar-only')) openFullGuide();
    });
    window.addEventListener('resize',placeGuide);
    window.addEventListener('agworld:game-mode-changed',()=>setTimeout(placeGuide,80));
    // Three-layer interaction:
    // 1) collapsed icon -> 2) avatar-only -> 3) avatar + conversation bubble.
    root.querySelector('.ag-guide-close').addEventListener('click',showAvatarOnly);
    root.querySelector('.ag-guide-minimise').addEventListener('click',collapseGuide);
    reopen.addEventListener('click',showAvatarOnly);

    const GUIDE_SEQUENCE=['welcome','player','mission','game'];
    let currentSection='welcome';
    const playButton=root.querySelector('.ag-guide-play');
    const previousButton=root.querySelector('.ag-guide-prev');
    const nextButton=root.querySelector('.ag-guide-next');
    const stepLabel=root.querySelector('.ag-guide-step-label');
    const playIcon=playButton.firstElementChild;
    const playLabel=playButton.lastElementChild;
    const progress=root.querySelector('.ag-guide-progress i');
    const resetPlaybackUI=()=>{
      playIcon.textContent='▶';
      playLabel.textContent='PLAY BRIEFING';
      progress.style.width='0%';
    };

    const setSection=(key,{show=true,autoplay=false}={})=>{
      const section=GUIDE_LIBRARY[key]||GUIDE_LIBRARY.welcome;
      currentSection=GUIDE_LIBRARY[key]?key:'welcome';
      window.speechSynthesis?.cancel();
      audio.pause();
      audio.currentTime=0;
      root.querySelector('.ag-guide-title').textContent=section.title;
      root.querySelector('.ag-guide-copy').textContent=section.copy;
      if(section.audioSrc){
        audio.src=section.audioSrc;
        window.AG_WORLD_GUIDE_AUDIO_SRC=section.audioSrc;
      }
      root.querySelectorAll('[data-guide-section]').forEach(btn=>{
        btn.classList.toggle('active',btn.dataset.guideSection===currentSection);
      });
      const sequenceIndex=Math.max(0,GUIDE_SEQUENCE.indexOf(currentSection));
      stepLabel.textContent='STEP '+(sequenceIndex+1)+' OF '+GUIDE_SEQUENCE.length;
      previousButton.disabled=sequenceIndex===0;
      nextButton.textContent=sequenceIndex===GUIDE_SEQUENCE.length-1?'FINISH':'NEXT';
      resetPlaybackUI();
      if(show) openFullGuide();
      if(autoplay) setTimeout(()=>playButton.click(),80);
    };

    root.querySelectorAll('[data-guide-section]').forEach(btn=>{
      btn.addEventListener('click',()=>setSection(btn.dataset.guideSection));
    });

    previousButton.addEventListener('click',()=>{
      const index=GUIDE_SEQUENCE.indexOf(currentSection);
      if(index>0) setSection(GUIDE_SEQUENCE[index-1]);
    });
    nextButton.addEventListener('click',()=>{
      const index=GUIDE_SEQUENCE.indexOf(currentSection);
      if(index>=GUIDE_SEQUENCE.length-1){
        showAvatarOnly();
        return;
      }
      setSection(GUIDE_SEQUENCE[index+1]);
    });

    root.querySelector('.ag-guide-play').addEventListener('click',async()=>{
      const src=audio.getAttribute('src')||window.AG_WORLD_GUIDE_AUDIO_SRC;
      if(!src){
        root.querySelector('.ag-guide-copy').textContent='This briefing is not connected to an AI voice track yet.';
        return;
      }
      if(audio.paused){
        try{
          await audio.play();
          playIcon.textContent='Ⅱ';
          playLabel.textContent='PAUSE BRIEFING';
        }catch(err){
          root.querySelector('.ag-guide-copy').textContent='The AI briefing is ready. Click PLAY BRIEFING again to start the audio.';
          resetPlaybackUI();
        }
      }else{
        audio.pause();
        playIcon.textContent='▶';
        playLabel.textContent='PLAY BRIEFING';
      }
    });

    audio.addEventListener('timeupdate',()=>{
      if(!audio.duration || !isFinite(audio.duration)) return;
      progress.style.width=Math.max(0,Math.min(100,(audio.currentTime/audio.duration)*100))+'%';
    });
    audio.addEventListener('ended',resetPlaybackUI);
    audio.addEventListener('error',()=>{
      resetPlaybackUI();
      root.querySelector('.ag-guide-copy').textContent='The AI voice briefing could not be loaded. Please try again.';
    });

    setSection('welcome',{show:false});
    window.AG_WORLD_GUIDE={
      show:openFullGuide,
      showAvatar:showAvatarOnly,
      hide:collapseGuide,
      select(section,options){setSection(section,options||{});},
      setAudioSource(src){
        if(!src) return false;
        audio.src=src;
        window.AG_WORLD_GUIDE_AUDIO_SRC=src;
        return true;
      },
      setBriefing({title,copy,audioSrc,show=true}={}){
        if(title) root.querySelector('.ag-guide-title').textContent=title;
        if(copy) root.querySelector('.ag-guide-copy').textContent=copy;
        if(audioSrc) {
          audio.src=audioSrc;
          window.AG_WORLD_GUIDE_AUDIO_SRC=audioSrc;
        }
        if(show) openFullGuide();
      },
      briefMission({title,copy,audioSrc}={}){
        if(title) root.querySelector('.ag-guide-title').textContent=title;
        if(copy) root.querySelector('.ag-guide-copy').textContent=copy;
        if(audioSrc) {
          audio.src=audioSrc;
          window.AG_WORLD_GUIDE_AUDIO_SRC=audioSrc;
        }
        openFullGuide();
      },
      sections:GUIDE_LIBRARY,
      current(){return currentSection;},
      stopBriefing(){
        window.speechSynthesis?.cancel();
        audio.pause();
        audio.currentTime=0;
        const b=root.querySelector('.ag-guide-play');
        resetPlaybackUI();
      }
    };
  }

  function boot(){
    ensure();
    const root=document.getElementById(GUIDE_ID);
    if(!root) return;

    // Persistent HUD element: do not hide the hologram after the first welcome.
    const syncVisibility=()=>{
      const active=document.body.classList.contains('ag-profile-mode') ||
                   document.body.classList.contains('ag-game-mode') ||
                   document.body.classList.contains('ag-full-game-mode');
      const guide=window.AG_WORLD_GUIDE;
      const reopen=document.querySelector('.ag-guide-reopen');
      if(active && guide && !(reopen&&reopen.classList.contains('show'))) guide.showAvatar();
      else if(!active) root.classList.remove('show','avatar-only');
    };

    window.addEventListener('agworld:ui-shell-ready',syncVisibility);
    window.addEventListener('load',syncVisibility);
    new MutationObserver(()=>{
      syncVisibility();
      if(document.body.classList.contains('ag-full-game-mode') && window.AG_WORLD_GUIDE?.current?.()!=='game'){
        window.AG_WORLD_GUIDE.select('game',{show:true,autoplay:false});
      }
    }).observe(document.body,{attributes:true,attributeFilter:['class']});

    syncVisibility();
    if((document.body.classList.contains('ag-profile-mode')||document.body.classList.contains('ag-game-mode')) && !sessionStorage.getItem(STATE_KEY)){
      sessionStorage.setItem(STATE_KEY,'1');
      setTimeout(()=>window.AG_WORLD_GUIDE?.select('welcome',{show:true,autoplay:false}),250);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();