// AG World authentication bridge v41
// Supabase is the sole player identity authority. No legacy session bypass.
(()=>{
  const SUPABASE_URL='https://vcnkspaljmsjvonftfcw.supabase.co';
  const SUPABASE_KEY='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';

  function client(){
    if(!window.supabase?.createClient) return null;
    return window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  }

  function legacySessionKeys(){
    ['gamechanger.authenticated','gamechanger.role','gamechanger.username'].forEach(k=>sessionStorage.removeItem(k));
  }

  async function enforce(){
    const db=client();
    if(!db) return;
    const {data:{user}}=await db.auth.getUser();

    if(user && window.__AGWORLD_EXPLICIT_AUTH__===true){
      // Mirror Supabase identity only after an explicit sign-in on this page.
      // A persisted browser session is not permission to bypass the login screen.
      sessionStorage.setItem('gamechanger.authenticated','1');
      sessionStorage.setItem('gamechanger.role','agriculture_sales');
      sessionStorage.setItem('gamechanger.username',user.user_metadata?.display_name||user.email||'PLAYER');
      window.dispatchEvent(new CustomEvent('agworld:supabase-authenticated',{detail:{user}}));
      return;
    }

    // Never allow an old browser-only identity to unlock AG World.
    legacySessionKeys();
  }

  function installJoinButton(){
    const gate=document.getElementById('ag-login-gate');
    const form=gate?.querySelector('.ag-login-form');
    if(!gate||!form) return;

    // The compact canonical layout owns the left action stack. Search the whole
    // gate so moving this button out of the form does not cause the bridge to
    // recreate a duplicate below Remember Me.
    let b=gate.querySelector('[data-company-login]');
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.dataset.companyLogin='1';
      b.textContent='CREATE ACCOUNT';
      b.style.cssText='width:100%;height:42px;margin:0;border-radius:8px;border:1px solid rgba(207,224,92,.55);background:rgba(207,232,91,.08);color:#dbe99c;font-weight:900;letter-spacing:1px;cursor:pointer';
      b.onclick=()=>{
        // Always open the account-creation boundary directly. A persisted
        // Supabase identity must not turn this button into the previous user's
        // profile menu after a page refresh.
        if(window.AGWorldBackend?.openAccountCreation){
          window.AGWorldBackend.openAccountCreation();
        }else{
          const a=document.querySelector('#agAuth button');
          if(a) a.click();
        }
        setTimeout(()=>{const m=document.getElementById('agAuthModal');if(m)m.style.zIndex='200000'},50);
      };
    }

    b.textContent='CREATE ACCOUNT';

    // Put Create Account beneath the Game Changer logo whenever the canonical
    // panel has already created its compact action stack.
    const actions=gate.querySelector('.gc-login-actions');
    if(actions && b.parentElement!==actions) actions.appendChild(b);
    else if(!actions && !b.parentElement) form.appendChild(b);

    // Do not intercept the form submit here. ag-auth.js owns real Supabase
    // sign-in, including Remember Me and validation.
  }
  let lastUserId='';
  setInterval(async()=>{
    installJoinButton();
    const db=client();
    if(!db) return;
    const {data:{user}}=await db.auth.getUser();
    const id=user?.id||'';
    if(id!==lastUserId){
      lastUserId=id;
      await enforce();
    }
    // Never turn a persisted Supabase session into an automatic AG World login.
    if(user && window.__AGWORLD_EXPLICIT_AUTH__!==true) legacySessionKeys();
    if(!user){
      // A gate may have been removed by legacy code. Restore authentication boundary.
      const gate=document.getElementById('ag-login-gate');
      if(!gate && document.body && location.pathname.toLowerCase().includes('index')) location.reload();
    }
  },700);
})();