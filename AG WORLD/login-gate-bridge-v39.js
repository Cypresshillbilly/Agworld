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

    if(user){
      // Supabase is authoritative. Keep only compatibility state derived from it.
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
    if(!form||form.querySelector('[data-company-login]')) return;

    const b=document.createElement('button');
    b.type='button';
    b.dataset.companyLogin='1';
    b.textContent='JOIN THE COMPANY / SIGN IN';
    b.style.cssText='width:100%;height:42px;margin-top:10px;border-radius:8px;border:1px solid rgba(207,224,92,.55);background:rgba(207,232,91,.08);color:#dbe99c;font-weight:900;letter-spacing:1px;cursor:pointer';
    b.onclick=()=>{
      const a=document.querySelector('#agAuth button');
      if(!a) return;
      a.click();
      setTimeout(()=>{const m=document.getElementById('agAuthModal');if(m)m.style.zIndex='200000'},50);
    };
    form.appendChild(b);

    // Disable the legacy username/password form for AG World player access.
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const err=form.querySelector('.ag-login-error');
      if(err) err.textContent='PLEASE USE JOIN THE COMPANY / SIGN IN';
    },true);
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
    if(!user){
      // A gate may have been removed by legacy code. Restore authentication boundary.
      const gate=document.getElementById('ag-login-gate');
      if(!gate && document.body && location.pathname.toLowerCase().includes('index')) location.reload();
    }
  },700);
})();