/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=menu-logo-v1';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
/* Final compact sidebar profile layout. Geometry is owned by main-game-layout-v1. */
body.ag-profile-mode .sidebar,.app-shell .sidebar{padding:6px 8px 8px!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;display:flex!important;flex-direction:column!important}
body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:62px!important;min-height:62px!important;margin:0 0 4px!important;padding:2px!important;background:none!important;border:0!important;box-sizing:border-box!important;overflow:hidden!important;font-size:0!important;flex:0 0 62px!important}
body.ag-profile-mode .sidebar .brand .ag-world-menu-logo,.app-shell .sidebar .brand .ag-world-menu-logo{display:block!important;width:100%!important;height:auto!important;max-width:205px!important;max-height:56px!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important}
body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small,.app-shell .sidebar .brand:before,.app-shell .sidebar .brand small{display:none!important}
body.ag-profile-mode .sidebar .menu-user,.app-shell .sidebar .menu-user{display:none!important}

/* Avatar and player summary are deliberately part of the normal flow directly under the logo. */
body.ag-profile-mode .sidebar .profile,.app-shell .sidebar .profile{display:grid!important;visibility:visible!important;opacity:1!important;grid-template-columns:46px minmax(0,1fr)!important;grid-template-rows:1fr!important;grid-template-areas:'avatar summary'!important;align-items:center!important;column-gap:7px!important;width:100%!important;min-height:58px!important;height:58px!important;margin:0 0 5px!important;padding:5px 2px!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;border-top:1px solid #30444f!important;border-bottom:1px solid #30444f!important;box-sizing:border-box!important;text-align:left!important;order:0!important;flex:0 0 58px!important;overflow:hidden!important}
body.ag-profile-mode .sidebar .profile:before,.app-shell .sidebar .profile:before{display:none!important;content:none!important}
body.ag-profile-mode .sidebar .profile .ag-profile-avatar,.app-shell .sidebar .profile .ag-profile-avatar{grid-area:avatar!important;display:flex!important;align-items:center!important;justify-content:center!important;width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;border-radius:50%!important;background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;font:900 18px Arial,sans-serif!important;box-sizing:border-box!important}
body.ag-profile-mode .sidebar .profile .ag-profile-summary,.app-shell .sidebar .profile .ag-profile-summary{grid-area:summary!important;display:flex!important;visibility:visible!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;min-width:0!important;width:auto!important;max-width:100%!important;text-align:left!important;overflow:hidden!important}
body.ag-profile-mode .sidebar .profile .ag-profile-summary strong,.app-shell .sidebar .profile .ag-profile-summary strong{display:block!important;margin:0 0 2px!important;padding:0!important;color:#eef3f5!important;font:900 9px/1.15 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:nowrap!important}
body.ag-profile-mode .sidebar .profile .ag-profile-summary span,.app-shell .sidebar .profile .ag-profile-summary span{display:block!important;margin:0!important;padding:0!important;color:#aebfc6!important;font:700 6.5px/1.35 Arial,sans-serif!important;white-space:nowrap!important}
body.ag-profile-mode .sidebar .profile>strong,body.ag-profile-mode .sidebar .profile>.ag-profile-summary-text,.app-shell .sidebar .profile>strong,.app-shell .sidebar .profile>.ag-profile-summary-text{display:none!important}

body.ag-profile-mode .sidebar .nav,.app-shell .sidebar .nav{display:flex!important;flex-direction:column!important;padding:1px 0 6px!important;gap:2px!important;margin-top:0!important;flex:0 0 auto!important}
body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{width:100%!important;min-height:24px!important;padding:5px 7px!important;font:700 7px/1.1 Arial,sans-serif!important;letter-spacing:.1px!important;white-space:nowrap!important;box-sizing:border-box!important}
body.ag-profile-mode .sidebar .nav button:last-child,.app-shell .sidebar .nav button:last-child{margin-bottom:4px!important}
body.ag-profile-mode .map-area .ag-world-map-logo,.app-shell .map-area .ag-world-map-logo{display:none!important}
body.ag-profile-mode .bottom{height:23%!important}
body.ag-profile-mode .sidebar::-webkit-scrollbar,.app-shell .sidebar::-webkit-scrollbar{width:5px}

@media(min-width:1500px){body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{height:68px!important;min-height:68px!important;flex-basis:68px!important}body.ag-profile-mode .sidebar .brand .ag-world-menu-logo,.app-shell .sidebar .brand .ag-world-menu-logo{max-height:62px!important}body.ag-profile-mode .sidebar .profile,.app-shell .sidebar .profile{grid-template-columns:50px minmax(0,1fr)!important;height:62px!important;min-height:62px!important;flex-basis:62px!important}body.ag-profile-mode .sidebar .profile .ag-profile-avatar,.app-shell .sidebar .profile .ag-profile-avatar{width:50px!important;height:50px!important;min-width:50px!important;min-height:50px!important;font-size:20px!important}}
`;
function installStyles(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==css)s.textContent=css}
function correctSidebar(){
 const s=document.querySelector('.sidebar');if(!s)return;
 const good=!!(s.querySelector('.brand .ag-world-menu-logo')&&s.querySelector('.profile .ag-profile-avatar')&&s.querySelector('.profile .ag-profile-summary'));
 if(good)return;
 s.querySelectorAll('.menu-user').forEach(el=>el.remove());
 s.querySelectorAll('.profile').forEach((el,i)=>{if(i>0)el.remove()});
 let b=s.querySelector('.brand');if(!b){b=document.createElement('div');b.className='brand';s.prepend(b)}
 let logo=b.querySelector('.ag-world-menu-logo');if(!logo){logo=document.createElement('img');logo.className='ag-world-menu-logo';logo.alt='AG World';logo.decoding='async';logo.loading='eager';b.replaceChildren(logo)}
 logo.src=LOGO_SRC;
 let p=s.querySelector('.profile');if(!p){p=document.createElement('div');p.className='profile'}
 const player=window.AGWorldPlayer||{};
 const name=(player.display_name||sessionStorage.getItem('gamechanger.username')||'PLAYER').toUpperCase();
 const level=Number(player.level||sessionStorage.getItem('gamechanger.level')||1);
 const initial=(name.trim().charAt(0)||'P').toUpperCase();
 p.innerHTML='<div class="ag-profile-avatar" aria-hidden="true">'+initial+'</div><div class="ag-profile-summary"><strong>'+name+'</strong><span>AG WORLD PLAYER</span><span>Level '+level+' · Chapter '+Number(player.chapter||sessionStorage.getItem('gamechanger.chapter')||1)+'</span></div>';
 b.insertAdjacentElement('afterend',p);
 document.querySelectorAll('.map-area .ag-world-map-logo').forEach(el=>el.remove());
}
function refreshPlayerUI(){
 const s=document.querySelector('.sidebar .profile');
 if(!s) return;
 const player=window.AGWorldPlayer||{};
 const name=(player.display_name||sessionStorage.getItem('gamechanger.username')||'PLAYER').toUpperCase();
 const level=Number(player.level||sessionStorage.getItem('gamechanger.level')||1);
 const chapter=Number(player.chapter||sessionStorage.getItem('gamechanger.chapter')||1);
 const initial=(name.trim().charAt(0)||'P').toUpperCase();
 const avatar=s.querySelector('.ag-profile-avatar');
 const strong=s.querySelector('.ag-profile-summary strong');
 const spans=s.querySelectorAll('.ag-profile-summary span');
 if(avatar) avatar.textContent=initial;
 if(strong) strong.textContent=name;
 if(spans[0]) spans[0].textContent='AG WORLD PLAYER';
 if(spans[1]) spans[1].textContent='Level '+level+' · Chapter '+chapter;
}
function start(){
 installStyles();correctSidebar();
 window.addEventListener('agworld:player-profile',refreshPlayerUI);
 const observer=new MutationObserver(()=>{
  installStyles();
  const s=document.querySelector('.sidebar');if(!s)return;
  const good=!!(s.querySelector('.brand .ag-world-menu-logo')&&s.querySelector('.profile .ag-profile-avatar')&&s.querySelector('.profile .ag-profile-summary'));
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
