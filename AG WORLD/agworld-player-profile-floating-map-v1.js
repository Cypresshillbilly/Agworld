/* AG WORLD — Player Profile floating map Command Center
   Owns only Player Profile geometry. Full Game geometry is untouched. */
(()=>{
'use strict';
const STYLE_ID='agworld-player-profile-floating-map-v1';
const isProfile=()=>document.body.classList.contains('ag-profile-mode');
const important=(el,p,v)=>el&&el.style.setProperty(p,v,'important');

function installStyle(){
  let s=document.getElementById(STYLE_ID);
  if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s);}
  s.textContent=`
body.ag-profile-mode .app-shell{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;min-width:100vw!important;min-height:100vh!important;max-width:none!important;max-height:none!important;overflow:hidden!important}
body.ag-profile-mode .map-area{overflow:hidden!important;clip-path:inset(0)!important;isolation:isolate!important}
body.ag-profile-mode .map-area>.map{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:100%!important;min-height:100%!important}
body.ag-profile-mode #entityInformationSection{position:absolute!important;z-index:1800!important;overflow:hidden!important;background:transparent!important;border:0!important}
body.ag-profile-mode #territoryStatsDrawer{position:absolute!important;right:0!important;left:auto!important;z-index:2300!important;transform:none!important}
body.ag-profile-mode #territoryStatsDrawer .ag-territory-drawer,
body.ag-profile-mode .ag-territory-drawer{transform:none!important}
`;
}

function layout(){
  if(!isProfile()) return;
  const shell=document.querySelector('.app-shell');
  const map=document.querySelector('.map-area');
  const entity=document.getElementById('entityInformationSection');
  const drawer=document.getElementById('territoryStatsDrawer');
  if(!shell||!map||!entity) return;

  const shellRect=shell.getBoundingClientRect();
  const mapRect=map.getBoundingClientRect();
  const mapLeft=Math.max(0,Math.round(mapRect.left-shellRect.left));
  const mapWidth=Math.max(1,Math.round(mapRect.width));

  // Player Profile only: the map continues behind the Command Center.
  important(map,'position','absolute');
  important(map,'left',mapLeft+'px');
  important(map,'top','0px');
  important(map,'right','auto');
  important(map,'bottom','0px');
  important(map,'width',mapWidth+'px');
  important(map,'height',shell.clientHeight+'px');

  // Independent floating Command Center: centered in the map and low over ocean.
  const liveMapW=map.clientWidth||mapWidth;
  const liveMapH=map.clientHeight||shell.clientHeight;
  const commandW=Math.min(680,Math.max(420,Math.round(liveMapW*.58)));
  const commandH=Math.min(170,Math.max(130,Math.round(liveMapH*.18)));
  const commandLeft=Math.round(mapLeft+(liveMapW-commandW)/2);
  const bottomInset=Math.max(22,Math.round(liveMapH*.028));

  important(entity,'left',commandLeft+'px');
  important(entity,'top','auto');
  important(entity,'right','auto');
  important(entity,'bottom',bottomInset+'px');
  important(entity,'width',commandW+'px');
  important(entity,'height',commandH+'px');
  important(entity,'min-height',commandH+'px');
  important(entity,'max-height',commandH+'px');
  important(entity,'transform','none');
  important(entity,'pointer-events','auto');
  important(entity,'z-index','1800');

  // Hard rule: Territory Stats remains independently above the Command Center.
  // It never grows behind or through the Command Center and keeps a visible gap.
  if(drawer){
    const commandTop=entity.offsetTop;
    const topInset=18;
    const gap=Math.max(16,Math.round(liveMapH*.02));
    const available=Math.max(220,commandTop-gap-topInset);
    const desired=Math.min(390,Math.max(300,Math.round(liveMapH*.52)));
    const drawerH=Math.min(desired,available);

    important(drawer,'right','0px');
    important(drawer,'left','auto');
    important(drawer,'top',topInset+'px');
    important(drawer,'bottom','auto');
    important(drawer,'height',drawerH+'px');
    important(drawer,'max-height',drawerH+'px');
    important(drawer,'z-index','2300');

    const content=document.getElementById('territoryStatsDrawerContent');
    if(content){
      important(content,'height','100%');
      important(content,'max-height','100%');
    }
  }

  window.__AGWORLD_PROFILE_FLOATING_MAP__={
    mapFullHeight:true,
    commandCenter:'ocean-floating',
    territoryStats:'right-side-above-command-center',
    territoryGap:true
  };
}

function apply(){
  if(!isProfile()) return;
  installStyle();
  layout();
}
function start(){
  apply();
  [0,80,220,500,1000,1800].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('resize',apply);
  window.addEventListener('agworld:player-profile',apply);
  const shell=document.querySelector('.app-shell');
  if(shell){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    }).observe(shell,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();