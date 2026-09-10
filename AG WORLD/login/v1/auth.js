/* GAME CHANGER authentication — Master and Ag World sessions are separate. */
(() => {
  // Credentials are scoped by authentication domain. Master credentials cannot
  // authenticate into Ag World, and Ag World credentials cannot authenticate
  // into the Master Console.
  const MASTER_USERS = {
    Admin: { passwordSha256: '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', role: 'administrator' }
  };
  const AGWORLD_USERS = {
    Agadmin: { passwordSha256: 'c7f3148a5d925a582b257c7660c9847d4114862d34f6335f76a4d2697ff55b79', role: 'agriculture_administrator' },
    Salesman: { passwordSha256: '75b2324a77561a1b03e3be652b212d9aff91834466726080e138cbdc6466dae4', role: 'agriculture_sales' }
  };
  const page = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const master = page()==='master-admin.html';
  const SESSION = master ? 'gamechanger.master.authenticated' : 'gamechanger.authenticated';
  const ROLE = master ? 'gamechanger.master.role' : 'gamechanger.role';
  const USER = master ? 'gamechanger.master.username' : 'gamechanger.username';
  // Master Admin "Remember Me" is intentionally scoped to the local browser
  // profile used by the desktop shortcut. It never shares credentials with
  // Ag World player sign-in.
  const REMEMBER_USER = 'gamechanger.master.remembered.username';
  const REMEMBER_FLAG = 'gamechanger.master.remembered.enabled';
  // Remember Me stores only a non-secret username/email. Authentication is
  // restored by the authenticated session provider, never by a plaintext
  // password retained in browser storage.
  const AG_REMEMBER_USER = 'agworld.remembered.email';
  const AG_REMEMBER_FLAG = 'agworld.remembered.enabled';
  const LEGACY_REMEMBER_PASS = 'gamechanger.master.remembered.password';
  const LEGACY_AG_REMEMBER_PASS = 'agworld.remembered.password';

  async function sha256(text){
    const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function landing(role){
    const roles=window.GAME_CHANGER_ROLES||{};
    return roles[role]?.landing || (role==='administrator'?'master-admin.html':'index.html');
  }
  function loginImage(){
    return window.GAME_CHANGER_BUILD?.current?.()?.loginBackground ||
      window.GAME_CHANGER_AGRICULTURE_BUILD?.login?.background ||
      'assets/ag_world_login_v2.jpg';
  }
  function reveal(){
    document.documentElement.style.visibility='visible';
    document.body.style.visibility='visible';
  }
  function showGate(){
    if(document.getElementById('ag-login-gate')) return;
    const gate=document.createElement('div');
    gate.id='ag-login-gate';
    gate.className=master?'gc-master-login':'gc-ag-login';

    const title=master?'MASTER PLATFORM ACCESS':'DOMINATE THE TERRITORY';
    const line=master?'Authorised access to the GAME CHANGER platform.':'Build relationships. Drive sales. WIN THE FUTURE.';
    gate.innerHTML=(master?'':'<img class="ag-login-art" src="'+loginImage()+'" alt="" aria-hidden="true">')+
      '<div class="ag-login-panel"><img class="agworld-login-logo" src="brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png" alt="AgWorld">'+
      '<form class="ag-login-form" autocomplete="off" data-lpignore="true" data-1p-ignore="true">'+
      '<input type="text" name="ag-world-decoy-user" autocomplete="username" tabindex="-1" aria-hidden="true" style="position:absolute;left:-10000px;opacity:0">'+
      '<input type="password" name="ag-world-decoy-pass" autocomplete="current-password" tabindex="-1" aria-hidden="true" style="position:absolute;left:-10000px;opacity:0">'+
      '<label class="ag-input-wrap"><span>USERNAME</span><input id="agUsername" name="ag-world-user" type="text" autocomplete="off" required value="" data-lpignore="true" data-1p-ignore="true"></label>'+
      '<label class="ag-input-wrap"><span>PASSWORD</span><div class="ag-password-row"><input id="agPassword" name="ag-world-pass" type="password" autocomplete="new-password" required value="" data-lpignore="true" data-1p-ignore="true"><button type="button" class="ag-eye">◉</button></div></label>'+
      '<label class="ag-remember"><input id="agRemember" type="checkbox"><span></span> REMEMBER ME</label>'+
      '<button class="ag-login-button" type="submit">ENTER AG WORLD</button>'+
      '<button class="ag-create-account-button" data-company-login="1" type="button">CREATE ACCOUNT</button>'+
      '<div class="ag-login-error"></div></form></div>';

    const style=document.createElement('style');
    style.textContent='#ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif;color:#f4f3eb}#ag-login-gate.gc-master-login{background:radial-gradient(circle at 78% 12%,rgba(123,161,29,.16),transparent 32%),linear-gradient(145deg,#070b08,#111812)}.ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.ag-login-panel{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:min(442px,calc(100vw - 36px));box-sizing:border-box;padding:21px 31px;border:1px solid rgba(207,224,92,.72);border-radius:15px;background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78));box-shadow:0 18px 55px rgba(0,0,0,.6);backdrop-filter:blur(6px)}.gc-master-login .ag-login-panel{top:50%;background:linear-gradient(145deg,rgba(15,23,17,.97),rgba(8,13,10,.95))}.gc-login-brand{text-align:center;margin-bottom:18px;text-transform:uppercase}.gc-login-brand strong{display:block;font-size:26px;font-weight:950;letter-spacing:2.5px}.gc-login-brand strong span{color:#cfe85b}.gc-login-brand small{display:block;margin-top:8px;font-size:8px;font-weight:900;letter-spacing:2.4px}.gc-login-brand em{display:block;margin-top:7px;font-size:8px;font-style:normal;color:#c8cdc3}.ag-input-wrap{display:block;margin-bottom:13px;font-size:9px;font-weight:800;letter-spacing:1.3px;color:#bfc2b9}.ag-input-wrap>span{display:block;margin-bottom:5px}.ag-input-wrap input{width:100%;height:49px;box-sizing:border-box;border:1px solid rgba(190,198,180,.34);border-radius:8px;background:rgba(0,0,0,.38);color:#fff;padding:0 13px}.ag-password-row{position:relative}.ag-password-row input{padding-right:44px}.ag-eye{position:absolute;right:4px;top:4px;width:36px;height:41px;border:0;background:transparent;color:#cfe05c;cursor:pointer}.ag-remember{display:flex;align-items:center;gap:8px;margin:2px 0 15px;font-size:9px;font-weight:700}.ag-remember input{position:absolute;opacity:0}.ag-remember span{width:16px;height:16px;border:1px solid rgba(207,224,92,.65);border-radius:3px}.ag-remember input:checked+span{background:#cfe05c;box-shadow:inset 0 0 0 3px #151a13}.ag-login-button{width:100%;height:50px;border:0;border-radius:8px;background:linear-gradient(180deg,#cfe85b,#8cad21);color:#11160b;font-weight:900;letter-spacing:1.35px;cursor:pointer}.ag-login-error{min-height:13px;margin-top:7px;text-align:center;color:#f0a08c;font-size:9px;font-weight:700}';
    document.head.appendChild(style); document.body.appendChild(gate); reveal();

    // The boot shield is present in index.html before any application code can
    // reveal the underlying game. Remove it only after the real login gate has
    // been mounted and the canonical login layout has had a render cycle to
    // apply, preventing the legacy application layer from flashing on refresh.
    const removeBootShield=()=>{
      const shield=document.getElementById('ag-login-boot-shield');
      if(shield) shield.remove();
    };
    requestAnimationFrame(()=>requestAnimationFrame(removeBootShield));

    const username=gate.querySelector('#agUsername');
    const password=gate.querySelector('#agPassword');
    const remember=gate.querySelector('#agRemember');

    // Restore credentials only when this browser/profile has explicitly
    // been told to remember them.
    try{
      // One-time hygiene for the old implementation: remove any legacy
      // plaintext password values that may still exist from prior versions.
      localStorage.removeItem(LEGACY_REMEMBER_PASS);
      localStorage.removeItem(LEGACY_AG_REMEMBER_PASS);
      if(master){
        const remembered=localStorage.getItem(REMEMBER_FLAG)==='1';
        if(remembered){
          username.value=localStorage.getItem(REMEMBER_USER)||'';
          remember.checked=!!username.value;
        }
      }else{
        const remembered=localStorage.getItem(AG_REMEMBER_FLAG)==='1';
        if(remembered){
          username.value=localStorage.getItem(AG_REMEMBER_USER)||'';
          remember.checked=!!username.value;
        }
      }
    }catch(err){
      console.warn('Unable to restore remembered login credentials',err);
    }

    // Remember Me stores only the username/email. Passwords are never retained
    // in localStorage; the authenticated provider owns session persistence.
    const persistAgRemember=()=>{
      if(master) return;
      try{
        localStorage.removeItem(LEGACY_AG_REMEMBER_PASS);
        if(remember.checked){
          localStorage.setItem(AG_REMEMBER_FLAG,'1');
          localStorage.setItem(AG_REMEMBER_USER,username.value);
        }else{
          localStorage.removeItem(AG_REMEMBER_FLAG);
          localStorage.removeItem(AG_REMEMBER_USER);
        }
      }catch(err){
        console.warn('Unable to save remembered Ag World username',err);
      }
    };
    if(!master){
      remember.addEventListener('change',persistAgRemember);
      username.addEventListener('input',persistAgRemember);
      password.addEventListener('input',persistAgRemember);
    }

    // Login fields are ordinary inputs. Do not clear, lock, reset or mutate them
    // after the form is rendered; this same authentication component serves both
    // Master Admin and Ag World login screens.

    gate.querySelector('.ag-eye').onclick=()=>password.type=password.type==='password'?'text':'password';

    // Create Account is part of the initial login DOM so it renders in the same
    // frame as Enter AgWorld. The click handler resolves the backend lazily,
    // allowing the account service to load later without delaying the button.
    const createAccount=gate.querySelector('[data-company-login]');
    if(createAccount){
      createAccount.onclick=()=>{
        if(window.AGWorldBackend?.openAccountCreation){
          window.AGWorldBackend.openAccountCreation();
        }else{
          const a=document.querySelector('#agAuth button');
          if(a) a.click();
        }
        setTimeout(()=>{const m=document.getElementById('agAuthModal');if(m)m.style.zIndex='200000'},50);
      };
    }

    gate.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault();
      if(!master){
        const error=gate.querySelector('.ag-login-error');
        error.textContent='SIGNING IN…';
        try{
          if(!window.supabase?.createClient){
            await new Promise((resolve,reject)=>{
              const existing=document.querySelector('script[data-agworld-supabase]');
              if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
              const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.dataset.agworldSupabase='1';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
            });
          }
          const db=window.supabase.createClient('https://vcnkspaljmsjvonftfcw.supabase.co','sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o');
          const email=username.value.trim();
          const pass=password.value;
          if(!email||!pass){error.textContent='ENTER YOUR EMAIL AND PASSWORD';return;}
          const {data,error:authError}=await db.auth.signInWithPassword({email,password:pass});
          if(authError){error.textContent=authError.message||'INVALID EMAIL OR PASSWORD';return;}
          if(!data?.user){error.textContent='UNABLE TO SIGN IN. PLEASE TRY AGAIN.';return;}
          const displayName=data.user.user_metadata?.display_name||email;
          window.__AGWORLD_EXPLICIT_AUTH__=true;
          sessionStorage.setItem('gamechanger.authenticated','1');
          sessionStorage.setItem('gamechanger.role','agriculture_sales');
          sessionStorage.setItem('gamechanger.username',displayName);
          if(remember.checked){
            try{
              localStorage.removeItem(LEGACY_AG_REMEMBER_PASS);
              localStorage.setItem(AG_REMEMBER_FLAG,'1');
              localStorage.setItem(AG_REMEMBER_USER,email);
            }catch(err){ console.warn('Unable to save remembered Ag World username',err); }
          }else{
            try{
              localStorage.removeItem(AG_REMEMBER_FLAG);
              localStorage.removeItem(AG_REMEMBER_USER);
              localStorage.removeItem(LEGACY_AG_REMEMBER_PASS);
            }catch(err){ console.warn('Unable to clear remembered Ag World username',err); }
          }
          gate.remove();
          reveal();
          window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:displayName,role:'agriculture_sales'}}));
          window.dispatchEvent(new CustomEvent('agworld:supabase-authenticated',{detail:{user:data.user}}));
        }catch(err){
          console.error('AG World sign-in failed',err);
          error.textContent='UNABLE TO CONNECT TO THE COMPANY ACCOUNT SERVICE';
        }
        return;
      }
      const account=(master ? MASTER_USERS : AGWORLD_USERS)[username.value.trim()];
      const error=gate.querySelector('.ag-login-error');
      error.textContent='';
      if(!account || await sha256(password.value)!==account.passwordSha256){error.textContent='INVALID USERNAME OR PASSWORD';return;}

      // Persist Master Admin credentials only after a successful login and only
      // when the user has explicitly ticked Remember Me. Unticking it on a
      // successful login removes any previously remembered credentials.
      if(master){
        try{
          localStorage.removeItem(LEGACY_REMEMBER_PASS);
          if(remember.checked){
            localStorage.setItem(REMEMBER_FLAG,'1');
            localStorage.setItem(REMEMBER_USER,username.value.trim());
          }else{
            localStorage.removeItem(REMEMBER_FLAG);
            localStorage.removeItem(REMEMBER_USER);
          }
        }catch(err){
          console.warn('Unable to save Master Admin remembered credentials',err);
        }
      }

      sessionStorage.setItem(SESSION,'1'); sessionStorage.setItem(ROLE,account.role); sessionStorage.setItem(USER,username.value.trim());
      if(!master && account.role==='agriculture_sales' && window.GAME_CHANGER_BUILD?.set) window.GAME_CHANGER_BUILD.set('agriculture');
      const dest=landing(account.role);
      if(dest!==page()){location.replace(dest);return;}
      gate.remove(); window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:username.value.trim(),role:account.role}}));
    });
  }

  function install(){
    if(!master){
      const active=sessionStorage.getItem(SESSION)==='1' && !!sessionStorage.getItem(ROLE);
      if(active){
        // A refresh is still an authenticated page load. Remove the boot shield
        // as well as revealing the document; otherwise the background shield
        // remains above the entire game and makes the application look blank.
        window.__AGWORLD_EXPLICIT_AUTH__=true;
        reveal();
        const shield=document.getElementById('ag-login-boot-shield');
        if(shield) shield.remove();

        // Re-emit the authenticated lifecycle event on refresh so the game shell,
        // player profile and menu modules initialise exactly as they do after a
        // fresh sign-in.
        const username=sessionStorage.getItem(USER)||'PLAYER';
        const role=sessionStorage.getItem(ROLE)||'agriculture_sales';
        requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username,role,restored:true}})));
        return;
      }
      window.__AGWORLD_EXPLICIT_AUTH__=false;
      showGate();
      return;
    }
    const ok=sessionStorage.getItem(SESSION)==='1';
    const role=sessionStorage.getItem(ROLE);
    if(ok&&role){reveal();return;}
    showGate();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();