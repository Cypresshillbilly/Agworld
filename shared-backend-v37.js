(()=>{const U='https://vcnkspaljmsjvonftfcw.supabase.co',K='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';const load=()=>new Promise((ok,no)=>{if(window.supabase)return ok();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=ok;s.onerror=no;document.head.appendChild(s)});let db,user;
async function init(){render();try{await load();db=window.supabase.createClient(U,K);const{data:{user:u}}=await db.auth.getUser();user=u;render()}catch(err){console.warn('AG World backend unavailable',err);render()}}
function render(){let e=document.getElementById('agAuth');if(!e){e=document.createElement('div');e.id='agAuth';document.body.appendChild(e)}e.innerHTML=user?'<button data-open>👤 '+(user.user_metadata?.display_name||user.email)+'</button>':'<button data-open>JOIN / SIGN IN</button>';e.querySelector('[data-open]').onclick=()=>user?menu():login()}
function login(){if(!db){const e=document.getElementById('agAuthModal')||Object.assign(document.createElement('div'),{id:'agAuthModal'});if(!e.parentNode)document.body.appendChild(e);e.innerHTML='<div><h2>Join The Company</h2><p>Connecting to the Company account service…</p><small data-msg>Please wait a moment, then try again.</small></div>';e.classList.add('show');return;}
const e=document.getElementById('agAuthModal')||Object.assign(document.createElement('div'),{id:'agAuthModal'});if(!e.parentNode)document.body.appendChild(e);
e.innerHTML='<div><button class="ag-auth-close" type="button">×</button><h2>Join The Company</h2><p>Create your AG World employee account or sign in.</p><input data-name placeholder="Your name" autocomplete="name"><input data-email placeholder="Email" type="email" autocomplete="email"><input data-pass placeholder="Password (minimum 6 characters)" type="password" autocomplete="new-password"><button data-signup>CREATE ACCOUNT</button><button data-login>SIGN IN</button><button data-resend type="button">RESEND CONFIRMATION EMAIL</button><small data-msg></small></div>';e.classList.add('show');e.style.zIndex='200000';
const msg=(x)=>e.querySelector('[data-msg]').textContent=x;
e.querySelector('.ag-auth-close').onclick=()=>e.classList.remove('show');
e.querySelector('[data-signup]').onclick=async()=>{
 const n=e.querySelector('[data-name]').value.trim(),email=e.querySelector('[data-email]').value.trim(),password=e.querySelector('[data-pass]').value;
 if(!n||!email||!password)return msg('Complete all fields.');
 if(password.length<6)return msg('Password must be at least 6 characters.');
 const btn=e.querySelector('[data-signup]');btn.disabled=true;btn.textContent='CREATING ACCOUNT…';msg('Creating your Company account…');
 try{
   const{data,error}=await db.auth.signUp({email,password,options:{data:{display_name:n}}});
   if(error){msg(error.message);return;}
   const created=data&&data.user;if(!created){msg('No account was returned. Please try again.');return;}
   if(data.session){
     user=created;sessionStorage.setItem('gamechanger.authenticated','1');sessionStorage.setItem('gamechanger.role','agriculture_sales');sessionStorage.setItem('gamechanger.username',n);
     try{await db.from('ag_players').upsert({id:created.id,display_name:n});}catch(x){console.warn(x);}
     document.getElementById('ag-login-gate')?.remove();e.classList.remove('show');render();window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:n,role:'agriculture_sales'}}));sync();return;
   }
   msg('Account created. Please check your email to confirm it, then return and click SIGN IN.');
 }catch(err){console.error(err);msg(err&&err.message||'Unable to create the account. Please try again.');}
 finally{btn.disabled=false;btn.textContent='CREATE ACCOUNT';}
};
e.querySelector('[data-resend]').onclick=async()=>{
 const email=e.querySelector('[data-email]').value.trim();if(!email)return msg('Enter your email address first.');
 const btn=e.querySelector('[data-resend]');btn.disabled=true;btn.textContent='SENDING…';msg('Requesting a new confirmation email…');
 try{const{error}=await db.auth.resend({type:'signup',email});msg(error?error.message:'Confirmation email requested. Check your inbox and spam/junk folder.');}
 catch(err){console.error(err);msg(err&&err.message||'Unable to resend the confirmation email.');}
 finally{btn.disabled=false;btn.textContent='RESEND CONFIRMATION EMAIL';}
};
e.querySelector('[data-login]').onclick=async()=>{
 const email=e.querySelector('[data-email]').value.trim(),password=e.querySelector('[data-pass]').value;if(!email||!password)return msg('Enter your email and password.');
 const btn=e.querySelector('[data-login]');btn.disabled=true;btn.textContent='SIGNING IN…';msg('Signing in…');
 try{
  const{data,error}=await db.auth.signInWithPassword({email,password});if(error){msg(error.message);return;}
  if(!data||!data.user){msg('Unable to sign in. Please try again.');return;}
  user=data.user;const name=user.user_metadata?.display_name||email;
  sessionStorage.setItem('gamechanger.authenticated','1');sessionStorage.setItem('gamechanger.role','agriculture_sales');sessionStorage.setItem('gamechanger.username',name);
  try{await db.from('ag_players').upsert({id:user.id,display_name:name});}catch(x){console.warn(x);}
  document.getElementById('ag-login-gate')?.remove();e.classList.remove('show');render();window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:name,role:'agriculture_sales'}}));sync();
 }catch(err){console.error(err);msg(err&&err.message||'Unable to sign in. Please try again.');}
 finally{btn.disabled=false;btn.textContent='SIGN IN';}
}}
function menu(){const e=document.getElementById('agAuthModal')||Object.assign(document.createElement('div'),{id:'agAuthModal'});if(!e.parentNode)document.body.appendChild(e);e.innerHTML='<div><h2>'+((user.user_metadata?.display_name)||user.email)+'</h2><p>Connected to the shared AG World.</p><button data-sync>SYNC COMPANY DATA</button><button data-out>SIGN OUT</button></div>';e.classList.add('show');e.querySelector('[data-sync]').onclick=sync;e.querySelector('[data-out]').onclick=async()=>{await db.auth.signOut();user=null;e.classList.remove('show');render()}}
async function sync(){if(!user)return;const s=window.AGWorldCompany?.getState?.();if(!s)return;const rows=(s.contributions||[]).filter(x=>!x.synced).map(x=>({player_id:user.id,contribution_type:x.type,mission_id:x.missionId||null,territory_id:x.territoryId||null,title:x.title||null,xp:x.xp||0}));if(rows.length){const{error}=await db.from('ag_contributions').insert(rows);if(!error)(s.contributions||[]).forEach(x=>x.synced=true)}const{data}=await db.from('ag_contributions').select('*,ag_players(display_name)').order('created_at',{ascending:false}).limit(100);if(data)window.AGWorldSharedContributions=data;window.AGWorldControlDashboard?.render?.();window.AGWorldCompany?.open?.()}
const st=document.createElement('style');st.textContent='#agAuthModal .ag-auth-close{position:absolute;right:8px;top:6px;width:auto!important;background:transparent!important;border:0!important;font-size:22px!important;color:#cfe85b!important;padding:4px 9px!important}#agAuthModal>div{position:relative}#agAuthModal button:disabled{opacity:.6;cursor:wait}#agAuthModal small{min-height:32px;line-height:1.4}\n#agAuth{position:fixed;right:22px;top:16px;z-index:15000}#agAuth button{padding:9px 12px;border-radius:7px;border:1px solid rgba(101,216,117,.45);background:#132019;color:#d9f4de;font-size:9px;font-weight:900}#agAuthModal{position:fixed;inset:0;display:none;z-index:16000;background:rgba(0,0,0,.78);align-items:center;justify-content:center}#agAuthModal.show{display:flex}#agAuthModal>div{width:min(360px,90%);background:#10191c;padding:24px;border-radius:15px;color:#edf5ef}#agAuthModal input,#agAuthModal button{width:100%;box-sizing:border-box;margin:6px 0;padding:10px;border-radius:6px}#agAuthModal input{background:#091013;border:1px solid #39443e;color:#fff}#agAuthModal button{background:#1a2a1e;color:#dff6e3;border:1px solid rgba(101,216,117,.4)}#agAuthModal small{display:block;color:#aab5ad;margin-top:8px}';document.head.appendChild(st);window.AGWorldBackend={sync,getUser:()=>user};init().catch(err=>{console.error('AG World backend failed to initialise',err);render()});})();