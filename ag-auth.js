/* GAME CHANGER authentication — Master and Ag World sessions are separate. */
(() => {
  const USERS = {
    Admin: { passwordSha256: '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', role: 'administrator' },
    Salesman: { passwordSha256: '75b2324a77561a1b03e3be652b212d9aff91834466726080e138cbdc6466dae4', role: 'agriculture_sales' }
  };
  const page = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const master = page()==='master-admin.html';
  const SESSION = master ? 'gamechanger.master.authenticated' : 'gamechanger.authenticated';
  const ROLE = master ? 'gamechanger.master.role' : 'gamechanger.role';
  const USER = master ? 'gamechanger.master.username' : 'gamechanger.username';

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
      '<div class="ag-login-panel"><div class="gc-login-brand"><strong>GAME <span>CHANGER</span></strong><small>'+title+'</small><em>'+line+'</em></div>'+
      '<form class="ag-login-form" autocomplete="off" data-lpignore="true" data-1p-ignore="true">'+
      '<input type="text" name="ag-world-decoy-user" autocomplete="username" tabindex="-1" aria-hidden="true" style="position:absolute;left:-10000px;opacity:0">'+
      '<input type="password" name="ag-world-decoy-pass" autocomplete="current-password" tabindex="-1" aria-hidden="true" style="position:absolute;left:-10000px;opacity:0">'+
      '<label class="ag-input-wrap"><span>USERNAME</span><input id="agUsername" name="ag-world-user" type="text" autocomplete="one-time-code" required value="" readonly data-lpignore="true" data-1p-ignore="true"></label>'+
      '<label class="ag-input-wrap"><span>PASSWORD</span><div class="ag-password-row"><input id="agPassword" name="ag-world-pass" type="password" autocomplete="new-password" required value="" readonly data-lpignore="true" data-1p-ignore="true"><button type="button" class="ag-eye">◉</button></div></label>'+
      '<label class="ag-remember"><input id="agRemember" type="checkbox"><span></span> REMEMBER ME</label>'+
      '<button class="ag-login-button" type="submit">ENTER GAME CHANGER</button><div class="ag-login-error"></div></form></div>';

    const style=document.createElement('style');
    style.textContent='#ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif;color:#f4f3eb}#ag-login-gate.gc-master-login{background:radial-gradient(circle at 78% 12%,rgba(123,161,29,.16),transparent 32%),linear-gradient(145deg,#070b08,#111812)}.ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.ag-login-panel{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:min(442px,calc(100vw - 36px));box-sizing:border-box;padding:21px 31px;border:1px solid rgba(207,224,92,.72);border-radius:15px;background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78));box-shadow:0 18px 55px rgba(0,0,0,.6);backdrop-filter:blur(6px)}.gc-master-login .ag-login-panel{top:50%;background:linear-gradient(145deg,rgba(15,23,17,.97),rgba(8,13,10,.95))}.gc-login-brand{text-align:center;margin-bottom:18px;text-transform:uppercase}.gc-login-brand strong{display:block;font-size:26px;font-weight:950;letter-spacing:2.5px}.gc-login-brand strong span{color:#cfe85b}.gc-login-brand small{display:block;margin-top:8px;font-size:8px;font-weight:900;letter-spacing:2.4px}.gc-login-brand em{display:block;margin-top:7px;font-size:8px;font-style:normal;color:#c8cdc3}.ag-input-wrap{display:block;margin-bottom:13px;font-size:9px;font-weight:800;letter-spacing:1.3px;color:#bfc2b9}.ag-input-wrap>span{display:block;margin-bottom:5px}.ag-input-wrap input{width:100%;height:49px;box-sizing:border-box;border:1px solid rgba(190,198,180,.34);border-radius:8px;background:rgba(0,0,0,.38);color:#fff;padding:0 13px}.ag-password-row{position:relative}.ag-password-row input{padding-right:44px}.ag-eye{position:absolute;right:4px;top:4px;width:36px;height:41px;border:0;background:transparent;color:#cfe05c;cursor:pointer}.ag-remember{display:flex;align-items:center;gap:8px;margin:2px 0 15px;font-size:9px;font-weight:700}.ag-remember input{position:absolute;opacity:0}.ag-remember span{width:16px;height:16px;border:1px solid rgba(207,224,92,.65);border-radius:3px}.ag-remember input:checked+span{background:#cfe05c;box-shadow:inset 0 0 0 3px #151a13}.ag-login-button{width:100%;height:50px;border:0;border-radius:8px;background:linear-gradient(180deg,#cfe85b,#8cad21);color:#11160b;font-weight:900;letter-spacing:1.35px;cursor:pointer}.ag-login-error{min-height:13px;margin-top:7px;text-align:center;color:#f0a08c;font-size:9px;font-weight:700}';
    document.head.appendChild(style); document.body.appendChild(gate); reveal();

    const username=gate.querySelector('#agUsername');
    const password=gate.querySelector('#agPassword');
    const remember=gate.querySelector('#agRemember');
    // The Ag World gate must never inherit Master Admin credentials from browser autofill.
    // Keep the real fields readonly until the user actively interacts with them.
    const hardClear=()=>{
      username.value='';
      password.value='';
      username.setAttribute('value','');
      password.setAttribute('value','');
      remember.checked=false;
    };
    hardClear();
    requestAnimationFrame(hardClear);
    setTimeout(hardClear,0);
    setTimeout(hardClear,100);
    setTimeout(hardClear,500);
    const unlock=(field)=>{
      hardClear();
      field.removeAttribute('readonly');
    };
    username.addEventListener('pointerdown',()=>unlock(username),{once:true});
    password.addEventListener('pointerdown',()=>unlock(password),{once:true});
    username.addEventListener('keydown',()=>unlock(username),{once:true});
    password.addEventListener('keydown',()=>unlock(password),{once:true});
    // If a password manager injects values after the page is shown, clear them while locked.
    const autofillGuard=setInterval(()=>{
      if(username.hasAttribute('readonly') || password.hasAttribute('readonly')) hardClear();
      else clearInterval(autofillGuard);
    },50);

    gate.querySelector('.ag-eye').onclick=()=>password.type=password.type==='password'?'text':'password';
    gate.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault();
      const account=USERS[username.value.trim()];
      const error=gate.querySelector('.ag-login-error');
      error.textContent='';
      if(!account || await sha256(password.value)!==account.passwordSha256){error.textContent='INVALID USERNAME OR PASSWORD';return;}
      sessionStorage.setItem(SESSION,'1'); sessionStorage.setItem(ROLE,account.role); sessionStorage.setItem(USER,username.value.trim());
      if(!master && account.role==='agriculture_sales' && window.GAME_CHANGER_BUILD?.set) window.GAME_CHANGER_BUILD.set('agriculture');
      const dest=landing(account.role);
      if(dest!==page()){location.replace(dest);return;}
      gate.remove(); window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:username.value.trim(),role:account.role}}));
    });
  }

  function install(){
    const ok=sessionStorage.getItem(SESSION)==='1';
    const role=sessionStorage.getItem(ROLE);
    if(ok&&role){
      if(master){reveal();return;}
      if(role==='agriculture_sales' && page()==='index.html'){reveal();return;}
      if(role==='agriculture_administrator' && page()==='admin.html'){reveal();return;}
      sessionStorage.removeItem(SESSION);sessionStorage.removeItem(ROLE);sessionStorage.removeItem(USER);
    }
    showGate();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();