/* AG WORLD — Profile menu: one clean, correctly proportioned user profile. */
(() => {
  const LOGO_SRC='assets/Logo.png?v=20260903';
  const css=`
    body.ag-profile-mode .sidebar{width:20%!important;padding:14px 14px 12px!important;box-sizing:border-box!important}
    body.ag-profile-mode .missions{left:20%!important;width:23%!important;box-sizing:border-box!important}
    body.ag-profile-mode .map-area{left:43%!important;box-sizing:border-box!important}

    /* Keep exactly one profile block at the top of the sidebar. */
    body.ag-profile-mode .sidebar .brand{display:none!important}
    body.ag-profile-mode .sidebar .menu-user{
      display:flex!important;flex-direction:row!important;align-items:center!important;
      width:100%!important;min-height:124px!important;height:auto!important;
      margin:0 1px 17px!important;padding:14px 8px!important;
      gap:16px!important;text-align:left!important;
      border-top:1px solid rgba(214,196,134,.25)!important;
      border-bottom:1px solid rgba(214,196,134,.25)!important;
      box-sizing:border-box!important;overflow:hidden!important
    }
    body.ag-profile-mode .sidebar .menu-user-avatar{
      display:flex!important;align-items:center!important;justify-content:center!important;
      width:96px!important;height:96px!important;min-width:96px!important;min-height:96px!important;
      max-width:96px!important;max-height:96px!important;flex:0 0 96px!important;
      aspect-ratio:1/1!important;box-sizing:border-box!important;
      margin:0!important;border-radius:50%!important;overflow:hidden!important;
      background:#344b56!important;border:2px solid #9eb1b8!important;
      color:#fff!important;font:900 34px Arial,sans-serif!important;
      line-height:1!important
    }
    body.ag-profile-mode .sidebar .menu-user-info{
      display:flex!important;flex:1 1 auto!important;min-width:0!important;
      flex-direction:column!important;justify-content:center!important;
      align-items:flex-start!important;text-align:left!important;overflow:hidden!important
    }
    body.ag-profile-mode .sidebar .menu-user-name{
      display:block!important;width:100%!important;margin:0!important;
      color:#eef3f5!important;font:900 17px/1.2 Arial,sans-serif!important;
      letter-spacing:.6px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
    }
    body.ag-profile-mode .sidebar .menu-user-role{
      display:block!important;width:100%!important;margin:6px 0 0!important;
      color:#aebfc6!important;font:700 11.5px/1.3 Arial,sans-serif!important;
      letter-spacing:.3px!important;white-space:normal!important
    }
    body.ag-profile-mode .sidebar .menu-user-level{
      display:block!important;width:100%!important;margin:7px 0 0!important;
      color:#8ea5af!important;font:700 10.5px/1.3 Arial,sans-serif!important;
      white-space:nowrap!important
    }

    body.ag-profile-mode .sidebar .nav{padding:5px 1px!important;gap:6px!important;margin-top:0!important}
    body.ag-profile-mode .sidebar .nav button{
      width:100%!important;min-height:48px!important;padding:12px 13px!important;
      font:700 15px/1.2 Arial,sans-serif!important;letter-spacing:.2px!important;
      white-space:nowrap!important;box-sizing:border-box!important
    }

    body.ag-profile-mode .map-area .ag-world-map-logo{
      display:block!important;position:absolute!important;z-index:55!important;top:18px!important;
      left:50%!important;transform:translateX(-50%)!important;width:465px!important;height:auto!important;
      max-width:55%!important;object-fit:contain!important;filter:drop-shadow(0 2px 5px rgba(0,0,0,.22))!important;
      pointer-events:none!important
    }

    body.ag-profile-mode .bottom{height:18%!important}
    @media(max-width:1100px){body.ag-profile-mode .map-area .ag-world-map-logo{width:360px!important;max-width:52%!important}}
    @media(max-width:900px){
      body.ag-profile-mode .sidebar{width:24%!important}
      body.ag-profile-mode .missions{left:24%!important;width:26%!important}
      body.ag-profile-mode .map-area{left:50%!important}
      body.ag-profile-mode .map-area .ag-world-map-logo{width:320px!important;max-width:55%!important}
      body.ag-profile-mode .sidebar .menu-user{min-height:110px!important;padding:10px 7px!important;gap:12px!important}
      body.ag-profile-mode .sidebar .menu-user-avatar{width:78px!important;height:78px!important;min-width:78px!important;min-height:78px!important;max-width:78px!important;max-height:78px!important;flex-basis:78px!important;font-size:28px!important}
      body.ag-profile-mode .sidebar .menu-user-name{font-size:15px!important}
      body.ag-profile-mode .sidebar .menu-user-role{font-size:10px!important}
      body.ag-profile-mode .sidebar .menu-user-level{font-size:9.5px!important}
    }
  `;

  function installStyles(){
    let s=document.getElementById('ag-profile-menu-refinement-style');
    if(!s){s=document.createElement('style');s.id='ag-profile-menu-refinement-style';document.head.appendChild(s)}
    s.textContent=css
  }

  function normalizeSidebarProfile(){
    const s=document.querySelector('.sidebar');
    if(!s)return;
    const nav=s.querySelector('.nav');
    if(!nav)return;

    let user=s.querySelector('.menu-user');
    const oldProfiles=[...s.querySelectorAll('.profile')];

    // If an older profile exists, turn the first one into the new profile block.
    if(!user){
      user=oldProfiles.shift() || document.createElement('div');
      user.className='menu-user';
      user.innerHTML='<div class="menu-user-avatar">N</div><div class="menu-user-info"><div class="menu-user-name">NICO</div><div class="menu-user-role">SALES REPRESENTATIVE</div><div class="menu-user-level">Level 7 · Territory 03</div></div>';
    }

    // Remove every legacy/duplicate profile so only the new block remains.
    oldProfiles.forEach(p=>p.remove());
    s.querySelectorAll('.menu-user').forEach(other=>{if(other!==user)other.remove()});

    if(user.parentElement!==s || user.nextElementSibling!==nav)nav.before(user);

    // Rebuild malformed legacy markup while preserving the clean profile block.
    if(!user.querySelector('.menu-user-avatar') || !user.querySelector('.menu-user-info')){
      user.innerHTML='<div class="menu-user-avatar">N</div><div class="menu-user-info"><div class="menu-user-name">NICO</div><div class="menu-user-role">SALES REPRESENTATIVE</div><div class="menu-user-level">Level 7 · Territory 03</div></div>';
    }
  }

  function injectMapLogo(){
    const map=document.querySelector('.map-area');if(!map)return;
    let l=map.querySelector('.ag-world-map-logo');
    if(!l){l=document.createElement('img');l.className='ag-world-map-logo';l.alt='AG World';l.src=LOGO_SRC;l.decoding='async';l.loading='eager';map.appendChild(l)}
    else if(!l.src.includes('/assets/Logo.png'))l.src=LOGO_SRC
  }

  function removeSidebarLogo(){document.querySelectorAll('.sidebar .ag-world-menu-logo').forEach(l=>l.remove())}

  function install(){
    installStyles();normalizeSidebarProfile();removeSidebarLogo();injectMapLogo();
    new MutationObserver(()=>{installStyles();normalizeSidebarProfile();removeSidebarLogo();injectMapLogo()}).observe(document.body,{childList:true,subtree:true})
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
