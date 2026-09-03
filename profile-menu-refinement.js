/* AG WORLD — Profile menu refinement. Sidebar-only observer: stable and does not create a load loop. */
(()=>{
  const LOGO_SRC='/Agworld/assets/Logo.png?v=20260903';
  const STYLE_ID='ag-profile-menu-refinement-style';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:10px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}
    body.ag-profile-mode .sidebar .brand{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:145px!important;margin:0 0 10px!important;padding:4px 2px!important;background:none!important;border:0!important;box-sizing:border-box!important;overflow:hidden!important;font-size:0!important;visibility:visible!important;opacity:1!important}
    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{display:block!important;width:100%!important;height:auto!important;max-width:310px!important;max-height:140px!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important;visibility:visible!important;opacity:1!important}
    body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small{display:none!important;content:none!important}
    body.ag-profile-mode .sidebar .menu-user{display:none!important}
    body.ag-profile-mode .sidebar .profile{display:flex!important;align-items:center!important;position:absolute!important;left:14px!important;right:14px!important;bottom:9px!important;min-height:76px!important;margin:0!important;padding:9px 8px 8px 58px!important;border-top:1px solid #30444f!important;box-sizing:border-box!important;color:#aebfc6!important;font:700 9px/1.35 Arial,sans-serif!important;text-align:left!important}
    body.ag-profile-mode .sidebar .profile:before{content:'N'!important;position:absolute!important;left:4px!important;top:9px!important;display:flex!important;align-items:center!important;justify-content:center!important;width:48px!important;height:48px!important;margin:0!important;border-radius:50%!important;background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;font:900 20px Arial,sans-serif!important}
    body.ag-profile-mode .sidebar .profile strong{display:block!important;color:#eef3f5!important;font:900 13px/1.2 Arial,sans-serif!important;margin:0 0 3px!important}
    body.ag-profile-mode .sidebar .nav{padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{width:100%!important;min-height:48px!important;padding:12px 13px!important;font:700 15px/1.2 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area .ag-world-map-logo{display:none!important}
    body.ag-profile-mode .bottom{height:18%!important}
    @media(max-width:1100px){body.ag-profile-mode .sidebar .brand{height:125px!important}body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:120px!important}}
    @media(max-width:900px){body.ag-profile-mode .sidebar{width:24%!important}body.ag-profile-mode .missions{left:24%!important;width:26%!important}body.ag-profile-mode .map-area{left:50%!important}body.ag-profile-mode .sidebar .brand{height:105px!important}body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:100px!important}body.ag-profile-mode .sidebar .nav button{font-size:13px!important;min-height:44px!important;padding:10px!important}}
  `;
  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s);
  }
  function applySidebar(){
    installStyles();
    const s=document.querySelector('.sidebar');
    if(!s)return false;
    const observer=s.__agWorldSidebarObserver;
    if(observer)observer.disconnect();
    s.querySelectorAll('.menu-user').forEach(p=>p.remove());
    const profiles=[...s.querySelectorAll('.profile')];
    if(profiles.length>1)profiles.slice(0,-1).forEach(p=>p.remove());
    let brand=s.querySelector('.brand');
    if(!brand){brand=document.createElement('div');brand.className='brand';s.prepend(brand)}
    let logo=brand.querySelector('.ag-world-menu-logo');
    if(!logo){logo=document.createElement('img');logo.className='ag-world-menu-logo';logo.alt='AG World';logo.decoding='async';logo.loading='eager';brand.replaceChildren(logo)}
    if(logo.getAttribute('src')!==LOGO_SRC)logo.setAttribute('src',LOGO_SRC);
    document.querySelectorAll('.map-area .ag-world-map-logo').forEach(l=>l.remove());
    if(observer)observer.observe(s,{childList:true,subtree:true});
    return true;
  }
  function start(){
    installStyles();
    const s=document.querySelector('.sidebar');
    if(!s)return;
    applySidebar();
    const observer=new MutationObserver(()=>applySidebar());
    s.__agWorldSidebarObserver=observer;
    observer.observe(s,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
