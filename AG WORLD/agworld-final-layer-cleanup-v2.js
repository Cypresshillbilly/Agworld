/* AG WORLD — Final landing/map layer cleanup + V1 Player Screen release guard.
   The approved Player Screen V1 is the only surface allowed to become visible
   after the loading page. This guard prevents the intermediate legacy shell from
   flashing while late canonical modules finish composing the locked V1 layout. */
(()=>{
  'use strict';

  const READY_CLASS='agworld-v1-player-screen-ready';
  const GUARD_STYLE_ID='agworld-v1-player-release-guard';
  let released=false;
  let releaseRaf=0;

  function installReleaseGuard(){
    if(document.getElementById(GUARD_STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=GUARD_STYLE_ID;
    style.textContent=
      'body:not(.'+READY_CLASS+') .app-shell{visibility:hidden!important;opacity:0!important;pointer-events:none!important}'+
      'body.'+READY_CLASS+' .app-shell{visibility:visible!important;opacity:1!important;pointer-events:auto!important;transition:opacity .16s ease-out!important}';
    document.head.appendChild(style);
  }

  function hasApprovedV1PlayerScreen(){
    const required=[
      '.app-shell',
      '.sidebar',
      '.missions',
      '#agPlayerMissionProfile',
      '#agPlayerProgressionStack',
      '#agCanonicalSkillProfile',
      '#agCanonicalMissionCard',
      '#agAdvisorBay',
      '.map-area',
      '#map',
      '#entityInformationSection',
      '#territoryStatsDrawer'
    ];
    return required.every(selector=>!!document.querySelector(selector));
  }

  function releaseApprovedV1(){
    if(released || !hasApprovedV1PlayerScreen()) return false;
    released=true;
    document.body.classList.add(READY_CLASS);
    document.dispatchEvent(new CustomEvent('agworld:v1-player-screen-ready'));
    return true;
  }

  function scheduleReleaseCheck(){
    if(released || releaseRaf) return;
    releaseRaf=requestAnimationFrame(()=>{
      releaseRaf=0;
      releaseApprovedV1();
    });
  }

  /* Existing final cleanup behaviour. */
  const css = `
    #mapStatus{display:none!important;visibility:hidden!important;pointer-events:none!important}
    [data-agworld-stale-player-layer="true"]{
      display:none!important;visibility:hidden!important;pointer-events:none!important;
    }
  `;

  function installStyle(){
    document.getElementById('agworld-final-layer-cleanup-style')?.remove();
    const style=document.createElement('style');
    style.id='agworld-final-layer-cleanup-style';
    style.textContent=css;
    document.head.appendChild(style);
  }

  function protectedNode(el){
    return !!(
      !el ||
      el.closest?.('.missions,.sidebar,.bottom.user-profile-section') ||
      el.id==='agEnterWorldBtn' ||
      el.id==='developerModeBtn' ||
      el.closest?.('.map-tools') ||
      el.closest?.('#territoryStatsDrawer,#entityInformationSection')
    );
  }

  function playerNames(){
    const p=window.AGWorldPlayer||{};
    return [...new Set([
      String(p.display_name||'').trim().toUpperCase(),
      'NICO VAN ROOYEN'
    ].filter(Boolean))];
  }

  function isPlayerText(el,names){
    const text=String(el?.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
    return text && names.some(name=>text.includes(name));
  }

  function compactOverlay(el){
    const r=el?.getBoundingClientRect?.();
    return !!(r && r.width>0 && r.height>0 && r.width<=620 && r.height<=320);
  }

  function markAndRemove(root){
    if(!root || protectedNode(root)) return;
    root.setAttribute('data-agworld-stale-player-layer','true');
    root.style.setProperty('display','none','important');
    root.style.setProperty('visibility','hidden','important');
    root.style.setProperty('pointer-events','none','important');
    root.remove();
  }

  function nearestOverlay(seed){
    let target=seed;
    let n=seed;
    for(let depth=0;n && n!==document.body && depth<10;depth++,n=n.parentElement){
      if(protectedNode(n)) break;
      const cs=getComputedStyle(n);
      const cls=(n.id||'')+' '+(typeof n.className==='string'?n.className:'');
      const overlay=/player|profile|user|avatar|hud|overlay|card|chip/i.test(cls);
      const floating=['fixed','absolute','sticky'].includes(cs.position);
      if(compactOverlay(n) && (overlay || floating)) target=n;
      if(n.parentElement===document.body) break;
    }
    return target;
  }

  function purgeNamedDuplicates(){
    const names=playerNames();
    [...document.querySelectorAll('body *')].forEach(el=>{
      if(protectedNode(el) || !isPlayerText(el,names)) return;
      if([...el.children].some(child=>isPlayerText(child,names))) return;
      const candidate=nearestOverlay(el);
      if(!candidate || protectedNode(candidate)) return;
      const inMap=!!candidate.closest?.('.map-area');
      const cs=getComputedStyle(candidate);
      const floating=['fixed','absolute','sticky'].includes(cs.position);
      if(inMap || (floating && compactOverlay(candidate))) markAndRemove(candidate);
    });
  }

  function purgeTopRightAvatarClone(){
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return;
    const mapRect=mapArea.getBoundingClientRect();
    if(!mapRect.width || !mapRect.height) return;

    [...document.querySelectorAll('body button,body [role="button"],body div,body span')].forEach(el=>{
      if(protectedNode(el)) return;
      if(String(el.textContent||'').trim().toUpperCase()!=='N') return;
      const r=el.getBoundingClientRect?.();
      if(!r || r.width<12 || r.height<12 || r.width>110 || r.height>110) return;
      const overMap=r.right>=mapRect.left && r.left<=mapRect.right && r.bottom>=mapRect.top && r.top<=mapRect.bottom;
      const nearTop=(r.top-mapRect.top)<160;
      const nearRight=(mapRect.right-r.right)<220;
      if(!overMap || !nearTop || !nearRight) return;
      const candidate=nearestOverlay(el);
      if(candidate && !protectedNode(candidate)) markAndRemove(candidate);
    });
  }

  function purgeLegacyLayers(){
    document.querySelectorAll(
      '#agControlDashboardButton,#agCompanyCommandButton,#agControlDashboard,#agCompanyCommand,'+
      '[data-agworld-legacy-surface="true"],[data-agworld-duplicate-player-overlay="true"]'
    ).forEach(el=>el.remove());
    purgeNamedDuplicates();
    purgeTopRightAvatarClone();
  }

  function run(){
    installReleaseGuard();
    installStyle();
    document.getElementById('mapStatus')?.remove();
    purgeLegacyLayers();
    scheduleReleaseCheck();
  }

  function observe(){
    const root=document.body;
    if(!root) return;
    let queued=false;
    new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        purgeLegacyLayers();
        scheduleReleaseCheck();
      });
    }).observe(root,{childList:true,subtree:true});
    [0,50,150,400,900,1800,3500,7000].forEach(ms=>setTimeout(()=>{
      purgeLegacyLayers();
      scheduleReleaseCheck();
    },ms));
  }

  run();
  observe();
})();