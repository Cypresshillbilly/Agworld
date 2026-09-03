/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='/Agworld/assets/Logo.png?v=20260903';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
body.ag-profile-mode .sidebar{width:20%!important;padding:10px 14px 12px!important;box-sizing:border-box!important}
body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}
body.ag-profile-mode .sidebar .brand{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:145px!important;margin:0 0 8px!important;padding:4px 2px!important;background:none!important;border:0!important;box-sizing:border-box!important;overflow:hidden!important;font-size:0!important}
body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{display:block!important;width:100%!important;height:auto!important;max-width:310px!important;max-height:140px!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important}
body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small{display:none!important}
body.ag-profile-mode .sidebar .menu-user{display:none!important}
body.ag-profile-mode .sidebar .profile{display:grid!important;grid-template-columns:82px minmax(0,1fr)!important;grid-template-rows:1fr!important;grid-template-areas:'avatar summary'!important;align-items:center!important;column-gap:12px!important;width:100%!important;min-height:102px!important;margin:0 0 12px!important;padding:9px 7px!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;border-top:1px solid #30444f!important;border-bottom:1px solid #30444f!important;box-sizing:border-box!important;text-align:left!important;order:0!important;overflow:hidden!important}
body.ag-profile-mode .sidebar .profile:before{display:none!important;content:none!important}
body.ag-profile-mode .sidebar .profile .ag-profile-avatar{grid-area:avatar!important;display:flex!important;align-items:center!important;justify-content:center!important;width:82px!important;height:82px!important;min-width:82px!important;min-height:82px!important;border-radius:50%!important;background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;font:900 30px Arial,sans-serif!important;box-sizing:border-box!important}
body.ag-profile-mode .sidebar .profile .ag-profile-summary{grid-area:summary!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;min-width:0!important;width:auto!important;max-width:100%!important;text-align:left!important;overflow:hidden!important}
body.ag-profile-mode .sidebar .profile .ag-profile-summary strong{display:block!important;margin:0 0 5px!important;padding:0!important;color:#eef3f5!important;font:900 15px/1.2 Arial,sans-serif!important;letter-spacing:.5px!important;white-space:nowrap!important}
body.ag-profile-mode .sidebar .profile .ag-profile-summary span{display:block!important;margin:0!important;padding:0!important;color:#aebfc6!important;font:700 10px/1.5 Arial,sans-serif!important;white-space:nowrap!important}
body.ag-profile-mode .sidebar .profile>strong,body.ag-profile-mode .sidebar .profile>.ag-profile-summary-text{display:none!important}
body.ag-profile-mode .sidebar .nav{display:flex!important;flex-direction:column!important;padding:5px 1px!important;gap:6px!important;margin-top:0!important}
body.ag-profile-mode .sidebar .nav button{width:100%!important;min-height:48px!important;padding:12px 13px!important;font:700 15px/1.2 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important}
body.ag-profile-mode .map-area .ag-world-map-logo{display:none!important}
body.ag-profile-mode .bottom{height:18%!important}
@media(max-width:1100px){body.ag-profile-mode .sidebar .brand{height:125px!important}body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:120px!important}body.ag-profile-mode .sidebar .profile{grid-template-columns:72px minmax(0,1fr)!important;min-height:92px!important}body.ag-profile-mode .sidebar .profile .ag-profile-avatar{width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;font-size:26px!important}}
@media(max-width:900px){body.ag-profile-mode .sidebar{width:24%!important}body.ag-profile-mode .missions{left:24%!important;width:26%!important}body.ag-profile-mode .map-area{left:50%!important}body.ag-profile-mode .sidebar .brand{height:105px!important}body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:100px!important}body.ag-profile-mode .sidebar .profile{grid-template-columns:60px minmax(0,1fr)!important;min-height:78px!important;column-gap:9px!important}body.ag-profile-mode .sidebar .profile .ag-profile-avatar{width:60px!important;height:60px!important;min-width:60px!important;min-height:60px!important;font-size:22px!important}body.ag-profile-mode .sidebar .profile .ag-profile-summary strong{font-size:12px!important}body.ag-profile-mode .sidebar .profile .ag-profile-summary span{font-size:8.5px!important}body.ag-profile-mode .sidebar .nav button{font-size:13px!important;min-height:44px!important;padding:10px!important}}
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
 p.innerHTML='<div class="ag-profile-avatar" aria-hidden="true">N</div><div class="ag-profile-summary"><strong>NICO VAN ROOYEN</strong><span>SALES REPRESENTATIVE</span><span>Level 7 · Territory 03</span></div>';
 b.insertAdjacentElement('afterend',p);
 document.querySelectorAll('.map-area .ag-world-map-logo').forEach(el=>el.remove());
}
function start(){
 installStyles();correctSidebar();
 const observer=new MutationObserver(()=>{
  const s=document.querySelector('.sidebar');if(!s)return;
  const good=!!(s.querySelector('.brand .ag-world-menu-logo')&&s.querySelector('.profile .ag-profile-avatar')&&s.querySelector('.profile .ag-profile-summary'));
  if(!good)correctSidebar();
 });
 /* Important: watch descendants because game-view-mode changes sidebar.innerHTML. The callback is inert once final markup exists, so it cannot loop. */
 observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
