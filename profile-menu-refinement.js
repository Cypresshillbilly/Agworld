/* AG WORLD — Profile menu branding + wide readable navigation. */
(() => {
  const LOGO_SRC='assets/Logo.png?v=20260903';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:10px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}
    body.ag-profile-mode .sidebar .brand{width:100%!important;height:150px!important;margin:0 0 10px!important;padding:3px 0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:none!important;font-size:0!important;border:0!important;overflow:hidden!important}
    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{display:block!important;width:100%!important;max-width:310px!important;height:142px!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important}
    body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small{display:none!important;content:none!important}
    body.ag-profile-mode .sidebar .menu-user{display:flex!important;align-items:center!important;text-align:left!important;gap:13px!important;margin:0 1px 13px!important;padding:13px 8px 14px!important;border-top:1px solid rgba(214,196,134,.25)!important;border-bottom:1px solid rgba(214,196,134,.25)!important;box-sizing:border-box!important}
    body.ag-profile-mode .sidebar .menu-user-avatar{width:66px!important;height:66px!important;flex:0 0 66px!important;margin:0!important;font-size:25px!important}
    body.ag-profile-mode .sidebar .menu-user-name{font-size:15px!important;line-height:1.2!important;margin:0!important;letter-spacing:.6px!important;font-weight:800!important}
    body.ag-profile-mode .sidebar .menu-user-role{font-size:10.5px!important;line-height:1.3!important;margin-top:5px!important;letter-spacing:.3px!important}
    body.ag-profile-mode .sidebar .menu-user-level{font-size:10.5px!important;margin-top:6px!important}
    body.ag-profile-mode .sidebar .menu-user-xp{margin-top:6px!important;width:100%!important}
    body.ag-profile-mode .sidebar .menu-user-xptext{font-size:9px!important;margin-top:4px!important}
    body.ag-profile-mode .sidebar .nav{padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{width:100%!important;min-height:48px!important;padding:12px 13px!important;font-size:15px!important;line-height:1.2!important;font-weight:700!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important}
    body.ag-profile-mode .bottom{height:18%!important}
    body.ag-profile-mode .sidebar .profile{left:18px!important;right:18px!important;bottom:9px!important;padding-top:7px!important;font-size:10px!important;line-height:1.3!important}
    body.ag-profile-mode .sidebar .profile strong{font-size:10px!important;margin-bottom:2px!important}
    @media(max-width:900px){body.ag-profile-mode .sidebar{width:24%!important}body.ag-profile-mode .missions{left:24%!important;width:26%!important}body.ag-profile-mode .map-area{left:50%!important}}
  `;
  function installStyles(){let s=document.getElementById('ag-profile-menu-refinement-style');if(!s){s=document.createElement('style');s.id='ag-profile-menu-refinement-style';document.head.appendChild(s)}s.textContent=css}
  function injectLogo(){const b=document.querySelector('.sidebar .brand');if(!b)return;let l=b.querySelector('.ag-world-menu-logo');if(!l){b.textContent='';l=document.createElement('img');l.className='ag-world-menu-logo';l.alt='AG World';l.src=LOGO_SRC;l.decoding='async';l.loading='eager';b.appendChild(l)}else if(!l.src.includes('/assets/Logo.png'))l.src=LOGO_SRC}
  function install(){installStyles();injectLogo();new MutationObserver(()=>{installStyles();injectLogo()}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();