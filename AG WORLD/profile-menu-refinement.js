/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=menu-logo-official-v2';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
/* Sidebar contract: PLAYER PROFILE/XP → NAVIGATION → LOGOUT.
   The official AG World logo now lives in Mission Control above the My Missions heading. */
body.ag-profile-mode .sidebar,.app-shell .sidebar{
  padding:5px 7px 5px!important;box-sizing:border-box!important;
  overflow:hidden!important;display:flex!important;flex-direction:column!important;
}
body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{display:none!important}
body.ag-profile-mode .sidebar .menu-user,.app-shell .sidebar .menu-user{display:none!important}

/* Mission Control brand: logo sits above the My Missions heading, outside the grey player menu. */
body.ag-profile-mode .missions .ag-world-missions-brand,.app-shell .missions .ag-world-missions-brand{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:50px!important;min-height:50px!important;margin:0 0 2px!important;padding:2px 0!important;
  box-sizing:border-box!important;overflow:visible!important;
}
body.ag-profile-mode .missions .ag-world-missions-logo,.app-shell .missions .ag-world-missions-logo{
  display:block!important;width:min(92%,210px)!important;height:46px!important;max-width:none!important;max-height:none!important;
  object-fit:contain!important;object-position:center!important;
}

/* Official dedicated player card. */
#agPlayerMenuCard{
  order:1!important;display:grid!important;visibility:visible!important;opacity:1!important;
  grid-template-columns:42px minmax(0,1fr)!important;align-items:center!important;column-gap:7px!important;
  width:100%!important;height:63px!important;min-height:63px!important;flex:0 0 63px!important;
  margin:0 0 2px!important;padding:5px 2px!important;position:relative!important;z-index:50!important;
  border-top:1px solid rgba(116,145,154,.55)!important;border-bottom:1px solid rgba(116,145,154,.55)!important;
  box-sizing:border-box!important;overflow:hidden!important;background:rgba(5,17,22,.10)!important;
}
#agPlayerMenuCard .ag-player-avatar{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;border-radius:50%!important;
  background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;font:900 16px Arial,sans-serif!important;box-sizing:border-box!important;
}
#agPlayerMenuCard .ag-player-summary{
  display:flex!important;visibility:visible!important;opacity:1!important;flex-direction:column!important;
  justify-content:center!important;align-items:stretch!important;min-width:0!important;overflow:hidden!important;text-align:left!important;
}
#agPlayerMenuCard .ag-player-name{
  display:block!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;
  color:#eef3f5!important;font:900 8.2px/1.15 Arial,sans-serif!important;letter-spacing:.25px!important;white-space:nowrap!important;
}
#agPlayerMenuCard .ag-player-role,#agPlayerMenuCard .ag-player-level{
  display:block!important;color:#aebfc6!important;font:700 6px/1.3 Arial,sans-serif!important;letter-spacing:.1px!important;white-space:nowrap!important;
}
#agPlayerMenuCard .ag-player-xp-track{
  display:block!important;width:100%!important;height:5px!important;margin:4px 0 2px!important;
  border-radius:999px!important;overflow:hidden!important;background:rgba(148,166,174,.25)!important;border:1px solid rgba(255,255,255,.06)!important;box-sizing:border-box!important;
}
#agPlayerMenuCard .ag-player-xp-fill{
  display:block!important;height:100%!important;width:0!important;border-radius:inherit!important;
  background:linear-gradient(90deg,#7cab30,#b7db4b)!important;transition:width .25s ease!important;
}
#agPlayerMenuCard .ag-player-xp-text{
  display:flex!important;justify-content:space-between!important;gap:6px!important;color:#c5d0d4!important;
  font:700 5.7px/1 Arial,sans-serif!important;white-space:nowrap!important;
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
  #agPlayerMenuCard{grid-template-columns:48px minmax(0,1fr)!important;height:72px!important;min-height:72px!important;flex-basis:72px!important}
  #agPlayerMenuCard .ag-player-avatar{width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;font-size:18px!important}
  #agPlayerMenuCard .ag-player-name{font-size:9px!important}
  #agPlayerMenuCard .ag-player-xp-track{height:6px!important}
  body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{height:18px!important;min-height:18px!important;flex-basis:18px!important;font-size:6.4px!important}
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
function ensureMissionsBrand(){
 const missions=document.querySelector('.missions');if(!missions)return null;
 let brand=missions.querySelector('#agWorldMissionsBrand');
 if(!brand){
   brand=document.createElement('div');
   brand.id='agWorldMissionsBrand';
   brand.className='ag-world-missions-brand';
   brand.setAttribute('aria-label','AG World');
 }
 let logo=brand.querySelector('.ag-world-missions-logo');
 if(!logo){
   logo=document.createElement('img');
   logo.className='ag-world-missions-logo';
   logo.alt='AG World';
   logo.decoding='async';
   logo.loading='eager';
   brand.replaceChildren(logo);
 }
 logo.src=LOGO_SRC;
 // Keep the logo above whichever mission heading is currently rendered.
 const heading=missions.querySelector('h1,.missions-title,.mission-title');
 if(heading){
   if(brand.nextElementSibling!==heading)heading.insertAdjacentElement('beforebegin',brand);
 }else if(missions.firstElementChild!==brand){
   missions.prepend(brand);
 }
 return brand;
}
function playerCardHTML(d){
 return '<div class="ag-player-avatar" aria-hidden="true">'+d.initial+'</div><div class="ag-player-summary"><strong class="ag-player-name">'+d.name+'</strong><span class="ag-player-role">AG WORLD PLAYER</span><span class="ag-player-level">Level '+d.level+' · Chapter '+d.chapter+'</span><span class="ag-player-xp-track"><i class="ag-player-xp-fill" style="width:'+d.pct+'%"></i></span><span class="ag-player-xp-text"><b>'+d.xp.toLocaleString()+' / '+d.next.toLocaleString()+' XP</b><b>'+d.pct+'%</b></span></div>';
}
function ensurePlayerCard(s){
 let card=s.querySelector('#agPlayerMenuCard');
 if(!card){card=document.createElement('section');card.id='agPlayerMenuCard';card.setAttribute('aria-label','Player profile')}
 card.innerHTML=playerCardHTML(playerData());
 return card;
}
function correctSidebar(){
 const s=document.querySelector('.sidebar');if(!s)return;
 // The sidebar intentionally starts with the player profile. Remove legacy and current sidebar logo blocks.
 s.querySelectorAll('.brand,.menu-user,.profile').forEach(el=>el.remove());
 const card=ensurePlayerCard(s);
 const nav=s.querySelector('.nav');
 // Deterministic DOM order: player profile first, navigation second.
 if(s.firstElementChild!==card)s.prepend(card);
 if(nav && card.nextElementSibling!==nav)card.insertAdjacentElement('afterend',nav);
 ensureMissionsBrand();
 document.querySelectorAll('.map-area .ag-world-map-logo').forEach(el=>el.remove());
}
function refreshPlayerUI(){
 const card=document.querySelector('.sidebar #agPlayerMenuCard');if(!card)return;
 const d=playerData();card.innerHTML=playerCardHTML(d);
}
function start(){
 installStyles();correctSidebar();
 window.addEventListener('agworld:player-profile',refreshPlayerUI);
 const observer=new MutationObserver(()=>{
  installStyles();
  const s=document.querySelector('.sidebar');if(!s)return;
  const good=!!(s.querySelector('#agPlayerMenuCard')&&document.querySelector('.missions #agWorldMissionsBrand .ag-world-missions-logo'));
  if(!good)correctSidebar();
 });
 /* Important: watch descendants because game-view-mode changes sidebar.innerHTML. The callback is inert once final markup exists, so it cannot loop. */
 observer.observe(document.body,{childList:true,subtree:true});
 // Defensive health check: later game modules are not allowed to remove the
 // profile block or its style rules after the sidebar has been normalised.
 setInterval(()=>{installStyles();correctSidebar();ensureMissionsBrand();refreshPlayerUI();},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
