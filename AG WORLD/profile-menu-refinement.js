/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=menu-logo-official-v2';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
/* Final layout contract:
   SIDEBAR: official AG World logo → navigation → logout.
   MISSIONS: player avatar/profile + level/XP → My Missions / Mission Control. */

/* Reserve enough horizontal space for the official logo. */
body.ag-profile-mode .app-shell,.app-shell{
  grid-template-columns:154px 145px minmax(0,1fr)!important;
}
body.ag-profile-mode .sidebar,.app-shell .sidebar{
  padding:6px 5px 5px!important;box-sizing:border-box!important;
  overflow:hidden!important;display:flex!important;flex-direction:column!important;
  width:154px!important;min-width:154px!important;
}
body.ag-profile-mode .sidebar .menu-user,.app-shell .sidebar .menu-user{display:none!important}
body.ag-profile-mode .sidebar .profile,.app-shell .sidebar .profile{display:none!important}

/* Official AG World logo remains at the top of the grey sidebar. */
body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{
  order:1!important;display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:106px!important;min-height:106px!important;flex:0 0 106px!important;
  margin:0 0 3px!important;padding:4px 0 5px!important;box-sizing:border-box!important;overflow:visible!important;
}
body.ag-profile-mode .sidebar .brand .brand-logo,.app-shell .sidebar .brand .brand-logo{
  display:block!important;width:min(100%,300px)!important;height:98px!important;max-width:none!important;max-height:none!important;
  object-fit:contain!important;object-position:center!important;filter:drop-shadow(0 3px 5px rgba(0,0,0,.28))!important;
}

/* Mission profile is deliberately above the eyebrow and My Missions heading. */
body.ag-profile-mode .missions .ag-player-mission-profile,.app-shell .missions .ag-player-mission-profile{
  display:grid!important;visibility:visible!important;opacity:1!important;
  grid-template-columns:66px minmax(0,1fr)!important;align-items:center!important;column-gap:11px!important;
  width:calc(100% - 8px)!important;min-height:96px!important;margin:3px 4px 8px!important;padding:10px 9px!important;
  position:relative!important;z-index:50!important;box-sizing:border-box!important;overflow:hidden!important;
  border:1px solid rgba(93,128,141,.55)!important;border-radius:10px!important;
  background:linear-gradient(145deg,rgba(17,39,49,.96),rgba(8,22,29,.98))!important;
  box-shadow:0 7px 15px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.07),inset 0 -2px 5px rgba(0,0,0,.22)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-avatar,.app-shell .missions .ag-player-mission-profile .ag-player-avatar{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:64px!important;height:64px!important;min-width:64px!important;min-height:64px!important;border-radius:50%!important;
  background:
    radial-gradient(circle at 35% 28%,#7c99a5 0%,#3d5b68 22%,#1a3541 52%,#0b1e27 76%)!important;
  border:3px solid #9eb1b8!important;outline:2px solid rgba(178,220,71,.52)!important;outline-offset:2px!important;
  color:#fff!important;font:900 26px Arial,sans-serif!important;letter-spacing:-1px!important;
  text-shadow:0 2px 4px rgba(0,0,0,.65)!important;box-sizing:border-box!important;
  box-shadow:0 7px 12px rgba(0,0,0,.38),inset 0 2px 4px rgba(255,255,255,.24),inset 0 -5px 9px rgba(0,0,0,.35)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-summary,.app-shell .missions .ag-player-mission-profile .ag-player-summary{
  display:flex!important;visibility:visible!important;opacity:1!important;flex-direction:column!important;
  justify-content:center!important;align-items:stretch!important;min-width:0!important;overflow:hidden!important;text-align:left!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-name,.app-shell .missions .ag-player-mission-profile .ag-player-name{
  display:block!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;
  color:#f1f6f7!important;font:900 12px/1.12 Arial,sans-serif!important;letter-spacing:.35px!important;white-space:nowrap!important;
  text-shadow:0 1px 2px rgba(0,0,0,.45)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-role,
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-level,
.app-shell .missions .ag-player-mission-profile .ag-player-role,
.app-shell .missions .ag-player-mission-profile .ag-player-level{
  display:block!important;color:#9fb1b8!important;font:800 8px/1.35 Arial,sans-serif!important;letter-spacing:.22px!important;white-space:nowrap!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-track,.app-shell .missions .ag-player-mission-profile .ag-player-xp-track{
  display:block!important;width:100%!important;height:8px!important;margin:6px 0 4px!important;border-radius:999px!important;overflow:hidden!important;
  background:#0a171d!important;border:1px solid rgba(167,199,208,.28)!important;box-sizing:border-box!important;
  box-shadow:inset 0 2px 3px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.05)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-fill,.app-shell .missions .ag-player-mission-profile .ag-player-xp-fill{
  display:block!important;height:100%!important;width:0!important;border-radius:inherit!important;
  background:linear-gradient(90deg,#6f9f2a,#c6e85b)!important;box-shadow:0 0 8px rgba(190,229,80,.48),inset 0 1px 0 rgba(255,255,255,.38)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-text,.app-shell .missions .ag-player-mission-profile .ag-player-xp-text{
  display:flex!important;justify-content:space-between!important;gap:6px!important;color:#b8c6cb!important;font:800 7.2px/1 Arial,sans-serif!important;white-space:nowrap!important;
}
/* Navigation occupies only the space below the fixed logo.  The logo can never be compressed by menu items. */
body.ag-profile-mode .sidebar .nav,.app-shell .sidebar .nav{
  order:2!important;display:flex!important;flex-direction:column!important;gap:1px!important;margin:0!important;padding:0 1px!important;
  flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;
}
body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{
  width:100%!important;min-height:23px!important;height:23px!important;flex:0 0 23px!important;
  margin:0!important;padding:4px 7px!important;font:700 8px/1 Arial,sans-serif!important;
  letter-spacing:.08px!important;white-space:nowrap!important;box-sizing:border-box!important;
}
body.ag-profile-mode .sidebar .nav button .icon,.app-shell .sidebar .nav button .icon{
  transform:scale(.82)!important;transform-origin:center!important;
}
body.ag-profile-mode .sidebar button[id*="logout"],.app-shell .sidebar button[id*="logout"],
body.ag-profile-mode .sidebar .logout,.app-shell .sidebar .logout{
  order:3!important;flex:0 0 auto!important;min-height:18px!important;height:18px!important;
}
/* Keep the map's command tools clear of the dedicated Developer Mode corner. */
body.ag-profile-mode .map-area .map-header,.app-shell .map-area .map-header{padding-right:118px!important}
body.ag-profile-mode .map-area .map-tools,.app-shell .map-area .map-tools{justify-content:flex-start!important;right:auto!important;max-width:calc(100% - 118px)!important}
#developerModeBtn{position:absolute!important;top:10px!important;right:12px!important;z-index:1250!important;min-width:94px!important;height:24px!important;padding:0 9px!important;border-radius:6px!important;font-size:7px!important;white-space:nowrap!important}
body.ag-profile-mode .map-area .ag-world-map-logo,.app-shell .map-area .ag-world-map-logo{display:none!important}
/* The mission card is the only player profile shown on this screen. */
.map-area .map-player-profile,.map-area .player-profile,.map-area .map-user-profile,.map-area .player-avatar-control,.map-area [id*="mapPlayerProfile"],.map-area [id*="mapUserProfile"]{display:none!important}
body.ag-profile-mode .bottom{height:23%!important}

@media(min-width:1500px){
  body.ag-profile-mode .app-shell,.app-shell{grid-template-columns:174px 158px minmax(0,1fr)!important}
  body.ag-profile-mode .sidebar,.app-shell .sidebar{width:174px!important;min-width:174px!important}
  body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{height:118px!important;min-height:118px!important;flex-basis:118px!important}
  body.ag-profile-mode .sidebar .brand .brand-logo,.app-shell .sidebar .brand .brand-logo{height:110px!important}
  body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{height:24px!important;min-height:24px!important;flex-basis:24px!important;font-size:8.4px!important}
  body.ag-profile-mode .missions .ag-player-mission-profile,.app-shell .missions .ag-player-mission-profile{min-height:108px!important;grid-template-columns:74px minmax(0,1fr)!important}
  body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-avatar,.app-shell .missions .ag-player-mission-profile .ag-player-avatar{width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;font-size:29px!important}
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
const SIDEBAR_MENU=[
 ['profile','Profile'],
 ['pipeline','Sales Funnel'],
 ['clients','Client List'],
 ['products','Sales Products'],
 ['after sales','After Sales'],
 ['mission history','Mission History'],
 ['ai assistant','AI Assistant'],
 ['territory campaigns','Territory Campaigns'],
 ['territory graphics','Territory Graphics'],
 ['settings','Settings'],
 ['logout','Logout']
];
function menuKey(el){
 const raw=(el.dataset.menu||el.dataset.view||el.id||el.getAttribute('aria-label')||el.textContent||'').toLowerCase();
 return raw.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
}
function ensureTerritoryCampaignMenuItem(nav){
 if(!nav)return null;
 let campaign=document.getElementById('agCampaignCommandButton');
 if(!campaign)return null;
 // Re-home the existing functional button rather than cloning it, preserving its
 // campaign click handler and all Chapter 3 behaviour.
 campaign.style.position='static';
 campaign.style.right='auto';
 campaign.style.bottom='auto';
 campaign.style.zIndex='auto';
 campaign.style.display='';
 campaign.style.visibility='visible';
 campaign.style.opacity='1';
 campaign.textContent='Territory Campaigns';
 if(campaign.parentElement!==nav)nav.appendChild(campaign);
 return campaign;
}
function normaliseSidebarMenu(nav){
 if(!nav)return;
 ensureTerritoryCampaignMenuItem(nav);
 const nodes=Array.from(nav.querySelectorAll('button,a,[role="button"]'));
 const matched=new Map();
 nodes.forEach(el=>{
   const key=menuKey(el);
   for(const [needle,label] of SIDEBAR_MENU){
     if(!matched.has(needle) && (key===needle || key.includes(needle) || (needle==='profile' && key.includes('my profile')) || (needle==='pipeline' && key.includes('my pipeline')) || (needle==='clients' && key.includes('my clients')) || (needle==='products' && key.includes('my products')))){
       matched.set(needle,el);
       el.textContent=label;
       el.setAttribute('data-ag-menu-label',label);
       break;
     }
   }
 });
 // Remove only stale navigation entries; matching keeps the original elements, IDs and click handlers intact.
 nodes.forEach(el=>{if(!Array.from(matched.values()).includes(el))el.remove()});
 SIDEBAR_MENU.forEach(([needle])=>{const el=matched.get(needle);if(el)nav.appendChild(el)});
}
function removeMapPlayerProfile(){
 const mapArea=document.querySelector('.map-area');if(!mapArea)return;
 mapArea.querySelectorAll('.map-player-profile,.player-profile,.map-user-profile,.player-avatar-control,[id*="mapPlayerProfile"],[id*="mapUserProfile"]').forEach(el=>el.remove());
 // Remove a late-injected standalone player chip only when it is clearly a
 // map overlay, leaving map controls and the mission profile untouched.
 [...mapArea.children].forEach(el=>{
   if(el.id==='map'||el.classList.contains('map-header')||el.classList.contains('map-status')||el.id==='farmCard')return;
   const text=(el.textContent||'').trim().toUpperCase();
   const cls=((el.id||'')+' '+(el.className||'')).toLowerCase();
   if((/player|profile|avatar|user/.test(cls)) && (text.length<=40||/NICO VAN ROOYEN/.test(text)))el.remove();
 });
}
function correctSidebar(){
 const s=document.querySelector('.sidebar');if(!s)return;
 // Remove legacy duplicate player blocks only. The official sidebar brand is retained.
 s.querySelectorAll('.menu-user,.profile').forEach(el=>el.remove());
 const brand=ensureSidebarBrand(s);
 const nav=s.querySelector('.nav');
 if(s.firstElementChild!==brand)s.prepend(brand);
 if(nav && brand.nextElementSibling!==nav)brand.insertAdjacentElement('afterend',nav);
 normaliseSidebarMenu(nav);
 ensureMissionsPlayerProfile();
 removeMapPlayerProfile();
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
