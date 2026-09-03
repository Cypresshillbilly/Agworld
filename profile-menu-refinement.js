/* AG WORLD — Profile menu logo + readability.
   Uses the exact logo uploaded to assets/Logo.png.
*/
(() => {
  const LOGO_SRC = 'assets/Logo.png?v=20260903';

  const css = `
    body.ag-profile-mode .sidebar {
      padding:8px 7px 20px!important;
      box-sizing:border-box!important;
    }
    body.ag-profile-mode .sidebar .brand {
      box-sizing:border-box!important;
      width:100%!important;
      height:104px!important;
      margin:0 0 8px!important;
      padding:4px 3px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      background:none!important;
      font-size:0!important;
      border:0!important;
      overflow:hidden!important;
    }
    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo {
      display:block!important;
      width:100%!important;
      max-width:220px!important;
      height:96px!important;
      object-fit:contain!important;
      object-position:center!important;
      margin:0 auto!important;
    }
    body.ag-profile-mode .sidebar .brand:before,
    body.ag-profile-mode .sidebar .brand small {display:none!important;content:none!important;}

    /* Larger, readable user block */
    body.ag-profile-mode .sidebar .menu-user {
      margin:0 1px 10px!important;
      padding:9px 5px 11px!important;
    }
    body.ag-profile-mode .sidebar .menu-user-avatar {
      width:48px!important;
      height:48px!important;
      font-size:19px!important;
    }
    body.ag-profile-mode .sidebar .menu-user-name {
      font-size:12px!important;
      letter-spacing:.7px!important;
      line-height:1.25!important;
      margin-top:6px!important;
    }
    body.ag-profile-mode .sidebar .menu-user-role {
      font-size:9.5px!important;
      letter-spacing:.45px!important;
      line-height:1.25!important;
      margin-top:4px!important;
    }
    body.ag-profile-mode .sidebar .menu-user-level {
      font-size:10px!important;
      margin-top:5px!important;
    }
    body.ag-profile-mode .sidebar .menu-user-xptext {
      font-size:9px!important;
      margin-top:4px!important;
    }

    /* Larger navigation buttons and text */
    body.ag-profile-mode .sidebar .nav {
      padding:5px 2px!important;
      gap:5px!important;
      margin-top:0!important;
    }
    body.ag-profile-mode .sidebar .nav button {
      width:100%!important;
      min-height:44px!important;
      box-sizing:border-box!important;
      padding:12px 10px!important;
      font-size:14px!important;
      line-height:1.25!important;
      font-weight:700!important;
      letter-spacing:.25px!important;
      white-space:nowrap!important;
    }

    /* Make the small bottom identity text readable too */
    body.ag-profile-mode .sidebar .profile {
      left:16px!important;
      right:16px!important;
      bottom:16px!important;
      padding-top:13px!important;
      font-size:12px!important;
      line-height:1.5!important;
    }
    body.ag-profile-mode .sidebar .profile strong {
      font-size:11px!important;
      letter-spacing:.35px!important;
      margin-bottom:4px!important;
    }
  `;

  function installStyles(){
    let style=document.getElementById('ag-profile-menu-refinement-style');
    if(!style){
      style=document.createElement('style');
      style.id='ag-profile-menu-refinement-style';
      document.head.appendChild(style);
    }
    style.textContent=css;
  }

  function injectLogo(){
    const brand=document.querySelector('.sidebar .brand');
    if(!brand) return;
    let logo=brand.querySelector('.ag-world-menu-logo');
    if(!logo){
      brand.textContent='';
      logo=document.createElement('img');
      logo.className='ag-world-menu-logo';
      logo.alt='AG World';
      logo.src=LOGO_SRC;
      logo.decoding='async';
      logo.loading='eager';
      logo.onerror=()=>{logo.style.display='none';brand.setAttribute('aria-label','AG World');};
      brand.appendChild(logo);
    }else if(!logo.src.includes('/assets/Logo.png')){
      logo.src=LOGO_SRC;
    }
  }

  function install(){
    installStyles();
    injectLogo();
    const observer=new MutationObserver(()=>{installStyles();injectLogo();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
