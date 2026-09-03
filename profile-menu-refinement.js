/* AG WORLD — Profile menu refinement. Profile summary is always right of avatar. */
(()=>{
  const LOGO_SRC='/Agworld/assets/Logo.png?v=20260903';
  const STYLE_ID='ag-profile-menu-refinement-style';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:10px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}

    body.ag-profile-mode .sidebar .brand{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:145px!important;margin:0 0 8px!important;padding:4px 2px!important;background:none!important;border:0!important;box-sizing:border-box!important;overflow:hidden!important;font-size:0!important;visibility:visible!important;opacity:1!important}
    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{display:block!important;width:100%!important;height:auto!important;max-width:310px!important;max-height:140px!important;object-fit:contain!important;object-position:center!important;margin:0 auto!important;visibility:visible!important;opacity:1!important}
    body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small{display:none!important;content:none!important}

    /* PROFILE SUMMARY: avatar is column 1; name/role/level are column 2. Never stack. */
    body.ag-profile-mode .sidebar .menu-user{display:none!important}
    body.ag-profile-mode .sidebar .profile{display:grid!important;grid-template-columns:76px minmax(0,1fr)!important;grid-template-rows:auto!important;grid-template-areas:'avatar summary'!important;align-items:center!important;column-gap:14px!important;position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;width:100%!important;min-height:94px!important;margin:0 0 12px!important;padding:9px 7px!important;border-top:1px solid #30444f!important;border-bottom:1px solid #30444f!important;box-sizing:border-box!important;color:#aebfc6!important;font-family:Arial,sans-serif!important;text-align:left!important;order:0!important}
    body.ag-profile-mode .sidebar .profile:before{content:'N'!important;grid-area:avatar!important;position:static!important;transform:none!important;display:flex!important;align-items:center!important;justify-content:center!important;width:76px!important;height:76px!important;margin:0!important;border-radius:50%!important;background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;font:900 30px Arial,sans-serif!important;box-sizing:border-box!important}
    body.ag-profile-mode .sidebar .profile strong{grid-area:summary!important;display:block!important;min-width:0!important;color:#eef3f5!important;font:900 15px/1.2 Arial,sans-serif!important;margin:0!important;letter-spacing:.5px!important}
    body.ag-profile-mode .sidebar .profile br{display:none!important}
    body.ag-profile-mode .sidebar .profile{font-size:0!important}
    body.ag-profile-mode .sidebar .profile:after{grid-area:summary!important;content:'SALES REPRESENTATIVE\A Level 7 · Territory 03'!important;white-space:pre!important;display:block!important;min-width:0!important;color:#aebfc6!important;font:700 10px/1.45 Arial,sans-serif!important;margin-top:20px!important;align-self:center!important;pointer-events:none!important}

    body.ag-profile-mode .sidebar .nav{display:flex!important;flex-direction:column!important;padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{width:100%!important;min-height:48px!important;padding:12px 13px!important;font:700 15px/1.2 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area .ag-world-map-logo{display:none!important}
    body.ag-profile-mode .bottom{height:18%!important}

    @media(max-width:1100px){
      body.ag-profile-mode .sidebar .brand{height:125px!important}
      body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:120px!important}
      body.ag-profile-mode .sidebar .profile{grid-template-columns:64px minmax(0,1fr)!important;min-height:82px!important;column-gap:12px!important}
      body.ag-profile-mode .sidebar .profile:before{width:64px!important;height:64px!important;font-size:25px!important}
    }
    @media(max-width:900px){
      body.ag-profile-mode .sidebar{width:24%!important}
      body.ag-profile-mode .missions{left:24%!important;width:26%!important}
      body.ag-profile-mode .map-area{left:50%!important}
      body.ag-profile-mode .sidebar .brand{height:105px!important}
      body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:100px!important}
      body.ag-profile-mode .sidebar .profile{grid-template-columns:54px minmax(0,1fr)!important;min-height:72px!important;column-gap:9px!important}
      body.ag-profile-mode .sidebar .profile:before{width:54px!important;height:54px!important;font-size:21px!important}
      body.ag-profile-mode .sidebar .profile strong{font-size:12px!important}
      body.ag-profile-mode .sidebar .profile:after{font-size:9px!important;margin-top:16px!important}
      body.ag-profile-mode .sidebar .nav button{font-size:13px!important;min-height:44px!important;padding:10px!important}
    }
  `;

  function installStyles(){
    let s=document.getElementById(STYLE_ID);
    if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
    s.textContent=css;
  }

  function installSidebar(){
    const s=document.querySelector('.sidebar');
    if(!s)return;
    const observer=s.__agWorldSidebarObserver;
    if(observer)observer.disconnect();

    s.querySelectorAll('.menu-user').forEach(p=>p.remove());
    const profiles=[...s.querySelectorAll('.profile')];
    let profile=profiles[profiles.length-1];
    profiles.slice(0,-1).forEach(p=>p.remove());

    let brand=s.querySelector('.brand');
    if(!brand){brand=document.createElement('div');brand.className='brand';s.prepend(brand)}
    let logo=brand.querySelector('.ag-world-menu-logo');
    if(!logo){logo=document.createElement('img');logo.className='ag-world-menu-logo';logo.alt='AG World';logo.decoding='async';logo.loading='eager';brand.replaceChildren(logo)}
    if(logo.getAttribute('src')!==LOGO_SRC)logo.setAttribute('src',LOGO_SRC);

    if(!profile){profile=document.createElement('div');profile.className='profile'}
    profile.innerHTML='<strong>NICO</strong><span class="ag-profile-summary-text">SALES REPRESENTATIVE<br>Level 7 · Territory 03</span>';
    brand.insertAdjacentElement('afterend',profile);

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
