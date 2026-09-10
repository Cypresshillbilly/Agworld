/* AG WORLD — PLAYER PAGE FINAL AUDIT / GEOMETRY LOCK v1
   Loaded last. Owns only Player Profile mode and resolves the final audit gaps:
   1) full browser viewport shell;
   2) full-height map stage;
   3) Command Center floating low and centred over the map/ocean;
   4) Territory Stats on the far right, opening left, clear of Command Center;
   5) Advisory Bay fully visible with all five advisor assets clickable;
   6) does not rewrite Mission Control baseline geometry.
*/
(()=>{'use strict';

const STYLE_ID='agworld-player-page-final-audit-v1-style';
const MODE='ag-profile-mode';
let raf=0,ro=null,mo=null;

const css=String.raw`
html,body{width:100%!important;min-width:100%!important;height:100%!important;min-height:100%!important;margin:0!important;padding:0!important}
html{overflow:hidden!important}
body.${MODE}{
  position:fixed!important;inset:0!important;
  width:100vw!important;min-width:100vw!important;max-width:none!important;
  height:100vh!important;min-height:100vh!important;max-height:none!important;
  overflow:hidden!important;transform:none!important;scale:1!important;zoom:1!important;
}
body.${MODE} .app-shell{
  --ag-final-sidebar-w:180px;
  --ag-final-missions-w:285px;
  position:fixed!important;inset:0!important;
  width:100vw!important;min-width:100vw!important;max-width:none!important;
  height:100vh!important;min-height:100vh!important;max-height:none!important;
  margin:0!important;padding:0!important;display:block!important;
  transform:none!important;scale:1!important;zoom:1!important;
  overflow:hidden!important;contain:none!important;box-sizing:border-box!important;
}
body.${MODE} .app-shell>.sidebar{
  position:absolute!important;left:0!important;top:0!important;bottom:0!important;
  width:var(--ag-final-sidebar-w)!important;min-width:var(--ag-final-sidebar-w)!important;
  height:100vh!important;max-height:none!important;z-index:50!important;
}
body.${MODE} .app-shell>.missions{
  position:absolute!important;
  left:var(--ag-final-sidebar-w)!important;top:0!important;bottom:0!important;
  width:var(--ag-final-missions-w)!important;min-width:var(--ag-final-missions-w)!important;
  height:100vh!important;max-height:none!important;
  box-sizing:border-box!important;overflow:hidden!important;z-index:70!important;
}
body.${MODE} .app-shell>.map-area{
  position:absolute!important;
  left:calc(var(--ag-final-sidebar-w) + var(--ag-final-missions-w))!important;
  top:0!important;right:0!important;bottom:0!important;
  width:auto!important;min-width:0!important;
  height:100vh!important;min-height:100vh!important;max-height:none!important;
  overflow:hidden!important;z-index:1!important;
}
body.${MODE} .app-shell>.map-area>.map{
  position:absolute!important;inset:0!important;
  width:100%!important;height:100%!important;min-height:100%!important;max-height:none!important;
}

/* Keep the map stage edge crisp. No feathered pseudo-layer is allowed to soften
   the map boundary into the surrounding screen. */
body.${MODE} .app-shell>.map-area::before,
body.${MODE} .app-shell>.map-area::after{filter:none!important;backdrop-filter:none!important}
body.${MODE} .app-shell>.map-area{border:0!important;box-shadow:none!important}
body.${MODE} .app-shell>.map-area>.map{
  clip-path:inset(0)!important;
  mask-image:none!important;-webkit-mask-image:none!important;
}

/* COMMAND CENTER: preserve the approved floating position, centred across the
   player-page map and low enough to sit over the ocean with visible map below. */
body.${MODE} .app-shell>#entityInformationSection{
  position:absolute!important;
  left:calc(var(--ag-final-sidebar-w) + var(--ag-final-missions-w) + ((100vw - var(--ag-final-sidebar-w) - var(--ag-final-missions-w))/2))!important;
  right:auto!important;top:auto!important;bottom:22px!important;
  width:min(680px,calc(100vw - var(--ag-final-sidebar-w) - var(--ag-final-missions-w) - 64px))!important;
  height:170px!important;max-height:170px!important;min-height:0!important;
  margin:0!important;padding:8px 10px 10px!important;
  box-sizing:border-box!important;transform:translateX(-50%)!important;
  z-index:1500!important;background:transparent!important;border:0!important;
  box-shadow:none!important;overflow:hidden!important;
}
body.${MODE} .app-shell>#entityInformationSection #farmCard{height:100%!important;max-height:none!important}

/* ADVISORY BAY: restore the approved five-across clickable advisor row.
   This removes the two-row overflow that was clipping the left-side bay after
   the Command Center geometry changed. */
body.${MODE} .missions #agAdvisorBay{
  box-sizing:border-box!important;
  overflow:hidden!important;
  min-height:0!important;
}
body.${MODE} .missions #agAdvisorBay .ag-advisor-grid{
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  grid-template-rows:minmax(0,1fr)!important;
  gap:5px!important;
  min-height:0!important;height:100%!important;
}
body.${MODE} .missions #agAdvisorBay .ag-advisor{
  grid-column:auto!important;grid-row:auto!important;
  min-width:0!important;min-height:0!important;height:auto!important;
  overflow:hidden!important;
}
body.${MODE} .missions #agAdvisorBay .ag-advisor:nth-child(1),
body.${MODE} .missions #agAdvisorBay .ag-advisor:nth-child(2),
body.${MODE} .missions #agAdvisorBay .ag-advisor:nth-child(3),
body.${MODE} .missions #agAdvisorBay .ag-advisor:nth-child(4),
body.${MODE} .missions #agAdvisorBay .ag-advisor:nth-child(5){
  grid-column:auto!important;grid-row:auto!important;
}
body.${MODE} .missions #agAdvisorBay .ag-advisor img{
  max-width:100%!important;max-height:100%!important;object-fit:cover!important;
}
`;

function active(){return document.body.classList.contains(MODE);}
function install(){
  let s=document.getElementById(STYLE_ID);
  if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s);}
  s.textContent=css;
}
function px(v){return Math.max(0,Math.round(Number(v)||0));}

function lock(){
  if(!active())return;
  install();

  const shell=document.querySelector('.app-shell');
  const missions=document.querySelector('.app-shell>.missions');
  const map=document.querySelector('.app-shell>.map-area');
  const command=document.getElementById('entityInformationSection');
  const advisor=document.getElementById('agAdvisorBay');
  const territory=document.getElementById('agProfileTerritoryStats');
  if(!shell||!missions||!map)return;

  /* One authoritative viewport calculation. Existing modules may request a
     relayout, but no module is allowed to shrink the profile page below the
     actual browser viewport. */
  const vw=Math.max(document.documentElement.clientWidth,window.innerWidth||0);
  const vh=Math.max(document.documentElement.clientHeight,window.innerHeight||0);
  shell.style.setProperty('width',vw+'px','important');
  shell.style.setProperty('height',vh+'px','important');
  shell.style.setProperty('min-width',vw+'px','important');
  shell.style.setProperty('min-height',vh+'px','important');

  /* Keep the already-approved left-column geometry while allowing narrow
     windows to remain a real full-screen layout instead of a scaled canvas. */
  const sidebarW=Math.max(154,Math.min(210,Math.round(vw*0.105)));
  const missionsW=Math.max(250,Math.min(285,Math.round(vw*0.148)));
  shell.style.setProperty('--ag-final-sidebar-w',sidebarW+'px');
  shell.style.setProperty('--ag-final-missions-w',missionsW+'px');

  /* Advisor Bay owns its own content height. It is intentionally not coupled to
     Command Center height: the previous coupling created a two-row grid inside
     a 170px box and clipped the advisor tabs. */
  if(advisor){
    const missionRect=missions.getBoundingClientRect();
    const head=advisor.querySelector('.ag-advisor-bay-head');
    const grid=advisor.querySelector('.ag-advisor-grid');
    const contentNeed=Math.max(
      132,
      px((head?.getBoundingClientRect().height||0)+(grid?.getBoundingClientRect().height||0)+20)
    );
    const targetH=Math.max(132,Math.min(176,contentNeed));
    const bottom=12;
    advisor.style.setProperty('position','absolute','important');
    advisor.style.setProperty('left','10px','important');
    advisor.style.setProperty('right','10px','important');
    advisor.style.setProperty('top','auto','important');
    advisor.style.setProperty('bottom',bottom+'px','important');
    advisor.style.setProperty('height',targetH+'px','important');
    advisor.style.setProperty('min-height',targetH+'px','important');
    advisor.style.setProperty('max-height',targetH+'px','important');
    advisor.style.setProperty('margin','0','important');
    advisor.style.setProperty('overflow','hidden','important');

    /* The canonical progression stack uses the Advisor top as its protected
       lower boundary. Refresh the geometry after the bay has been fixed. */
    const ar=advisor.getBoundingClientRect();
    const bottomBoundary=Math.max(14,px(missionRect.bottom-ar.top)+14);
    missions.style.setProperty('--agps-bottom',bottomBoundary+'px');
  }

  /* Command Center stays in the already-correct low, central map position. */
  if(command){
    const mapRect=map.getBoundingClientRect();
    const maxW=Math.max(320,mapRect.width-64);
    const width=Math.min(680,Math.max(420,Math.round(mapRect.width*.58)),maxW);
    const height=170;
    const centerX=mapRect.left+mapRect.width/2;
    command.style.setProperty('left',px(centerX)+'px','important');
    command.style.setProperty('right','auto','important');
    command.style.setProperty('bottom','22px','important');
    command.style.setProperty('top','auto','important');
    command.style.setProperty('width',px(width)+'px','important');
    command.style.setProperty('height',height+'px','important');
    command.style.setProperty('max-height',height+'px','important');
    command.style.setProperty('transform','translateX(-50%)','important');
    command.style.setProperty('z-index','1500','important');
  }

  /* Territory Stats remains on the far right and opens to the left. Its lower
     edge is capped above the Command Center rather than allowing overlap. */
  if(territory){
    const cr=command?.getBoundingClientRect();
    const mr=map.getBoundingClientRect();
    const top=18,gap=14;
    const available=cr?.height?Math.max(220,Math.floor(cr.top-mr.top-gap-top)):Math.max(220,Math.floor(mr.height*.52));
    const h=Math.max(220,Math.min(360,available));
    territory.style.setProperty('position','absolute','important');
    territory.style.setProperty('right','0px','important');
    territory.style.setProperty('left','auto','important');
    territory.style.setProperty('top',top+'px','important');
    territory.style.setProperty('bottom','auto','important');
    territory.style.setProperty('height',h+'px','important');
    territory.style.setProperty('z-index','2600','important');
  }

  /* Explicitly request dependent modules to re-read the final geometry. */
  window.dispatchEvent(new CustomEvent('agworld:player-page-geometry-locked'));
}

function schedule(){
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{raf=0;lock();});
}
function start(){
  install();schedule();
  addEventListener('resize',schedule,{passive:true});
  ['agworld:landing-layout-ready','agworld:player-ready','agworld:player-profile','agworld:advisor-selected','agworld:mission-completed','agworld:player-page-geometry-locked'].forEach(e=>addEventListener(e,schedule));
  [0,40,120,300,700,1400,2600,4200].forEach(ms=>setTimeout(schedule,ms));
  if('ResizeObserver'in window){
    ro?.disconnect();ro=new ResizeObserver(schedule);
    ['.app-shell','.missions','.map-area','#agAdvisorBay','#entityInformationSection'].map(q=>document.querySelector(q)).filter(Boolean).forEach(el=>ro.observe(el));
  }
  mo?.disconnect();
  mo=new MutationObserver(rs=>{if(rs.some(r=>r.type==='childList'))schedule();});
  mo.observe(document.body,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();