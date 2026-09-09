// AG World canonical login presentation v42
// Canonical background: approved clean AgWorld login v1.3.
// The gate uses layered CSS backgrounds so the page remains visible while the
// v1.3 binary is being deployed; once v1.3 exists it automatically sits above
// the temporary v2 fallback without any code change.
(()=>{
  const BG='assets/ag_world_login_v1.3.png?v=agworld-login-bg-v1.3-20260909';
  const BG_FALLBACK='assets/ag_world_login_v2.jpg?v=agworld-login-bg-fallback-20260909';
  const AG_LOGO='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=agworld-brand-v1.3-20260909';
  const GC_LOGO='brand/game-changer/OFFICIAL/GameChanger_Official_Horizontal_Dark.svg?v=gc-official-20260909';

  function install(){
    const gate=document.getElementById('ag-login-gate');
    if(!gate) return;

    // Never leave the user with a black login screen. CSS layers v1.3 above v2:
    // when v1.3 is present it is the visible canonical image; until then v2 is
    // still rendered underneath.
    gate.style.backgroundImage='url("'+BG+'"), url("'+BG_FALLBACK+'")';
    gate.style.backgroundSize='cover, cover';
    gate.style.backgroundPosition='center, center';
    gate.style.backgroundRepeat='no-repeat, no-repeat';

    const art=gate.querySelector('.ag-login-art');
    if(art) art.style.display='none';

    const panel=gate.querySelector('.ag-login-panel');
    if(!panel) return;

    panel.classList.remove('ag-login-panel-wide');

    // Restore the official Game Changer logo on the LEFT of the login form.
    let gc=panel.querySelector('.gc-login-brand');
    if(!gc){
      gc=document.createElement('div');
      gc.className='gc-login-brand';
      gc.innerHTML='<img src="'+GC_LOGO+'" alt="Game Changer">';
      panel.insertBefore(gc,panel.firstChild);
    } else {
      const img=gc.querySelector('img');
      if(img) img.setAttribute('src',GC_LOGO);
    }

    // Remove only obsolete AgWorld artwork from inside the panel. The official
    // AgWorld mark belongs at the top centre of the page.
    panel.querySelectorAll('.agworld-login-logo,.ag-official-gamechanger-logo,.ag-login-wide,.ag-login-logo-side').forEach(node=>node.remove());

    const form=panel.querySelector('.ag-login-form');
    if(form && form.parentElement!==panel) panel.appendChild(form);

    let logo=gate.querySelector('.ag-login-official-logo');
    if(!logo){
      logo=document.createElement('img');
      logo.className='ag-login-official-logo';
      logo.alt='AgWorld';
      gate.appendChild(logo);
    }
    if(logo.getAttribute('src')!==AG_LOGO) logo.setAttribute('src',AG_LOGO);
  }

  const old=document.getElementById('agworld-canonical-login-v41');
  if(old) old.remove();
  const style=document.createElement('style');
  style.id='agworld-canonical-login-v42';
  style.textContent=`
#ag-login-gate{position:fixed!important;inset:0!important;overflow:hidden!important;background-color:#070a09!important}
#ag-login-gate .ag-login-art{display:none!important}
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
  transform:translate(-50%,-50%)!important;width:min(690px,calc(100vw - 36px))!important;
  max-width:690px!important;min-height:0!important;padding:24px 28px!important;
  box-sizing:border-box!important;overflow:visible!important;border-radius:15px!important;
  border:1px solid rgba(207,224,92,.72)!important;
  background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78))!important;
  box-shadow:0 18px 55px rgba(0,0,0,.6)!important;backdrop-filter:blur(6px)!important;
  display:flex!important;align-items:center!important;gap:28px!important;
}
#ag-login-gate .gc-login-brand{
  display:flex!important;align-items:center!important;justify-content:center!important;
  flex:0 0 42%!important;margin:0!important;padding:8px 12px!important;
  border-right:1px solid rgba(207,224,92,.22)!important;
}
#ag-login-gate .gc-login-brand img{
  display:block!important;width:100%!important;max-width:250px!important;height:auto!important;
  max-height:150px!important;object-fit:contain!important;
}
#ag-login-gate .ag-login-form{
  display:block!important;flex:1 1 auto!important;width:auto!important;max-width:none!important;margin:0!important;
}
#ag-login-gate .ag-login-wide,
#ag-login-gate .ag-login-logo-side,
#ag-login-gate .agworld-login-logo{display:none!important}
@media(max-width:720px){
  #ag-login-gate .ag-login-official-logo{
    top:22px!important;width:min(430px,calc(100vw - 48px))!important;max-height:22vh!important;
  }
  #ag-login-gate .ag-login-panel,
  #ag-login-gate .ag-login-panel.ag-login-panel-wide{
    top:58%!important;width:min(442px,calc(100vw - 28px))!important;padding:18px 24px!important;
    display:block!important;
  }
  #ag-login-gate .gc-login-brand{
    border-right:0!important;border-bottom:1px solid rgba(207,224,92,.22)!important;
    padding:0 0 14px!important;margin:0 0 14px!important;
  }
  #ag-login-gate .gc-login-brand img{max-width:210px!important;max-height:110px!important}
}
`;
  document.head.appendChild(style);

  // This file is intentionally loaded before ag-auth.js. Watch for the login
  // gate so the canonical presentation is applied in the same render cycle as
  // gate creation, preventing the legacy screen from flashing first.
  const observer=new MutationObserver(()=>install());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  install();
  setTimeout(()=>observer.disconnect(),15000);
})();