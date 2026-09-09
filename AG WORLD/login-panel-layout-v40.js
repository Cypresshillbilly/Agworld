// AG World canonical login presentation v41
// Locks the login screen to the approved clean AgWorld background v1.3,
// uses the official AgWorld logo above the panel, and keeps the panel floating
// in its normal centred position. No Game Changer brand artwork is used here.
(()=>{
  const BG='assets/ag_world_login_v1.3.png?v=agworld-login-bg-v1.3-20260909';
  const LOGO='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=agworld-brand-v1.3-20260909';

  function install(){
    const gate=document.getElementById('ag-login-gate');
    if(!gate) return;

    const art=gate.querySelector('.ag-login-art');
    if(art){
      if(art.getAttribute('src')!==BG) art.setAttribute('src',BG);
      art.onerror=()=>{
        // Temporary deployment safety only: if the canonical binary has not yet
        // reached the repository, keep the login screen usable rather than blank.
        // The canonical v1.3 asset automatically wins as soon as it exists.
        if(!art.dataset.agworldBgFallback){
          art.dataset.agworldBgFallback='1';
          art.setAttribute('src','assets/ag_world_login_v2.jpg');
        }
      };
    }

    const panel=gate.querySelector('.ag-login-panel');
    if(!panel) return;

    // Remove all legacy or panel-embedded brand artwork.
    panel.querySelectorAll('.gc-login-brand,.agworld-login-logo,.ag-official-gamechanger-logo,.ag-login-wide').forEach(node=>node.remove());
    panel.classList.remove('ag-login-panel-wide');

    // Keep the authentication form directly inside the floating panel.
    const form=panel.querySelector('.ag-login-form');
    if(form && form.parentElement!==panel) panel.appendChild(form);

    // Official AgWorld logo belongs above the floating panel.
    let logo=gate.querySelector('.ag-login-official-logo');
    if(!logo){
      logo=document.createElement('img');
      logo.className='ag-login-official-logo';
      logo.alt='AgWorld';
      gate.appendChild(logo);
    }
    if(logo.getAttribute('src')!==LOGO) logo.setAttribute('src',LOGO);
  }

  const style=document.createElement('style');
  style.id='agworld-canonical-login-v41';
  style.textContent=`
#ag-login-gate{position:fixed!important;inset:0!important;overflow:hidden!important}
#ag-login-gate .ag-login-art{
  position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
  object-fit:cover!important;z-index:0!important;
}
#ag-login-gate .ag-login-official-logo{
  position:absolute!important;z-index:2!important;left:50%!important;
  top:clamp(24px,6vh,76px)!important;transform:translateX(-50%)!important;
  width:min(560px,calc(100vw - 72px))!important;height:auto!important;
  max-height:27vh!important;object-fit:contain!important;background:transparent!important;
  filter:drop-shadow(0 8px 22px rgba(0,0,0,.55))!important;pointer-events:none!important;
}
#ag-login-gate .ag-login-panel,
#ag-login-gate .ag-login-panel.ag-login-panel-wide{
  position:absolute!important;z-index:3!important;left:50%!important;top:58%!important;
  transform:translate(-50%,-50%)!important;width:min(442px,calc(100vw - 36px))!important;
  max-width:442px!important;min-height:0!important;padding:21px 31px!important;
  overflow:visible!important;border-radius:15px!important;
  border:1px solid rgba(207,224,92,.72)!important;
  background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78))!important;
  box-shadow:0 18px 55px rgba(0,0,0,.6)!important;backdrop-filter:blur(6px)!important;
}
#ag-login-gate .ag-login-wide,
#ag-login-gate .ag-login-logo-side,
#ag-login-gate .gc-login-brand,
#ag-login-gate .agworld-login-logo{display:none!important}
#ag-login-gate .ag-login-form{width:100%!important;max-width:none!important;margin:0!important}
@media(max-width:720px){
  #ag-login-gate .ag-login-official-logo{
    top:22px!important;width:min(430px,calc(100vw - 48px))!important;max-height:22vh!important;
  }
  #ag-login-gate .ag-login-panel,
  #ag-login-gate .ag-login-panel.ag-login-panel-wide{
    top:58%!important;width:min(442px,calc(100vw - 28px))!important;padding:18px 24px!important;
  }
}
`;
  document.head.appendChild(style);

  const timer=setInterval(install,200);
  install();
  setTimeout(()=>clearInterval(timer),15000);
})();