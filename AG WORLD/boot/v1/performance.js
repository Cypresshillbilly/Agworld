/* AG WORLD — V1 boot performance instrumentation.
   Non-visual, non-layout code only. It preserves the approved Login V1,
   Loading V0 and Player V1 surfaces while warming critical network resources,
   recording stage timing, and running a structural regression audit. */
(()=>{
  'use strict';

  if(window.AGWorldBootDiagnostics?.version==='1.0.0') return;

  const bootMarks=window.__AGWORLD_BOOT_MARKS__||(window.__AGWORLD_BOOT_MARKS__={});
  const START=bootMarks.submit??bootMarks.auth??performance.now();
  const stageOrder=['submit','auth','interface','systems','map','world','populate','ready'];
  const diagnostics={
    version:'1.0.0',
    startedAt:START,
    marks:bootMarks,
    durations:{},
    regression:null,
    sourceWarmup:{started:false,complete:false,failed:[]},
    snapshot:null
  };
  window.AGWorldBootDiagnostics=diagnostics;

  const mark=(name)=>{
    const t=diagnostics.marks[name]??performance.now();
    diagnostics.marks[name]=t;
    try{ performance.mark('agworld-'+name); }catch(_){ }
    if(name!=='submit' && diagnostics.marks.submit!=null){
      diagnostics.durations['submit-to-'+name]=Math.round((t-diagnostics.marks.submit)*10)/10;
    }
    return t;
  };

  const CRITICAL=[
    'boot/v1/three.mjs?v=three-r178-module-20260912',
    'core/role-config.js?v=master-architecture-v1',
    'core/bootstrap.js?v=playable-loop-v1',
    'builds/agriculture/profile/profile.manifest.js?v=playable-loop-v1',
    'builds/agriculture/profile/profile.module.js?v=playable-loop-v1',
    'api-bridge.js?v=20260902',
    'config-gis-v4.js',
    'world-data-mode-v1.js?v=demo-user-world-mode-v1-20260908-1305',
    'app-gis-loader-v24.js?v=boot-repair-20260912'
  ];

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

  async function warmCriticalSources(){
    if(diagnostics.sourceWarmup.started) return;
    diagnostics.sourceWarmup.started=true;
    warmConnections();
    const concurrency=4;
    let cursor=0;
    const worker=async()=>{
      while(cursor<CRITICAL.length){
        const current=CRITICAL[cursor++];
        try{
          const response=await fetch(current,{cache:'force-cache',credentials:'same-origin'});
          if(!response.ok) throw new Error('HTTP '+response.status);
          await response.arrayBuffer();
        }catch(error){
          diagnostics.sourceWarmup.failed.push({src:current,error:String(error?.message||error)});
        }
      }
    };
    await Promise.all(Array.from({length:concurrency},worker));
    diagnostics.sourceWarmup.complete=true;
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
      missionsLightSurface:lightSurface(required.missions),
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

  window.AGWorldBootDiagnostics.getReport=()=>JSON.parse(JSON.stringify(diagnostics));
  window.AGWorldBootDiagnostics.getTimeline=()=>stageOrder
    .filter(name=>diagnostics.marks[name]!=null)
    .map(name=>({stage:name,ms:Math.round((diagnostics.marks[name]-START)*10)/10}));
})();
