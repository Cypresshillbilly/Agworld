/* AG WORLD — Profile menu refinement. Explicit profile layout. */
(()=>{
  const LOGO_SRC='/Agworld/assets/Logo.png?v=20260903';
  const STYLE_ID='ag-profile-menu-refinement-style';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:10px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}

    body.ag-profile-mode .sidebar .brand{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:145px!important;margin:0 0 8px!important;padding:4px 2px!important;background:none!important;border:0!important;box-sizing:border-box!important;overflow:hidden!important}
    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{display:block!important;width:100%!important;height:auto!important;max-width:310px!important;max-height:140px!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important;visibility:visible!important;opacity:1!important}
    body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small{display:none!important;content:none!important}

    /* Profile is a real two-column layout: avatar LEFT, identity RIGHT. */
    body.ag-profile-mode .sidebar .menu-user{display:none!important}
    body.ag-profile-mode .sidebar .profile{display:grid!important;grid-template-columns:76px minmax(0,1fr)!important;grid-template-rows:auto!important;align-items:center!important;column-gap:12px!important;position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;min-height:86px!important;margin:0 0 12px!important;padding:10px 7px!important;border-top:1px solid #30444f!important;border-bottom:1px solid #30444f!important;box-sizing:border-box!important;color:#aebfc6!important;font:700 10px/1.35 Arial,sans-serif!important;text-align:left!important}
    body.ag-profile-mode .sidebar .profile .ag-profile-avatar{grid-column:1!important;grid-row:1!important;width:76px!important;height:76px!important;min-width:76px!important;min-height:76px!important;box-sizing:border-box!important;border-radius:50%!important;background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font:900 30px Arial,sans-serif!important;overflow:hidden!important}
    body.ag-profile-mode .sidebar .profile .ag-profile-copy{grid-column:2!important;grid-row:1!important;min-width:0!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;text-align:left!important}
    body.ag-profile-mode .sidebar .profile .ag-profile-copy strong{display:block!important;margin:0 0 5px!important;color:#eef3f5!important;font:900 17px/1.15 Arial,sans-serif!important;letter-spacing:.5px!important}
    body.ag-profile-mode .sidebar .profile .ag-profile-role{display:block!important;color:#aebfc6!important;font:800 10.5px/1.3 Arial,sans-serif!important;letter-spacing:.2px!important}
    body.ag-profile-mode .sidebar .profile .ag-profile-level{display:block!important;margin-top:4px!important;color:#8fa5ae!important;font:700 9px/1.3 Arial,sans-serif!important}
    body.ag-profile-mode .sidebar .profile>br,body.ag-profile-mode .sidebar .profile>strong{display:none!important}
    body.ag-profile-mode .sidebar .profile:before,body.ag-profile-mode .sidebar .profile:after{content:none!important;display:none!important}

    body.ag-profile-mode .sidebar .nav{display:flex!important;flex-direction:column!important;padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{width:100%!important;min-height:48px!important;padding:12px 13px!important;font:700 15px/1.2 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important}

    body.ag-profile-mode .map-area .ag-world-map-logo{display:none!important}
    body.ag-profile-mode .bottom{height:18%!important}

    @media(max-width:1100px){
      body.ag-profile-mode .sidebar .brand{height:125px!important}
      body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:120px!important}
      body.ag-profile-mode .sidebar .profile{grid-template-columns:66px minmax(0,1fr)!important;min-height:76px!important;column-gap:10px!important}
      body.ag-profile-mode .sidebar .profile .ag-profile-avatar{width:66px!important;height:66px!important;min-width:66px!important;min-height:66px!important}
      body.ag-profile-mode .sidebar .profile .ag-profile-copy strong{font-size:15px!important}
    }
    @media(max-width:900px){
      body.ag-profile-mode .sidebar{width:24%!important}
      body.ag-profile-mode .missions{left:24%!important;width:26%!important}
      body.ag-profile-mode .map-area{left:50%!important}
      body.ag-profile-mode .sidebar .brand{height:105px!important}
      body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:100px!important}
      body.ag-profile-mode .sidebar .profile{grid-template-columns:58px minmax(0,1fr)!important;min-height:68px!important;column-gap:8px!important;padding:7px 5px!important}
      body.ag-profile-mode .sidebar .profile .ag-profile-avatar{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;font-size:23px!important}
      body.ag-profile-mode .sidebar .profile .ag-profile-copy strong{font-size:12px!important}
      body.ag-profile-mode .sidebar .profile .ag-profile-role{font-size:8.5px!important}
      body.ag-profile-mode .sidebar .profile .ag-profile-level{font-size:8px!important}
      body.ag-profile-mode .sidebar .nav button{font-size:13px!important;min-height:44px!important;padding:10px!important}
    }
  `;

  function installStyles(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
    if(s.textContent!==css)s.textContent=css;
  }

  function installSidebar(){
    const s=document.querySelector('.sidebar');
    if(!s)return;
    const observer=s.__agWorldSidebarObserver;
    if(observer)observer.disconnect();

    /* Remove all legacy/duplicate profile blocks. */
    s.querySelectorAll('.menu-user').forEach(p=>p.remove());
    const profiles=[...s.querySelectorAll('.profile')];
    let profile=profiles[0];
    profiles.slice(1).forEach(p=>p.remove());

    /* Keep the official logo as a real image. */
    let brand=s.querySelector('.brand');
    if(!brand){brand=document.createElement('div');brand.className='brand';s.prepend(brand)}
    let logo=brand.querySelector('.ag-world-menu-logo');
    if(!logo){
      logo=document.createElement('img');
      logo.className='ag-world-menu-logo';
      logo.alt='AG World';
      logo.decoding='async';
      logo.loading='eager';
      brand.replaceChildren(logo);
    }
    if(logo.getAttribute('src')!==LOGO_SRC)logo.setAttribute('src',LOGO_SRC);

    /* Build the profile with explicit elements so flex/grid cannot stack the text under the avatar. */
    if(!profile){profile=document.createElement('div');profile.className='profile'}
    if(!profile.classList.contains('ag-profile-structured')){
      profile.classList.add('ag-profile-structured');
      profile.innerHTML='<div class="ag-profile-avatar" aria-hidden="true">N</div><div class="ag-profile-copy"><strong>NICO</strong><span class="ag-profile-role">SALES REPRESENTATIVE</span><span class="ag-profile-level">Level 7 · Territory 03</span></div>';
    }
    brand.insertAdjacentElement('afterend',profile);

    /* No AG World logo on the map. */
    document.querySelectorAll('.map-area .ag-world-map-logo').forEach(l=>l.remove());

    if(observer)observer.observe(s,{childList:true,subtree:true});
  }

  function start(){
    installStyles();
    const s=document.querySelector('.sidebar');
    if(!s)return;
    const observer=new MutationObserver(()=>installSidebar());
    s.__agWorldSidebarObserver=observer;
    installSidebar();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
