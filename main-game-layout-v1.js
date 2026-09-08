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
