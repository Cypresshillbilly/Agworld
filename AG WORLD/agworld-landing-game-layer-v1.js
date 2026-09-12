/* AG WORLD — Landing surface + full-screen game layer.
   The landing screen is the player's control layer. The map remains the live
   world underneath it, and Enter AgWorld promotes that same live map into the
   full-screen game HUD without rebuilding or duplicating the world. */
(()=>{
  'use strict';

  const css=`
  /* Recess the live map into the landing surface. The left and lower edges
     behave like a shallow frame, giving the map a physically indented depth. */
  body:not(.ag-full-game-mode) .map-area{
    isolation:isolate!important;
    overflow:hidden!important;
    background:#dfe7e4!important;
    box-shadow:
      inset 13px 0 20px rgba(7,31,38,.28),
      inset 0 -16px 24px rgba(7,31,38,.24),
      0 12px 26px rgba(8,27,33,.13)!important;
  }
  body:not(.ag-full-game-mode) .map-area::before,
  body:not(.ag-full-game-mode) .map-area::after{
    content:''!important;position:absolute!important;pointer-events:none!important;
    z-index:7200!important;
  }
  body:not(.ag-full-game-mode) .map-area::before{
    left:0!important;top:0!important;bottom:0!important;width:18px!important;
    background:linear-gradient(90deg,
      rgba(255,255,255,.96) 0%,
      rgba(247,249,248,.9) 22%,
      rgba(211,221,217,.52) 58%,
      rgba(38,67,72,.12) 78%,
      transparent 100%)!important;
    box-shadow:inset -8px 0 12px rgba(10,39,46,.18)!important;
  }
  body:not(.ag-full-game-mode) .map-area::after{
    left:0!important;right:0!important;bottom:0!important;height:19px!important;
    background:linear-gradient(180deg,
      rgba(12,41,48,.14) 0%,
      rgba(199,211,207,.42) 35%,
      rgba(245,247,246,.9) 72%,
      rgba(255,255,255,.98) 100%)!important;
    box-shadow:inset 0 8px 14px rgba(10,37,44,.18)!important;
  }
  body:not(.ag-full-game-mode) .map-area #map{
    box-shadow:inset 0 0 0 1px rgba(8,34,40,.14)!important;
  }

  /* Entry control belongs to the live world, not to a duplicate screen. */
  #agEnterWorldBtn{
    position:absolute!important;right:12px!important;top:10px!important;z-index:7600!important;
    display:inline-flex!important;align-items:center!important;gap:7px!important;
    min-height:28px!important;padding:0 12px!important;
    border:1px solid rgba(114,184,74,.62)!important;border-radius:9px!important;
    background:linear-gradient(145deg,#173c45,#102b36 68%,#0a2029)!important;
    color:#efffd2!important;font-size:9px!important;font-weight:900!important;
    letter-spacing:.9px!important;cursor:pointer!important;
    box-shadow:0 8px 20px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.08)!important;
  }
  #agEnterWorldBtn:hover{border-color:#c2e95d!important;box-shadow:0 0 0 1px rgba(194,233,93,.2),0 10px 24px rgba(0,0,0,.3)!important}
  #agEnterWorldBtn::before{content:'◉';color:#c2e95d!important;font-size:10px!important}

  /* Full AgWorld mode: promote the existing live map into a true game HUD. */
  body.ag-full-game-mode{overflow:hidden!important;background:#081d25!important}
  body.ag-full-game-mode .app-shell{
    position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;
    max-width:none!important;max-height:none!important;overflow:hidden!important;
    background:#081d25!important;box-shadow:none!important;
  }
  body.ag-full-game-mode .sidebar,
  body.ag-full-game-mode .missions,
  body.ag-full-game-mode .bottom.user-profile-section{display:none!important}
  body.ag-full-game-mode .map-area{
    position:fixed!important;inset:0!important;left:0!important;right:0!important;
    top:0!important;bottom:0!important;width:100vw!important;height:100vh!important;
    z-index:500!important;overflow:hidden!important;background:#081d25!important;
    box-shadow:none!important;border:0!important;
  }
  body.ag-full-game-mode .map-area::before,
  body.ag-full-game-mode .map-area::after{display:none!important}
  body.ag-full-game-mode .map-area #map{
    position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
    box-shadow:none!important;
  }
  body.ag-full-game-mode .map-header{
    left:18px!important;right:18px!important;top:14px!important;z-index:540!important;
  }
  body.ag-full-game-mode .map-header .map-tools{max-width:72vw!important}
  body.ag-full-game-mode #agEnterWorldBtn{
    position:fixed!important;right:18px!important;top:18px!important;z-index:10020!important;
  }
  body.ag-full-game-mode #agEnterWorldBtn::before{content:'←'!important}
  body.ag-full-game-mode #agEnterWorldBtn{font-size:0!important}
  body.ag-full-game-mode #agEnterWorldBtn::after{
    content:'PLAYER VIEW'!important;font-size:9px!important;letter-spacing:.9px!important;
  }

  /* The two live game systems become HUD surfaces over the full map. */
  body.ag-full-game-mode #entityInformationSection{
    position:fixed!important;left:50%!important;top:50%!important;bottom:auto!important;
    transform:translate(-50%,-50%)!important;
    width:min(680px,calc(100vw - 620px))!important;min-width:460px!important;
    max-height:62vh!important;overflow:auto!important;
    z-index:10000!important;padding:0!important;
    background:transparent!important;border:0!important;box-shadow:none!important;
  }
  body.ag-full-game-mode #entityCommandCentreHeading{
    position:sticky!important;top:0!important;z-index:2!important;
  }
  body.ag-full-game-mode #entityInformationSection #farmCard,
  body.ag-full-game-mode #entityInformationSection .farm-card{
    border-radius:14px!important;overflow:hidden!important;
  }
  body.ag-full-game-mode #territoryStatsDrawer{
    position:fixed!important;right:18px!important;left:auto!important;top:92px!important;bottom:auto!important;
    width:min(300px,calc(100vw - 36px))!important;max-height:calc(100vh - 120px)!important;
    z-index:10010!important;
  }
  body.ag-full-game-mode #territoryStatsDrawerContent{
    max-height:calc(100vh - 170px)!important;overflow:auto!important;
  }
  body.ag-full-game-mode #territoryStatsToggle{
    border-radius:12px!important;
  }
  @media(max-width:1050px){
    body.ag-full-game-mode #entityInformationSection{
      left:18px!important;right:18px!important;bottom:18px!important;top:auto!important;
      transform:none!important;width:auto!important;min-width:0!important;max-height:38vh!important;
    }
    body.ag-full-game-mode #territoryStatsDrawer{right:12px!important;top:72px!important;width:270px!important}
  }
  `;

  function inject(){
    if(document.getElementById('agworld-landing-game-layer-style')) return;
    const s=document.createElement('style');
    s.id='agworld-landing-game-layer-style';
    s.textContent=css;
    document.head.appendChild(s);
  }

  function playerName(){
    const p=window.AGWorldPlayer||{};
    return String(p.display_name||'NICO VAN ROOYEN').trim().toUpperCase();
  }

  /* Remove the duplicate Nico identity HUD from the map layer. The landing
     screen already has the canonical player profile, so there must never be a
     second Nico/player card floating over the map or the Enter AgWorld control. */
  function purgeDuplicatePlayerOverlay(){
    const keepRoots=[
      document.getElementById('agPlayerMissionProfile'),
      document.querySelector('.missions'),
      document.querySelector('.sidebar'),
      document.querySelector('.bottom.user-profile-section')
    ].filter(Boolean);

    const isKept=el=>keepRoots.some(root=>root===el||root.contains(el));
    const isDuplicateName=el=>/\bNICO\s+VAN\s+ROOYEN\b/i.test((el.textContent||'').replace(/\s+/g,' ').trim());

    const roots=new Set();
    [...document.querySelectorAll('body *')].forEach(el=>{
      if(!el || isKept(el) || !isDuplicateName(el)) return;

      /* Ignore large container nodes that merely contain a duplicate further
         down; start from the smallest matching node and climb only to the
         floating HUD/card root. */
      if([...el.children].some(child=>isDuplicateName(child))) return;

      let n=el;
      let fallback=el;
      while(n && n!==document.body){
        if(isKept(n)) return;
        if(n.matches?.('#entityInformationSection,#territoryStatsDrawer,.map-header')) break;

        const cs=getComputedStyle(n);
        const floating=cs.position==='absolute'||cs.position==='fixed'||cs.position==='sticky';
        const cardLike=/(^|[-_\s])(leader|player|profile|hud|card|overlay)([-_\s]|$)/i.test((n.id||'')+' '+(n.className||''));
        if(floating || cardLike) fallback=n;

        if(n.parentElement?.classList?.contains('map-area')){
          roots.add(floating||cardLike?n:fallback);
          return;
        }
        n=n.parentElement;
      }

      /* If the duplicate is injected directly into the map without a useful
         class name, remove its nearest element inside the live map rather than
         allowing it to cover the Enter AgWorld button. */
      if(el.closest('.map-area')) roots.add(fallback);
    });

    roots.forEach(root=>{
      if(!root || isKept(root)) return;
      try{root.remove();}catch(e){}
    });
  }

  function ensureButton(){
    const area=document.querySelector('.map-area');
    if(!area) return null;
    let btn=document.getElementById('agEnterWorldBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.id='agEnterWorldBtn';
      btn.type='button';
      btn.setAttribute('aria-label','Enter full AgWorld game mode');
      btn.textContent='ENTER AGWORLD';
      (area.querySelector('.map-tools')||area.querySelector('.map-header')||area).appendChild(btn);
      btn.addEventListener('click',()=>toggleGameMode());
    }
    return btn;
  }

  function refreshMap(){
    setTimeout(()=>{
      window.dispatchEvent(new Event('resize'));
      const candidates=[window.map,window.agMap,window.AGWorldMap,window.leafletMap];
      candidates.forEach(m=>{try{m&&typeof m.invalidateSize==='function'&&m.invalidateSize({animate:false});}catch(e){}});
    },80);
    setTimeout(()=>window.dispatchEvent(new Event('resize')),350);
  }

  function toggleGameMode(force){
    const next=typeof force==='boolean'?force:!document.body.classList.contains('ag-full-game-mode');
    document.body.classList.toggle('ag-full-game-mode',next);
    const btn=ensureButton();
    if(btn){
      btn.setAttribute('aria-label',next?'Return to Player View':'Enter full AgWorld game mode');
      btn.textContent=next?'PLAYER VIEW':'ENTER AGWORLD';
    }
    refreshMap();
    window.dispatchEvent(new CustomEvent('agworld:game-mode-changed',{detail:{mode:next?'game':'player'}}));
  }

  function run(){
    inject();
    ensureButton();
    purgeDuplicatePlayerOverlay();
  }

  window.AGWorldGameLayer={enter:()=>toggleGameMode(true),exit:()=>toggleGameMode(false),toggle:()=>toggleGameMode()};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  window.addEventListener('agworld:player-profile',()=>{setTimeout(purgeDuplicatePlayerOverlay,0);setTimeout(purgeDuplicatePlayerOverlay,300);});
  const observer=new MutationObserver(()=>purgeDuplicatePlayerOverlay());
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();



/* FINAL MAP PLAYER OVERLAY KILL SWITCH
   The map must never render a second player identity. The canonical identity is
   the Player Profile in the Missions column only. This runs after every late
   map mutation and removes the smallest compact map overlay containing the
   player's name, including overlays injected inside the map header or Leaflet. */
(()=>{
  'use strict';

  const normalise=v=>String(v||'').replace(/\s+/g,' ').trim().toUpperCase();

  function canonicalNames(){
    const p=window.AGWorldPlayer||{};
    return [...new Set([
      normalise(p.display_name),
      normalise(sessionStorage.getItem('gamechanger.username')),
      'NICO VAN ROOYEN'
    ].filter(Boolean))];
  }

  function isProtected(el){
    return !!(
      !el ||
      el.closest?.('#agPlayerMissionProfile,.missions,.sidebar,#entityInformationSection,#territoryStatsDrawer') ||
      el.id==='agEnterWorldBtn' ||
      el.id==='developerModeBtn' ||
      el.closest?.('.map-tools')
    );
  }

  function compact(el,mapRect){
    const r=el.getBoundingClientRect?.();
    if(!r) return false;
    const nearMap=r.right>=mapRect.left && r.left<=mapRect.right && r.bottom>=mapRect.top && r.top<=mapRect.bottom;
    return nearMap && r.width>0 && r.height>0 && r.width<=520 && r.height<=260;
  }

  function removeOverlayCandidate(seed,mapArea,mapRect){
    if(!seed||isProtected(seed)) return;

    let target=seed;
    let n=seed;
    for(let depth=0; n && n!==mapArea && depth<8; depth++, n=n.parentElement){
      const parent=n.parentElement;
      if(!parent || parent===mapArea || parent.id==='map' || parent.classList?.contains('map-header')) break;

      const idcls=normalise((parent.id||'')+' '+(typeof parent.className==='string'?parent.className:''));
      const positioned=['ABSOLUTE','FIXED','STICKY'].includes(getComputedStyle(parent).position.toUpperCase());
      const looksLikeOverlay=/PLAYER|PROFILE|USER|AVATAR|HUD|OVERLAY|CONTROL|CHIP|LEAFLET/.test(idcls);

      if(compact(parent,mapRect) && (positioned || looksLikeOverlay)) target=parent;
      else if(normalise(parent.textContent).includes(normalise(seed.textContent)) && compact(parent,mapRect)) target=parent;
    }

    if(target===mapArea || target.id==='map' || target.classList?.contains('map-header') || isProtected(target)) return;
    target.setAttribute('data-agworld-duplicate-player-overlay','true');
    target.style.setProperty('display','none','important');
    target.style.setProperty('visibility','hidden','important');
    target.style.setProperty('pointer-events','none','important');
    target.remove();
  }

  function purge(){
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return;
    const mapRect=mapArea.getBoundingClientRect?.();
    if(!mapRect) return;

    const names=canonicalNames();

    // Remove exact player-name overlays first, always from the smallest matching
    // node so a shared map header/container is never deleted.
    [...mapArea.querySelectorAll('*')].forEach(el=>{
      if(isProtected(el)) return;
      const text=normalise(el.textContent);
      if(!text) return;
      if(!names.some(name=>name && text.includes(name))) return;

      const childAlsoMatches=[...el.children].some(child=>{
        const childText=normalise(child.textContent);
        return names.some(name=>name && childText.includes(name));
      });
      if(childAlsoMatches) return;

      removeOverlayCandidate(el,mapArea,mapRect);
    });

    // Remove the compact top-right N avatar/chip if it is the duplicate shell
    // rendered without the full name.
    [...mapArea.querySelectorAll('button,[role="button"],div,span')].forEach(el=>{
      if(isProtected(el)) return;
      const text=normalise(el.textContent);
      if(text!=='N') return;
      const r=el.getBoundingClientRect?.();
      if(!r || r.width<12 || r.height<12 || r.width>100 || r.height>100) return;
      const nearTop=(r.top-mapRect.top)<140;
      const nearRight=(mapRect.right-r.right)<180;
      if(nearTop && nearRight) removeOverlayCandidate(el,mapArea,mapRect);
    });
  }

  function start(){
    purge();
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return;
    const observer=new MutationObserver(()=>requestAnimationFrame(purge));
    observer.observe(mapArea,{childList:true,subtree:true});
    [50,150,400,900,1800,3500,7000,12000].forEach(ms=>setTimeout(purge,ms));
    setInterval(purge,2000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
