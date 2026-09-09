/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=menu-logo-v1';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
/* Official game sidebar: reserve the top of the menu for the brand and player identity. */
body.ag-profile-mode .sidebar,.app-shell .sidebar{
  padding:4px 7px 6px!important;box-sizing:border-box!important;
  overflow:hidden!important;display:flex!important;flex-direction:column!important;
}
body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:78px!important;min-height:78px!important;flex:0 0 78px!important;
  margin:0!important;padding:0!important;background:none!important;border:0!important;
  box-sizing:border-box!important;overflow:visible!important;font-size:0!important;
}
body.ag-profile-mode .sidebar .brand .ag-world-menu-logo,.app-shell .sidebar .brand .ag-world-menu-logo{
  display:block!important;width:118%!important;height:72px!important;max-width:none!important;
  max-height:none!important;object-fit:contain!important;object-position:center!important;
  margin:0 auto!important;transform:scale(1.08)!important;transform-origin:center!important;
}
body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small,
.app-shell .sidebar .brand:before,.app-shell .sidebar .brand small{display:none!important}
body.ag-profile-mode .sidebar .menu-user,.app-shell .sidebar .menu-user{display:none!important}

/* Unique player card deliberately avoids legacy .profile selectors used elsewhere in the game. */
#agPlayerMenuCard{
  display:grid!important;visibility:visible!important;opacity:1!important;
  grid-template-columns:44px minmax(0,1fr)!important;align-items:center!important;column-gap:7px!important;
  width:100%!important;height:54px!important;min-height:54px!important;flex:0 0 54px!important;
  margin:0 0 2px!important;padding:4px 2px!important;
  position:relative!important;z-index:50!important;
  border-top:1px solid rgba(116,145,154,.55)!important;border-bottom:1px solid rgba(116,145,154,.55)!important;
  box-sizing:border-box!important;overflow:hidden!important;background:rgba(5,17,22,.08)!important;
}
#agPlayerMenuCard .ag-player-avatar{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;
  border-radius:50%!important;background:#344b56!important;border:2px solid #9eb1b8!important;
  color:#fff!important;font:900 17px Arial,sans-serif!important;box-sizing:border-box!important;
}
#agPlayerMenuCard .ag-player-summary{
  display:flex!important;visibility:visible!important;opacity:1!important;
  flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;
  min-width:0!important;overflow:hidden!important;text-align:left!important;
}
#agPlayerMenuCard .ag-player-name{
  display:block!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;
  color:#eef3f5!important;font:900 8.5px/1.15 Arial,sans-serif!important;letter-spacing:.25px!important;white-space:nowrap!important;
}
#agPlayerMenuCard .ag-player-role,#agPlayerMenuCard .ag-player-level{
  display:block!important;color:#aebfc6!important;font:700 6.2px/1.35 Arial,sans-serif!important;
  letter-spacing:.1px!important;white-space:nowrap!important;
}

/* Squash menu rows to preserve permanent space for logo + player profile. */
body.ag-profile-mode .sidebar .nav,.app-shell .sidebar .nav{
  display:flex!important;flex-direction:column!important;gap:0!important;margin:0!important;padding:0!important;
  flex:1 1 auto!important;min-height:0!important;overflow:hidden!important;
}
body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{
  width:100%!important;min-height:17px!important;height:17px!important;flex:0 0 17px!important;
  margin:0!important;padding:2px 6px!important;font:700 6.1px/1 Arial,sans-serif!important;
  letter-spacing:.05px!important;white-space:nowrap!important;box-sizing:border-box!important;
}
body.ag-profile-mode .map-area .ag-world-map-logo,.app-shell .map-area .ag-world-map-logo{display:none!important}
body.ag-profile-mode .bottom{height:23%!important}

@media(min-width:1500px){
  body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{height:88px!important;min-height:88px!important;flex-basis:88px!important}
  body.ag-profile-mode .sidebar .brand .ag-world-menu-logo,.app-shell .sidebar .brand .ag-world-menu-logo{height:82px!important;width:122%!important;transform:scale(1.12)!important}
  #agPlayerMenuCard{grid-template-columns:50px minmax(0,1fr)!important;height:60px!important;min-height:60px!important;flex-basis:60px!important}
  #agPlayerMenuCard .ag-player-avatar{width:48px!important;height:48px!important;min-width:48px!important;min-height:48px!important;font-size:19px!important}
  #agPlayerMenuCard .ag-player-name{font-size:9.5px!important}
  body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{height:19px!important;min-height:19px!important;flex-basis:19px!important;font-size:6.7px!important}
}
`;
function installStyles(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==css)s.textContent=css}
function playerData(){
 const player=window.AGWorldPlayer||{};
 const name=(player.display_name||sessionStorage.getItem('gamechanger.username')||'PLAYER').toUpperCase();
 const level=Number(player.level||sessionStorage.getItem('gamechanger.level')||1);
 const chapter=Number(player.chapter||sessionStorage.getItem('gamechanger.chapter')||1);
 return {name,level,chapter,initial:(name.trim().charAt(0)||'P').toUpperCase()};
}
function ensureBrand(s){
 let b=s.querySelector('.brand');
 if(!b){b=document.createElement('div');b.className='brand';s.prepend(b)}
 let logo=b.querySelector('.ag-world-menu-logo');
 if(!logo){logo=document.createElement('img');logo.className='ag-world-menu-logo';logo.alt='AG World';logo.decoding='async';logo.loading='eager';b.replaceChildren(logo)}
 logo.src=LOGO_SRC;
 return b;
}
function ensurePlayerCard(s){
 let card=s.querySelector('#agPlayerMenuCard');
 if(!card){card=document.createElement('section');card.id='agPlayerMenuCard';card.setAttribute('aria-label','Player profile')}
 const d=playerData();
 card.innerHTML='<div class="ag-player-avatar" aria-hidden="true">'+d.initial+'</div><div class="ag-player-summary"><strong class="ag-player-name">'+d.name+'</strong><span class="ag-player-role">AG WORLD PLAYER</span><span class="ag-player-level">Level '+d.level+' · Chapter '+d.chapter+'</span></div>';
 return card;
}
function correctSidebar(){
 const s=document.querySelector('.sidebar');if(!s)return;
 s.querySelectorAll('.menu-user,.profile').forEach(el=>el.remove());
 const b=ensureBrand(s);
 const card=ensurePlayerCard(s);
 const nav=s.querySelector('.nav');
 if(nav){if(card.parentElement!==s || card.nextElementSibling!==nav) s.insertBefore(card,nav)}
 else if(card.parentElement!==s || b.nextElementSibling!==card) b.insertAdjacentElement('afterend',card);
 document.querySelectorAll('.map-area .ag-world-map-logo').forEach(el=>el.remove());
}
function refreshPlayerUI(){
 const card=document.querySelector('.sidebar #agPlayerMenuCard');
 if(!card)return;
 const d=playerData();
 const avatar=card.querySelector('.ag-player-avatar');
 const name=card.querySelector('.ag-player-name');
 const role=card.querySelector('.ag-player-role');
 const level=card.querySelector('.ag-player-level');
 if(avatar)avatar.textContent=d.initial;
 if(name)name.textContent=d.name;
 if(role)role.textContent='AG WORLD PLAYER';
 if(level)level.textContent='Level '+d.level+' · Chapter '+d.chapter;
}
function start(){
 installStyles();correctSidebar();
 window.addEventListener('agworld:player-profile',refreshPlayerUI);
 const observer=new MutationObserver(()=>{
  installStyles();
  const s=document.querySelector('.sidebar');if(!s)return;
  const good=!!(s.querySelector('.brand .ag-world-menu-logo')&&s.querySelector('#agPlayerMenuCard'));
  if(!good)correctSidebar();
 });
 /* Important: watch descendants because game-view-mode changes sidebar.innerHTML. The callback is inert once final markup exists, so it cannot loop. */
 observer.observe(document.body,{childList:true,subtree:true});
 // Defensive health check: later game modules are not allowed to remove the
 // profile block or its style rules after the sidebar has been normalised.
 setInterval(()=>{installStyles();correctSidebar();refreshPlayerUI();},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
