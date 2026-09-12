/* Read-only view of the connected game. No credentials or record payloads enter reports. */
(()=>{
  'use strict';
  const safe=(fn,fallback=null)=>{try{return fn()??fallback}catch(_){return fallback}};
  const clean=text=>String(text||'').replace(/https?:\/\/[^\s)]+/g,url=>safe(()=>new URL(url).origin+new URL(url).pathname,'[URL]')).replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[email]').replace(/Bearer\s+\S+/gi,'Bearer [redacted]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').replace(/((?:password|token|secret|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi,'$1[redacted]').slice(0,400);
  function collect(w){
    const connected=!!w&&safe(()=>w.location.origin===location.origin,false)&&!w.closed;
    const report={version:'2.0',capturedAt:new Date().toISOString(),connected,checks:[],timeline:[],events:[],counts:{farms:0,contractors:0,competitors:0,facilities:0,total:0},screen:'Not connected',boot:'NOT CONNECTED',map:'NOT CONNECTED'};
    const add=(id,name,state,items,note='')=>report.checks.push({id,name,state,items,note});
    if(!connected){add('connection','Game connection','warn',[['Live game tab','Not connected']],'Open Developer Mode from the game button. A standalone page cannot inspect another tab.');return report;}
    const doc=w.document,q=selector=>doc.querySelector(selector),byId=id=>doc.getElementById(id),world=w.AG_WORLD_WORLD;
    const boot=w.AGWorldBootDiagnostics,ready=!!w.__AGWORLD_GAME_BOOTED__&&!!boot?.regression?.pass;
    const failed=!!byId('agworld-game-loader-retry')&&!byId('agworld-game-loader-retry').hidden&&byId('agworld-game-loader')?.classList.contains('is-active');
    const loaded=(w.__AGWORLD_SOURCE_TIMINGS__||[]).length;
    // The boot owner removes each inert source after execution. Include both
    // completed and remaining steps rather than counting removed declarations.
    const expected=loaded+doc.querySelectorAll('script[type="text/agworld-deferred-script"]').length;
    report.boot=failed?'FAILED':ready?'READY':byId('ag-login-gate')?'LOGIN':'LOADING';
    report.map=w.__AGWORLD_WORLD_BOOTED__?'READY':failed?'CHECK':'WAITING';
    report.screen=safe(()=>w.AGWorldPlayerMenu.getScreen(),'Not ready');
    const counts=report.counts;
    counts.farms=safe(()=>world.farms.length,0);counts.contractors=safe(()=>world.getContractors().length,0);
    counts.competitors=safe(()=>world.getCompetitors().length,0);counts.facilities=safe(()=>world.getCompanyFacilities().length,0);
    counts.total=counts.farms+counts.contractors+counts.competitors+counts.facilities;
    const required=(ok)=>ok?'pass':ready?'fail':'warn';
    add('boot','Login & loading',failed?'fail':ready?'pass':'warn',[
      ['Current phase',report.boot],['Boot audit',boot?.regression?.pass===true?'Passed':boot?.regression?.pass===false?'Failed':'Not completed'],
      ['Loading message',clean(byId('agworld-game-loader-status')?.textContent)],['Missing components',boot?.regression?.missing?.join(', ')||'None reported']
    ],'Ready means the existing startup audit has passed.');
    add('sources','Game interface sources',required(!!w.__AGWORLD_GAME_BOOTED__),[
      ['Completed game steps',loaded],['Total game steps (files + inline)',expected],['Ordered boot complete',!!w.__AGWORLD_GAME_BOOTED__],['Three.js revision',w.THREE?.REVISION||'Not loaded']
    ]);
    add('map','Map & world',required(!!w.__AGWORLD_WORLD_BOOTED__),[
      ['World readiness',!!w.__AGWORLD_WORLD_BOOTED__],['Map element',!!byId('map')],['Google Maps runtime',!!w.google?.maps],['World interface',!!world],['Loaded entities',counts.total]
    ],'Uses current world readiness; no legacy Leaflet or global-map assumptions.');
    const player=safe(()=>w.AGWorldProgression.getState(),{});
    add('player','Player & mission progression',required(!!player.playerName&&!!w.AGWorldPlayerMenu),[
      ['Player data ready',!!player.playerName],['Progression service',!!w.AGWorldProgression],['Level',Number(player.level)||1],['Completed missions',Object.keys(player.completed||{}).length]
    ]);
    const nav=q('.sidebar .nav'),buttons=[...(nav?.querySelectorAll('[data-ag-screen]')||[])],active=buttons.filter(b=>b.getAttribute('aria-current')==='page');
    const routes=['dashboard','profile','pipeline','clients','products','after-sales','mission-history','ai-assistant','territory-campaigns','territory-graphics','settings','logout'];
    const missing=routes.filter(key=>!buttons.some(b=>b.dataset.agScreen===key));
    const panel=byId('agMenuPanel'),selection=active.length===1&&active[0].dataset.agScreen===report.screen;
    const correctPanel=!!panel&&(report.screen==='dashboard'?panel.hidden:!panel.hidden);
    add('navigation','Sidebar & panel navigation',required(!missing.length&&selection&&correctPanel),[
      ['Current screen',report.screen],['Routes available',routes.length-missing.length+' / '+routes.length],['One matching selection',selection],['Panel visibility matches selection',correctPanel],['Missing routes',missing.join(', ')||'None']
    ]);
    const dashboard=['agPlayerMissionProfile','agPlayerSalesFunnel','agCanonicalMissionCard','agAdvisorBay'];
    add('dashboard','Dashboard components',required(dashboard.every(id=>!!byId(id)?.isConnected)),dashboard.map(id=>[{'agPlayerMissionProfile':'Player profile','agPlayerSalesFunnel':'Sales funnel','agCanonicalMissionCard':'Mission card','agAdvisorBay':'Advisor pane'}[id],!!byId(id)?.isConnected]),'Panels remain mounted while another menu screen is open.');
    const rect=el=>el?.getBoundingClientRect(),side=rect(q('.sidebar')),mission=rect(q('.missions')),map=rect(q('.map-area'));
    const joined=!!side&&!!mission&&!!map&&Math.abs(side.right-mission.left)<3&&Math.abs(mission.right-map.left)<3;
    add('layout','Screen layout',required(joined&&!!byId('entityInformationSection')&&!!byId('territoryStatsDrawer')),[
      ['Sidebar, panels and map aligned',joined],['Command Center',!!byId('entityInformationSection')],['Territory drawer',!!byId('territoryStatsDrawer')],['Layout lock',!!w.__AGWORLD_MAIN_LAYOUT_LOCKED__]
    ],'Checks the current floating Command Center and territory drawer layout.');
    add('entities','Entity & fleet services',required(!!world&&!!w.AGWorldFleetUI),[
      ['Farms',counts.farms],['Contractors',counts.contractors],['Company facilities',counts.facilities],['Competitors',counts.competitors],['Fleet interface',!!w.AGWorldFleetUI],['Entity detail host',byId('agworldV2FarmDetailHost')?'Mounted':'Not active; select an entity to test']
    ],'Service availability is checked here. Opening a fleet transaction remains an explicit manual test.');
    add('backend','Backend connection','warn',[
      ['Shared backend interface',!!w.AGWorldBackend],['API health', 'Use CHECK API to probe the health endpoint']
    ],'An available client or local storage is not proof of a healthy server.');
    report.timeline=(safe(()=>boot.getTimeline(),[])||[]).map(x=>({stage:clean(x.stage),ms:Number(x.ms)||0}));
    report.events=(safe(()=>w.AGWorldRuntimeEvents.getEvents(),[])||[]).map(x=>({time:clean(x.time),type:clean(x.type),message:clean(x.message),level:x.level==='error'?'error':'warn'}));
    const errors=report.events.filter(e=>e.level==='error').length;
    add('runtime','Runtime error capture',errors?'fail':report.events.length?'warn':'pass',[
      ['Runtime errors',errors],['Resource warnings',report.events.length-errors],['Capture service',!!w.AGWorldRuntimeEvents]
    ],'Captures from startup in the connected game. No captured errors does not prove every feature has been exercised.');
    return report;
  }
  window.AGWorldDeveloperDiagnostics={collect,clean};
})();
