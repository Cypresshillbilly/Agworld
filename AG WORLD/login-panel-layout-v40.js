// AG World canonical login presentation v43
// Canonical background: approved clean AgWorld login v1.3.
// The gate uses layered CSS backgrounds so the page remains visible while the
// approved v1.3 binary sits above the temporary fallback.
(()=>{
  const BG='assets/backround%20v1.3.png?v=agworld-login-bg-v1.3-20260909-2040';
  const BG_FALLBACK='assets/ag_world_login_v2.jpg?v=agworld-login-bg-fallback-20260909';
  const AG_LOGO='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=agworld-brand-v1.3-20260909';
  // Single canonical Game Changer asset. This is the approved uploaded PNG master;
  // do not fall back to legacy SVGs or previously injected artwork.
  const GC_LOGO='../GAME%20CHANGER/BRAND/OFFICIAL/Game_Changer_Primary_Horizontal_Dark.png?v=gc-approved-master-20260909-2100';

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
    // Keep installation idempotent: the MutationObserver must not trigger an
    // endless remove/recreate DOM loop.
    panel.querySelectorAll('.ag-official-gamechanger-logo,.legacy-gamechanger-logo').forEach(node=>node.remove());
    let gc=panel.querySelector('.gc-login-brand');
    if(!gc){
      gc=document.createElement('div');
      gc.className='gc-login-brand';
      panel.insertBefore(gc,panel.firstChild);
    }
    let gcImg=gc.querySelector('img');
    if(!gcImg){
      gcImg=document.createElement('img');
      gc.appendChild(gcImg);
    }
    gcImg.src=GC_LOGO;
    gcImg.alt='Game Changer';

    // Compact left action stack: Game Changer brand above, both primary actions
    // directly underneath. This keeps the panel clear of the large AgWorld logo.
    let actions=gc.querySelector('.gc-login-actions');
    if(!actions){
      actions=document.createElement('div');
      actions.className='gc-login-actions';
      gc.appendChild(actions);
    }

    // Remove only obsolete AgWorld artwork from inside the panel. The official
    // AgWorld mark belongs at the top centre of the page.
    panel.querySelectorAll('.agworld-login-logo,.ag-official-gamechanger-logo,.ag-login-wide,.ag-login-logo-side').forEach(node=>node.remove());

    const form=panel.querySelector('.ag-login-form');
    if(form){
      if(!form.id) form.id='ag-login-form-canonical';
      const enter=form.querySelector('.ag-login-button');
      if(enter && enter.parentElement!==actions){
        enter.setAttribute('form',form.id);
        actions.appendChild(enter);
      }

      // The account button is injected shortly afterwards by login-gate-bridge.
      // Observe only this form and disconnect as soon as that one button is moved.
      const moveCreate=()=>{
        const create=form.querySelector('[data-company-login]');
        if(!create) return false;
        if(create.parentElement!==actions) actions.appendChild(create);
        return true;
      };
      if(!moveCreate()){
        const actionObserver=new MutationObserver(()=>{
          if(moveCreate()) actionObserver.disconnect();
        });
        actionObserver.observe(form,{childList:true});
      }
      if(form.parentElement!==panel) panel.appendChild(form);
    }

    let logo=gate.querySelector('.ag-login-official-logo');
    if(!logo){
      logo=document.createElement('img');
      logo.className='ag-login-official-logo';
      logo.alt='AgWorld';
      gate.appendChild(logo);
    }
    if(logo.getAttribute('src')!==AG_LOGO) logo.setAttribute('src',AG_LOGO);
  }

  ['agworld-canonical-login-v41','agworld-canonical-login-v42','agworld-canonical-login-v43'].forEach(id=>{
    const old=document.getElementById(id);
    if(old) old.remove();
  });
  const style=document.createElement('style');
  style.id='agworld-canonical-login-v43';
  style.textContent=`
#ag-login-gate{position:fixed!important;inset:0!important;overflow:hidden!important;background-color:#070a09!important}
#ag-login-gate .ag-login-art{display:none!important}
#ag-login-gate .ag-login-official-logo{
  position:absolute!important;z-index:2!important;left:50%!important;
  top:clamp(18px,4.5vh,60px)!important;transform:translateX(-50%)!important;
  width:min(900px,calc(100vw - 72px))!important;height:auto!important;
  max-height:40vh!important;object-fit:contain!important;background:transparent!important;
  filter:drop-shadow(0 8px 22px rgba(0,0,0,.55))!important;pointer-events:none!important;
}
#ag-login-gate .ag-login-panel,
#ag-login-gate .ag-login-panel.ag-login-panel-wide{
  position:absolute!important;z-index:3!important;left:50%!important;top:61%!important;
  transform:translate(-50%,-50%)!important;width:min(690px,calc(100vw - 36px))!important;
  max-width:690px!important;min-height:0!important;padding:17px 24px!important;
  box-sizing:border-box!important;overflow:visible!important;border-radius:15px!important;
  border:1px solid rgba(207,224,92,.72)!important;
  background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78))!important;
  box-shadow:0 18px 55px rgba(0,0,0,.6)!important;backdrop-filter:blur(6px)!important;
  display:flex!important;align-items:stretch!important;gap:22px!important;
}
#ag-login-gate .gc-login-brand{
  display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;
  flex:0 0 38%!important;margin:0!important;padding:4px 20px 4px 4px!important;
  border-right:1px solid rgba(207,224,92,.22)!important;
}
#ag-login-gate .gc-login-brand img{
  display:block!important;width:100%!important;max-width:230px!important;height:auto!important;
  max-height:76px!important;object-fit:contain!important;margin:0 0 8px!important;
}
#ag-login-gate .gc-login-actions{
  display:grid!important;grid-template-columns:1fr!important;gap:8px!important;
  width:100%!important;margin-top:auto!important;
}
#ag-login-gate .gc-login-actions .ag-login-button,
#ag-login-gate .gc-login-actions [data-company-login]{
  width:100%!important;height:38px!important;min-height:38px!important;margin:0!important;
  box-sizing:border-box!important;border-radius:7px!important;font-size:9px!important;
  letter-spacing:1px!important;
}
#ag-login-gate .ag-login-form{
  display:block!important;flex:1 1 auto!important;width:auto!important;max-width:none!important;margin:0!important;
}
#ag-login-gate .ag-input-wrap{margin-bottom:8px!important}
#ag-login-gate .ag-input-wrap input{height:39px!important}
#ag-login-gate .ag-remember{margin:1px 0 6px!important}
#ag-login-gate .ag-login-error{min-height:0!important;margin-top:4px!important}
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
  #ag-login-gate .gc-login-brand img{max-width:210px!important;max-height:78px!important}
}
`;
  document.head.appendChild(style);

  // This file is intentionally loaded before ag-auth.js. Watch for the login
  // gate so the canonical presentation is applied in the same render cycle as
  // gate creation, preventing the legacy screen from flashing first.
  // One-shot readiness observer. Once the auth script creates the gate and
  // panel, install the presentation and disconnect immediately.
  const observer=new MutationObserver(()=>{
    if(document.getElementById('ag-login-gate')){
      install();
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  install();
  if(document.getElementById('ag-login-gate')) observer.disconnect();
})();