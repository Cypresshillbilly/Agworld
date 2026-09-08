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
    const important=(el,prop,val)=>{ if(el) el.style.setProperty(prop,val,'important'); };

    if(sidebar){ important(sidebar,'bottom','170px'); important(sidebar,'height','650px'); }
    if(missions){ important(missions,'left','180px'); important(missions,'top','0'); important(missions,'width','285px'); important(missions,'height','650px'); }
    if(mapArea){ important(mapArea,'left','465px'); important(mapArea,'top','0'); important(mapArea,'right','0'); important(mapArea,'height','650px'); }
    if(territory){ important(territory,'position','absolute'); important(territory,'left','0'); important(territory,'top','650px'); important(territory,'width','465px'); important(territory,'height','170px'); important(territory,'bottom','0'); important(territory,'z-index','999'); }
    if(entity){ important(entity,'position','absolute'); important(entity,'left','465px'); important(entity,'top','650px'); important(entity,'right','0'); important(entity,'height','170px'); important(entity,'bottom','0'); important(entity,'z-index','999'); }

    const oldProfile=document.querySelector('.bottom.user-profile-section');
    if(oldProfile) important(oldProfile,'display','none');

    if(shell && territory && territory.parentElement!==shell) shell.appendChild(territory);
    if(shell && entity && entity.parentElement!==shell) shell.appendChild(entity);
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
  window.addEventListener('load',()=>{ run(); setTimeout(run,250); setTimeout(run,1000); setTimeout(run,2500); });
  window.addEventListener('agworld:territory-selected',event=>{
    window.__AGWORLD_SELECTED_TERRITORY__=event.detail?.territory||event.detail||null;
  });
})();