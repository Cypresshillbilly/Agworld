/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=menu-logo-official-v2';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
/* Final layout contract:
   SIDEBAR: official AG World logo → navigation → logout.
   MISSIONS: player avatar/profile + level/XP → My Missions / Mission Control. */
body.ag-profile-mode .sidebar,.app-shell .sidebar{
  padding:6px 7px 5px!important;box-sizing:border-box!important;
  overflow:hidden!important;display:flex!important;flex-direction:column!important;
}
body.ag-profile-mode .sidebar .menu-user,.app-shell .sidebar .menu-user{display:none!important}
body.ag-profile-mode .sidebar .profile,.app-shell .sidebar .profile{display:none!important}

/* Official AG World logo remains at the top of the grey sidebar. */
body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{
  order:1!important;display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:58px!important;min-height:58px!important;flex:0 0 58px!important;
  margin:0 0 4px!important;padding:2px 0!important;box-sizing:border-box!important;overflow:visible!important;
}
body.ag-profile-mode .sidebar .brand .brand-logo,.app-shell .sidebar .brand .brand-logo{
  display:block!important;width:min(96%,220px)!important;height:54px!important;max-width:none!important;max-height:none!important;
  object-fit:contain!important;object-position:center!important;
}

/* Mission profile is deliberately above the eyebrow and My Missions heading. */
body.ag-profile-mode .missions .ag-player-mission-profile,.app-shell .missions .ag-player-mission-profile{
  display:grid!important;visibility:visible!important;opacity:1!important;
  grid-template-columns:46px minmax(0,1fr)!important;align-items:center!important;column-gap:8px!important;
  width:100%!important;min-height:68px!important;margin:0 0 5px!important;padding:5px 3px!important;
  position:relative!important;z-index:50!important;box-sizing:border-box!important;overflow:hidden!important;
  border-top:1px solid rgba(116,145,154,.45)!important;border-bottom:1px solid rgba(116,145,154,.45)!important;
  background:rgba(5,17,22,.025)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-avatar,.app-shell .missions .ag-player-mission-profile .ag-player-avatar{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;border-radius:50%!important;
  background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;font:900 17px Arial,sans-serif!important;box-sizing:border-box!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-summary,.app-shell .missions .ag-player-mission-profile .ag-player-summary{
  display:flex!important;visibility:visible!important;opacity:1!important;flex-direction:column!important;
  justify-content:center!important;align-items:stretch!important;min-width:0!important;overflow:hidden!important;text-align:left!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-name,.app-shell .missions .ag-player-mission-profile .ag-player-name{
  display:block!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;
  color:inherit!important;font:900 8.5px/1.15 Arial,sans-serif!important;letter-spacing:.25px!important;white-space:nowrap!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-role,
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-level,
.app-shell .missions .ag-player-mission-profile .ag-player-role,
.app-shell .missions .ag-player-mission-profile .ag-player-level{
  display:block!important;color:#6f858e!important;font:700 6.2px/1.3 Arial,sans-serif!important;letter-spacing:.1px!important;white-space:nowrap!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-track,.app-shell .missions .ag-player-mission-profile .ag-player-xp-track{
  display:block!important;width:100%!important;height:5px!important;margin:4px 0 2px!important;border-radius:999px!important;overflow:hidden!important;
  background:rgba(67,87,94,.2)!important;border:1px solid rgba(0,0,0,.06)!important;box-sizing:border-box!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-fill,.app-shell .missions .ag-player-mission-profile .ag-player-xp-fill{
  display:block!important;height:100%!important;width:0!important;border-radius:inherit!important;background:linear-gradient(90deg,#7cab30,#b7db4b)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-text,.app-shell .missions .ag-player-mission-profile .ag-player-xp-text{
  display:flex!important;justify-content:space-between!important;gap:6px!important;color:#6f858e!important;font:700 5.8px/1 Arial,sans-serif!important;white-space:nowrap!important;
}
/* Navigation consumes only remaining space and can scroll internally if another module adds rows. */
body.ag-profile-mode .sidebar .nav,.app-shell .sidebar .nav{
  order:2!important;display:flex!important;flex-direction:column!important;gap:0!important;margin:0!important;padding:0!important;
  flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;
}
body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{
  width:100%!important;min-height:16px!important;height:16px!important;flex:0 0 16px!important;
  margin:0!important;padding:2px 6px!important;font:700 5.9px/1 Arial,sans-serif!important;
  letter-spacing:.04px!important;white-space:nowrap!important;box-sizing:border-box!important;
}
body.ag-profile-mode .sidebar button[id*="logout"],.app-shell .sidebar button[id*="logout"],
body.ag-profile-mode .sidebar .logout,.app-shell .sidebar .logout{
  order:3!important;flex:0 0 auto!important;min-height:18px!important;height:18px!important;
}
body.ag-profile-mode .map-area .ag-world-map-logo,.app-shell .map-area .ag-world-map-logo{display:none!important}
body.ag-profile-mode .bottom{height:23%!important}

@media(min-width:1500px){
  body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{height:66px!important;min-height:66px!important;flex-basis:66px!important}
  body.ag-profile-mode .sidebar .brand .brand-logo,.app-shell .sidebar .brand .brand-logo{height:62px!important}
  body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{height:18px!important;min-height:18px!important;flex-basis:18px!important;font-size:6.4px!important}
  body.ag-profile-mode .missions .ag-player-mission-profile,.app-shell .missions .ag-player-mission-profile{min-height:74px!important}
}
`;
function installStyles(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==css)s.textContent=css}
function playerData(){
 const player=window.AGWorldPlayer||{};
 const name=(player.display_name||sessionStorage.getItem('gamechanger.username')||'PLAYER').toUpperCase();
 const level=Math.max(1,Number(player.level||sessionStorage.getItem('gamechanger.level')||1));
 const chapter=Math.max(1,Number(player.chapter||sessionStorage.getItem('gamechanger.chapter')||1));
 const xp=Math.max(0,Number(player.xp||sessionStorage.getItem('gamechanger.xp')||0));
 const next=Math.max(1000,Math.ceil((xp+1)/1000)*1000);
 const pct=Math.max(0,Math.min(100,Math.round((xp/next)*100)));
 return {name,level,chapter,xp,next,pct,initial:(name.trim().charAt(0)||'P').toUpperCase()};
}
function ensureMissionsPlayerProfile(){
 const missions=document.querySelector('.missions');if(!missions)return null;
 let card=missions.querySelector('#agPlayerMissionProfile');
 if(!card){
   card=document.createElement('section');
   card.id='agPlayerMissionProfile';
   card.className='ag-player-mission-profile';
   card.setAttribute('aria-label','Player profile');
 }
 card.innerHTML=playerCardHTML(playerData());
 const eyebrow=missions.querySelector('.eyebrow');
 const heading=missions.querySelector('h1,.missions-title,.mission-title');
 const anchor=eyebrow||heading||missions.firstElementChild;
 if(anchor && card.nextElementSibling!==anchor)anchor.insertAdjacentElement('beforebegin',card);
 else if(!anchor && missions.firstElementChild!==card)missions.prepend(card);
 return card;
}
function ensureSidebarBrand(s){
 if(!s)return null;
 let brand=s.querySelector('.brand');
 if(!brand){
   brand=document.createElement('div');
   brand.className='brand';
   const logo=document.createElement('img');
   logo.className='brand-logo';
   logo.alt='AgWorld';
   brand.appendChild(logo);
   s.prepend(brand);
 }
 let logo=brand.querySelector('.brand-logo');
 if(!logo){logo=document.createElement('img');logo.className='brand-logo';logo.alt='AgWorld';brand.replaceChildren(logo)}
 logo.src=LOGO_SRC;
 return brand;
}
function playerCardHTML(d){
 return '<div class="ag-player-avatar" aria-hidden="true">'+d.initial+'</div><div class="ag-player-summary"><strong class="ag-player-name">'+d.name+'</strong><span class="ag-player-role">AG WORLD PLAYER</span><span class="ag-player-level">Level '+d.level+' · Chapter '+d.chapter+'</span><span class="ag-player-xp-track"><i class="ag-player-xp-fill" style="width:'+d.pct+'%"></i></span><span class="ag-player-xp-text"><b>'+d.xp.toLocaleString()+' / '+d.next.toLocaleString()+' XP</b><b>'+d.pct+'%</b></span></div>';
}
function correctSidebar(){
 const s=document.querySelector('.sidebar');if(!s)return;
 // Remove legacy duplicate player blocks only. The official sidebar brand is retained.
 s.querySelectorAll('.menu-user,.profile').forEach(el=>el.remove());
 const brand=ensureSidebarBrand(s);
 const nav=s.querySelector('.nav');
 if(s.firstElementChild!==brand)s.prepend(brand);
 if(nav && brand.nextElementSibling!==nav)brand.insertAdjacentElement('afterend',nav);
 ensureMissionsPlayerProfile();
 document.querySelectorAll('.map-area .ag-world-map-logo').forEach(el=>el.remove());
}
function refreshPlayerUI(){
 const card=document.querySelector('.missions #agPlayerMissionProfile');if(!card)return;
 const d=playerData();card.innerHTML=playerCardHTML(d);
}
function start(){
 installStyles();correctSidebar();
 window.addEventListener('agworld:player-profile',refreshPlayerUI);
 const observer=new MutationObserver(()=>{
  installStyles();
  const s=document.querySelector('.sidebar');if(!s)return;
  const good=!!(s.querySelector('.brand .brand-logo')&&document.querySelector('.missions #agPlayerMissionProfile'));
  if(!good)correctSidebar();
 });
 /* Important: watch descendants because game-view-mode changes sidebar.innerHTML. The callback is inert once final markup exists, so it cannot loop. */
 observer.observe(document.body,{childList:true,subtree:true});
 // Defensive health check: later game modules are not allowed to remove the
 // mission player profile or its style rules after the layout has been normalised.
 setInterval(()=>{installStyles();correctSidebar();ensureMissionsPlayerProfile();refreshPlayerUI();},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
