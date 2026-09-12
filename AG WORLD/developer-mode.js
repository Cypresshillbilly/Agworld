(()=>{const $=id=>document.getElementById(id);let auto=true,errors=[];const opener=()=>{try{return window.opener&&!window.opener.closed&&window.opener.location.origin===location.origin?window.opener:null}catch(e){return null}};const root=()=>opener()||window;
function value(fn,fallback='Unavailable'){try{const v=fn();return v??fallback}catch(e){return fallback}}
function getWorld(w){return w.AG_WORLD_WORLD||{}}
function entityCounts(w){const world=getWorld(w);const farms=Array.isArray(world.farms)?world.farms.length:0;const contractors=value(()=>world.getContractors().length,0);const competitors=value(()=>world.getCompetitors().length,0);const facilities=value(()=>world.getCompanyFacilities().length,0);return {farms,contractors,competitors,facilities,total:farms+contractors+competitors+facilities}}
function relationshipData(w){const s=w.marketInfluenceState||w.relationshipState||w.relationshipNetworkState||{};const candidates=[s.relationships,w.relationships,w.AG_WORLD_RELATIONSHIPS];for(const x of candidates)if(Array.isArray(x))return x;return []}
function eventData(w){const e=w.worldEventState||w.worldEventsState||w.AG_WORLD_WORLD_EVENTS||{};if(Array.isArray(e))return e;if(Array.isArray(e.events))return e.events;return []}
function yes(v){return v===true||!!v}
let currentFilter='all',latestReport=null,apiCheck=null,clearedThrough='';
function diag(){const w=root(),report=window.AGWorldDeveloperDiagnostics.collect(opener());if(apiCheck){const check=report.checks.find(c=>c.id==='backend');if(check){check.state=apiCheck.ok?'pass':'fail';check.items[1]=['API health',apiCheck.label];check.note='Health endpoint checked at '+apiCheck.at+'. This does not validate every database operation.';}}latestReport=report;return {w,counts:report.counts,report,checks:report.checks,rels:relationshipData(w),events:eventData(w)}}

function fleetApi(w){return w.AGWorldFleetUI||null}
function selectedFleetEntity(w){return fleetApi(w)?.selected?.()||null}
function setFleetStatus(message,state=''){const el=$('fleetDevStatus');if(!el)return;el.textContent=message;el.className='population-status '+state}
function syncFleetControls(){const w=root(),api=fleetApi(w),selectedEntity=selectedFleetEntity(w);const ids=['fleetReassert','fleetOpenSell','fleetOpenHistory'];ids.forEach(id=>{const b=$(id);if(b)b.disabled=!(api&&selectedEntity)});if(!api){setFleetStatus(opener()?'WAITING · Fleet public bridge is not ready yet.':'OPEN THIS PAGE FROM AG WORLD to access the live Fleet system.','warn');return}if(!selectedEntity){setFleetStatus('READY · Fleet system is available. Select a Farm or Contractor in the AG World tab, then return here.','warn');$('fleetDevNote').textContent='No eligible Farm or Contractor is currently selected.';return}setFleetStatus('SELECTED · '+selectedEntity.type.toUpperCase()+' · '+(selectedEntity.name||selectedEntity.id)+' · Fleet controls can now be tested.','ready');$('fleetDevNote').textContent='Selected entity ID: '+selectedEntity.id}
function fleetOverlayReady(w,el){
  if(!el)return false;
  const cs=w.getComputedStyle?.(el);
  return !!cs && cs.position==='fixed' && Number(cs.zIndex||0)>=1000;
}
function fleetModalState(w,el){
  if(!el)return 'MISSING';
  return el.hidden?'CLOSED':'OPEN';
}
function checkFleetSystem(){
  const w=root(),api=fleetApi(w),sell=!!w.openFleetTransaction,history=!!w.openFleetManagement,
    tx=w.document?.getElementById('fleetTransactionModal'),mg=w.document?.getElementById('fleetManagementModal');
  let health=null;
  try{health=api?.health?.({repair:false})||null}catch(e){capture('FLEET HEALTH',e?.message||e)}
  const ui=health?.healthy===true;
  const txOverlay=fleetOverlayReady(w,tx),mgOverlay=fleetOverlayReady(w,mg);
  const pass=!!(api&&sell&&history&&tx&&mg&&ui&&txOverlay&&mgOverlay);
  setFleetStatus((pass?'PASS · ':'WARN · ')+'API: '+(sell?'SELL OK':'SELL MISSING')+' · '+(history?'HISTORY OK':'HISTORY MISSING')+' · Transaction: '+(txOverlay?'OVERLAY READY':'OVERLAY STYLE FAILED')+' ('+fleetModalState(w,tx)+') · History: '+(mgOverlay?'OVERLAY READY':'OVERLAY STYLE FAILED')+' ('+fleetModalState(w,mg)+') · Visible Fleet UI: '+(ui?'READY':'NOT READY'),pass?'ready':'warn');
  syncFleetControls();
  return {...(health||{}),transactionOverlayReady:txOverlay,historyOverlayReady:mgOverlay,transactionModalState:fleetModalState(w,tx),historyModalState:fleetModalState(w,mg)};
}
function fleetSelectedOrWarn(){const w=root(),s=selectedFleetEntity(w);if(!s)throw new Error('Select a Farm or Contractor in AG World first.');return {w,s}}
function reassertFleet(){try{const {w,s}=fleetSelectedOrWarn();const r=fleetApi(w).ensureQuickActions(s.type,s.id);setFleetStatus('BUTTONS REASSERTED · '+s.name+' now has the dedicated Fleet quick-action host.','ready');checkFleetSystem();return r}catch(e){setFleetStatus('REASSERT FAILED · '+(e?.message||e),'error');capture('FLEET UI',e?.message||e)}}
function openFleetSellFromDev(){
  try{
    const {w,s}=fleetSelectedOrWarn(); w.openFleetTransaction(s.type,s.id);
    const modal=w.document?.getElementById('fleetTransactionModal');
    if(!modal||modal.hidden)throw new Error('Transaction action ran but the modal did not enter OPEN state.');
    setFleetStatus('PASS · TRANSACTION MODAL OPEN and visible overlay style verified.','ready');
  }catch(e){setFleetStatus('SELL TEST FAILED · '+(e?.message||e),'error');capture('FLEET SELL',e?.message||e)}
}
async function openFleetHistoryFromDev(){
  try{
    const {w,s}=fleetSelectedOrWarn(); await w.openFleetManagement(s.type,s.id);
    const modal=w.document?.getElementById('fleetManagementModal');
    if(!modal||modal.hidden)throw new Error('History action ran but the modal did not enter OPEN state.');
    setFleetStatus('PASS · FLEET HISTORY MODAL OPEN and visible overlay style verified.','ready');
  }catch(e){setFleetStatus('HISTORY TEST FAILED · '+(e?.message||e),'error');capture('FLEET HISTORY',e?.message||e)}
}

function populationReady(w){return !!(w.AGWorldDemoWorldSeed?.run && w.AGWorldDynamicEntityAPI?.create && w.AGWorldDynamicEntityAPI?.createRelationship && w.AGWorldDynamicEntityAPI?.repairUniqueContractorFarmAssignments && w.AGWorldDynamicEntityAPI?.snapshotExistingAsDemo)}
function setPopulationStatus(message,state=''){const el=$('populationStatus');if(!el)return;el.textContent=message;el.className='population-status '+state}
function syncPopulationControls(){const w=root(),ready=populationReady(w),connected=!!opener();const run=$('populationRun'),repair=$('populationRepair'),demo=$('populationDemo');if(!run)return;if(ready){setPopulationStatus('SYSTEM STABLE · Creation services ready. The live map remains idle until you explicitly start a process.','ready')}else if(connected){setPopulationStatus('WAITING · AG World is still initialising its creation services.','warn')}else{setPopulationStatus('OPEN THIS PAGE FROM THE AG WORLD DEVELOPER MODE MENU to access live population controls.','warn')}[run,repair,demo].forEach(b=>b.disabled=!ready)}
async function runPopulation(){const w=root();if(!populationReady(w))return;if(!confirm('Create the 5 Company Facilities and 50 Contractors now? This is a controlled, one-time demo population process.'))return;const b=$('populationRun');b.disabled=true;b.textContent='POPULATING WORLD…';setPopulationStatus('POPULATION STARTED · The map remains interactive while entities and relationships are created.');try{const r=await w.AGWorldDemoWorldSeed.run();setPopulationStatus('COMPLETE · '+r.facilities+' facilities and '+r.contractors+' contractors processed.','ready');b.textContent='WORLD POPULATED'}catch(e){setPopulationStatus('FAILED · '+(e?.message||'Unknown error'),'error');b.disabled=false;b.textContent='RETRY CONTROLLED POPULATION';capture('POPULATION',e?.message||e)}}
async function repairPopulation(){const w=root();if(!populationReady(w))return;const b=$('populationRepair');b.disabled=true;b.textContent='CHECKING ASSIGNMENTS…';try{const p=await w.AGWorldDynamicEntityAPI.repairUniqueContractorFarmAssignments({preview:true});if(!p.conflictingFarms){setPopulationStatus('CHECK COMPLETE · '+p.farmsChecked+' Farm assignments checked. No duplicate active Contractor assignments were found.','ready');b.textContent='ASSIGNMENTS ALREADY VALID';return}if(!confirm(p.conflictingFarms+' Farms have duplicate active Contractor assignments. '+p.duplicateRelationships+' duplicate relationships will be made inactive, keeping one active Contractor per Farm. Continue?')){setPopulationStatus('REPAIR CANCELLED · No relationships were changed.','warn');b.disabled=false;b.textContent='CHECK & REPAIR FARM ASSIGNMENTS';return}b.textContent='REPAIRING…';const r=await w.AGWorldDynamicEntityAPI.repairUniqueContractorFarmAssignments();setPopulationStatus('REPAIR COMPLETE · '+r.conflictingFarms+' Farms reconciled · '+r.deactivated.length+' duplicate assignments made inactive.','ready');b.textContent='ASSIGNMENTS REPAIRED'}catch(e){setPopulationStatus('REPAIR FAILED · '+(e?.message||'Unknown error'),'error');b.disabled=false;b.textContent='RETRY ASSIGNMENT REPAIR';capture('REPAIR',e?.message||e)}}
async function snapshotCompetitors(){const w=root();if(!populationReady(w))return;if(!confirm('Mark all currently existing Competitor records as DEMO data? Future user-created entities will remain live.'))return;const b=$('populationDemo');b.disabled=true;b.textContent='MARKING DEMO BASELINE…';try{const r=await w.AGWorldDynamicEntityAPI.snapshotExistingAsDemo('competitor');setPopulationStatus('DEMO BASELINE CAPTURED · '+r.marked+' existing Competitor records marked as demo data.','ready');b.textContent='COMPETITOR DEMO BASELINE SAVED';$('populationNote').textContent='Current Farms and seeded Contractors are already demo records. Current Competitors are now explicitly classified as demo. Future user-created entities are saved as live.'}catch(e){setPopulationStatus('DEMO BASELINE FAILED · '+(e?.message||'Unknown error'),'error');b.disabled=false;b.textContent='RETRY DEMO BASELINE';capture('DEMO BASELINE',e?.message||e)}}
function renderEntityCommandDiagnostic(){
  const el=$('entityCommandDiagnostic'); if(!el)return;
  const w=root(),doc=w.document,d=w.__AGWORLD_ENTITY_COMMAND_DIAGNOSTIC__||{};
  const bool=v=>v===true?'PASS':v===false?'FAIL':'WAITING';
  const list=(arr,labels)=>labels.map((label,i)=>'<div class="check"><span>'+label+'</span><b class="'+(arr?.[i]===false?'bad':arr?.[i]===true?'ok':'warning')+'">'+bool(arr?.[i])+'</b></div>').join('');
  const expected=['details','intelligence','lifecycle','spatial','relationships','activity','documents','media','notes'];
  const tabs=d.tabs||[],coverage=expected.map(t=>tabs.includes(t));
  const active=d.activeTab||'NONE';
  const card=doc?.getElementById('farmCard'),host=doc?.getElementById('agworldV2FarmDetailHost');
  const r=card?.getBoundingClientRect(),er=doc?.getElementById('entityInformationSection')?.getBoundingClientRect();
  const fill=!!r&&!!er&&Math.abs(r.width-er.width)<4&&Math.abs(r.height-er.height)<4;
  const checks=[
    ['Entity Command card',!!card],
    ['Card fills allocated section',fill],
    ['V2 entity host',!!host],
    ['V2 panel rendered',!!host?.querySelector('.agworld-v2-detail-panel')],
    ['Legacy summary metrics',(d.summaryMetrics||[]).length===7&&(d.summaryMetrics||[]).every(Boolean)],
    ['Quick-action controls',(d.quickActions||[]).length===4&&(d.quickActions||[]).every(Boolean)],
    ['All Farm management tabs',coverage.every(Boolean)],
    ['Active tab',active]
  ];
  const state=checks.every(([,v])=>v===true||typeof v==='string')&&coverage.every(Boolean)?'pass':'warn';
  el.innerHTML='<div class="entity-command-status '+state+'">'+(state==='pass'?'PASS · PRIMARY ENTITY COMMAND INTERFACE READY':'WARN · ENTITY COMMAND INTERFACE HAS MISSING ELEMENTS')+'</div>'+
    '<div class="entity-command-grid">'+checks.map(([k,v])=>'<div class="check"><span>'+k+'</span><b class="'+(v===true||typeof v==='string'?'ok':v===false?'bad':'warning')+'">'+(typeof v==='string'?esc(v):bool(v))+'</b></div>').join('')+
    '<div class="check"><span>Tab coverage</span><b class="'+(coverage.every(Boolean)?'ok':'bad')+'">'+coverage.filter(Boolean).length+' / '+expected.length+'</b></div></div>'+
    '<div class="entity-command-tabs">'+expected.map((t,i)=>'<span class="'+(coverage[i]?'ok':'bad')+'">'+t+'</span>').join('')+'</div>'+
    '<small>Rendered: '+(d.renderedAt?new Date(d.renderedAt).toLocaleTimeString():'waiting for live render')+' · Active management tab: '+esc(active)+'</small>';
}
function renderEntitySelectionDiagnostic(){
  const el=$('entitySelectionDiagnostic'); if(!el)return;
  const w=root(),doc=w.document,d=w.__AGWORLD_ENTITY_COMMAND_DIAGNOSTIC__||{};
  const card=doc?.getElementById('farmCard'),host=doc?.getElementById('agworldV2FarmDetailHost');
  const dyn=w.AGWorldV2?.LiveDynamicEntityDetailBridge, farm=w.AGWorldV2?.LiveFarmDetailBridge;
  const events=Array.isArray(d.events)?d.events:[];
  const selected=events.slice().reverse().find(x=>x.entityId)||d.last||{};
  const checks=[
    ['Selected entity ID',selected.entityId||'NONE'],['Selected entity type',selected.entityType||'NONE'],['Current command scope',w.__AGWORLD_ENTITY_COMMAND_SCOPE__||'NONE'],['Startup mode',w.__AGWORLD_ENTITY_COMMAND_STARTUP__||'NONE'],
    ['Entity card connected',!!card?.isConnected],['Company card still active',!!card?.classList?.contains('agworld-company-entity-card')],['V2 host exists',!!host],['V2 host connected',!!host?.isConnected],['V2 host parent',host?.parentElement?.id||'NONE'],['V2 panel visible in host',!!host?.querySelector('.agworld-v2-detail-panel')],
    ['Dynamic bridge installed',!!dyn],['Dynamic bridge uses visible host',!!dyn&&dyn.__host===host&&!!dyn.__host?.isConnected],['Farm bridge installed',!!farm],['Farm bridge uses visible host',!!farm&&farm.__host===host&&!!farm.__host?.isConnected]
  ];
  const status=events.length?'LIVE TRACE CAPTURED':'WAITING FOR ENTITY SELECTION';
  const rows=checks.map(([k,v])=>{const good=v===true||typeof v==='string'&&v!=='NONE';const bad=v===false||v==='NONE';return '<div class="check"><span>'+esc(k)+'</span><b class="'+(good?'ok':bad?'bad':'warning')+'">'+esc(String(typeof v==='boolean'?(v?'PASS':'FAIL'):v))+'</b></div>'}).join('');
  const trace=events.slice(-14).reverse().map(e=>'<div class="check"><span>'+esc(new Date(e.time).toLocaleTimeString())+' · '+esc(e.stage)+'</span><b class="'+(String(e.stage).includes('ERROR')?'bad':e.panel?'ok':'warning')+'">'+esc((e.entityType||'')+' '+(e.entityName||e.entityId||''))+'</b></div>').join('')||'<div class="check"><span>No map-click trace captured yet.</span><b class="warning">WAITING</b></div>';
  el.innerHTML='<div class="entity-command-status '+(events.length?'warn':'warn')+'">'+status+'</div><div class="entity-command-grid">'+rows+'</div><div style="margin-top:12px"><span class="eyebrow">LATEST HANDOFF EVENTS</span><div class="checks">'+trace+'</div></div>';
}
function applyFilter(){
  document.querySelectorAll('.toolbar button[data-filter]').forEach(b=>{const active=b.dataset.filter===currentFilter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('#diagnosticPanels .panel').forEach(p=>p.hidden=currentFilter!=='all'&&p.dataset.state!==currentFilter);
}
function render(){
  const d=diag(),report=d.report,connected=report.connected;
  $('connectionState').textContent=connected?'CONNECTED TO LIVE GAME':'NO GAME CONNECTION';
  $('connectionState').style.color=connected?'var(--green)':'var(--amber)';
  $('appStatus').textContent=report.boot;$('mapStatus').textContent=report.map;$('entityTotal').textContent=connected?d.counts.total:'—';
  $('relationshipTotal').textContent=report.checks.filter(c=>c.state==='pass').length;
  $('eventTotal').textContent=report.checks.filter(c=>c.state!=='pass').length;
  $('errorTotal').textContent=report.events.filter(e=>e.level==='error').length;
  $('diagnosticTimestamp').textContent='Updated '+new Date(report.capturedAt).toLocaleTimeString()+' · Screen: '+report.screen;
  const collapsed=new Set([...document.querySelectorAll('#diagnosticPanels .collapsed')].map(el=>el.dataset.check));
  $('diagnosticPanels').innerHTML=d.checks.map(p=>'<article class="panel'+(collapsed.has(p.id)?' collapsed':'')+'" data-check="'+p.id+'" data-state="'+p.state+'"><button class="panel-head" type="button" aria-expanded="'+!collapsed.has(p.id)+'"><h2>'+esc(p.name)+'</h2><span class="badge '+p.state+'">'+p.state.toUpperCase()+'</span></button><div class="panel-body"><div class="checks">'+p.items.map(([k,v])=>'<div class="check"><span>'+esc(k)+'</span><b>'+esc(typeof v==='boolean'?(v?'Yes':'No'):v)+'</b></div>').join('')+'</div><p class="check-note">'+esc(p.note)+'</p></div></article>').join('');
  document.querySelectorAll('#diagnosticPanels .panel-head').forEach(button=>button.onclick=()=>{const panel=button.closest('.panel');panel.classList.toggle('collapsed');button.setAttribute('aria-expanded',String(!panel.classList.contains('collapsed')));});
  $('bootTimeline').innerHTML=report.timeline.length?report.timeline.map(x=>'<div class="timeline-stage"><span>'+esc(x.stage)+'</span><b>'+(x.ms/1000).toFixed(2)+' s</b></div>').join(''):'Waiting for a connected game startup.';
  applyFilter();renderErrors();
  if($('advancedDiagnostics').open&&connected){renderEntityCommandDiagnostic();renderEntitySelectionDiagnostic();renderStorage();syncPopulationControls();syncFleetControls();}
}
function renderErrors(){const log=[...(latestReport?.events||[]).filter(e=>e.time>clearedThrough),...errors];$('errorLog').textContent=log.length?log.map(e=>'['+e.time+'] '+e.type+'\n'+window.AGWorldDeveloperDiagnostics.clean(e.message)).join('\n\n'):'No errors captured in this view.';}
function renderStorage(){const w=opener();$('storageState').textContent=w?'Local preferences available: '+value(()=>w.localStorage.length,0)+' keys. Authentication values and saved record contents are intentionally excluded.':'Connect from the game to inspect storage availability.';}
async function checkApi(){const button=$('checkApi');button.disabled=true;button.textContent='CHECKING API…';try{const response=await fetch('https://ag-world-api.onrender.com/api/health',{signal:AbortSignal.timeout(10000),credentials:'omit',cache:'no-store'});apiCheck={ok:response.ok,label:'HTTP '+response.status,at:new Date().toLocaleTimeString()};}catch(_){apiCheck={ok:false,label:'Connection failed or timed out',at:new Date().toLocaleTimeString()};}finally{button.disabled=false;button.textContent='CHECK API';render();}}
function saveReport(){diag();const blob=new Blob([JSON.stringify(latestReport,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='agworld-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function capture(type,message){errors.unshift({time:new Date().toLocaleTimeString(),type,message:String(message)});if(errors.length>100)errors.pop();renderErrors();$('errorTotal').textContent=errors.length}
window.addEventListener('error',e=>capture('ERROR',e.message));window.addEventListener('unhandledrejection',e=>capture('PROMISE',e.reason?.message||e.reason));
$('fleetCheck').onclick=checkFleetSystem;$('fleetReassert').onclick=reassertFleet;$('fleetOpenSell').onclick=openFleetSellFromDev;$('fleetOpenHistory').onclick=openFleetHistoryFromDev;
$('populationRun').onclick=runPopulation;$('populationRepair').onclick=repairPopulation;$('populationDemo').onclick=snapshotCompetitors;
$('refreshDiagnostics').onclick=render;$('refreshStorage').onclick=renderStorage;$('checkApi').onclick=checkApi;$('saveDiagnosticReport').onclick=saveReport;
$('clearErrors').onclick=()=>{errors=[];clearedThrough=new Date().toISOString();renderErrors()};
$('toggleAuto').onclick=e=>{auto=!auto;e.currentTarget.textContent='AUTO REFRESH: '+(auto?'ON':'OFF');e.currentTarget.setAttribute('aria-pressed',String(auto))};
$('expandAll').onclick=()=>document.querySelectorAll('#diagnosticPanels .panel').forEach(x=>{x.classList.remove('collapsed');x.querySelector('button').setAttribute('aria-expanded','true')});
$('collapseAll').onclick=()=>document.querySelectorAll('#diagnosticPanels .panel').forEach(x=>{x.classList.add('collapsed');x.querySelector('button').setAttribute('aria-expanded','false')});
document.querySelectorAll('.toolbar button[data-filter]').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;applyFilter()});
$('advancedDiagnostics').addEventListener('toggle',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&auto)render()});
setInterval(()=>{if(auto&&!document.hidden)render()},2500);render();
})();
