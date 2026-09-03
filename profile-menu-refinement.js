/* AG WORLD — Profile menu: logo first, user profile directly underneath. */
(()=>{
  const LOGO_SRC='assets/Logo.png?v=20260903';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:10px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}

    /* 1. LOGO */
    body.ag-profile-mode .sidebar .brand{
      display:flex!important;align-items:center!important;justify-content:center!important;
      width:100%!important;height:145px!important;margin:0 0 8px!important;padding:4px 2px!important;
      background:none!important;border:0!important;box-sizing:border-box!important;overflow:hidden!important;font-size:0!important
    }
    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{
      display:block!important;width:100%!important;height:100%!important;max-width:310px!important;max-height:140px!important;
      object-fit:contain!important;object-position:center!important;margin:0 auto!important
    }
    body.ag-profile-mode .sidebar .brand:before,body.ag-profile-mode .sidebar .brand small{display:none!important;content:none!important}

    /* 2. USER PROFILE — directly under logo, avatar left and identity right. */
    body.ag-profile-mode .sidebar .menu-user{
      display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;
      width:100%!important;min-height:116px!important;height:116px!important;margin:0 0 12px!important;padding:10px 8px!important;
      gap:14px!important;box-sizing:border-box!important;overflow:hidden!important;text-align:left!important;
      border-top:1px solid rgba(214,196,134,.25)!important;border-bottom:1px solid rgba(214,196,134,.25)!important
    }
    body.ag-profile-mode .sidebar .menu-user-avatar{
      display:flex!important;align-items:center!important;justify-content:center!important;
      width:82px!important;height:82px!important;min-width:82px!important;min-height:82px!important;
      max-width:82px!important;max-height:82px!important;flex:0 0 82px!important;aspect-ratio:1/1!important;
      border-radius:50%!important;box-sizing:border-box!important;overflow:hidden!important;
      background:#344b56!important;border:2px solid #9eb1b8!important;color:#fff!important;
      font:900 30px/1 Arial,sans-serif!important;margin:0!important
    }
    body.ag-profile-mode .sidebar .menu-user-info{
      display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;
      flex:1 1 auto!important;min-width:0!important;max-width:calc(100% - 96px)!important;overflow:hidden!important;text-align:left!important
    }
    body.ag-profile-mode .sidebar .menu-user-name{
      display:block!important;width:100%!important;margin:0!important;color:#eef3f5!important;
      font:900 16px/1.2 Arial,sans-serif!important;letter-spacing:.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
    }
    body.ag-profile-mode .sidebar .menu-user-role{
      display:block!important;width:100%!important;margin:5px 0 0!important;color:#aebfc6!important;
      font:700 10.5px/1.25 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:normal!important
    }
    body.ag-profile-mode .sidebar .menu-user-level{
      display:block!important;width:100%!important;margin:6px 0 0!important;color:#8ea5af!important;
      font:700 9.5px/1.25 Arial,sans-serif!important;white-space:nowrap!important
    }

    /* 3. NAVIGATION */
    body.ag-profile-mode .sidebar .nav{padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{
      width:100%!important;min-height:48px!important;padding:12px 13px!important;
      font:700 15px/1.2 Arial,sans-serif!important;letter-spacing:.2px!important;white-space:nowrap!important;box-sizing:border-box!important
    }

    /* The old bottom profile is deliberately removed. */
    body.ag-profile-mode .sidebar .profile{display:none!important}

    /* No AG World logo on the map. */
    body.ag-profile-mode .map-area .ag-world-map-logo{display:none!important}
    body.ag-profile-mode .bottom{height:18%!important}

    @media(max-width:1100px){
      body.ag-profile-mode .sidebar .brand{height:125px!important}
      body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:120px!important}
      body.ag-profile-mode .sidebar .menu-user{height:106px!important;min-height:106px!important;gap:11px!important}
      body.ag-profile-mode .sidebar .menu-user-avatar{width:74px!important;height:74px!important;min-width:74px!important;min-height:74px!important;max-width:74px!important;max-height:74px!important;flex-basis:74px!important;font-size:27px!important}
    }
    @media(max-width:900px){
      body.ag-profile-mode .sidebar{width:24%!important}
      body.ag-profile-mode .missions{left:24%!important;width:26%!important}
      body.ag-profile-mode .map-area{left:50%!important}
      body.ag-profile-mode .sidebar .brand{height:105px!important}
      body.ag-profile-mode .sidebar .brand .ag-world-menu-logo{max-height:100px!important}
      body.ag-profile-mode .sidebar .menu-user{height:96px!important;min-height:96px!important;padding:8px 6px!important;gap:9px!important}
      body.ag-profile-mode .sidebar .menu-user-avatar{width:66px!important;height:66px!important;min-width:66px!important;min-height:66px!important;max-width:66px!important;max-height:66px!important;flex-basis:66px!important;font-size:24px!important}
      body.ag-profile-mode .sidebar .menu-user-info{max-width:calc(100% - 75px)!important}
      body.ag-profile-mode .sidebar .menu-user-name{font-size:14px!important}
      body.ag-profile-mode .sidebar .menu-user-role{font-size:9px!important}
      body.ag-profile-mode .sidebar .menu-user-level{font-size:8.5px!important}
      body.ag-profile-mode .sidebar .nav button{font-size:13px!important;min-height:44px!important;padding:10px!important}
    }
  `;

  function installStyles(){
    let s=document.getElementById('ag-profile-menu-refinement-style');
    if(!s){s=document.createElement('style');s.id='ag-profile-menu-refinement-style';document.head.appendChild(s)}
    s.textContent=css;
  }

  function installSidebarLogo(){
    const s=document.querySelector('.sidebar');if(!s)return;
    const brand=s.querySelector('.brand');if(!brand)return;
    let logo=brand.querySelector('.ag-world-menu-logo');
    if(!logo){
      brand.textContent='';
      logo=document.createElement('img');logo.className='ag-world-menu-logo';logo.alt='AG World';logo.src=LOGO_SRC;logo.decoding='async';logo.loading='eager';brand.appendChild(logo);
    }else if(!logo.src.includes('/assets/Logo.png'))logo.src=LOGO_SRC;
  }

  function installUserProfile(){
    const s=document.querySelector('.sidebar');if(!s)return;
    const brand=s.querySelector('.brand');const nav=s.querySelector('.nav');if(!brand||!nav)return;

    // Remove every legacy profile and every previously injected duplicate.
    s.querySelectorAll('.profile').forEach(p=>p.remove());
    const users=[...s.querySelectorAll('.menu-user')];
    let user=users[0];
    users.slice(1).forEach(p=>p.remove());

    if(!user){
      user=document.createElement('div');
      user.className='menu-user';
      user.innerHTML='<div class="menu-user-avatar">N</div><div class="menu-user-info"><div class="menu-user-name">NICO</div><div class="menu-user-role">SALES REPRESENTATIVE</div><div class="menu-user-level">Level 7 · Territory 03</div></div>';
    }
    if(user.parentElement!==s || user.previousElementSibling!==brand)brand.after(user);
    if(user.nextElementSibling!==nav)nav.before(user);
  }

  function removeMapLogo(){document.querySelectorAll('.map-area .ag-world-map-logo').forEach(l=>l.remove())}

  function install(){
    installStyles();installSidebarLogo();installUserProfile();removeMapLogo();
    new MutationObserver(()=>{installStyles();installSidebarLogo();installUserProfile();removeMapLogo()}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
