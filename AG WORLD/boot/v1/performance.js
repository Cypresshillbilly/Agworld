/* AG WORLD — V1 boot performance instrumentation.
   Non-visual, non-layout code only. It preserves the approved Login V1,
   Loading V0 and Player V1 surfaces while warming critical network resources,
   recording stage timing, and running a structural regression audit. */
(()=>{
  'use strict';

  if(window.AGWorldBootDiagnostics?.version==='1.1.0') return;

  const bootMarks=window.__AGWORLD_BOOT_MARKS__||(window.__AGWORLD_BOOT_MARKS__={});
  const START=bootMarks.submit??bootMarks.auth??performance.now();
  const stageOrder=['submit','auth','interface','systems','map','world','populate','ready'];
  const diagnostics={
    version:'1.1.0',
    startedAt:START,
    marks:bootMarks,
    durations:{},
    regression:null,
    snapshot:null
  };
  window.AGWorldBootDiagnostics=diagnostics;

  // Capture from the game itself, including errors before Developer Mode opens.
  // Keep only short, redacted messages in memory; never read session storage.
  if(!window.AGWorldRuntimeEvents){
    const events=[];
    const clean=text=>String(text||'Unknown error')
      .replace(/https?:\/\/[^\s)]+/g,url=>{try{const u=new URL(url);return u.origin+u.pathname}catch(_){return '[URL]'}})
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[email]')
      .replace(/Bearer\s+\S+/gi,'Bearer [redacted]')
      .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]')
      .replace(/((?:password|token|secret|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi,'$1[redacted]').slice(0,400);
    const capture=(type,message,level='error')=>{
      events.push({time:new Date().toISOString(),type,message:clean(message),level});
      if(events.length>50)events.shift();
    };
    window.addEventListener('error',event=>{
      if(event.target&&event.target!==window){
        const target=event.target,source=target.getAttribute?.('src')||target.getAttribute?.('href');
        if(source)capture('Resource',source,'warn');
      }else capture('JavaScript',event.message||'Script error');
    },true);
    window.addEventListener('unhandledrejection',event=>capture('Promise',event.reason?.message||event.reason));
    window.addEventListener('agworld:world-failed',event=>capture('World',event.detail?.message||'World loading failed'));
    window.AGWorldRuntimeEvents={getEvents:()=>events.map(event=>({...event}))};
  }

  const mark=(name)=>{
    const t=diagnostics.marks[name]??performance.now();
    diagnostics.marks[name]=t;
    try{ performance.mark('agworld-'+name); }catch(_){ }
    if(name!=='submit' && diagnostics.marks.submit!=null){
      diagnostics.durations['submit-to-'+name]=Math.round((t-diagnostics.marks.submit)*10)/10;
    }
    return t;
  };

  diagnostics.mark=mark;

  function warmConnections(){
    [
      'https://cdn.jsdelivr.net',
      'https://maps.googleapis.com',
      'https://maps.gstatic.com'
    ].forEach((href,index)=>{
      const id='agworld-perf-preconnect-'+index;
      if(document.getElementById(id)) return;
      const link=document.createElement('link');
      link.id=id;
      link.rel='preconnect';
      link.href=href;
      link.crossOrigin='anonymous';
      document.head.appendChild(link);
    });
  }

  function warmCriticalSources(){
    warmConnections();
    window.__AGWORLD_PRELOAD_GAME__?.();
  }

  function attachSubmitWarmup(){
    const form=document.querySelector('#ag-login-gate form');
    if(!form) return false;
    if(form.dataset.agworldPerfBound==='1') return true;
    form.dataset.agworldPerfBound='1';
    form.addEventListener('submit',()=>{
      mark('submit');
      warmCriticalSources();
    },{capture:true});
    // Start only once the login page is parsed and painted. Downloads stay
    // inert; authentication remains the execution boundary.
    const warm=()=>requestAnimationFrame(warmCriticalSources);
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',warm,{once:true});
    else warm();
    return true;
  }

  const gateObserver=new MutationObserver(()=>{
    if(attachSubmitWarmup()) gateObserver.disconnect();
  });
  gateObserver.observe(document.documentElement,{childList:true,subtree:true});
  attachSubmitWarmup();

  // The auth handoff marks visible stages after their prerequisites are met.
  // Raw GIS events can arrive while interface sources are still executing.

  function geometry(el){
    if(!el) return null;
    const r=el.getBoundingClientRect();
    return {
      x:Math.round(r.x),y:Math.round(r.y),
      width:Math.round(r.width),height:Math.round(r.height),
      display:getComputedStyle(el).display,
      visibility:getComputedStyle(el).visibility
    };
  }

  function lightSurface(el){
    if(!el) return false;
    const color=getComputedStyle(el).backgroundColor;
    const m=color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if(!m) return false;
    const rgb=[Number(m[1]),Number(m[2]),Number(m[3])];
    return rgb.reduce((a,b)=>a+b,0)/3>210;
  }

  function runRegressionAudit(){
    const shells=document.querySelectorAll('.app-shell');
    const required={
      shell:document.querySelector('.app-shell'),
      sidebar:document.querySelector('.sidebar'),
      missions:document.querySelector('.missions'),
      playerProfile:document.getElementById('agPlayerMissionProfile'),
      mapArea:document.querySelector('.map-area'),
      map:document.getElementById('map'),
      commandCenter:document.getElementById('entityInformationSection'),
      territoryStats:document.getElementById('territoryStatsDrawer'),
      systemGuide:document.getElementById('agWorldSystemGuide')
    };
    const missing=Object.entries(required).filter(([,el])=>!el).map(([name])=>name);
    const checks={
      singleAppShell:shells.length===1,
      requiredElements:missing.length===0,
      missionsSurfaceMatchesTheme:document.documentElement.dataset.agGameTheme==='reference' ? getComputedStyle(required.missions).backgroundColor===(required.missions.dataset.agScreen==='dashboard'?'rgb(255, 255, 255)':'rgb(0, 20, 27)') : lightSurface(required.missions),
      mapAreaSized:!!required.mapArea && required.mapArea.getBoundingClientRect().width>200 && required.mapArea.getBoundingClientRect().height>200,
      commandCenterPresent:!!required.commandCenter,
      territoryStatsPresent:!!required.territoryStats,
      noLoginGate:!document.getElementById('ag-login-gate'),
      loadingOverlayHidden:!document.getElementById('agworld-game-loader')?.classList.contains('is-active')
    };
    const pass=Object.values(checks).every(Boolean);
    diagnostics.regression={pass,checks,missing,checkedAt:performance.now()};
    diagnostics.snapshot={
      shell:geometry(required.shell),
      sidebar:geometry(required.sidebar),
      missions:geometry(required.missions),
      mapArea:geometry(required.mapArea),
      commandCenter:geometry(required.commandCenter),
      territoryStats:geometry(required.territoryStats)
    };
    window.dispatchEvent(new CustomEvent(pass?'agworld:boot-regression-pass':'agworld:boot-regression-fail',{detail:diagnostics.regression}));
    if(!pass) console.error('AG World V1 boot regression audit failed',diagnostics.regression,diagnostics.snapshot);
  }

  window.addEventListener('agworld:player-visible',()=>{
    mark('ready');
    requestAnimationFrame(()=>requestAnimationFrame(runRegressionAudit));
  },{once:true});

  window.AGWorldBootDiagnostics.getReport=()=>JSON.parse(JSON.stringify({...diagnostics,sources:window.__AGWORLD_SOURCE_TIMINGS__||[]}));
  window.AGWorldBootDiagnostics.getTimeline=()=>stageOrder
    .filter(name=>diagnostics.marks[name]!=null)
    .map(name=>({stage:name,ms:Math.round((diagnostics.marks[name]-START)*10)/10}));
})();
