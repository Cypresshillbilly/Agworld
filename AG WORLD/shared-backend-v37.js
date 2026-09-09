// AG World shared backend — company account creation and player identity
(()=>{
  const U='https://vcnkspaljmsjvonftfcw.supabase.co';
  const K='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';
  let db,user;

  const load=()=>new Promise((ok,no)=>{
    if(window.supabase) return ok();
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=ok;s.onerror=no;document.head.appendChild(s);
  });

  async function init(){
    render();
    try{
      await load();
      db=window.supabase.createClient(U,K);
      const {data:{user:u}}=await db.auth.getUser();
      user=u;
      render();
    }catch(err){
      console.warn('AG World backend unavailable',err);
      render();
    }
  }

  function render(){
    let e=document.getElementById('agAuth');
    if(!e){e=document.createElement('div');e.id='agAuth';document.body.appendChild(e);}
    e.innerHTML=user
      ?'<button data-open>👤 '+(user.user_metadata?.display_name||user.email)+'</button>'
      :'<button data-open>JOIN / SIGN IN</button>';
    e.querySelector('[data-open]').onclick=()=>user?menu():login('create');
  }

  async function facilities(){
    if(!db) return [];
    const {data,error}=await db.from('company_facilities')
      .select('id,name,details')
      .order('name',{ascending:true});
    if(error) throw error;
    return (data||[])
      .filter(x=>!/^demo /i.test(x.name||''))
      .map(x=>({
        id:x.id,
        name:x.name||'Company Facility',
        town:x.details?.nearestTown||''
      }));
  }

  function modal(){
    const e=document.getElementById('agAuthModal')||Object.assign(document.createElement('div'),{id:'agAuthModal'});
    if(!e.parentNode)document.body.appendChild(e);
    return e;
  }

  async function loadPlayer(currentUser){
    if(!db||!currentUser) return null;
    const {data,error}=await db.from('ag_players')
      .select('id,display_name,company_facility_id,level,xp,chapter')
      .eq('id',currentUser.id)
      .maybeSingle();
    if(error){
      console.warn('Unable to load AG World player profile',error);
      return null;
    }
    return data||null;
  }

  function applyPlayerProfile(player,currentUser){
    const profile={
      id:player?.id||currentUser?.id||null,
      display_name:player?.display_name||currentUser?.user_metadata?.display_name||currentUser?.email||'PLAYER',
      company_facility_id:player?.company_facility_id||currentUser?.user_metadata?.company_facility_id||null,
      level:Number(player?.level||1),
      xp:Number(player?.xp||0),
      chapter:Number(player?.chapter||1)
    };
    window.AGWorldPlayer=profile;
    window.dispatchEvent(new CustomEvent('agworld:player-profile',{detail:profile}));

    // Update existing static/demo profile text in-place without requiring every
    // legacy screen to be rewritten at once.
    const name=profile.display_name;
    document.querySelectorAll('[data-ag-player-name]').forEach(el=>el.textContent=name);
    document.querySelectorAll('[data-ag-player-level]').forEach(el=>el.textContent='LEVEL '+profile.level);
    document.querySelectorAll('[data-ag-player-xp]').forEach(el=>el.textContent=profile.xp+' XP');
    document.querySelectorAll('[data-ag-player-chapter]').forEach(el=>el.textContent='CHAPTER '+profile.chapter);
    return profile;
  }

  async function openGame(currentUser,name){
    user=currentUser;
    const player=await loadPlayer(currentUser);
    const profile=applyPlayerProfile(player,currentUser);
    const displayName=name||profile.display_name;
    window.__AGWORLD_EXPLICIT_AUTH__=true;
    sessionStorage.setItem('gamechanger.authenticated','1');
    sessionStorage.setItem('gamechanger.role','agriculture_sales');
    sessionStorage.setItem('gamechanger.username',displayName);
    document.getElementById('ag-login-gate')?.remove();
    const e=document.getElementById('agAuthModal');if(e)e.classList.remove('show');
    render();
    window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:displayName,role:'agriculture_sales'}}));
    window.dispatchEvent(new CustomEvent('agworld:supabase-authenticated',{detail:{user:currentUser}}));
    sync();
  }

  async function ensurePlayer(currentUser){
    const displayName=currentUser.user_metadata?.display_name||currentUser.email||'AG WORLD USER';
    const facilityId=currentUser.user_metadata?.company_facility_id||'seed-company-facility-lichtenburg';
    const {error}=await db.from('ag_players').upsert({
      id:currentUser.id,
      display_name:displayName,
      company_facility_id:facilityId
    });
    if(error) console.warn('Unable to confirm AG World player profile',error);
  }

  function login(mode='create'){
    if(!db){
      const e=modal();
      e.innerHTML='<div><h2>Join The Company</h2><p>Connecting to the Company account service…</p><small data-msg>Please wait a moment, then try again.</small></div>';
      e.classList.add('show');
      return;
    }

    const e=modal();
    e.innerHTML='<div class="ag-auth-card">'+
      '<button class="ag-auth-close" type="button">×</button>'+
      '<div class="ag-auth-heading"><span>GAME CHANGER · AG WORLD</span><h2>Join the Company</h2><p id="agAuthIntro">Create your employee account and connect yourself to your Company Facility.</p></div>'+
      '<div class="ag-auth-fields">'+
      '<label data-create-only>FULL NAME<input data-name placeholder="Your full name" autocomplete="name"></label>'+
      '<label>EMAIL ADDRESS<input data-email placeholder="name@company.com" type="email" autocomplete="email"></label>'+
      '<label>PASSWORD<input data-pass placeholder="Minimum 6 characters" type="password" autocomplete="new-password"></label>'+
      '<label data-create-only>COMPANY FACILITY<select data-facility><option value="">Loading Company Facilities…</option></select></label>'+
      '</div>'+
      '<button class="ag-auth-primary" data-signup>CREATE ACCOUNT</button>'+
      '<button class="ag-auth-secondary" data-login>ALREADY HAVE AN ACCOUNT? SIGN IN</button>'+
      '<button class="ag-auth-resend" data-resend type="button">RESEND CONFIRMATION EMAIL</button>'+
      '<small data-msg></small>'+
      '</div>';
    e.classList.add('show');
    e.style.zIndex='200000';

    const createOnly=[...e.querySelectorAll('[data-create-only]')];
    const intro=e.querySelector('#agAuthIntro');
    const signup=e.querySelector('[data-signup]');
    const loginBtn=e.querySelector('[data-login]');
    const resend=e.querySelector('[data-resend]');
    const msg=(x)=>e.querySelector('[data-msg]').textContent=x;

    function setMode(next){
      mode=next;
      const creating=mode==='create';
      createOnly.forEach(x=>x.hidden=!creating);
      signup.hidden=!creating;
      resend.hidden=!creating;
      loginBtn.textContent=creating
        ?'ALREADY HAVE AN ACCOUNT? SIGN IN'
        :'BACK TO CREATE ACCOUNT';
      intro.textContent=creating
        ?'Create your employee account and connect yourself to your Company Facility.'
        :'Sign in to your existing AG World employee account.';
      if(!creating) e.querySelector('[data-pass]').setAttribute('autocomplete','current-password');
      else e.querySelector('[data-pass]').setAttribute('autocomplete','new-password');
      msg('');
    }

    e.querySelector('.ag-auth-close').onclick=()=>e.classList.remove('show');
    loginBtn.onclick=()=>setMode(mode==='create'?'signin':'create');
    setMode(mode);

    facilities().then(rows=>{
      const select=e.querySelector('[data-facility]');
      if(!select)return;
      select.innerHTML='<option value="">Select your Company Facility</option>'+
        rows.map(x=>'<option value="'+x.id.replace(/"/g,'&quot;')+'">'+
          x.name+(x.town?' · '+x.town:'')+
        '</option>').join('');
      if(!rows.length) msg('No Company Facilities are currently available.');
    }).catch(err=>{
      console.error(err);
      const select=e.querySelector('[data-facility]');
      if(select)select.innerHTML='<option value="">Unable to load Company Facilities</option>';
      msg('Unable to load the Company Facility list. Please try again.');
    });

    signup.onclick=async()=>{
      const n=e.querySelector('[data-name]').value.trim();
      const email=e.querySelector('[data-email]').value.trim();
      const password=e.querySelector('[data-pass]').value;
      const facilityId=e.querySelector('[data-facility]').value;
      if(!n||!email||!password||!facilityId) return msg('Complete your name, email, password and Company Facility.');
      if(password.length<6) return msg('Password must be at least 6 characters.');

      signup.disabled=true;signup.textContent='CREATING ACCOUNT…';
      msg('Creating your Company account…');
      try{
        const selected=e.querySelector('[data-facility]').selectedOptions[0];
        const facilityName=selected?.textContent||'';
        const {data,error}=await db.auth.signUp({
          email,
          password,
          options:{data:{
            display_name:n,
            company_facility_id:facilityId,
            company_facility_name:facilityName
          }}
        });
        if(error){msg(error.message);return;}
        const created=data?.user;
        if(!created){msg('No account was returned. Please try again.');return;}

        // The database trigger creates the AG World player and binds the facility
        // immediately, even when email confirmation is required.
        if(data.session){
          await ensurePlayer(created);
          await openGame(created,n);
          return;
        }
        msg('Account created and linked to your Company Facility. Check your email to confirm it, then return and sign in.');
      }catch(err){
        console.error(err);
        msg(err?.message||'Unable to create the account. Please try again.');
      }finally{
        signup.disabled=false;signup.textContent='CREATE ACCOUNT';
      }
    };

    resend.onclick=async()=>{
      const email=e.querySelector('[data-email]').value.trim();
      if(!email)return msg('Enter your email address first.');
      resend.disabled=true;resend.textContent='SENDING…';
      msg('Requesting a new confirmation email…');
      try{
        const {error}=await db.auth.resend({type:'signup',email});
        msg(error?error.message:'Confirmation email requested. Check your inbox and spam/junk folder.');
      }catch(err){
        console.error(err);
        msg(err?.message||'Unable to resend the confirmation email.');
      }finally{
        resend.disabled=false;resend.textContent='RESEND CONFIRMATION EMAIL';
      }
    };

    e.querySelector('[data-login]').onclick=async()=>{
      if(mode==='create'){setMode('signin');return;}
      const email=e.querySelector('[data-email]').value.trim();
      const password=e.querySelector('[data-pass]').value;
      if(!email||!password)return msg('Enter your email and password.');
      const button=e.querySelector('[data-login]');
      button.disabled=true;button.textContent='SIGNING IN…';
      msg('Signing in…');
      try{
        const {data,error}=await db.auth.signInWithPassword({email,password});
        if(error){msg(error.message);return;}
        if(!data?.user){msg('Unable to sign in. Please try again.');return;}
        await ensurePlayer(data.user);
        await openGame(data.user);
      }catch(err){
        console.error(err);
        msg(err?.message||'Unable to sign in. Please try again.');
      }finally{
        button.disabled=false;
        button.textContent=mode==='signin'?'ALREADY HAVE AN ACCOUNT? SIGN IN':'BACK TO CREATE ACCOUNT';
      }
    };
  }

  function menu(){
    const e=modal();
    e.innerHTML='<div><h2>'+((user.user_metadata?.display_name)||user.email)+'</h2><p>Connected to the shared AG World.</p><button data-sync>SYNC COMPANY DATA</button><button data-out>SIGN OUT</button></div>';
    e.classList.add('show');
    e.querySelector('[data-sync]').onclick=sync;
    e.querySelector('[data-out]').onclick=async()=>{
      await db.auth.signOut();
      user=null;
      window.__AGWORLD_EXPLICIT_AUTH__=false;
      e.classList.remove('show');
      render();
      location.reload();
    };
  }

  async function sync(){
    if(!user)return;
    const s=window.AGWorldCompany?.getState?.();
    if(!s)return;
    const rows=(s.contributions||[]).filter(x=>!x.synced).map(x=>({
      player_id:user.id,
      contribution_type:x.type,
      mission_id:x.missionId||null,
      territory_id:x.territoryId||null,
      title:x.title||null,
      xp:x.xp||0
    }));
    if(rows.length){
      const{error}=await db.from('ag_contributions').insert(rows);
      if(!error)(s.contributions||[]).forEach(x=>x.synced=true);
    }
    const{data}=await db.from('ag_contributions')
      .select('*,ag_players(display_name)')
      .order('created_at',{ascending:false})
      .limit(100);
    if(data)window.AGWorldSharedContributions=data;
    window.AGWorldControlDashboard?.render?.();
    window.AGWorldCompany?.open?.();
  }

  const st=document.createElement('style');
  st.textContent=`
#agAuthModal .ag-auth-close{position:absolute;right:8px;top:6px;width:auto!important;background:transparent!important;border:0!important;font-size:22px!important;color:#cfe85b!important;padding:4px 9px!important}
#agAuthModal>div{position:relative}
#agAuthModal button:disabled{opacity:.6;cursor:wait}
#agAuthModal small{min-height:32px;line-height:1.4}
#agAuth{position:fixed;right:22px;top:16px;z-index:15000}
#agAuth button{padding:9px 12px;border-radius:7px;border:1px solid rgba(101,216,117,.45);background:#132019;color:#d9f4de;font-size:9px;font-weight:900}
#agAuthModal{position:fixed;inset:0;display:none;z-index:16000;background:rgba(0,0,0,.78);align-items:center;justify-content:center}
#agAuthModal.show{display:flex}
#agAuthModal>div{width:min(420px,92vw);background:linear-gradient(145deg,#10191c,#0a1012);padding:26px;border-radius:15px;color:#edf5ef;border:1px solid rgba(207,224,92,.35);box-shadow:0 24px 80px rgba(0,0,0,.6)}
#agAuthModal .ag-auth-heading span{display:block;color:#cfe85b;font-size:9px;font-weight:900;letter-spacing:1.8px}
#agAuthModal .ag-auth-heading h2{margin:8px 0 6px}
#agAuthModal .ag-auth-heading p{margin:0 0 16px;color:#aab5ad;font-size:12px;line-height:1.45}
#agAuthModal .ag-auth-fields{display:grid;gap:9px}
#agAuthModal label{display:flex;flex-direction:column;gap:5px;color:#b9c5b8;font-size:9px;font-weight:900;letter-spacing:1px}
#agAuthModal input,#agAuthModal select,#agAuthModal button{width:100%;box-sizing:border-box;margin:0;padding:11px;border-radius:7px}
#agAuthModal input,#agAuthModal select{background:#091013;border:1px solid #39443e;color:#fff}
#agAuthModal button{margin-top:9px;background:#1a2a1e;color:#dff6e3;border:1px solid rgba(101,216,117,.4);font-weight:900;letter-spacing:.8px}
#agAuthModal .ag-auth-primary{background:linear-gradient(180deg,#cfe85b,#8cad21);color:#11160b;border:0}
#agAuthModal .ag-auth-secondary{background:rgba(207,232,91,.08);color:#dbe99c;border:1px solid rgba(207,224,92,.45)}
#agAuthModal .ag-auth-resend{background:transparent;color:#aab5ad;border:0;font-size:9px}
#agAuthModal small{display:block;color:#cfd8cf;margin-top:10px;text-align:center}
`;
  document.head.appendChild(st);
  window.AGWorldBackend={
    sync,
    getUser:()=>user,
    getPlayer:()=>window.AGWorldPlayer||null,
    refreshPlayer:async()=>{
      if(!user) return null;
      const player=await loadPlayer(user);
      return applyPlayerProfile(player,user);
    },
    openAccountCreation:()=>login('create')
  };
  init().catch(err=>{console.error('AG World backend failed to initialise',err);render();});
})();