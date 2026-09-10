/* AG WORLD — isolated System Guide / Hologram test layer.
   Intentionally does not read, modify, replace, or re-parent GIS/map elements. */
(()=>{
  'use strict';

  const STATE_KEY='agworld.guide.welcome.seen.v1';
  const GUIDE_ID='agWorldSystemGuide';
  const AUDIO_ID='agWorldGuideAudio';
  let welcomeTimer=null;

  const css=`
#${GUIDE_ID}{position:fixed;right:clamp(250px,18vw,420px);top:235px;bottom:auto;z-index:2147482000;display:none;align-items:flex-end;gap:12px;pointer-events:none;font-family:Arial,Helvetica,sans-serif}
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
.ag-guide-card{width:min(360px,calc(100vw - 190px));pointer-events:auto;border:1px solid rgba(184,230,32,.32);border-radius:14px;background:linear-gradient(145deg,rgba(11,44,32,.97),rgba(7,28,22,.97));color:#F4F3ED;box-shadow:0 20px 46px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden;transform-origin:bottom right}
.ag-guide-card-head{display:flex;align-items:center;justify-content:space-between;padding:11px 13px 9px;border-bottom:1px solid rgba(244,243,237,.08)}
.ag-guide-eyebrow{color:#B8E620;font-size:8px;font-weight:900;letter-spacing:1.4px}
.ag-guide-status{display:inline-flex;align-items:center;gap:5px;color:#D9DAD5;font-size:7px;font-weight:800;letter-spacing:.8px}
.ag-guide-status i{display:block;width:6px;height:6px;border-radius:50%;background:#B8E620;box-shadow:0 0 10px rgba(184,230,32,.8)}
.ag-guide-close{width:26px;height:26px;border:0;border-radius:7px;background:rgba(244,243,237,.06);color:#F4F3ED;font-size:16px;cursor:pointer}
.ag-guide-body{padding:13px 14px 14px}
.ag-guide-title{margin:0;color:#F4F3ED;font-size:18px;line-height:1.05;letter-spacing:.2px}
.ag-guide-copy{margin:7px 0 12px;color:#D9DAD5;font-size:11px;line-height:1.5}
.ag-guide-controls{display:flex;align-items:center;gap:7px}
.ag-guide-play{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:0 12px;border:1px solid rgba(184,230,32,.52);border-radius:8px;background:#0D6A38;color:#F4F3ED;font-size:8px;font-weight:900;letter-spacing:.8px;cursor:pointer}
.ag-guide-play:hover{background:#0b5a31}
.ag-guide-minimise{margin-left:auto;border:0;background:transparent;color:#D9DAD5;font-size:8px;font-weight:800;letter-spacing:.5px;cursor:pointer}
.ag-guide-reopen{position:fixed;right:18px;bottom:18px;z-index:2147481999;display:none;width:42px;height:42px;border-radius:50%;border:1px solid rgba(184,230,32,.55);background:#0B2C20;color:#B8E620;box-shadow:0 10px 25px rgba(0,0,0,.28),0 0 18px rgba(184,230,32,.16);font-size:17px;cursor:pointer}
.ag-guide-reopen.show{display:block}
/* Guide sits in the open map space below the territory summary and alongside the My Missions pull-tab. */
body.ag-game-mode #${GUIDE_ID}{right:clamp(250px,18vw,420px);top:235px;bottom:auto}
body.ag-game-mode .ag-guide-reopen{right:clamp(250px,18vw,420px);top:235px;bottom:auto}
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
          <button class="ag-guide-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="ag-guide-body">
          <h2 class="ag-guide-title">Welcome to AgWorld.</h2>
          <p class="ag-guide-copy">Your interactive guide is ready. Welcome briefings, mission introductions and future system updates will appear here without changing the AgWorld map or game layer.</p>
          <div class="ag-guide-controls">
            <button class="ag-guide-play" type="button"><span>▶</span><span>PLAY BRIEFING</span></button>
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

    const show=()=>{root.classList.add('show');reopen.classList.remove('show');};
    const hide=()=>{root.classList.remove('show');reopen.classList.add('show');};
    root.querySelector('.ag-guide-hologram').addEventListener('click',show);
    root.querySelector('.ag-guide-close').addEventListener('click',hide);
    root.querySelector('.ag-guide-minimise').addEventListener('click',hide);
    reopen.addEventListener('click',show);

    root.querySelector('.ag-guide-play').addEventListener('click',async()=>{
      const src=audio.getAttribute('src')||window.AG_WORLD_GUIDE_AUDIO_SRC;
      if(!src){
        root.querySelector('.ag-guide-copy').textContent='The guide shell is live and isolated from the GIS. The recorded voice source is not connected yet.';
        return;
      }
      if(audio.paused){
        try{await audio.play();root.querySelector('.ag-guide-play').lastElementChild.textContent='PAUSE BRIEFING';}
        catch(err){root.querySelector('.ag-guide-copy').textContent='Audio is ready but the browser blocked playback. Click PLAY BRIEFING again.';}
      }else{
        audio.pause();root.querySelector('.ag-guide-play').lastElementChild.textContent='PLAY BRIEFING';
      }
    });

    audio.addEventListener('ended',()=>{const b=root.querySelector('.ag-guide-play');if(b) b.lastElementChild.textContent='PLAY BRIEFING';});

    window.AG_WORLD_GUIDE={
      show,
      hide,
      setAudioSource(src){
        if(!src) return false;
        audio.src=src;
        window.AG_WORLD_GUIDE_AUDIO_SRC=src;
        return true;
      },
      setBriefing({title,copy}={}){
        if(title) root.querySelector('.ag-guide-title').textContent=title;
        if(copy) root.querySelector('.ag-guide-copy').textContent=copy;
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
                   document.body.classList.contains('ag-game-mode');
      root.classList.toggle('show',active);
    };

    window.addEventListener('agworld:ui-shell-ready',syncVisibility);
    window.addEventListener('load',syncVisibility);
    new MutationObserver(syncVisibility).observe(document.body,{attributes:true,attributeFilter:['class']});
    syncVisibility();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();