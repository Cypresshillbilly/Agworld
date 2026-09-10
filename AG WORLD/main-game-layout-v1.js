(function(){
  const $=id=>document.getElementById(id);

  function ensurePanel(id, after, className){
    let node=$(id);
    if(!node){
      node=document.createElement('section');
      node.id=id;
      if(className) node.className=className;
      after.insertAdjacentElement('afterend',node);
    }
    return node;
  }

  function ensureEntityCommandHeading(entitySection){
    if(!entitySection) return null;
    let heading=$('entityCommandCentreHeading');
    if(!heading){
      heading=document.createElement('div');
      heading.id='entityCommandCentreHeading';
      heading.innerHTML='<span class="agworld-command-center-label">COMMAND CENTER</span><span class="agworld-command-center-live"><i></i> LIVE</span>';
      entitySection.insertBefore(heading,entitySection.firstChild);
    }
    return heading;
  }

  function moveCorePanels(){
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return false;

    // Territory Stats is now a collapsible map drawer. It no longer consumes
    // the entire bottom-left stage, leaving Sidebar and My Missions full height.
    const entitySection=ensurePanel('entityInformationSection',mapArea,'bottom-game-panel entity-game-panel');

    const territoryPanel=$('territoryInfoPanel');
    let territoryDrawer=$('territoryStatsDrawer');
    if(!territoryDrawer){
      territoryDrawer=document.createElement('aside');
      territoryDrawer.id='territoryStatsDrawer';
      territoryDrawer.className='ag-territory-drawer';
      territoryDrawer.innerHTML='<button id="territoryStatsToggle" type="button" aria-label="Toggle Territory Stats" aria-expanded="true"><span class="ag-territory-toggle-label">TERRITORY STATS</span><span class="ag-territory-toggle-arrow">›</span></button><div id="territoryStatsDrawerContent"></div>';
      mapArea.appendChild(territoryDrawer);
      territoryDrawer.querySelector('#territoryStatsToggle').addEventListener('click',()=>{
        const collapsed=territoryDrawer.classList.toggle('collapsed');
        territoryDrawer.querySelector('#territoryStatsToggle').setAttribute('aria-expanded',String(!collapsed));
      });
    }
    const drawerContent=$('territoryStatsDrawerContent');
    if(territoryPanel && drawerContent && territoryPanel.parentElement!==drawerContent) drawerContent.appendChild(territoryPanel);
    if(territoryPanel && !territoryPanel.classList.contains('show') && !territoryPanel.innerHTML.trim()){
      territoryPanel.classList.add('show');
      territoryPanel.innerHTML='<div class="territory-info-empty"><div class="territory-info-level">TERRITORY CONTROL</div><div class="territory-info-name">Select a territory on the map</div><div class="territory-info-footer"><span>Territory statistics will remain fixed here after selection.</span></div></div>';
    }

    const card=$('farmCard');
    if(card && card.parentElement!==entitySection) entitySection.appendChild(card);
    ensureEntityCommandHeading(entitySection);
    return true;
  }

  function moveBadges(){
    const missions=document.querySelector('.missions');
    const source=document.querySelector('.user-achievements');
    if(!missions || !source) return false;
    let target=$('badgesEarnedSection');
    if(!target){
      target=document.createElement('section');
      target.id='badgesEarnedSection';
      target.innerHTML='<div class="badges-earned-title">Badges Earned</div>';
      const all=[...missions.querySelectorAll('*')];
      const skill=all.find(el=>el.children.length===0 && /skill profile/i.test((el.textContent||'').trim()));
      if(skill){
        const block=skill.closest('section,div') || skill;
        block.insertAdjacentElement('afterend',target);
      }else{
        const cards=[...missions.querySelectorAll('.mission')];
        if(cards.length) cards[0].insertAdjacentElement('beforebegin',target);
        else missions.appendChild(target);
      }
    }
    const badges=source.querySelector('.badges');
    if(badges && badges.parentElement!==target) target.appendChild(badges);
    source.remove();
    return true;
  }

  function moveProgress(){
    const menuUser=document.querySelector('.menu-user');
    if(!menuUser) return false;
    if(!menuUser.querySelector('.menu-user-progress-title')){
      const title=document.createElement('span');
      title.className='menu-user-progress-title';
      title.textContent='Your Progress';
      const xp=menuUser.querySelector('.menu-user-xp');
      if(xp) menuUser.insertBefore(title,xp); else menuUser.appendChild(title);
    }
    return true;
  }

  function ensureRegionWindow(){
    if($('regionWindow')) return $('regionWindow');
    const win=document.createElement('div');
    win.id='regionWindow';
    win.innerHTML='<div class="region-window-card" role="dialog" aria-modal="true" aria-label="My Region"><div class="region-window-head"><div><div class="eyebrow">AG WORLD · STRATEGIC AREA</div><h2>MY REGION</h2></div><button type="button" data-region-close>×</button></div><div class="region-window-body"><div id="regionWindowContent">Loading regional intelligence…</div></div></div>';
    document.body.appendChild(win);
    win.addEventListener('click',event=>{ if(event.target===win || event.target.closest('[data-region-close]')) win.classList.remove('show'); });
    return win;
  }

  function openMyRegion(){
    const win=ensureRegionWindow();
    const content=$('regionWindowContent');
    const mapTitle=document.querySelector('.map-title')?.textContent||'Current territory';
    const selectedTerritory=window.__AGWORLD_SELECTED_TERRITORY__ || null;
    content.innerHTML='<div class="farm-info-hero"><span>REGIONAL COMMAND</span><h3>'+(selectedTerritory?.name || mapTitle)+'</h3><p>Regional information is presented here as a dedicated window while the main game screen remains unchanged.</p></div><div id="regionWindowDynamic"></div>';
    win.classList.add('show');
    window.dispatchEvent(new CustomEvent('agworld:open-my-region',{detail:{host:content}}));
  }

  function wireMyRegion(){
    const buttons=[...document.querySelectorAll('button')].filter(btn=>{
      const text=(btn.textContent||'').replace(/\s+/g,' ').trim();
      return btn.dataset.view==='region' || /^.*MY REGION.*$/i.test(text);
    });
    buttons.forEach(btn=>{
      if(btn.dataset.agworldRegionWindowWired==='1') return;
      btn.dataset.agworldRegionWindowWired='1';
      btn.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        openMyRegion();
      },true);
    });
    return buttons.length>0;
  }

  function lockGeometry(){
    const shell=document.querySelector('.app-shell');
    const sidebar=document.querySelector('.sidebar');
    const missions=document.querySelector('.missions');
    const mapArea=document.querySelector('.map-area');
    const territory=$('territorySection');
    const entity=$('entityInformationSection');
    const territoryDrawer=$('territoryStatsDrawer');
    if(!shell) return;

    // The shell is the single geometry owner. Derive the split from the live
    // shell dimensions so responsive scaling cannot leave the left and right
    // bottom panels with different start heights.
    const shellH=shell.clientHeight||820;
    const shellW=shell.clientWidth||1280;
    const bottomH=Math.round(shellH*(210/820));
    const topH=shellH-bottomH;
    const sidebarW=Math.round(shellW*(215/1280));
    const missionsW=Math.round(shellW*(250/1280));
    const leftStage=sidebarW+missionsW;
    const important=(el,prop,val)=>{ if(el) el.style.setProperty(prop,val,'important'); };
    const frame=(el,left,top,width,height)=>{
      if(!el) return;
      important(el,'position','absolute');
      important(el,'left',left+'px');
      important(el,'top',top+'px');
      important(el,'width',width+'px');
      important(el,'height',height+'px');
      important(el,'right','auto');
      important(el,'bottom','auto');
      important(el,'box-sizing','border-box');
    };

    // Sidebar and Missions now run the full height of the game screen.
    // Territory Stats is an overlay drawer on the map instead of a bottom-left panel.
    frame(sidebar,0,0,sidebarW,shellH);
    frame(missions,sidebarW,0,missionsW,shellH);
    // The map is now the full-height tactical background for the right stage.
    // Command Center overlays it instead of reserving a separate strip below it.
    frame(mapArea,leftStage,0,shellW-leftStage,shellH);
    frame(entity,leftStage,topH,shellW-leftStage,bottomH);
    if(entity){
      important(entity,'z-index','1500');
      important(entity,'pointer-events','auto');
      important(entity,'background','transparent');
    }
    if(territory) important(territory,'display','none');
    if(territoryDrawer){
      // Territory Stats remains a right-side pop-out, reshaped into a tall,
      // narrow strategic side panel without occupying the centre of the map.
      important(territoryDrawer,'position','absolute');
      important(territoryDrawer,'left','auto');
      important(territoryDrawer,'top','74px');
      important(territoryDrawer,'right','0');
      important(territoryDrawer,'bottom','14px');
      important(territoryDrawer,'width',Math.min(272,Math.max(228,Math.round((shellW-leftStage)*0.235)))+'px');
      important(territoryDrawer,'height','auto');
      important(territoryDrawer,'transform','none');
      important(territoryDrawer,'z-index','2200');
    }

    // The Command Center remains locked to its approved bottom-right geometry,
    // but now floats as an overlay on top of the full-height map background.
    const entityCard=$('farmCard');
    if(entity && entityCard){
      important(entity,'overflow','hidden');
      important(entityCard,'position','absolute');
      important(entityCard,'left','0');
      important(entityCard,'top','34px');
      important(entityCard,'right','0');
      important(entityCard,'bottom','0');
      important(entityCard,'width','100%');
      important(entityCard,'height','calc(100% - 34px)');
      important(entityCard,'min-height','calc(100% - 34px)');
      important(entityCard,'max-width','none');
      important(entityCard,'max-height','none');
      important(entityCard,'margin','0');
      important(entityCard,'box-sizing','border-box');
      important(entityCard,'z-index','2');
    }
    ensureEntityCommandHeading(entity);

    if(entity) important(entity,'z-index','999');

    const oldProfile=document.querySelector('.bottom.user-profile-section');
    if(oldProfile){
      important(oldProfile,'display','none');
      important(oldProfile,'visibility','hidden');
      important(oldProfile,'pointer-events','none');
    }

    if(entity && entity.parentElement!==shell) shell.appendChild(entity);

    window.__AGWORLD_MAIN_LAYOUT_GEOMETRY__={shellW,shellH,topH,bottomH,sidebarW,missionsW,leftStage,territoryDrawer:true};
  }

  function purgeLegacySurfaces(){
    // These belonged to superseded dashboard layers and must never sit above
    // the canonical Sales Game shell.
    [
      'agControlDashboardButton','agCompanyCommandButton','agControlDashboard','agCompanyCommand',
      'agMenuCompanyCommands','agMenuCompanyControl'
    ].forEach(id=>document.getElementById(id)?.remove());
    document.querySelectorAll('.ag-db-box,.ag-cc-box').forEach(el=>el.closest('#agControlDashboard,#agCompanyCommand')?.remove());
  }

  function run(){
    purgeLegacySurfaces();
    moveCorePanels();
    moveProgress();
    moveBadges();
    wireMyRegion();
    lockGeometry();
    window.__AGWORLD_MAIN_LAYOUT_LOCKED__=true;
  }

  run();
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{ queued=false; run(); });
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>{ run(); setTimeout(run,250); setTimeout(run,1000); setTimeout(run,2500); setTimeout(run,4000); });
  window.addEventListener('resize',run);
  // Late UI scripts must never be allowed to re-own the screen geometry.
  setInterval(lockGeometry,1500);
  window.addEventListener('agworld:territory-selected',event=>{
    window.__AGWORLD_SELECTED_TERRITORY__=event.detail?.territory||event.detail||null;
  });
})();

/* Collapsible Territory Stats map drawer */
(function(){
  if(document.getElementById('agworldTerritoryDrawerStyle'))return;
  const style=document.createElement('style');
  style.id='agworldTerritoryDrawerStyle';
  style.textContent=`
    /* MAP FRAME — hard clipping only. No blurred/cloudy edge can bleed past
       the left or bottom boundary of the playable map. */
    .map-area{
      overflow:hidden!important;
      clip-path:inset(0)!important;
      isolation:isolate!important;
      contain:paint!important;
      border:1px solid rgba(113,151,128,.52)!important;
      border-radius:0!important;
      box-shadow:none!important;
      background:#07151b!important;
    }
    /* Explicit hard edge overlay: prevents any terrain glow, map imagery,
       pseudo-element or GPU anti-aliasing effect from softening the frame. */
    .map-area::after{
      content:""!important;
      position:absolute!important;
      inset:0!important;
      pointer-events:none!important;
      z-index:999999!important;
      border:1px solid rgba(113,151,128,.62)!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    .map-area::before{
      filter:none!important;
      box-shadow:none!important;
      opacity:0!important;
    }
    .map-area>canvas,
    .map-area>svg,
    .map-area .leaflet-container,
    .map-area .mapboxgl-map,
    .map-area .maplibregl-map,
    .map-area .map-container,
    .map-area .map-canvas{
      border-radius:0!important;
      box-shadow:none!important;
      filter:none!important;
    }

    /* TERRITORY STATS — anchored flush to the FAR RIGHT.
       The narrow handle stays at the outer screen edge and the panel opens LEFT. */
    .ag-territory-drawer{
      width:clamp(228px,23.5%,272px);
      height:auto;
      display:flex;
      flex-direction:row-reverse;
      align-items:stretch;
      transition:transform .28s ease,width .28s ease;
      transform-origin:right center;
      filter:none!important;
    }
    .ag-territory-drawer #territoryStatsDrawerContent{
      width:100%;
      min-width:0;
      min-height:0;
      height:100%;
      overflow:hidden;
    }
    .ag-territory-drawer #territoryInfoPanel{
      position:relative!important;
      right:auto!important;
      top:auto!important;
      left:auto!important;
      bottom:auto!important;
      width:100%!important;
      height:100%!important;
      box-sizing:border-box!important;
      margin:0!important;
      border-radius:12px 0 0 12px!important;
      padding:14px 12px!important;
      display:block!important;
      max-height:none!important;
      overflow:auto;
    }
    .ag-territory-drawer #territoryStatsToggle{width:28px;flex:0 0 28px;border:1px solid rgba(142,181,101,.48);border-left:0;border-radius:0 10px 10px 0;background:#10252c;color:#dce9df;cursor:pointer;padding:7px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
    .ag-territory-toggle-label{writing-mode:vertical-rl;transform:rotate(180deg);font-size:7px;font-weight:900;letter-spacing:1px}
    .ag-territory-toggle-arrow{font-size:22px;line-height:1;transition:transform .25s ease}
    .ag-territory-drawer.collapsed{width:28px!important;right:0!important;left:auto!important}
    .ag-territory-drawer.collapsed #territoryStatsDrawerContent{display:none}
    .ag-territory-drawer.collapsed #territoryStatsToggle{border-right:1px solid rgba(142,181,101,.48);border-radius:10px}
    .ag-territory-drawer.collapsed .ag-territory-toggle-arrow{transform:rotate(180deg)}
    .ag-territory-drawer .territory-info-name{font-size:15px!important}
    .ag-territory-drawer .territory-info-control{padding:8px 0 6px!important}
    .ag-territory-drawer .territory-info-control-value{font-size:32px!important}
    .ag-territory-drawer .territory-info-grid{grid-template-columns:repeat(2,1fr)!important}
    .ag-territory-drawer .territory-info-grid div{padding:6px!important}
    @media(max-width:900px){.ag-territory-drawer{top:auto!important;bottom:12px;transform:none!important}.ag-territory-drawer #territoryInfoPanel{max-height:50vh}}
  `;
  document.head.appendChild(style);
})();

/* AG World v4 layout state: national strategic summary remains fixed until a territory is selected. */
(function(){
  const $=id=>document.getElementById(id);
  let userSelected=false;
  let nationalTimer=null;

  function farmList(){
    const world=window.AG_WORLD_WORLD||{};
    return Array.isArray(window.__AG_WORLD_FARMS)?window.__AG_WORLD_FARMS:
      (Array.isArray(world.farms)?world.farms:(world.getFarms?.()||[]));
  }
  function ownership(farm){
    const items=[...(farm?.assets||[]),...(farm?.objects||[])].map(x=>String(x?.type||x?.name||x||'').toLowerCase());
    if(items.some(x=>x.includes('our drone')||x.includes('company drone')||x==='drone')) return 'company';
    if(items.some(x=>x.includes('competitor'))) return 'competitor';
    return 'neutral';
  }
  function nationalSummary(){
    const farms=farmList();
    const total=farms.length;
    const company=farms.filter(f=>ownership(f)==='company').length;
    const competitor=farms.filter(f=>ownership(f)==='competitor').length;
    const neutral=Math.max(0,total-company-competitor);
    const pct=n=>total?Math.round(n/total*100):0;
    return {total,company,competitor,neutral,companyPct:pct(company),competitorPct:pct(competitor),neutralPct:pct(neutral)};
  }
  function renderNationalPanel(){
    if(userSelected) return;
    const panel=$('territoryInfoPanel');
    if(!panel) return false;
    const s=nationalSummary();
    panel.innerHTML=
      '<div class="territory-national-layout">'+
        '<section class="territory-national-left">'+
          '<div class="territory-info-header"><div><div class="territory-info-level">NATIONAL TERRITORY</div><div class="territory-info-name">SOUTH AFRICA · NATIONAL OVERVIEW</div></div></div>'+
          '<div class="territory-info-control"><div class="territory-info-control-value">'+s.companyPct+'%</div><div><div class="territory-info-control-title">THE COMPANY NATIONAL CONTROL</div><div class="territory-info-status territory-info-status-strong">LIVE NATIONAL BASELINE</div></div></div>'+
          '<div class="territory-info-progress"><div class="territory-info-progress-company" style="width:'+s.companyPct+'%"></div><div class="territory-info-progress-enemy" style="width:'+s.competitorPct+'%"></div><div class="territory-info-progress-neutral" style="width:'+s.neutralPct+'%"></div></div>'+
          '<div class="territory-info-legend"><span>🟢 Company '+s.companyPct+'%</span><span>🔴 Competitor '+s.competitorPct+'%</span><span>⚪ Neutral '+s.neutralPct+'%</span></div>'+
        '</section>'+
        '<section class="territory-national-right">'+
          '<div class="territory-info-grid">'+
            '<div><strong>'+s.total+'</strong><span>Total Farms</span></div>'+
            '<div><strong>'+s.company+'</strong><span>Company Control</span></div>'+
            '<div><strong>'+s.competitor+'</strong><span>Competitor</span></div>'+
            '<div><strong>'+s.neutral+'</strong><span>Neutral</span></div>'+
            '<div class="territory-national-scope"><strong>NATIONAL</strong><span>Active Scope</span></div>'+
          '</div>'+
        '</section>'+
      '</div>';
    panel.classList.add('show');
    window.__AGWORLD_TERRITORY_STARTUP__='NATIONAL';
    window.__AGWORLD_TERRITORY_SCOPE__='NATIONAL';
    return true;
  }
  function initialiseNational(){
    if(renderNationalPanel()) return;
    clearTimeout(nationalTimer);
    nationalTimer=setTimeout(initialiseNational,300);
  }
  window.addEventListener('agworld:territory-selected',event=>{
    const territory=event.detail?.territory||event.detail;
    if(!territory) return;
    userSelected=true;
    window.__AGWORLD_TERRITORY_SCOPE__='TERRITORY';
    window.__AGWORLD_TERRITORY_STARTUP__='NATIONAL_THEN_TERRITORY';
  });
  window.addEventListener('load',()=>{ setTimeout(initialiseNational,400); setTimeout(initialiseNational,1200); setTimeout(initialiseNational,3000); });
  document.addEventListener('DOMContentLoaded',()=>setTimeout(initialiseNational,250));
  window.__AGWORLD_RENDER_NATIONAL_TERRITORY__=()=>{userSelected=false;return renderNationalPanel()};
})();


/* AG World v5 entity command startup: The Company portfolio is the default card. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const facilityDefaults={
    'Ballito Company Facility':{employees:24,role:'Head Office & Sales'},
    'Bothaville Company Facility':{employees:14,role:'Sales & Service Hub'},
    'Upington Company Facility':{employees:10,role:'Regional Sales Hub'},
    'Lichtenburg Company Facility':{employees:12,role:'Sales & Support Hub'},
    'Brits Company Facility':{employees:11,role:'Service & Demonstration Centre'}
  };
  let companyCardActive=true;
  // Preserve the real Entity Command Centre shell before the startup Company
  // portfolio temporarily occupies it. Selecting any map entity must restore
  // this shell in the same bottom-right command centre, not open or append a
  // second card somewhere else.
  let entityCommandTemplate=null;

  function captureEntityCommandTemplate(){
    const card=$('farmCard');
    if(!card) return false;
    if(!entityCommandTemplate && !card.classList.contains('agworld-company-entity-card')){
      entityCommandTemplate=card.innerHTML;
    }
    return !!entityCommandTemplate;
  }

  function restoreEntityCommandTemplate(){
    const card=$('farmCard');
    if(!card) return false;
    captureEntityCommandTemplate();
    if(entityCommandTemplate) card.innerHTML=entityCommandTemplate;

    // Replacing innerHTML destroys the old V2 host. Any bridge that captured
    // that detached node must be discarded before the selected entity renders,
    // otherwise it successfully renders into an invisible, detached element and
    // leaves the visible Entity Command Centre as the empty legacy shell.
    if(window.AGWorldV2){
      delete window.AGWorldV2.LiveFarmDetailBridge;
      delete window.AGWorldV2.LiveDynamicEntityDetailBridge;
    }

    card.classList.remove('agworld-company-entity-card');
    delete card.dataset.entityCommandDefault;
    card.classList.add('show');
    return true;
  }

  function facilities(){
    const world=window.AG_WORLD_WORLD||{};
    const list=world.getCompanyFacilities?.()||window.__AG_WORLD_COMPANY_FACILITIES__||[];
    return Array.isArray(list)?list:[];
  }
  function employeeCount(f){
    const d=f?.details||{};
    const n=d.employees??d.employeeCount??f?.employees??f?.employeeCount??facilityDefaults[f?.name]?.employees??0;
    return Math.max(0,Number(n)||0);
  }
  function facilityRole(f){
    const d=f?.details||{};
    return d.facilityType||d.type||d.primaryFunction||facilityDefaults[f?.name]?.role||'Company Facility';
  }
  function facilityLocation(f){
    const d=f?.details||{};
    return [d.nearestTown||d.town,d.province].filter(Boolean).join(', ')||d.municipality||'South Africa';
  }
  function facilityCoordinates(f){
    const d=f?.details||{};
    const candidates=[
      f?.coordinates,f?.coordinate,f?.location?.coordinates,f?.geometry?.coordinates,
      d.coordinates,d.coordinate,d.location?.coordinates,d.geometry?.coordinates
    ];
    for(const c of candidates){
      if(Array.isArray(c) && c.length>=2){
        const a=Number(c[0]), b=Number(c[1]);
        if(Number.isFinite(a)&&Number.isFinite(b)){
          const geoJsonCoordinates=c===f?.geometry?.coordinates || c===d.geometry?.coordinates;
          if(geoJsonCoordinates) return {lat:b,lng:a};
          if(Math.abs(a)<=90 && Math.abs(b)>90) return {lat:a,lng:b};
          if(Math.abs(b)<=90 && Math.abs(a)>90) return {lat:b,lng:a};
          return {lat:a,lng:b};
        }
      }
      if(c && typeof c==='object'){
        const lat=Number(c.lat??c.latitude), lng=Number(c.lng??c.lon??c.longitude);
        if(Number.isFinite(lat)&&Number.isFinite(lng)) return {lat,lng};
      }
    }
    const lat=Number(d.latitude??d.lat??f?.latitude??f?.lat);
    const lng=Number(d.longitude??d.lng??d.lon??f?.longitude??f?.lng??f?.lon);
    return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
  }

  function openCompanyFacility(f){
    if(!f) return false;
    const coordinates=facilityCoordinates(f);
    const payload={entity:f,facility:f,coordinates,source:'company-command-centre'};

    // Prefer the existing GIS/runtime focus hooks. This keeps facility navigation
    // inside the same map workflow used by the live game rather than creating a
    // second map system.
    const focusFns=[
      window.focusEntityOnMap,window.focusMapEntity,window.flyToEntity,
      window.focusCompanyFacility,window.flyToCompanyFacility,
      window.AGWorldGIS?.focusEntity,window.AGWorldGIS?.focusCompanyFacility,
      window.AGWorldMap?.focusEntity,window.AGWorldMap?.focusCompanyFacility,
      window.AG_WORLD_WORLD?.focusEntity,window.AG_WORLD_WORLD?.focusCompanyFacility
    ];
    for(const fn of focusFns){
      if(typeof fn==='function'){
        try{ fn(f,payload); break; }catch(error){ console.warn('Company facility focus hook failed',error); }
      }
    }

    // Leaflet fallback when the live map instance is exposed directly.
    if(coordinates){
      const map=window.AG_WORLD_MAP||window.__AG_WORLD_MAP__||window.map||window.AGWorldMapInstance;
      if(map?.flyTo){
        const zoom=Math.max(Number(map.getZoom?.()||0),13);
        try{ map.flyTo([coordinates.lat,coordinates.lng],zoom,{animate:true,duration:0.9}); }
        catch(_){ try{ map.flyTo({center:[coordinates.lng,coordinates.lat],zoom}); }catch(__){} }
      }else if(map?.setView){
        try{ map.setView([coordinates.lat,coordinates.lng],13,{animate:true}); }catch(_){}
      }
    }

    window.dispatchEvent(new CustomEvent('agworld:focus-entity',{detail:payload}));
    window.dispatchEvent(new CustomEvent('agworld:company-facility-open-request',{detail:payload}));

    // Make the facility the active entity using the existing dynamic-entity
    // selection pipeline, so the map and Entity Command Centre stay in sync.
    window.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected',{detail:{entity:f}}));
    return true;
  }

  function bindCompanyFacilityRows(fs){
    document.querySelectorAll('#farmCard [data-company-facility-id]').forEach(row=>{
      if(row.dataset.agworldFacilityBound==='1') return;
      row.dataset.agworldFacilityBound='1';
      const facility=fs.find(item=>String(item?.id||item?.name||'')===String(row.dataset.companyFacilityId));
      if(!facility) return;
      const activate=()=>{
        document.querySelectorAll('#farmCard .company-facility-row').forEach(node=>node.classList.remove('is-selected'));
        row.classList.add('is-selected');
        openCompanyFacility(facility);
      };
      row.addEventListener('click',activate);
      row.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); activate(); }
      });
    });
  }

  function renderCompanyCard(){
    if(!companyCardActive) return false;
    const card=$('farmCard');
    if(!card) return false;
    captureEntityCommandTemplate();
    const fs=facilities();
    const employees=fs.reduce((sum,f)=>sum+employeeCount(f),0);
    const active=fs.filter(f=>String(f?.status||'active').toLowerCase()!=='inactive').length;
    const provinces=new Set(fs.map(f=>String((f?.details||{}).province||'').trim()).filter(Boolean)).size;

    const facilityRows=fs.length
      ? fs.map(f=>{
          const name=String(f?.name||'Company Facility');
          const role=String(facilityRole(f));
          const location=String(facilityLocation(f));
          const staff=employeeCount(f);
          return '<button type="button" class="company-facility-row" data-company-facility-id="'+String(f?.id||name).replace(/"/g,'&quot;')+'" aria-label="Open '+name.replace(/"/g,'&quot;')+' on map">'+
            '<span class="company-facility-marker"><i></i></span>'+
            '<span class="company-facility-name"><b>'+name+'</b><span>'+role+(location?' · '+location:'')+'</span></span>'+
            '<span class="company-facility-staff"><b>'+staff+'</b><span>STAFF</span></span>'+
            '<span class="company-facility-open">›</span>'+
          '</button>';
        }).join('')
      : '<div class="company-facility-empty">No Company facilities available.</div>';

    card.classList.add('show','agworld-company-entity-card');
    card.dataset.entityCommandDefault='company';
    card.innerHTML=
      '<div class="company-command-split">'+
        '<section class="company-command-stats-pane" aria-label="Company statistics">'+
          '<div class="company-command-pane-title"><span>COMPANY NETWORK</span><b>LIVE OVERVIEW</b></div>'+
          '<div class="company-command-kpis">'+
            '<div><span class="company-kpi-icon">⌂</span><div><b>'+fs.length+'</b><span>FACILITIES</span></div></div>'+
            '<div><span class="company-kpi-icon">◉</span><div><b>'+employees+'</b><span>EMPLOYEES</span></div></div>'+
            '<div><span class="company-kpi-icon">✓</span><div><b>'+active+'</b><span>ACTIVE SITES</span></div></div>'+
            '<div><span class="company-kpi-icon">⌖</span><div><b>'+provinces+'</b><span>PROVINCES</span></div></div>'+
          '</div>'+
          '<div class="company-stats-summary">'+
            '<div><span>NETWORK COVERAGE</span><b>'+provinces+' PROVINCE'+(provinces===1?'':'S')+'</b></div>'+
            '<div><span>ACTIVE FOOTPRINT</span><b>'+active+' / '+fs.length+' SITES LIVE</b></div>'+
          '</div>'+
        '</section>'+
        '<section class="company-command-facilities-pane company-command-right-pane" aria-label="Company capability and facilities">'+
          '<div class="company-command-skills-pane" aria-label="Combined Company skills"><div id="companySkillChartHost" aria-live="polite"></div></div>'+
          '<div class="company-command-facility-side" aria-label="Company facilities"><div class="company-facility-list">'+facilityRows+'</div></div>'+
        '</section>'+
      '</div>';

    bindCompanyFacilityRows(fs);
    // The right half of the Command Center is now Company Skill Intelligence.
    // It uses the exact same five skills as every player and aggregates all
    // completed mission rewards across Company users.
    if(window.AG_WORLD_SKILLS?.renderCompany) setTimeout(()=>window.AG_WORLD_SKILLS.renderCompany(document.getElementById('companySkillChartHost')),0);
    window.__AGWORLD_ENTITY_COMMAND_STARTUP__='THE_COMPANY';
    window.__AGWORLD_ENTITY_COMMAND_SCOPE__='COMPANY';
    window.__AGWORLD_ENTITY_COMMAND_COMPANY_SUMMARY__={facilities:fs.length,employees,activeSites:active,provinces};
    return true;
  }
  function waitForFacilities(){
    if(renderCompanyCard() && facilities().length) return;
    if(companyCardActive) setTimeout(waitForFacilities,700);
  }
  function entityCommandDiag(stage, extra){
    const d=window.__AGWORLD_ENTITY_COMMAND_DIAGNOSTIC__||(window.__AGWORLD_ENTITY_COMMAND_DIAGNOSTIC__={events:[]});
    const card=$('farmCard'), host=$('agworldV2FarmDetailHost');
    const snapshot={time:new Date().toISOString(),stage,...(extra||{}),card:!!card,cardConnected:!!card?.isConnected,companyCard:!!card?.classList?.contains('agworld-company-entity-card'),host:!!host,hostConnected:!!host?.isConnected,hostParent:host?.parentElement?.id||null,hostHTML:host?host.innerHTML.slice(0,220):''};
    d.events.push(snapshot); if(d.events.length>40)d.events.shift(); d.last=snapshot;
    return snapshot;
  }
  window.__AGWORLD_ENTITY_COMMAND_DIAG__=entityCommandDiag;

  // The legacy Farm Card actions are wired by the map/game runtime. Cache the
  // actual DOM node as soon as this layout module loads so later entity-card
  // rebuilds cannot destroy the working buttons and their handlers.
  let agworldPreservedFarmActions = null;

  function captureFarmActions(){
    const live=document.getElementById('farmActions');
    if(live) agworldPreservedFarmActions=live;
    return agworldPreservedFarmActions;
  }

  function openEntityDetailsFromAction(entity){
    // Select the Details tab directly in the already-rendered V2 panel, then
    // invoke its real Edit entity control. Retry briefly because selection and
    // panel rendering complete asynchronously.
    const open=()=>{
      const host=document.querySelector('#agworldV2FarmDetailHost, #agworldV2EntityDetailHost');
      const detailsTab=host?.querySelector('[data-tab="details"]');
      if(detailsTab) detailsTab.click();
      const edit=host?.querySelector('[data-entity-action="edit-details"]');
      if(edit){ edit.click(); return true; }
      return false;
    };
    if(open()) return;
    window.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected',{detail:{entity}}));
    let attempts=0;
    const retry=()=>{
      if(open() || ++attempts>=8) return;
      setTimeout(retry,80);
    };
    setTimeout(retry,0);
  }

  function openEntityHistoryFromAction(entity){
    const host=document.querySelector('#agworldV2FarmDetailHost, #agworldV2EntityDetailHost');
    const history=[...host?.querySelectorAll?.('[data-tab]')||[]].find(node=>/history|activity/i.test(node.dataset.tab||''));
    if(history) history.click();
    else window.dispatchEvent(new CustomEvent('agworld:entity-history-request',{detail:{entity}}));
  }

  function normalizeEntityActionRow(actions, entity){
    if(!actions) return actions;

    /*
     * IMPORTANT: Do not recreate, wrap, replace, or overwrite the legacy Farm
     * Card action handlers here. The real #farmActions DOM node is moved into
     * the new Entity Command Centre specifically so the exact workflow that
     * was working before the screen-layout refactor continues unchanged.
     *
     * This function is therefore presentation-only: it makes the existing
     * controls visible and leaves their IDs, labels, listeners and onclick
     * handlers completely untouched.
     */
    actions.querySelectorAll('button').forEach(button=>{
      button.hidden=false;
      button.removeAttribute('hidden');
      button.style.removeProperty('display');
      button.style.removeProperty('visibility');
      button.style.removeProperty('opacity');

      // UPDATE FARM DETAILS must enter the exact canonical Farm Card editor:
      // the original pre-populated multi-step Create Farm workflow in edit mode.
      // The action row can be moved by the Command Centre, so explicitly keep
      // this canonical function as the handler rather than replacing it with a
      // V2 Details-tab editor or a new overlay.
      if(String(entity?.type||'')==='farm' && button.id==='farm3d' && typeof window.openEditFarm==='function'){
        button.onclick=()=>window.openEditFarm(entity);
      }
    });
    return actions;
  }

  function ensureEntityCommandFallbackActions(summary, entity){
    if(!summary) return null;

    // The Entity Command Centre has one consistent operational action set for
    // every entity type. Do not inherit type-specific legacy labels/buttons.
    let actions=summary.querySelector('#farmActions');
    if(actions) actions.remove();

    actions=document.createElement('div');
    actions.id='farmActions';
    actions.className='farm-actions agworld-entity-command-actions agworld-entity-command-fallback-actions';

    const update=document.createElement('button');
    update.id='farm3d';
    update.type='button';
    update.textContent='UPDATE ENTITY INFO';
    update.onclick=()=>{
      if(String(entity?.type||'')==='farm' && typeof window.openEditFarm==='function'){
        return window.openEditFarm(entity);
      }
      return openEntityDetailsFromAction(entity);
    };

    const fleet=document.createElement('button');
    fleet.id='entityFleetAction';
    fleet.type='button';
    fleet.textContent='🚁 SELL / MANAGE FLEET';
    fleet.onclick=()=>{
      if(typeof window.openFleetTransaction==='function'){
        return window.openFleetTransaction(String(entity?.type||'entity'),String(entity?.id||''));
      }
      document.getElementById('fleetTransactionAction')?.click();
    };

    const sales=document.createElement('button');
    sales.id='entitySalesFleetAction';
    sales.type='button';
    sales.textContent='📊 SALES HISTORY & FLEET';
    sales.onclick=()=>{
      if(typeof window.openFleetManagement==='function'){
        return window.openFleetManagement(String(entity?.type||'entity'),String(entity?.id||''));
      }
      document.getElementById('fleetHistoryAction')?.click();
    };

    // Only Farms and Contractors participate in the sales/fleet commercial
    // workflows. Competitors and Company Facilities keep the common entity
    // update action but do not expose sales controls.
    const commercialEntity=String(entity?.type||'')==='farm' || String(entity?.type||'')==='contractor';
    actions.appendChild(update);
    if(commercialEntity) actions.append(fleet,sales);
    summary.appendChild(actions);
    return actions;
  }
  function installFarmActionCapture(){
    captureFarmActions();
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',captureFarmActions,{once:true});
    }
    const card=$('farmCard');
    if(card && !card.__agworldActionCaptureObserver){
      const observer=new MutationObserver(()=>captureFarmActions());
      observer.observe(card,{childList:true,subtree:true});
      card.__agworldActionCaptureObserver=true;
    }
  }

  installFarmActionCapture();

  function escEntityCommand(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function entityCommandTypeLabel(type){
    const canonical=type==='companyFacility'?'company_facility':String(type||'entity');
    return window.AGWorldV2?.EntityTypes?.[canonical]?.label || canonical.replace(/_/g,' ');
  }

  function entityCommandSummary(entity){
    const details=entity?.details||{}, metadata=entity?.metadata||{};
    const territory=(entity?.territoryIds||details?.territoryIds||[entity?.territoryId||details?.territoryId]).filter(Boolean);
    const location=details.location || entity.location || metadata.location || metadata.address || entity.address || '';
    const metrics=[
      ['STATUS',String(entity?.status||'active').toUpperCase()],
      ['TERRITORY',territory.join(', ')||'Not assigned'],
      ['LOCATION',typeof location==='string'?location:'Mapped entity']
    ];
    if(entity?.type==='farm'){
      const size=entity.farmSize ?? metadata.farmSize;
      const crops=entity.crops ?? metadata.crops;
      if(size!==undefined&&size!==null&&size!=='') metrics.push(['FARM SIZE',String(size)]);
      else if(Array.isArray(crops)&&crops.length) metrics.push(['CROPS',crops.join(', ')]);
    } else {
      const staff=details.staffCount ?? metadata.staffCount;
      if(staff!==undefined&&staff!==null&&staff!=='') metrics.push(['STAFF',String(staff)]);
    }
    return metrics;
  }

  function prepareEntityCommandCentreForSelection(entity){
    const card=$('farmCard');
    if(!card) return null;

    // Preserve the original Farm Card action nodes before rebuilding the
    // Command Centre. Moving the real DOM nodes (rather than recreating
    // buttons) keeps all existing, proven click handlers intact.
    // Prefer the live action row, then fall back to the action row captured
    // before any Command Centre renderer rebuilt the card.
    const preservedActions=card.querySelector('#farmActions') || captureFarmActions();

    card.innerHTML='';
    card.classList.remove('agworld-company-entity-card');
    card.classList.add('show','agworld-selected-entity-command');
    delete card.dataset.entityCommandDefault;

    if(window.AGWorldV2){
      delete window.AGWorldV2.LiveFarmDetailBridge;
      delete window.AGWorldV2.LiveDynamicEntityDetailBridge;
    }

    const shell=document.createElement('div');
    shell.className='agworld-entity-command-shell';

    const summary=document.createElement('section');
    summary.className='agworld-entity-command-summary';
    const metrics=entityCommandSummary(entity);
    summary.innerHTML=
      '<div class="agworld-entity-command-eyebrow">'+escEntityCommand(entityCommandTypeLabel(entity?.type)).toUpperCase()+'</div>'+
      '<h2>'+escEntityCommand(entity?.name||'Unnamed entity')+'</h2>'+
      '<div class="agworld-entity-command-status">'+escEntityCommand(String(entity?.status||'active').toUpperCase())+'</div>'+
      '<div class="agworld-entity-command-summary-grid">'+metrics.map(([label,value])=>
        '<div><span>'+escEntityCommand(label)+'</span><b>'+escEntityCommand(value)+'</b></div>').join('')+'</div>';

    // Use the same three Command Centre actions for every entity type.
    let actionRow=ensureEntityCommandFallbackActions(summary, entity);
    if(actionRow){
      normalizeEntityActionRow(actionRow, entity);
      actionRow.hidden=false;
      actionRow.removeAttribute('hidden');
      actionRow.style.removeProperty('display');
      actionRow.classList.remove('agworld-entity-command-actions');
      if(!summary.contains(actionRow)) summary.appendChild(actionRow);
      actionRow.classList.add('agworld-entity-command-actions');
      actionRow.style.setProperty('display','flex','important');
      actionRow.style.setProperty('visibility','visible','important');
      actionRow.style.setProperty('opacity','1','important');
      agworldPreservedFarmActions=actionRow;
    }

    const management=document.createElement('section');
    management.className='agworld-entity-command-management';
    management.innerHTML='<div class="agworld-entity-management-label">ENTITY MANAGEMENT</div>';

    const host=document.createElement('div');
    host.id='agworldV2FarmDetailHost';
    host.hidden=false;
    host.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;';
    management.appendChild(host);
    shell.append(summary,management);
    card.appendChild(shell);

    // Reassert the action row on the next frame. Other selection listeners may
    // complete in the same event turn, but the cached real node remains the
    // single source of truth and retains its original onclick handlers.
    requestAnimationFrame(()=>{
      let actions=summary.querySelector('#farmActions') || ensureEntityCommandFallbackActions(summary, entity);
      if(actions){
        normalizeEntityActionRow(actions, entity);
        actions.hidden=false;
        actions.removeAttribute('hidden');
        actions.style.removeProperty('display');
        actions.classList.remove('agworld-entity-command-actions');
        if(!summary.contains(actions)) summary.appendChild(actions);
        actions.classList.add('agworld-entity-command-actions');
        actions.style.setProperty('display','flex','important');
        actions.style.setProperty('visibility','visible','important');
        actions.style.setProperty('opacity','1','important');
      }
      entityCommandDiag('ENTITY COMMAND ACTIONS RESTORED',{
        entityId:String(entity?.id||''),
        entityType:entity?.type||'',
        actionsFound:!!actions,
        actionButtons:actions ? actions.querySelectorAll('button').length : 0,
        actionHost:actions?.parentElement?.className||''
      });
    });

    entityCommandDiag('ENTITY COMMAND SPLIT LAYOUT PREPARED',{entityId:String(entity?.id||''),entityType:entity?.type||'',summary:!!summary,management:!!management,hostOnlyManagementChild:management.children.length===2,actionsFound:!!preservedActions});
    return host;
  }

  // Selection events are dispatched from inside the legacy Farm/Dynamic
  // selection functions. Those functions continue doing important work *after*
  // dispatchEvent() returns: they populate the card and, crucially, bind the
  // original Farm Card button handlers. Rebuilding #farmCard synchronously
  // inside the event listener removes those DOM targets and aborts the legacy
  // selection function before its button wiring runs.
  //
  // Therefore the Command Centre handoff must happen on the next task, after
  // the canonical selection function has completed its existing workflow.
  let entityCommandSelectionToken = 0;

  function selectEntityScope(event){
    const entity=event?.detail?.entity||event?.detail?.farm||event?.detail;
    if(!entity) return;

    const token=++entityCommandSelectionToken;
    const eventType=event.type;
    const entityId=String(entity.id||'');
    const entityType=entity.type||'';

    entityCommandDiag('SELECTION RECEIVED',{
      eventType,
      entityId,
      entityName:entity.name||'',
      entityType,
      deferred:true
    });

    setTimeout(()=>{
      // Ignore an older deferred handoff if another entity was selected first.
      if(token!==entityCommandSelectionToken) return;

      companyCardActive=false;
      window.__AGWORLD_ENTITY_COMMAND_SCOPE__=String(entityType||'entity').toUpperCase();
      window.__AGWORLD_ENTITY_COMMAND_STARTUP__='THE_COMPANY_THEN_ENTITY';

      // At this point the original selection routine has completed, including
      // UPDATE DETAILS, FARM HISTORY and Fleet button wiring.
      const host=prepareEntityCommandCentreForSelection(entity);
      entityCommandDiag('ENTITY COMMAND CENTRE PREPARED',{
        prepared:!!host,
        entityId,
        entityType,
        deferred:true
      });

      // Re-open from the canonical selection after the dedicated visible canvas
      // has been prepared. This remains separate from the legacy button setup.
      const isFarm=eventType==='agworld:farm-selected' || event?.detail?.farm;
      const delay=isFarm?0:180;
      entityCommandDiag('V2 HANDOFF SCHEDULED',{
        isFarm,
        delay,
        hasFarmOpen:typeof window.openV2FarmDetail==='function',
        hasDynamicOpen:typeof window.openV2DynamicEntityDetail==='function'
      });

      setTimeout(()=>{
        if(token!==entityCommandSelectionToken) return;
        entityCommandDiag('V2 HANDOFF EXECUTING',{isFarm,entityId,entityType});
        if(isFarm && typeof window.openV2FarmDetail==='function') window.openV2FarmDetail(entity);
        else if(!isFarm && typeof window.openV2DynamicEntityDetail==='function') window.openV2DynamicEntityDetail(entity);
        setTimeout(()=>entityCommandDiag('V2 HANDOFF POSTCHECK',{isFarm,entityId}),60);
      },delay);
    },0);
  }

  window.addEventListener('agworld:farm-selected',selectEntityScope);
  window.addEventListener('agworld:dynamic-entity-selected',selectEntityScope);
  window.addEventListener('agworld:v2-entity-selected',selectEntityScope);
  window.addEventListener('load',()=>{setTimeout(waitForFacilities,350);setTimeout(waitForFacilities,1400);setTimeout(waitForFacilities,3200);});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(waitForFacilities,150));
  window.addEventListener('agworld:dynamic-layer-updated',()=>{if(companyCardActive) renderCompanyCard();});
  window.__AGWORLD_RENDER_COMPANY_ENTITY_CARD__=()=>{companyCardActive=true;return renderCompanyCard();};

  const style=document.createElement('style');
  style.textContent=
    '#entityInformationSection{position:absolute!important;overflow:hidden!important;padding:0!important;margin:0!important;box-sizing:border-box!important;background:linear-gradient(180deg,#0b151a 0%,#071015 100%);border:1px solid rgba(119,171,147,.22);border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}'+
    '#entityCommandCentreHeading{position:absolute!important;left:0!important;right:0!important;top:0!important;height:38px!important;z-index:6!important;display:flex!important;align-items:center!important;padding:0 16px!important;box-sizing:border-box!important;background:linear-gradient(90deg,#101f25 0%,#0b161b 72%,#0e211d 100%);border-bottom:1px solid rgba(117,224,132,.2);color:#eef8f1;font-family:inherit!important;font-size:20px!important;font-weight:800!important;letter-spacing:2px!important;line-height:1!important;text-transform:uppercase!important;box-shadow:0 5px 16px rgba(0,0,0,.18)}'+
    '#entityCommandCentreHeading .entity-command-centre-mark,#entityCommandCentreHeading small{display:none!important}'+
    '#entityInformationSection .farm-card{position:absolute!important;inset:auto!important;left:0!important;right:0!important;bottom:0!important;top:38px!important;width:100%!important;height:calc(100% - 38px)!important;min-height:calc(100% - 38px)!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0 0 12px 12px;box-sizing:border-box;overflow:hidden}'+
    '#entityInformationSection .agworld-company-entity-card{display:flex!important;flex-direction:column;color:#edf6ef;background:radial-gradient(circle at 100% 0,rgba(73,132,91,.16),transparent 35%),linear-gradient(145deg,#17272b 0%,#0d171b 58%,#091013 100%);border:1px solid rgba(122,224,145,.34);box-shadow:0 14px 34px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.07)}'+
    '#entityInformationSection .agworld-company-entity-card:before{content:"";display:block;height:4px;flex:0 0 4px;background:linear-gradient(90deg,#5ed879,#a9ee7c 42%,rgba(169,238,124,.12));box-shadow:0 0 18px rgba(94,216,121,.32)}'+
    '.company-command-card-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,.08)}'+
    '.company-command-title-block{min-width:0}.company-command-eyebrow{font-size:10px;line-height:1.2;letter-spacing:1.25px;font-weight:900;color:#8ee99d;margin-bottom:6px}.company-command-card-head h2{margin:0;font-size:25px;line-height:1;letter-spacing:.9px;color:#f3fbf5}.company-command-card-head .meta{margin-top:6px;font-size:11px;line-height:1.35;color:#a8bbb0}.company-command-status{display:flex;align-items:center;gap:6px;flex:0 0 auto;font-size:10px;font-weight:900;letter-spacing:1px;color:#a9efb2;border:1px solid rgba(117,224,132,.42);background:rgba(117,224,132,.08);padding:7px 10px;border-radius:999px}.company-command-status i{width:7px;height:7px;border-radius:50%;background:#75e084;box-shadow:0 0 10px rgba(117,224,132,.9)}'+
    '.company-command-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);flex:1;min-height:0;border-top:1px solid rgba(255,255,255,.07)}'+
    '.company-command-stats-pane,.company-command-facilities-pane{min-width:0;min-height:0;display:flex;flex-direction:column;padding:12px 14px 14px}.company-command-stats-pane{border-right:1px solid rgba(255,255,255,.08)}'+
    '.company-pane-heading{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:0 2px 10px}.company-pane-heading div{min-width:0}.company-pane-heading strong{display:block;font-size:12px;letter-spacing:1px;color:#e8f5eb}.company-pane-heading span{display:block;margin-top:3px;font-size:8px;letter-spacing:.9px;color:#7f9889}.company-pane-heading>b{flex:0 0 auto;font-size:8px;letter-spacing:.8px;color:#93e99e;background:rgba(117,224,132,.08);border:1px solid rgba(117,224,132,.17);padding:5px 7px;border-radius:6px}'+
    '.company-command-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:0}.company-command-kpis>div{display:flex;align-items:center;gap:10px;min-width:0;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))}.company-command-kpis b,.company-command-kpis span{display:block}.company-kpi-icon{width:30px;height:30px;flex:0 0 30px;display:flex!important;align-items:center;justify-content:center;border-radius:8px;background:rgba(117,224,132,.11);border:1px solid rgba(117,224,132,.16);color:#93e99e;font-size:15px!important}.company-command-kpis b{font-size:22px;line-height:1;color:#f1faf3}.company-command-kpis span:not(.company-kpi-icon){font-size:8px;line-height:1.2;letter-spacing:.7px;color:#a2b6a8;margin-top:4px}'+
    '.company-stats-summary{display:grid;gap:8px;margin-top:10px}.company-stats-summary>div{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 11px;border:1px solid rgba(255,255,255,.06);border-radius:9px;background:rgba(3,10,13,.32)}.company-stats-summary span{font-size:8px;letter-spacing:.75px;color:#82988b}.company-stats-summary b{font-size:10px;letter-spacing:.4px;color:#dcebe0;text-align:right}'+
    '.company-facility-list{display:grid;grid-template-columns:1fr;gap:8px;padding:0;overflow:auto;flex:1;align-content:start;min-height:0}.company-facility-row{cursor:pointer;display:grid;grid-template-columns:12px minmax(0,1fr) 42px 20px;gap:9px;align-items:center;min-height:54px;padding:9px 10px;border-radius:9px;background:linear-gradient(135deg,rgba(3,10,13,.66),rgba(20,38,40,.55));border:1px solid rgba(255,255,255,.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.025);transition:.16s ease}.company-facility-row:hover,.company-facility-row:focus,.company-facility-row.is-selected{outline:none;border-color:rgba(117,224,132,.55);background:linear-gradient(135deg,rgba(20,54,43,.8),rgba(17,37,36,.78));box-shadow:0 0 0 1px rgba(117,224,132,.08),inset 0 1px 0 rgba(255,255,255,.035)}.company-facility-marker{display:flex;align-items:center;justify-content:center}.company-facility-marker i{width:7px;height:7px;border-radius:50%;background:#75e084;box-shadow:0 0 9px rgba(117,224,132,.55)}.company-facility-name{min-width:0}.company-facility-name b,.company-facility-name span{display:block}.company-facility-name b{font-size:12px;line-height:1.2;color:#eff8f1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.company-facility-name span{font-size:9px;line-height:1.3;color:#a0b3a7;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.company-facility-staff{text-align:center}.company-facility-staff b,.company-facility-staff span{display:block}.company-facility-staff b{font-size:15px;line-height:1;color:#e8f6eb}.company-facility-staff span{font-size:7px;letter-spacing:.7px;color:#82988b;margin-top:3px}.company-facility-open{display:flex;align-items:center;justify-content:center;color:#93e99e;font-size:15px;opacity:.85}.company-facility-empty{padding:14px;font-size:11px;color:#a0b2a8}.company-command-footer{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0 0;border-top:1px solid rgba(255,255,255,.06);font-size:9px;line-height:1.35;color:#91a59a}.company-command-footer>b{flex:0 0 auto;font-size:8px;letter-spacing:.8px;color:#6fdc82}'+
    '@media(max-width:900px){.company-command-split{grid-template-columns:1fr}.company-command-stats-pane{border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.company-command-card-head h2{font-size:22px}}';
  document.head.appendChild(style);
  // ENTITY COMMAND CENTRE READABILITY SCALE
  // Bring summary, action controls and management tabs/content up to the same
  // practical reading scale as the primary game menu.
  const entityCommandReadabilityStyle=document.createElement('style');
  entityCommandReadabilityStyle.textContent=
    '#entityInformationSection .agworld-entity-command-shell{font-size:14px!important}'+
    '#entityInformationSection .agworld-entity-command-eyebrow{font-size:11px!important;letter-spacing:1.2px!important}'+
    '#entityInformationSection .agworld-entity-command-summary h2{font-size:24px!important;line-height:1.12!important}'+
    '#entityInformationSection .agworld-entity-command-status{font-size:11px!important;padding:6px 10px!important}'+
    '#entityInformationSection .agworld-entity-command-summary-grid span{font-size:10px!important;letter-spacing:.7px!important}'+
    '#entityInformationSection .agworld-entity-command-summary-grid b{font-size:14px!important;line-height:1.25!important}'+
    '#entityInformationSection .agworld-entity-command-actions button{font-size:12px!important;letter-spacing:.5px!important;padding:10px 13px!important;min-height:38px!important}'+
    '#entityInformationSection .agworld-entity-management-label{font-size:12px!important;letter-spacing:1px!important}'+
    '#entityInformationSection .agworld-entity-command-management{font-size:14px!important}'+
    '#entityInformationSection .agworld-entity-command-management [data-tab],#entityInformationSection .agworld-entity-command-management .tab{font-size:12px!important}'+
    '#entityInformationSection .agworld-entity-command-management p,#entityInformationSection .agworld-entity-command-management li,#entityInformationSection .agworld-entity-command-management td,#entityInformationSection .agworld-entity-command-management th,#entityInformationSection .agworld-entity-command-management label{font-size:13px!important;line-height:1.35!important}'+
    '#entityInformationSection .agworld-entity-command-management input,#entityInformationSection .agworld-entity-command-management select,#entityInformationSection .agworld-entity-command-management textarea,#entityInformationSection .agworld-entity-command-management button{font-size:13px!important}';
  document.head.appendChild(entityCommandReadabilityStyle);

  // FULL ENTITY COMMAND CENTRE DARK SURFACE
  // The entity command context is a permanent dark game surface. This override
  // deliberately stays scoped to the command panel so it cannot affect popups,
  // the map, missions or territory statistics.
  const entityCommandDarkSurfaceStyle=document.createElement('style');
  entityCommandDarkSurfaceStyle.textContent=
    '#entityInformationSection{background:linear-gradient(180deg,#0b151a 0%,#071015 100%)!important;color:#dcebe1!important}'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card){background:linear-gradient(145deg,#101c21 0%,#0a1318 58%,#071015 100%)!important;color:#dcebe1!important}'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card)>*:not(button):not(input):not(select):not(textarea),'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card)>*>*:not(button):not(input):not(select):not(textarea){background-color:#0d181d!important;color:#dcebe1!important;border-color:rgba(126,167,148,.18)!important}'+
    '#entityInformationSection .farm-card .farm-info-hero,'+
    '#entityInformationSection .farm-card .agworld-entity-summary,'+
    '#entityInformationSection .farm-card .agworld-entity-command-actions,'+
    '#entityInformationSection .farm-card .agworld-entity-command-management,'+
    '#entityInformationSection .farm-card .entity-management,'+
    '#entityInformationSection .farm-card .entity-management-content,'+
    '#entityInformationSection .farm-card .entity-management-tabs,'+
    '#entityInformationSection .farm-card .tab-content,'+
    '#entityInformationSection .farm-card .management-tab-content{background:#0d181d!important;color:#dcebe1!important;border-color:rgba(126,167,148,.18)!important}'+
    '#entityInformationSection .farm-card h1,#entityInformationSection .farm-card h2,#entityInformationSection .farm-card h3,#entityInformationSection .farm-card h4,#entityInformationSection .farm-card strong,#entityInformationSection .farm-card b{color:#eef8f1!important}'+
    '#entityInformationSection .farm-card p,#entityInformationSection .farm-card span,#entityInformationSection .farm-card label,#entityInformationSection .farm-card li,#entityInformationSection .farm-card td,#entityInformationSection .farm-card th{color:#b8cbbf!important}'+
    '#entityInformationSection .farm-card input,#entityInformationSection .farm-card select,#entityInformationSection .farm-card textarea{background:#071015!important;color:#eef8f1!important;border:1px solid rgba(126,167,148,.28)!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.25)!important}'+
    '#entityInformationSection .farm-card button{background:linear-gradient(180deg,#173229 0%,#10251f 100%)!important;color:#e8f6ec!important;border-color:rgba(117,224,132,.32)!important}'+
    '#entityInformationSection .farm-card button:hover{background:linear-gradient(180deg,#1c3d31 0%,#143127 100%)!important;border-color:rgba(117,224,132,.58)!important}'+
    '#entityInformationSection .farm-card [data-tab],#entityInformationSection .farm-card .tab{background:#0a1419!important;color:#aebfb5!important;border-color:rgba(126,167,148,.16)!important}'+
    '#entityInformationSection .farm-card [data-tab].active,#entityInformationSection .farm-card .tab.active{background:#153126!important;color:#ecf8ef!important;border-color:rgba(117,224,132,.42)!important;box-shadow:inset 0 -2px 0 #75e084!important}'+
    '#entityInformationSection .farm-card hr{border-color:rgba(126,167,148,.16)!important}'+
    '#entityInformationSection .farm-card ::placeholder{color:#70877b!important}';
  document.head.appendChild(entityCommandDarkSurfaceStyle);
})();


/* AG WORLD MENU COMMAND BRIDGE v2 */
(function(){
  const legacyControls=new Map();

  // Canonical Sales Game menu bridge: Company Commands and Company Control
  // were superseded by the bottom Command Center and Territory Stats. Keep only
  // Territory Graphics here; do not recreate obsolete menu layers.
  const COMMANDS=[
    {
      id:'agMenuTerritoryGraphics',
      label:'◇ TERRITORY GRAPHICS',
      // The legacy control has appeared with more than one label across builds.
      // Match the button text as well as stable graphic-related IDs/data hooks.
      match:/(territory\s*graphics?|graphics?\s*territory|^graphics?$|map\s*graphics?)/i,
      selectors:[
        '#territoryGraphicsButton',
        '#agTerritoryGraphicsButton',
        '#territoryGraphics',
        '#mapGraphicsButton',
        '[data-territory-graphics]',
        '[data-action="territory-graphics"]',
        '[data-action="graphics"]'
      ],
      open:()=>{
        const targets=[
          window.AGWorldTerritoryGraphics?.open,
          window.TerritoryGraphics?.open,
          window.openTerritoryGraphics,
          window.showTerritoryGraphics,
          window.toggleTerritoryGraphics,
          window.openMapGraphics,
          window.showMapGraphics
        ];
        for(const fn of targets){
          if(typeof fn==='function'){
            try{return fn.call(window);}catch(error){console.warn('Territory Graphics command fallback failed',error);}
          }
        }
        return undefined;
      }
    }
  ];

  function isMenuButton(button){
    return !!button?.dataset?.agworldCommandMenu;
  }

  function findLiveControl(command){
    const cached=legacyControls.get(command.id);
    if(cached && document.contains(cached)) return cached;

    for(const selector of (command.selectors||[])){
      try{
        const candidate=document.querySelector(selector);
        if(candidate && candidate.id!==command.id && !isMenuButton(candidate)){
          legacyControls.set(command.id,candidate);
          return candidate;
        }
      }catch(_){}
    }

    const buttons=[...document.querySelectorAll('button')];
    const candidate=buttons.find(button=>{
      if(button.id===command.id || isMenuButton(button)) return false;
      const text=(button.textContent||'').replace(/\s+/g,' ').trim();
      const signature=[button.id,button.className,button.dataset?.action,button.dataset?.view].filter(Boolean).join(' ');
      return command.match.test(text)||command.match.test(signature);
    })||null;

    if(candidate) legacyControls.set(command.id,candidate);
    return candidate;
  }

  function hideLegacyControl(command){
    const button=findLiveControl(command);
    if(button){
      button.style.setProperty('display','none','important');
      button.setAttribute('aria-hidden','true');
      button.tabIndex=-1;
      button.dataset.agworldMovedToMenu='1';
    }
    return button;
  }

  function openCommand(command,event){
    event?.preventDefault();
    event?.stopPropagation();

    if(typeof command.open==='function'){
      const result=command.open();
      if(result!==undefined) return result;
    }

    const live=findLiveControl(command);
    if(live){
      // Restore just long enough for legacy handlers that guard against
      // non-visible controls, then invoke the original workflow unchanged.
      const previousDisplay=live.style.display;
      live.style.removeProperty('display');
      try{
        live.click();
        return true;
      }finally{
        live.style.setProperty('display',previousDisplay||'none','important');
      }
    }

    if(command.id==='agMenuTerritoryGraphics'){
      window.showToast?.('Territory Graphics is still loading. Please try again in a moment.');
      console.warn('AG World Territory Graphics control was not found in the live DOM.');
    }
    return false;
  }

  function ensureMenuCommands(){
    const nav=document.querySelector('.sidebar .nav')||document.querySelector('.nav');
    if(!nav) return false;

    const developer=document.getElementById('developerModeBtn');
    COMMANDS.forEach(command=>{
      let button=document.getElementById(command.id);
      if(!button){
        button=document.createElement('button');
        button.id=command.id;
        button.type='button';
        button.textContent=command.label;
        button.dataset.agworldCommandMenu='1';
        button.addEventListener('click',event=>openCommand(command,event));
        if(developer && developer.parentElement===nav) nav.insertBefore(button,developer);
        else nav.appendChild(button);
      }
      hideLegacyControl(command);
    });
    return true;
  }

  ensureMenuCommands();
  const observer=new MutationObserver(()=>ensureMenuCommands());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>{
    ensureMenuCommands();
    setTimeout(ensureMenuCommands,400);
    setTimeout(ensureMenuCommands,1500);
    setTimeout(ensureMenuCommands,3500);
  });
})();
/* ENTITY COMMAND CENTRE HARD DARK FINISH v26 */
(function(){
  const style=document.createElement('style');
  style.id='agworldEntityCommandHardDarkFinish';
  style.textContent=
    '#entityInformationSection,#entityInformationSection .farm-card{background:#081217!important;color:#dcebe1!important}'+
    '#entityInformationSection .agworld-company-entity-card{background:radial-gradient(circle at 100% 0,rgba(73,132,91,.16),transparent 35%),linear-gradient(145deg,#101d22 0%,#091318 58%,#060d11 100%)!important;color:#edf6ef!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-card-head,'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis,'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-list-head,'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-list,'+
    '#entityInformationSection .agworld-company-entity-card .company-command-footer{background:transparent!important;color:#dcebe1!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-card-head{border-color:rgba(126,167,148,.18)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis>div{background:linear-gradient(145deg,#122128 0%,#0b151a 100%)!important;border-color:rgba(126,167,148,.22)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row{background:linear-gradient(135deg,#0d181d 0%,#081116 100%)!important;border-color:rgba(126,167,148,.18)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row:hover{background:#122329!important;border-color:rgba(117,224,132,.42)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-footer{border-color:rgba(126,167,148,.16)!important}'+
    '#entityInformationSection .agworld-company-entity-card h1,#entityInformationSection .agworld-company-entity-card h2,#entityInformationSection .agworld-company-entity-card h3,#entityInformationSection .agworld-company-entity-card h4,#entityInformationSection .agworld-company-entity-card b{color:#edf8f0!important}'+
    '#entityInformationSection .agworld-company-entity-card p,#entityInformationSection .agworld-company-entity-card span,#entityInformationSection .agworld-company-entity-card label{color:#aebfb5!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-eyebrow,#entityInformationSection .agworld-company-entity-card .company-command-status,#entityInformationSection .agworld-company-entity-card .company-facility-state{color:#8ee99d!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis b,#entityInformationSection .agworld-company-entity-card .company-facility-name b,#entityInformationSection .agworld-company-entity-card .company-facility-staff b{color:#f1faf3!important}'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card){background:linear-gradient(145deg,#101c21 0%,#0a1318 58%,#071015 100%)!important}'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card) .agworld-entity-command-shell,'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card) .agworld-entity-summary,'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card) .agworld-entity-command-actions,'+
    '#entityInformationSection .farm-card:not(.agworld-company-entity-card) .agworld-entity-command-management{background:#0b151a!important;color:#dcebe1!important}';
  document.head.appendChild(style);
})();


/* COMPANY COMMAND CENTRE STRICT 50/50 OVERRIDE v28 */
(function(){
  const style=document.createElement('style');
  style.id='agworldCompanyCommandStrictSplitV28';
  style.textContent=
    /* The Company card owns the complete Entity Command Centre canvas. */
    '#entityInformationSection .farm-card.agworld-company-entity-card{display:flex!important;flex-direction:column!important;width:100%!important;min-width:0!important;max-width:none!important;height:calc(100% - 34px)!important;min-height:calc(100% - 34px)!important;margin:0!important;padding:0!important;overflow:hidden!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-card-head{width:100%!important;min-width:0!important;box-sizing:border-box!important;flex:0 0 auto!important;margin:0!important}'+
    /* Strict equal ownership: no intrinsic content is allowed to resize either side. */
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{display:grid!important;grid-template-columns:50% 50%!important;grid-template-rows:minmax(0,1fr)!important;width:100%!important;min-width:0!important;max-width:none!important;flex:1 1 0!important;min-height:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{grid-column:1!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;margin:0!important;padding:14px 16px!important;overflow:hidden!important;border-right:1px solid rgba(117,224,132,.18)!important;border-bottom:0!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{grid-column:2!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;margin:0!important;padding:14px 16px!important;overflow:hidden!important}'+
    /* Keep the left column visibly populated across the full half. */
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis{width:100%!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-content:start!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis>div{min-width:0!important;width:auto!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary{width:100%!important;min-width:0!important}'+
    /* Keep facilities inside their own right-hand 50%, with internal scrolling only. */
    '#entityInformationSection .agworld-company-entity-card .company-facility-list{width:100%!important;min-width:0!important;max-width:none!important;flex:1 1 0!important;min-height:0!important;overflow:auto!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row{width:100%!important;min-width:0!important;box-sizing:border-box!important}'+
    /* Defensive reset against older card rules that position Company content. */
    '#entityInformationSection .agworld-company-entity-card .company-command-stats-pane,#entityInformationSection .agworld-company-entity-card .company-command-facilities-pane,#entityInformationSection .agworld-company-entity-card .company-command-kpis,#entityInformationSection .agworld-company-entity-card .company-stats-summary,#entityInformationSection .agworld-company-entity-card .company-facility-list{position:relative!important;left:auto!important;right:auto!important;float:none!important;transform:none!important}'+
    '@media(max-width:900px){#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{grid-template-columns:1fr!important;grid-template-rows:auto minmax(0,1fr)!important;height:auto!important;overflow:auto!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{grid-column:1!important;grid-row:1!important;border-right:0!important;border-bottom:1px solid rgba(117,224,132,.18)!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{grid-column:1!important;grid-row:2!important}}';
  document.head.appendChild(style);
})();


/* COMPANY COMMAND CENTRE STRICT 50/50 FIX v29 */
(function(){
  /*
   * v28 proved the column widths, but its height:0 flex sizing rule could
   * collapse the entire split area on the live bottom-panel geometry. Keep
   * the strict 50/50 width contract while giving the split a real flex height.
   */
  const style=document.createElement('style');
  style.id='agworldCompanyCommandStrictSplitV29';
  style.textContent=
    '#entityInformationSection .farm-card.agworld-company-entity-card{display:flex!important;flex-direction:column!important;width:100%!important;height:calc(100% - 34px)!important;min-height:calc(100% - 34px)!important;overflow:hidden!important;background:radial-gradient(circle at 100% 0,rgba(73,132,91,.16),transparent 35%),linear-gradient(145deg,#17272b 0%,#0d171b 58%,#091013 100%)!important;color:#edf6ef!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-card-head{display:flex!important;flex:0 0 auto!important;width:100%!important;box-sizing:border-box!important;position:relative!important;z-index:2!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{display:grid!important;grid-template-columns:minmax(0,50%) minmax(0,50%)!important;grid-template-rows:minmax(0,1fr)!important;flex:1 1 auto!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;box-sizing:border-box!important;overflow:hidden!important;position:relative!important;z-index:1!important;background:#0b151a!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{grid-column:1!important;grid-row:1!important;width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;padding:12px 16px 14px!important;margin:0!important;overflow:auto!important;background:#0d181d!important;border-right:1px solid rgba(117,224,132,.18)!important;border-bottom:0!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{grid-column:2!important;grid-row:1!important;width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;padding:12px 16px 14px!important;margin:0!important;overflow:hidden!important;background:#0a1419!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;min-width:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis>div{min-width:0!important;box-sizing:border-box!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary{display:grid!important;width:100%!important;min-width:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-list{display:grid!important;grid-template-columns:1fr!important;width:100%!important;min-width:0!important;flex:1 1 auto!important;min-height:0!important;height:auto!important;overflow:auto!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row{display:grid!important;width:100%!important;min-width:0!important;box-sizing:border-box!important}'+
    '@media(max-width:900px){#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{grid-template-columns:1fr!important;grid-template-rows:auto minmax(0,1fr)!important;overflow:auto!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{grid-column:1!important;grid-row:1!important;border-right:0!important;border-bottom:1px solid rgba(117,224,132,.18)!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{grid-column:1!important;grid-row:2!important}}';
  document.head.appendChild(style);
})();


/* COMPANY COMMAND CENTRE FLEX 50/50 HARD RESET v30 */
(function(){
  /*
   * The screenshot shows the grid is still being influenced by the legacy
   * bottom-panel geometry. Remove grid placement from the equation entirely:
   * the two Company panes are now physical 50% flex items starting at the
   * left edge of the Company card.
   */
  const style=document.createElement('style');
  style.id='agworldCompanyCommandFlexSplitV30';
  style.textContent=
    '#entityInformationSection .farm-card.agworld-company-entity-card{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{display:flex!important;flex-direction:row!important;align-items:stretch!important;justify-content:flex-start!important;flex:1 1 0!important;align-self:stretch!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important;grid-template-columns:none!important;grid-template-rows:none!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{display:flex!important;flex:0 0 50%!important;width:50%!important;max-width:50%!important;min-width:0!important;height:100%!important;box-sizing:border-box!important;position:static!important;order:0!important;margin:0!important;left:auto!important;right:auto!important;transform:none!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{display:flex!important;flex:0 0 50%!important;width:50%!important;max-width:50%!important;min-width:0!important;height:100%!important;box-sizing:border-box!important;position:static!important;order:1!important;margin:0!important;left:auto!important;right:auto!important;transform:none!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane *,#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane *{box-sizing:border-box!important}'+
    '@media(max-width:900px){#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{flex-direction:column!important;overflow:auto!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane,#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{flex:0 0 auto!important;width:100%!important;max-width:100%!important;height:auto!important}}';
  document.head.appendChild(style);
})();


;



/* COMPANY COMMAND CENTER EXACT 50/50 FINAL SPLIT v34 */
(function(){
  /*
   * The Company card has one physical content area. Lock that area to a true
   * two-track grid so the statistics and facilities panes each own exactly
   * half of the Command Center width, regardless of their internal content.
   */
  const style=document.createElement('style');
  style.id='agworldCompanyCommandExactSplitV34';
  style.textContent=
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;column-gap:0!important;row-gap:0!important;align-items:stretch!important;justify-items:stretch!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;box-sizing:border-box!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{grid-column:1!important;grid-row:1!important;display:flex!important;flex-direction:column!important;width:100%!important;max-width:none!important;min-width:0!important;height:100%!important;min-height:0!important;margin:0!important;box-sizing:border-box!important;overflow:hidden!important;border-right:1px solid rgba(117,224,132,.22)!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{grid-column:2!important;grid-row:1!important;display:flex!important;flex-direction:column!important;width:100%!important;max-width:none!important;min-width:0!important;height:100%!important;min-height:0!important;margin:0!important;box-sizing:border-box!important;overflow:hidden!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis,#entityInformationSection .agworld-company-entity-card .company-stats-summary{flex:0 0 auto!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-list{flex:1 1 0!important;min-height:0!important;overflow:auto!important}'+
    '@media(max-width:900px){#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{display:flex!important;flex-direction:column!important;height:auto!important;min-height:100%!important;overflow:auto!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane,#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{width:100%!important;height:auto!important;min-height:0!important;max-width:100%!important}}';
  document.head.appendChild(style);
})();

/* COMPANY COMMAND CENTRE FULL AREA v32 */
(function(){
  const style=document.createElement('style');
  style.id='agworldCompanyCommandFullAreaV32';
  style.textContent=
    '#entityInformationSection .farm-card.agworld-company-entity-card{position:relative!important;display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#0b151a!important;box-sizing:border-box!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-card-head{display:none!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{position:absolute!important;inset:0!important;display:flex!important;flex-direction:row!important;align-items:stretch!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important;background:#0b151a!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{display:flex!important;flex:0 0 50%!important;flex-direction:column!important;width:50%!important;max-width:50%!important;min-width:0!important;min-height:0!important;height:100%!important;margin:0!important;padding:16px!important;overflow:auto!important;box-sizing:border-box!important;background:#0d181d!important;border-right:1px solid rgba(117,224,132,.22)!important}'+
    '#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{display:flex!important;flex:0 0 50%!important;flex-direction:column!important;width:50%!important;max-width:50%!important;min-width:0!important;min-height:0!important;height:100%!important;margin:0!important;padding:16px!important;overflow:hidden!important;box-sizing:border-box!important;background:#0a1419!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-pane-heading{display:none!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis{width:100%!important;margin:0 0 12px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary{width:100%!important;margin:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-footer{margin-top:auto!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-list{width:100%!important;flex:1 1 auto!important;min-height:0!important;height:auto!important;margin:0!important;overflow:auto!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row{width:100%!important;box-sizing:border-box!important}'+
    '@media(max-width:900px){#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split{position:relative!important;inset:auto!important;flex-direction:column!important;height:auto!important;min-height:100%!important;overflow:auto!important}#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane,#entityInformationSection .farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{flex:0 0 auto!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important}}';
  document.head.appendChild(style);
})();


/* COMPANY COMMAND CENTER COMPLETE LAYOUT v35
   Final authority: true 50/50 command split plus compact operational facility cards.
   This block is deliberately appended after all legacy Company overrides. */
(function(){
  const previous=document.getElementById('agworldCompanyCommandCompleteV35');
  if(previous) previous.remove();
  const style=document.createElement('style');
  style.id='agworldCompanyCommandCompleteV35';
  style.textContent=
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card{display:block!important;position:relative!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#091216!important}'+
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split{position:absolute!important;inset:0!important;display:grid!important;grid-template-columns:minmax(0,50%) minmax(0,50%)!important;grid-template-rows:minmax(0,1fr)!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#091216!important}'+
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane{grid-column:1!important;grid-row:1!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;margin:0!important;padding:12px 14px!important;overflow:hidden!important;box-sizing:border-box!important;background:#0c171c!important;border-right:1px solid rgba(110,218,134,.24)!important}'+
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{grid-column:2!important;grid-row:1!important;display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;margin:0!important;padding:12px 14px!important;overflow:hidden!important;box-sizing:border-box!important;background:#081116!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-pane-title,#entityInformationSection .agworld-company-entity-card .company-facilities-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:20px!important;margin:0 0 10px!important;padding:0!important;color:#b8d7c2!important;font-family:inherit!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-pane-title span,#entityInformationSection .agworld-company-entity-card .company-facilities-header span{font-size:9px!important;font-weight:800!important;letter-spacing:.12em!important;color:#89b69a!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-pane-title b,#entityInformationSection .agworld-company-entity-card .company-facilities-header b{font-size:8px!important;font-weight:800!important;letter-spacing:.08em!important;color:#5ee07d!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facilities-header>div{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facilities-header em{font-size:7px!important;font-style:normal!important;letter-spacing:.08em!important;color:#557464!important;white-space:nowrap!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis>div{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;min-height:0!important;padding:9px 10px!important;background:#0a151a!important;border:1px solid rgba(91,197,119,.15)!important;border-radius:5px!important;box-sizing:border-box!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis>div>div{min-width:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-kpi-icon{display:grid!important;place-items:center!important;flex:0 0 24px!important;width:24px!important;height:24px!important;border-radius:50%!important;background:rgba(76,184,105,.09)!important;border:1px solid rgba(90,205,120,.18)!important;color:#63df80!important;font-size:12px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis b{display:block!important;font-size:17px!important;line-height:1!important;color:#e4f0e8!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis span:not(.company-kpi-icon){display:block!important;margin-top:3px!important;font-size:7px!important;font-weight:800!important;letter-spacing:.08em!important;color:#71877b!important;white-space:nowrap!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary{display:flex!important;justify-content:space-between!important;gap:8px!important;width:100%!important;margin:10px 0 0!important;padding-top:8px!important;border-top:1px solid rgba(91,197,119,.13)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary>div{display:flex!important;flex-direction:column!important;gap:2px!important;min-width:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary span{font-size:7px!important;font-weight:800!important;letter-spacing:.08em!important;color:#668072!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary b{font-size:9px!important;color:#bfe8c8!important;white-space:nowrap!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-footer{display:none!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-list{display:flex!important;flex-direction:column!important;gap:7px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0 2px 0 0!important;overflow-y:auto!important;overflow-x:hidden!important;box-sizing:border-box!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row{display:grid!important;grid-template-columns:26px minmax(0,1fr) auto auto!important;align-items:center!important;gap:9px!important;flex:0 0 auto!important;min-height:48px!important;width:100%!important;margin:0!important;padding:8px 10px!important;background:linear-gradient(90deg,#0b171c,#0a1418)!important;border:1px solid rgba(86,182,111,.16)!important;border-radius:6px!important;box-sizing:border-box!important;cursor:pointer!important;transition:transform .15s ease,border-color .15s ease,background .15s ease!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-row:hover,#entityInformationSection .agworld-company-entity-card .company-facility-row:focus,#entityInformationSection .agworld-company-entity-card .company-facility-row.is-selected{outline:none!important;transform:translateX(-2px)!important;background:#0d1c20!important;border-color:rgba(105,230,137,.55)!important;box-shadow:inset 3px 0 0 #5edc7b!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-marker{display:grid!important;place-items:center!important;width:26px!important;height:26px!important;border-radius:50%!important;background:rgba(85,205,116,.08)!important;border:1px solid rgba(92,215,123,.2)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-marker i{width:7px!important;height:7px!important;border-radius:50%!important;background:#5fdc7d!important;box-shadow:0 0 9px rgba(95,220,125,.45)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-name{min-width:0!important;overflow:hidden!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-name b{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:10px!important;color:#e0eee4!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-name span{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;margin-top:3px!important;font-size:8px!important;color:#7f9989!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-staff{min-width:30px!important;text-align:center!important;padding-left:8px!important;border-left:1px solid rgba(101,172,120,.14)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-staff b{display:block!important;font-size:11px!important;color:#d7f0dd!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-staff span{display:block!important;margin-top:2px!important;font-size:6px!important;font-weight:800!important;letter-spacing:.08em!important;color:#71887a!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-open{display:flex!important;align-items:center!important;gap:5px!important;color:#63df80!important;font-size:12px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-open span{font-size:7px!important;font-weight:800!important;letter-spacing:.08em!important;color:#79ad87!important}'+
    '@media(max-width:900px){#entityInformationSection #farmCard.farm-card.agworld-company-entity-card{height:auto!important;overflow:auto!important}#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split{position:relative!important;display:flex!important;flex-direction:column!important;height:auto!important;overflow:visible!important}#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-stats-pane,#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-facilities-pane{display:flex!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important}#entityInformationSection .agworld-company-entity-card .company-command-kpis{min-height:220px!important}#entityInformationSection .agworld-company-entity-card .company-facility-list{height:auto!important;max-height:none!important;overflow:visible!important}}';
  document.head.appendChild(style);
})();

// Keep the Company Command Center at a strict 50/50 split while sharing the
// right half between the compact skills radar and the scrollable facilities.
(function(){
  const style=document.createElement('style');
  style.id='agworldCompanyCommandSkillsFacilitiesStyle';
  style.textContent=
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{display:grid!important;grid-template-columns:minmax(112px,38%) minmax(0,62%)!important;align-items:stretch!important;min-width:0!important;min-height:0!important;height:100%!important;padding:0!important;overflow:hidden!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-skills-pane{display:flex!important;min-width:0!important;min-height:0!important;height:100%!important;padding:4px!important;box-sizing:border-box!important;overflow:hidden!important;border-right:1px solid rgba(91,197,119,.14)!important}'+
    '#entityInformationSection .agworld-company-entity-card #companySkillChartHost{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side{display:flex!important;min-width:0!important;min-height:0!important;height:100%!important;padding:6px 4px 6px 7px!important;box-sizing:border-box!important;overflow:hidden!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-list{display:flex!important;flex-direction:column!important;gap:5px!important;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0 2px 0 0!important;overflow-y:auto!important;overflow-x:hidden!important;box-sizing:border-box!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-row{min-height:40px!important;padding:6px 7px!important;grid-template-columns:20px minmax(0,1fr) 28px 10px!important;gap:6px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-marker{width:20px!important;height:20px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-name b{font-size:9px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-name span{font-size:6px!important;margin-top:2px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-staff{min-width:24px!important;padding-left:4px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-staff b{font-size:9px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-staff span{font-size:5px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-open{font-size:10px!important}'+
    '@media(max-width:900px){#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:1fr!important;height:auto!important;overflow:visible!important}#entityInformationSection .agworld-company-entity-card .company-command-skills-pane{height:150px!important;border-right:0!important;border-bottom:1px solid rgba(91,197,119,.14)!important}#entityInformationSection .agworld-company-entity-card .company-command-facility-side{height:260px!important}}';
  document.head.appendChild(style);
})();

/* AG World v35 Territory Stats command-center visual system. */
(function(){
  const $=id=>document.getElementById(id);

  function ensureHeading(){
    const panel=$('territoryInfoPanel');
    if(!panel) return false;
    panel.classList.add('agworld-territory-command-panel');
    let heading=panel.querySelector(':scope > .agworld-territory-stats-heading');
    if(!heading){
      heading=document.createElement('div');
      heading.className='agworld-territory-stats-heading';
      heading.innerHTML='<span class="agworld-territory-stats-label">TERRATORY STATS</span><span class="agworld-territory-stats-live"><i></i> LIVE</span>';
      panel.insertBefore(heading,panel.firstChild);
    }
    return true;
  }

  const style=document.createElement('style');
  style.id='agworldTerritoryStatsCommandStyle';
  style.textContent=
    '#territorySection{background:#081217!important;border-top:1px solid rgba(126,167,148,.16)!important;overflow:hidden!important}'+
    '#territoryInfoPanel.agworld-territory-command-panel{position:relative!important;display:flex!important;flex-direction:column!important;min-width:0!important;min-height:0!important;height:100%!important;max-height:100%!important;margin:0!important;padding:0!important;overflow:auto!important;box-sizing:border-box!important;background:radial-gradient(circle at 100% 0,rgba(73,132,91,.14),transparent 42%),linear-gradient(145deg,#101d22 0%,#091318 58%,#060d11 100%)!important;color:#edf6ef!important;border:1px solid rgba(122,224,145,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important}'+
    '#territoryInfoPanel.agworld-territory-command-panel:before{content:"";display:block;position:sticky;top:0;z-index:5;height:4px;flex:0 0 4px;background:linear-gradient(90deg,#5ed879,#a9ee7c 42%,rgba(169,238,124,.10));box-shadow:0 0 18px rgba(94,216,121,.26)}'+
    '#territoryInfoPanel .agworld-territory-stats-heading{position:sticky!important;top:0!important;z-index:4!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;min-height:46px!important;padding:0 16px!important;box-sizing:border-box!important;background:linear-gradient(180deg,rgba(16,29,34,.98),rgba(9,19,24,.96))!important;border-bottom:1px solid rgba(126,167,148,.18)!important;box-shadow:0 8px 18px rgba(0,0,0,.14)!important}'+
    '#territoryInfoPanel .agworld-territory-stats-label{font-size:16px!important;line-height:1!important;letter-spacing:1.6px!important;font-weight:900!important;color:#edf8f0!important;text-transform:uppercase!important;font-family:inherit!important}'+
    '#territoryInfoPanel .agworld-territory-stats-live{display:flex!important;align-items:center!important;gap:6px!important;flex:0 0 auto!important;padding:6px 8px!important;border:1px solid rgba(117,224,132,.24)!important;border-radius:999px!important;background:rgba(117,224,132,.07)!important;color:#a9efb2!important;font-size:8px!important;font-weight:900!important;letter-spacing:1px!important}'+
    '#territoryInfoPanel .agworld-territory-stats-live i{display:block!important;width:6px!important;height:6px!important;border-radius:50%!important;background:#75e084!important;box-shadow:0 0 10px rgba(117,224,132,.9)!important}'+
    '#territoryInfoPanel .territory-info-header{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;margin:14px 16px 0!important;padding:0 0 12px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;background:transparent!important}'+
    '#territoryInfoPanel .territory-info-level{font-size:9px!important;line-height:1.2!important;letter-spacing:1.2px!important;font-weight:900!important;color:#8ee99d!important;text-transform:uppercase!important}'+
    '#territoryInfoPanel .territory-info-name{margin-top:5px!important;font-size:16px!important;line-height:1.1!important;letter-spacing:.7px!important;font-weight:900!important;color:#f3fbf5!important}'+
    '#territoryInfoPanel .territory-info-control{display:flex!important;align-items:center!important;gap:12px!important;margin:12px 16px 0!important;padding:12px 14px!important;border:1px solid rgba(126,167,148,.20)!important;border-radius:8px!important;background:linear-gradient(145deg,#122128 0%,#0b151a 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}'+
    '#territoryInfoPanel .territory-info-control-value{font-size:28px!important;line-height:1!important;font-weight:900!important;letter-spacing:-.6px!important;color:#9cf1a8!important;text-shadow:0 0 18px rgba(117,224,132,.16)!important}'+
    '#territoryInfoPanel .territory-info-control-title{font-size:10px!important;font-weight:900!important;letter-spacing:.9px!important;color:#e8f5eb!important}'+
    '#territoryInfoPanel .territory-info-status{margin-top:4px!important;font-size:8px!important;font-weight:900!important;letter-spacing:1px!important;color:#7f9889!important}'+
    '#territoryInfoPanel .territory-info-status-strong{color:#93e99e!important}'+
    '#territoryInfoPanel .territory-info-progress{height:6px!important;margin:10px 16px 0!important;border-radius:999px!important;overflow:hidden!important;background:#071015!important;border:1px solid rgba(255,255,255,.06)!important;display:flex!important}'+
    '#territoryInfoPanel .territory-info-progress-company{background:linear-gradient(90deg,#48c76a,#9dea7b)!important}'+
    '#territoryInfoPanel .territory-info-progress-enemy{background:linear-gradient(90deg,#d05b5b,#f08a72)!important}'+
    '#territoryInfoPanel .territory-info-progress-neutral{background:#64747b!important}'+
    '#territoryInfoPanel .territory-info-legend{display:flex!important;flex-wrap:wrap!important;gap:7px 14px!important;margin:8px 16px 0!important;color:#91a59a!important;font-size:9px!important;line-height:1.3!important}'+
    '#territoryInfoPanel .territory-info-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important;margin:12px 16px 16px!important;padding:0!important;background:transparent!important}'+
    '#territoryInfoPanel .territory-info-grid>div{min-width:0!important;padding:11px 10px!important;border:1px solid rgba(126,167,148,.18)!important;border-radius:7px!important;background:linear-gradient(145deg,#0f1d23 0%,#091217 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}'+
    '#territoryInfoPanel .territory-info-grid strong{display:block!important;font-size:17px!important;line-height:1!important;color:#edf8f0!important;font-weight:900!important}'+
    '#territoryInfoPanel .territory-info-grid span{display:block!important;margin-top:5px!important;font-size:7px!important;line-height:1.2!important;letter-spacing:.8px!important;text-transform:uppercase!important;color:#7f9889!important}'+
    '#territoryInfoPanel .territory-info-empty{margin:14px 16px 16px!important;padding:16px!important;border:1px solid rgba(126,167,148,.18)!important;border-radius:8px!important;background:linear-gradient(145deg,#0f1d23,#091217)!important;color:#dcebe1!important}'+
    '#territoryInfoPanel .territory-info-footer{margin-top:10px!important;padding-top:10px!important;border-top:1px solid rgba(255,255,255,.07)!important;color:#91a59a!important;font-size:10px!important}'+
    '@media(max-width:1050px){#territoryInfoPanel .territory-info-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}'+
    '@media(max-width:760px){#territoryInfoPanel .territory-info-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#territoryInfoPanel .agworld-territory-stats-label{font-size:14px!important}}';
  document.head.appendChild(style);

  let observer;
  function start(){
    ensureHeading();
    const panel=$('territoryInfoPanel');
    if(panel && !observer){
      observer=new MutationObserver(()=>ensureHeading());
      observer.observe(panel,{childList:true});
    }
  }
  document.addEventListener('DOMContentLoaded',start);
  window.addEventListener('load',()=>{start();setTimeout(ensureHeading,300);setTimeout(ensureHeading,1200);setTimeout(ensureHeading,3000)});
  window.addEventListener('agworld:territory-selected',()=>setTimeout(ensureHeading,0));
  window.__AGWORLD_ENSURE_TERRATORY_STATS__=ensureHeading;
})();


/* AG World v37 Territory Stats vertical side-panel composition. */
(function(){
  const style=document.createElement('style');
  style.id='agworldTerritoryStatsVerticalComposition';
  style.textContent=
    /* The tall drawer is a vertical composition, not the former horizontal dashboard. */
    '#territoryInfoPanel.agworld-territory-command-panel{overflow:hidden!important}'+
    '#territoryInfoPanel .territory-national-layout{display:flex!important;flex-direction:column!important;height:100%!important;min-height:100%!important;overflow:hidden!important}'+
    '#territoryInfoPanel .territory-national-left{display:flex!important;flex-direction:column!important;flex:0 0 auto!important;border-right:0!important;border-bottom:1px solid rgba(126,167,148,.20)!important}'+
    '#territoryInfoPanel .territory-national-right{display:flex!important;flex:1 1 auto!important;min-height:0!important;padding:10px 12px 12px!important;overflow:hidden!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-header{margin:12px 14px 0!important;padding-bottom:9px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-name{font-size:14px!important;line-height:1.15!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-control{margin:9px 14px 0!important;padding:11px 12px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-control-value{font-size:34px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-progress{margin:8px 14px 0!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-legend{margin:8px 14px 12px!important;display:grid!important;grid-template-columns:1fr!important;gap:5px!important;white-space:normal!important;font-size:8px!important}'+
    /* Use the full vertical space for five stacked, high-legibility stat tiles. */
    '#territoryInfoPanel .territory-national-right .territory-info-grid{display:grid!important;grid-template-columns:1fr!important;grid-template-rows:repeat(5,minmax(0,1fr))!important;gap:8px!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid>div{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;min-width:0!important;min-height:0!important;padding:10px 12px!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid strong{font-size:24px!important;line-height:1!important;flex:0 0 auto!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid span{margin:0!important;text-align:right!important;font-size:8px!important;line-height:1.2!important;letter-spacing:1px!important;max-width:58%!important}'+
    '#territoryInfoPanel .territory-national-scope{background:linear-gradient(145deg,rgba(39,104,62,.32),rgba(12,27,20,.92))!important;border-color:rgba(126,224,145,.30)!important}'+
    /* Selected territory layouts inherit the same vertical rhythm. */
    '#territoryInfoPanel:not(:has(.territory-national-layout)) .territory-info-grid{grid-template-columns:1fr!important;grid-template-rows:none!important;gap:8px!important;margin:10px 12px 14px!important}'+
    '#territoryInfoPanel:not(:has(.territory-national-layout)) .territory-info-grid>div{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:11px 12px!important}'+
    '#territoryInfoPanel:not(:has(.territory-national-layout)) .territory-info-grid strong{font-size:23px!important}'+
    '#territoryInfoPanel:not(:has(.territory-national-layout)) .territory-info-grid span{margin-top:0!important;text-align:right!important;max-width:60%!important}';
  document.head.appendChild(style);
})();


/* AG World v36 National Territory two-column layout. */
(function(){
  const style=document.createElement('style');
  style.id='agworldNationalTerritoryTwoColumnStyle';
  style.textContent=
    '#territoryInfoPanel.agworld-territory-command-panel:has(.territory-national-layout){overflow:hidden!important}'+
    '#territoryInfoPanel .territory-national-layout{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:0!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;box-sizing:border-box!important;overflow:hidden!important}'+
    '#territoryInfoPanel .territory-national-left,#territoryInfoPanel .territory-national-right{min-width:0!important;min-height:0!important;box-sizing:border-box!important;overflow:hidden!important}'+
    '#territoryInfoPanel .territory-national-left{display:flex!important;flex-direction:column!important;border-right:1px solid rgba(126,167,148,.22)!important;background:linear-gradient(145deg,rgba(18,33,40,.84),rgba(8,18,23,.74))!important}'+
    '#territoryInfoPanel .territory-national-right{display:flex!important;align-items:stretch!important;padding:12px 14px!important;background:radial-gradient(circle at 100% 0,rgba(73,132,91,.11),transparent 50%),linear-gradient(145deg,rgba(10,20,25,.92),rgba(6,13,17,.92))!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-header{margin:12px 16px 0!important;padding:0 0 8px!important;flex:0 0 auto!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-level{font-size:8px!important;letter-spacing:1.25px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-name{margin-top:4px!important;font-size:13px!important;letter-spacing:.55px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-control{margin:8px 16px 0!important;padding:9px 12px!important;gap:10px!important;flex:0 0 auto!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-control-value{font-size:25px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-control-title{font-size:8px!important;letter-spacing:.7px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-status{margin-top:3px!important;font-size:7px!important;letter-spacing:.8px!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-progress{margin:7px 16px 0!important;height:5px!important;flex:0 0 auto!important}'+
    '#territoryInfoPanel .territory-national-left .territory-info-legend{margin:7px 16px 12px!important;gap:5px 10px!important;font-size:8px!important;white-space:nowrap!important;flex:0 0 auto!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid>div{display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;min-height:0!important;padding:9px 11px!important;border-color:rgba(126,167,148,.20)!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid strong{font-size:20px!important;line-height:1!important;color:#effaf2!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid span{margin-top:4px!important;font-size:7px!important;letter-spacing:.75px!important;color:#8ea196!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid .territory-national-scope{grid-column:1 / -1!important;background:linear-gradient(90deg,rgba(57,125,75,.15),rgba(13,26,31,.88))!important;border-color:rgba(117,224,132,.22)!important}'+
    '#territoryInfoPanel .territory-national-right .territory-info-grid .territory-national-scope strong{font-size:14px!important;letter-spacing:1.2px!important;color:#a8f0b2!important}'+
    '@media(max-width:900px){#territoryInfoPanel .territory-national-layout{grid-template-columns:1fr!important;overflow:auto!important}#territoryInfoPanel .territory-national-left{border-right:0!important;border-bottom:1px solid rgba(126,167,148,.22)!important}#territoryInfoPanel .territory-national-right{min-height:240px!important}}';
  document.head.appendChild(style);
})();


/* AG World v38 Command Center heading matches Territory Stats. */
(function(){
  const style=document.createElement('style');
  style.id='agworldCommandCenterHeadingTerritoryMatch';
  style.textContent=
    '#entityCommandCentreHeading{position:absolute!important;left:0!important;right:0!important;top:0!important;height:46px!important;min-height:46px!important;z-index:8!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:0 16px!important;box-sizing:border-box!important;background:linear-gradient(180deg,rgba(16,29,34,.98),rgba(9,19,24,.96))!important;border-bottom:1px solid rgba(126,167,148,.18)!important;box-shadow:0 8px 18px rgba(0,0,0,.14)!important;color:#edf8f0!important;font-family:inherit!important;text-transform:uppercase!important}'+
    '#entityCommandCentreHeading .agworld-command-center-label{font-size:16px!important;line-height:1!important;letter-spacing:1.6px!important;font-weight:900!important;color:#edf8f0!important;text-transform:uppercase!important;font-family:inherit!important}'+
    '#entityCommandCentreHeading .agworld-command-center-live{display:flex!important;align-items:center!important;gap:6px!important;flex:0 0 auto!important;padding:6px 8px!important;border:1px solid rgba(117,224,132,.24)!important;border-radius:999px!important;background:rgba(117,224,132,.07)!important;color:#a9efb2!important;font-size:8px!important;font-weight:900!important;letter-spacing:1px!important;line-height:1!important}'+
    '#entityCommandCentreHeading .agworld-command-center-live i{display:block!important;width:6px!important;height:6px!important;border-radius:50%!important;background:#75e084!important;box-shadow:0 0 10px rgba(117,224,132,.9)!important}'+
    '#entityInformationSection .farm-card{top:46px!important;height:calc(100% - 46px)!important;min-height:calc(100% - 46px)!important}';
  document.head.appendChild(style);
})();


/* AG World v39 Command Center exact Territory Stats heading match. */
(function(){
  function syncHeading(){
    const section=document.getElementById('entityInformationSection');
    if(!section) return false;
    let heading=document.getElementById('entityCommandCentreHeading');
    if(!heading){
      heading=document.createElement('div');
      heading.id='entityCommandCentreHeading';
      section.insertBefore(heading,section.firstChild);
    }
    heading.className='agworld-command-center-heading-exact';
    heading.innerHTML='<span class="agworld-command-center-label-exact">COMMAND CENTER</span><span class="agworld-command-center-live-exact"><i></i> LIVE</span>';
    return true;
  }
  const style=document.createElement('style');
  style.id='agworldCommandCenterExactTerritoryMatchV39';
  style.textContent=
    '#entityInformationSection{position:absolute!important;overflow:hidden!important;background:radial-gradient(circle at 100% 0,rgba(73,132,91,.14),transparent 35%),linear-gradient(145deg,#101d22 0%,#0a1519 100%)!important;border:1px solid rgba(126,167,148,.16)!important;border-radius:12px!important}'+
    '#entityInformationSection:before{content:""!important;display:block!important;position:absolute!important;left:0!important;right:0!important;top:0!important;z-index:12!important;height:4px!important;background:linear-gradient(90deg,#5ed879,#a9ee7c 42%,rgba(169,238,124,.10))!important;box-shadow:0 0 18px rgba(94,216,121,.26)!important;pointer-events:none!important}'+
    '#entityInformationSection>#entityCommandCentreHeading.agworld-command-center-heading-exact{position:absolute!important;left:0!important;right:0!important;top:4px!important;height:46px!important;min-height:46px!important;z-index:11!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:0 16px!important;margin:0!important;box-sizing:border-box!important;background:linear-gradient(180deg,rgba(16,29,34,.98),rgba(9,19,24,.96))!important;border:0!important;border-bottom:1px solid rgba(126,167,148,.18)!important;border-radius:0!important;box-shadow:0 8px 18px rgba(0,0,0,.14)!important;color:#edf8f0!important;text-transform:uppercase!important}'+
    '#entityCommandCentreHeading .agworld-command-center-label-exact{font-family:inherit!important;font-size:16px!important;line-height:1!important;letter-spacing:1.6px!important;font-weight:900!important;color:#edf8f0!important;text-transform:uppercase!important}'+
    '#entityCommandCentreHeading .agworld-command-center-live-exact{display:flex!important;align-items:center!important;gap:6px!important;flex:0 0 auto!important;padding:6px 8px!important;border:1px solid rgba(117,224,132,.24)!important;border-radius:999px!important;background:rgba(117,224,132,.07)!important;color:#a9efb2!important;font-size:8px!important;font-weight:900!important;letter-spacing:1px!important;line-height:1!important}'+
    '#entityCommandCentreHeading .agworld-command-center-live-exact i{display:block!important;width:6px!important;height:6px!important;border-radius:50%!important;background:#75e084!important;box-shadow:0 0 10px rgba(117,224,132,.9)!important}'+
    '#entityInformationSection .farm-card{top:50px!important;height:calc(100% - 50px)!important;min-height:calc(100% - 50px)!important}';
  document.head.appendChild(style);
  syncHeading();
  const section=document.getElementById('entityInformationSection');
  if(section){
    const observer=new MutationObserver(()=>syncHeading());
    observer.observe(section,{childList:true});
  }
})();


/* AG World v43 Command Center skills emphasis and invisible facility scrolling. */
(function(){
  const style=document.createElement('style');
  style.id='agworldCompanyCommandReadabilityV43';
  style.textContent=
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:minmax(230px,60%) minmax(0,40%)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-skills-pane{padding:3px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side{padding-right:2px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-list{scrollbar-width:none!important;-ms-overflow-style:none!important;padding-right:0!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-list::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}'+
    '@media(max-width:900px){#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:1fr!important}}';
  document.head.appendChild(style);
})();


/* AG World v44 Command Center enlarged skills intelligence. */
(function(){
  const style=document.createElement('style');
  style.id='agworldCompanyCommandSkillsV44';
  style.textContent=
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:minmax(230px,60%) minmax(0,40%)!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-skills-pane{padding:1px 4px 3px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-head{padding:3px 6px!important;min-height:14px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-head span{font-size:6px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-head b{font-size:8px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-visual{padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-visual .ag-skill-radar-svg{width:100%!important;height:164px!important;max-height:164px!important;overflow:visible!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-visual .ag-radar-labels text{font-size:7px!important;font-weight:900!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side{padding-left:6px!important;padding-top:4px!important;padding-bottom:4px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-row{min-height:42px!important}'+
    '@media(max-width:900px){#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:1fr!important}}';
  document.head.appendChild(style);
})();


/* AG World v45 Command Center: maximum skill radar space + larger network stats. */
(function(){
  const style=document.createElement('style');
  style.id='agworldCompanyCommandScaleV45';
  style.textContent=
    /* Give the radar more horizontal room without collapsing the facility list. */
    '#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:minmax(270px,68%) minmax(0,32%)!important;gap:0!important}'+
    /* Remove the now-unused chart heading footprint and let the radar occupy the pane. */
    '#entityInformationSection .agworld-company-entity-card .company-command-skills-pane{padding:0 3px!important;min-width:0!important;min-height:0!important;overflow:visible!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded{height:100%!important;min-height:0!important;display:flex!important;align-items:stretch!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded .company-skill-chart-main{height:100%!important;min-height:0!important;flex:1!important;display:flex!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded .company-skill-visual{height:100%!important;min-height:0!important;flex:1!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded .ag-skill-radar-svg{width:100%!important;height:184px!important;max-height:none!important;overflow:visible!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded .ag-radar-labels text{font-size:11px!important;font-weight:900!important;fill:#edf7ef!important;letter-spacing:.15px!important;paint-order:stroke!important;stroke:#0b151a!important;stroke-width:2.4px!important}'+
    /* Company Network stats: increase every practical reading target. */
    '#entityInformationSection .agworld-company-entity-card .company-command-stats-pane{padding:10px 14px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-pane-title{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;padding:0 2px 8px!important;min-height:18px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-pane-title span{font-size:9px!important;font-weight:900!important;letter-spacing:1px!important;color:#a5c7ad!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-pane-title b{font-size:10px!important;font-weight:900!important;letter-spacing:.8px!important;color:#e8f6eb!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis{gap:8px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis>div{gap:11px!important;padding:11px!important;border-radius:10px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-kpi-icon{width:34px!important;height:34px!important;flex-basis:34px!important;font-size:17px!important;border-radius:9px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis b{font-size:25px!important;line-height:1!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-kpis span:not(.company-kpi-icon){font-size:8.5px!important;font-weight:900!important;letter-spacing:.75px!important;margin-top:4px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary{gap:7px!important;margin-top:8px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary>div{padding:9px 11px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary span{font-size:8px!important;font-weight:900!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-stats-summary b{font-size:11px!important}'+
    /* Preserve facility readability at the narrower side. */
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side{padding-left:7px!important;padding-right:2px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-command-facility-side .company-facility-row{grid-template-columns:10px minmax(0,1fr) 36px 14px!important;gap:6px!important;padding:8px!important;min-height:42px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-name b{font-size:11px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-name span{font-size:8px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-staff b{font-size:13px!important}'+
    '#entityInformationSection .agworld-company-entity-card .company-facility-staff span{font-size:6px!important}'+
    '@media(max-width:1100px){#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:minmax(240px,66%) minmax(0,34%)!important}#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded .ag-skill-radar-svg{height:176px!important}}'+
    '@media(max-width:900px){#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split>.company-command-right-pane{grid-template-columns:1fr!important}.company-command-facility-side{display:none!important}}';
  document.head.appendChild(style);
})();


/* AG World v49 Command Center tablet frame — stronger visual-only bezel. */
(function(){
  const style=document.createElement('style');
  style.id='agworldCommandCenterTabletFrameV49';
  style.textContent=
    /* Visual treatment only: no sizing, grid, DOM or positioning rules are changed. */
    '#entityInformationSection{isolation:isolate!important;border-radius:22px!important;overflow:hidden!important;outline:1px solid rgba(238,245,247,.42)!important;outline-offset:3px!important;box-shadow:0 0 0 2px rgba(186,198,202,.72),0 0 0 4px rgba(73,84,91,.98),0 0 0 7px rgba(24,32,37,.98),0 0 0 10px rgba(93,106,112,.92),0 0 0 12px rgba(20,26,30,.92),0 16px 34px rgba(0,0,0,.48),0 3px 8px rgba(255,255,255,.10)!important}'+
    '#entityInformationSection:after{content:""!important;position:absolute!important;inset:0!important;z-index:30!important;pointer-events:none!important;border-radius:22px!important;box-sizing:border-box!important;background:linear-gradient(135deg,rgba(255,255,255,.20),rgba(255,255,255,0) 16%,rgba(0,0,0,0) 72%,rgba(0,0,0,.32)),linear-gradient(90deg,rgba(166,178,182,.26),rgba(255,255,255,.08) 12%,rgba(0,0,0,.10) 50%,rgba(255,255,255,.07) 86%,rgba(50,60,66,.34))!important;border:6px solid rgba(69,82,88,.96)!important;box-shadow:inset 2px 2px 0 rgba(255,255,255,.30),inset -2px -2px 0 rgba(0,0,0,.72),inset 0 0 0 2px rgba(176,190,194,.20),inset 0 0 20px rgba(0,0,0,.32)!important}'+
    '#entityInformationSection .farm-card{border-radius:15px!important;box-shadow:inset 0 0 0 1px rgba(200,215,219,.12)!important}';
  document.head.appendChild(style);
})();
