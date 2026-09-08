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

  function moveCorePanels(){
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return false;

    const territorySection=ensurePanel('territorySection',mapArea,'bottom-game-panel territory-game-panel');
    const entitySection=ensurePanel('entityInformationSection',territorySection,'bottom-game-panel entity-game-panel');

    const territoryPanel=$('territoryInfoPanel');
    if(territoryPanel && territoryPanel.parentElement!==territorySection) territorySection.appendChild(territoryPanel);
    if(territoryPanel && !territoryPanel.classList.contains('show') && !territoryPanel.innerHTML.trim()){
      territoryPanel.classList.add('show');
      territoryPanel.innerHTML='<div class="territory-info-empty"><div class="territory-info-level">TERRITORY CONTROL</div><div class="territory-info-name">Select a territory on the map</div><div class="territory-info-footer"><span>Territory statistics will remain fixed here after selection.</span></div></div>';
    }

    const card=$('farmCard');
    if(card && card.parentElement!==entitySection) entitySection.appendChild(card);
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
    if(!shell) return;

    // The shell is the single geometry owner. Derive the split from the live
    // shell dimensions so responsive scaling cannot leave the left and right
    // bottom panels with different start heights.
    const shellH=shell.clientHeight||820;
    const shellW=shell.clientWidth||1280;
    const bottomH=Math.round(shellH*(170/820));
    const topH=shellH-bottomH;
    const sidebarW=Math.round(shellW*(180/1280));
    const missionsW=Math.round(shellW*(285/1280));
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

    frame(sidebar,0,0,sidebarW,topH);
    frame(missions,sidebarW,0,missionsW,topH);
    frame(mapArea,leftStage,0,shellW-leftStage,topH);
    frame(territory,0,topH,leftStage,bottomH);
    frame(entity,leftStage,topH,shellW-leftStage,bottomH);

    // The Entity Command card is the sole visual surface for the entire
    // bottom-right allocation. Force it to occupy the exact geometry owned
    // by entityInformationSection rather than retaining any legacy card size.
    const entityCard=$('farmCard');
    if(entity && entityCard){
      important(entity,'overflow','hidden');
      important(entityCard,'position','absolute');
      important(entityCard,'left','0');
      important(entityCard,'top','0');
      important(entityCard,'right','0');
      important(entityCard,'bottom','0');
      important(entityCard,'width','100%');
      important(entityCard,'height','100%');
      important(entityCard,'min-height','100%');
      important(entityCard,'max-width','none');
      important(entityCard,'max-height','none');
      important(entityCard,'margin','0');
      important(entityCard,'box-sizing','border-box');
      important(entityCard,'z-index','2');
    }

    if(territory) important(territory,'z-index','999');
    if(entity) important(entity,'z-index','999');

    const oldProfile=document.querySelector('.bottom.user-profile-section');
    if(oldProfile){
      important(oldProfile,'display','none');
      important(oldProfile,'visibility','hidden');
      important(oldProfile,'pointer-events','none');
    }

    if(territory && territory.parentElement!==shell) shell.appendChild(territory);
    if(entity && entity.parentElement!==shell) shell.appendChild(entity);

    window.__AGWORLD_MAIN_LAYOUT_GEOMETRY__={shellW,shellH,topH,bottomH,sidebarW,missionsW,leftStage};
  }

  function run(){
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
      '<div class="territory-info-header"><div><div class="territory-info-level">NATIONAL TERRITORY</div><div class="territory-info-name">SOUTH AFRICA · NATIONAL OVERVIEW</div></div></div>'+
      '<div class="territory-info-control"><div class="territory-info-control-value">'+s.companyPct+'%</div><div><div class="territory-info-control-title">THE COMPANY NATIONAL CONTROL</div><div class="territory-info-status territory-info-status-strong">LIVE NATIONAL BASELINE</div></div></div>'+
      '<div class="territory-info-progress"><div class="territory-info-progress-company" style="width:'+s.companyPct+'%"></div><div class="territory-info-progress-enemy" style="width:'+s.competitorPct+'%"></div><div class="territory-info-progress-neutral" style="width:'+s.neutralPct+'%"></div></div>'+
      '<div class="territory-info-legend"><span>🟢 Company '+s.companyPct+'%</span><span>🔴 Competitor '+s.competitorPct+'%</span><span>⚪ Neutral '+s.neutralPct+'%</span></div>'+
      '<div class="territory-info-grid"><div><strong>'+s.total+'</strong><span>Total Farms</span></div><div><strong>'+s.company+'</strong><span>Company Control</span></div><div><strong>'+s.competitor+'</strong><span>Competitor</span></div><div><strong>'+s.neutral+'</strong><span>Neutral</span></div><div><strong>NATIONAL</strong><span>Active Scope</span></div></div>';
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
  function renderCompanyCard(){
    if(!companyCardActive) return false;
    const card=$('farmCard');
    if(!card) return false;
    captureEntityCommandTemplate();
    const fs=facilities();
    const employees=fs.reduce((sum,f)=>sum+employeeCount(f),0);
    const active=fs.filter(f=>String(f?.status||'active').toLowerCase()!=='inactive').length;
    const provinces=new Set(fs.map(f=>String((f?.details||{}).province||'').trim()).filter(Boolean)).size;
    card.classList.add('show','agworld-company-entity-card');
    card.dataset.entityCommandDefault='company';
    card.innerHTML=
      '<div class="company-command-card-head">'+
        '<div><div class="company-command-eyebrow">THE COMPANY · ENTITY COMMAND</div><h2 id="farmName">THE COMPANY</h2><div id="farmMeta" class="meta">National company network · live facility overview</div></div>'+
        '<div class="company-command-status">LIVE</div>'+
      '</div>'+
      '<div class="company-command-kpis">'+
        '<div><b>'+fs.length+'</b><span>FACILITIES</span></div>'+
        '<div><b>'+employees+'</b><span>EMPLOYEES</span></div>'+
        '<div><b>'+active+'</b><span>ACTIVE SITES</span></div>'+
        '<div><b>'+provinces+'</b><span>PROVINCES</span></div>'+
      '</div>'+
      '<div class="company-facility-list-head"><strong>COMPANY FACILITIES</strong><span>'+fs.length+' NATIONAL LOCATIONS</span></div>'+
      '<div class="company-facility-list">'+
        (fs.length?fs.map(f=>'<article class="company-facility-row">'+
          '<div class="company-facility-name"><b>'+esc(f.name)+'</b><span>'+esc(facilityRole(f))+' · '+esc(facilityLocation(f))+'</span></div>'+
          '<div class="company-facility-staff"><b>'+employeeCount(f)+'</b><span>EMPLOYEES</span></div>'+
          '<div class="company-facility-state">'+esc(String(f.status||'Active').toUpperCase())+'</div>'+
        '</article>').join(''):'<div class="company-facility-empty">Loading Company facilities from the live world…</div>')+
      '</div>'+
      '<div class="company-command-footer"><span>Company-wide entity information remains visible here until you select another map entity.</span></div>';
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

    if(preservedActions){
      preservedActions.classList.remove('agworld-entity-command-actions');
      summary.appendChild(preservedActions);
      preservedActions.classList.add('agworld-entity-command-actions');
      agworldPreservedFarmActions=preservedActions;
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
      const actions=captureFarmActions();
      if(actions && !summary.contains(actions)){
        actions.classList.remove('agworld-entity-command-actions');
        summary.appendChild(actions);
        actions.classList.add('agworld-entity-command-actions');
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

  function selectEntityScope(event){
    const entity=event?.detail?.entity||event?.detail?.farm||event?.detail;
    if(!entity) return;
    entityCommandDiag('SELECTION RECEIVED',{eventType:event.type,entityId:String(entity.id||''),entityName:entity.name||'',entityType:entity.type||''});
    companyCardActive=false;
    window.__AGWORLD_ENTITY_COMMAND_SCOPE__=String(entity.type||'entity').toUpperCase();
    window.__AGWORLD_ENTITY_COMMAND_STARTUP__='THE_COMPANY_THEN_ENTITY';

    // The Company portfolio is startup content only. On selection, give the
    // selected entity the entire visible Entity Command Centre instead of
    // restoring the old legacy shell as blank spacer columns.
    const host=prepareEntityCommandCentreForSelection(entity);
    entityCommandDiag('ENTITY COMMAND CENTRE PREPARED',{prepared:!!host,entityId:String(entity.id||''),entityType:entity.type||''});

    // Re-open from the canonical selection after the dedicated visible canvas
    // has been prepared. This makes the handoff deterministic for all types.
    const isFarm=event.type==='agworld:farm-selected' || event?.detail?.farm;
    const delay=isFarm?0:180;
    entityCommandDiag('V2 HANDOFF SCHEDULED',{isFarm,delay,hasFarmOpen:typeof window.openV2FarmDetail==='function',hasDynamicOpen:typeof window.openV2DynamicEntityDetail==='function'});
    setTimeout(()=>{
      entityCommandDiag('V2 HANDOFF EXECUTING',{isFarm,entityId:String(entity.id||''),entityType:entity.type||''});
      if(isFarm && typeof window.openV2FarmDetail==='function') window.openV2FarmDetail(entity);
      else if(!isFarm && typeof window.openV2DynamicEntityDetail==='function') window.openV2DynamicEntityDetail(entity);
      setTimeout(()=>entityCommandDiag('V2 HANDOFF POSTCHECK',{isFarm,entityId:String(entity.id||'')}),60);
    },delay);
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
    '#entityInformationSection{position:absolute!important;overflow:hidden!important;padding:0!important;margin:0!important;box-sizing:border-box!important}'+
    '#entityInformationSection .farm-card{position:absolute!important;inset:0!important;left:0!important;right:0!important;bottom:0!important;top:0!important;width:100%!important;height:100%!important;min-height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:12px;box-sizing:border-box;overflow:hidden}'+
    '#entityInformationSection .agworld-company-entity-card{display:flex!important;flex-direction:column;background:linear-gradient(145deg,#16252a 0%,#0c161a 58%,#0a1114 100%);border:1px solid rgba(122,224,145,.32);box-shadow:0 12px 28px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.06)}'+
    '.company-command-card-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:13px 16px 9px;border-bottom:1px solid rgba(255,255,255,.07)}'+
    '.company-command-eyebrow{font-size:8px;letter-spacing:1.35px;font-weight:900;color:#75e084;margin-bottom:4px}.company-command-card-head h2{margin:0;font-size:20px;letter-spacing:.6px}.company-command-status{font-size:8px;font-weight:900;letter-spacing:1px;color:#75e084;border:1px solid rgba(117,224,132,.38);padding:5px 8px;border-radius:999px}'+
    '.company-command-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:10px 16px}.company-command-kpis>div{padding:9px 10px;border:1px solid rgba(255,255,255,.07);border-radius:8px;background:rgba(255,255,255,.025)}.company-command-kpis b,.company-command-kpis span{display:block}.company-command-kpis b{font-size:17px;color:#e9f6ec}.company-command-kpis span{font-size:7px;letter-spacing:.8px;color:#91a59a;margin-top:3px}'+
    '.company-facility-list-head{display:flex;justify-content:space-between;gap:10px;padding:3px 16px 7px;font-size:8px;letter-spacing:.9px;color:#a8b8ad}.company-facility-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:0 16px 9px;overflow:auto;flex:1;align-content:start}.company-facility-row{display:grid;grid-template-columns:minmax(0,1fr) 58px auto;gap:8px;align-items:center;padding:8px 9px;border-radius:8px;background:rgba(5,13,16,.55);border:1px solid rgba(255,255,255,.055)}.company-facility-name{min-width:0}.company-facility-name b,.company-facility-name span{display:block}.company-facility-name b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.company-facility-name span{font-size:7px;color:#8fa095;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.company-facility-staff{text-align:center}.company-facility-staff b,.company-facility-staff span{display:block}.company-facility-staff b{font-size:12px;color:#dfeee2}.company-facility-staff span{font-size:6px;letter-spacing:.6px;color:#7f9588}.company-facility-state{font-size:7px;color:#75e084;font-weight:900}.company-facility-empty{padding:12px;font-size:9px;color:#94a39a}.company-command-footer{padding:7px 16px 10px;border-top:1px solid rgba(255,255,255,.055);font-size:8px;color:#84948b}'+
    '@media(max-width:900px){.company-facility-list{grid-template-columns:1fr}.company-command-kpis{grid-template-columns:repeat(2,1fr)}}';
  document.head.appendChild(style);
})();
