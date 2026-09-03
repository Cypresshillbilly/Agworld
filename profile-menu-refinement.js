/* AG WORLD — Profile menu: large user profile first, logo on map. */
(() => {
  const LOGO_SRC='assets/Logo.png?v=20260903';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:14px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}

    /* User profile is the first thing in the menu: large avatar on the left, identity beside it. */
    body.ag-profile-mode .sidebar .brand{display:none!important}
    body.ag-profile-mode .sidebar .menu-user{display:flex!important;flex-direction:row!important;align-items:center!important;text-align:left!important;gap:15px!important;width:100%!important;margin:0 1px 17px!important;padding:14px 8px 16px!important;border-top:1px solid rgba(214,196,134,.25)!important;border-bottom:1px solid rgba(214,196,134,.25)!important;box-sizing:border-box!important}
    body.ag-profile-mode .sidebar .menu-user-avatar{width:88px!important;height:88px!important;min-width:88px!important;flex:0 0 88px!important;margin:0!important;font-size:32px!important}
    body.ag-profile-mode .sidebar .menu-user-name{font-size:17px!important;line-height:1.2!important;margin:0!important;letter-spacing:.6px!important;font-weight:800!important}
    body.ag-profile-mode .sidebar .menu-user-role{font-size:11.5px!important;line-height:1.3!important;margin-top:6px!important;letter-spacing:.3px!important}
    body.ag-profile-mode .sidebar .menu-user-level{font-size:10.5px!important;margin-top:7px!important}
    body.ag-profile-mode .sidebar .menu-user-xp{margin-top:6px!important;width:100%!important}
    body.ag-profile-mode .sidebar .menu-user-xptext{font-size:9px!important;margin-top:4px!important}

    body.ag-profile-mode .sidebar .nav{padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{width:100%!important;min-height:48px!important;padding:12px 13px!important;font-size:15px!important;line-height:1.2!important;font-weight:700!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important}

    /* Center the full AG World logo above the live map. */
    body.ag-profile-mode .map-area .ag-world-map-logo{display:block!important;position:absolute!important;z-index:55!important;top:18px!important;left:50%!important;transform:translateX(-50%)!important;width:465px!important;height:auto!important;max-width:55%!important;object-fit:contain!important;filter:drop-shadow(0 2px 5px rgba(0,0,0,.22))!important;pointer-events:none!important}

    body.ag-profile-mode .bottom{height:18%!important}
    body.ag-profile-mode .sidebar .profile{left:18px!important;right:18px!important;bottom:9px!important;padding-top:7px!important;font-size:10px!important;line-height:1.3!important}
    body.ag-profile-mode .sidebar .profile strong{font-size:10px!important;margin-bottom:2px!important}
    @media(max-width:1100px){body.ag-profile-mode .map-area .ag-world-map-logo{width:360px!important;max-width:52%!important}}
    @media(max-width:900px){body.ag-profile-mode .sidebar{width:24%!important}body.ag-profile-mode .missions{left:24%!important;width:26%!important}body.ag-profile-mode .map-area{left:50%!important}body.ag-profile-mode .map-area .ag-world-map-logo{width:320px!important;max-width:55%!important}body.ag-profile-mode .sidebar .menu-user-avatar{width:76px!important;height:76px!important;min-width:76px!important;flex-basis:76px!important}}
  `;
  function installStyles(){let s=document.getElementById('ag-profile-menu-refinement-style');if(!s){s=document.createElement('style');s.id='ag-profile-menu-refinement-style';document.head.appendChild(s)}s.textContent=css}
  function injectMapLogo(){const map=document.querySelector('.map-area');if(!map)return;let l=map.querySelector('.ag-world-map-logo');if(!l){l=document.createElement('img');l.className='ag-world-map-logo';l.alt='AG World';l.src=LOGO_SRC;l.decoding='async';l.loading='eager';map.appendChild(l)}else if(!l.src.includes('/assets/Logo.png'))l.src=LOGO_SRC}
  function removeSidebarLogo(){document.querySelectorAll('.sidebar .ag-world-menu-logo').forEach(l=>l.remove())}
  function install(){installStyles();removeSidebarLogo();injectMapLogo();new MutationObserver(()=>{installStyles();removeSidebarLogo();injectMapLogo()}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
