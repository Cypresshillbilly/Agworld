/* GAME CHANGER role-based authentication gate — V2 */
(() => {
  const USERS = {
    Admin: { passwordSha256: '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', role: 'administrator' },
    Salesman: { passwordSha256: '75b2324a77561a1b03e3be652b212d9aff91834466726080e138cbdc6466dae4', role: 'agriculture_sales' }
  };
  const REMEMBER_KEY = 'gamechanger.rememberedLogin';
  const SESSION_KEY = 'gamechanger.authenticated';
  const ROLE_KEY = 'gamechanger.role';
  const LOGIN_IMAGE = '/Agworld/assets/ag_world_login_v2.jpg?v=20260903-0646';
  async function sha256(text){const data=new TextEncoder().encode(text);const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
  function landingFor(role){const registry=window.GAME_CHANGER_ROLES||{};return registry[role]?.landing||(role==='administrator'?'admin.html':'index.html');}
  function currentPage(){return(location.pathname.split('/').pop()||'index.html').toLowerCase();}
  function routeExistingSession(role){if(!role)return false;const page=currentPage();if(role==='administrator'&&page!=='admin.html'){location.replace(landingFor(role));return true;}if(role==='agriculture_sales'&&page==='admin.html'){location.replace(landingFor(role));return true;}return false;}
  function getRemembered(){try{const value=JSON.parse(localStorage.getItem(REMEMBER_KEY)||'null');return value&&USERS[value.username]&&typeof value.password==='string'?value:null;}catch{return null;}}
  function install(){
    if(document.getElementById('ag-login-gate'))return;
    const authenticated=sessionStorage.getItem(SESSION_KEY)==='1';const role=sessionStorage.getItem(ROLE_KEY);
    if(authenticated&&role){if(routeExistingSession(role))return;document.documentElement.style.visibility='visible';document.body.style.visibility='visible';window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username:sessionStorage.getItem('gamechanger.username')||'',role,restored:true}}));return;}
    const remembered=getRemembered();const gate=document.createElement('div');gate.id='ag-login-gate';
    gate.innerHTML=`<img class="ag-login-art" src="${LOGIN_IMAGE}" alt="" aria-hidden="true"><div class="ag-login-panel" role="dialog" aria-label="Enter GAME CHANGER"><div class="gc-login-brand"><strong>GAME <span>CHANGER</span></strong><small>DOMINATE THE TERRITORY</small><em>Build relationships. Drive sales. <b>WIN THE FUTURE.</b></em></div><form class="ag-login-form" autocomplete="off"><label class="ag-input-wrap"><span>USERNAME</span><input id="agUsername" name="username" type="text" autocomplete="off" aria-label="Username" value="${remembered?remembered.username:''}" required></label><label class="ag-input-wrap"><span>PASSWORD</span><div class="ag-password-row"><input id="agPassword" name="password" type="password" autocomplete="new-password" aria-label="Password" value="${remembered?remembered.password:''}" required><button type="button" class="ag-eye" aria-label="Show password">◉</button></div></label><label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered?'checked':''}><span></span> REMEMBER ME</label><button class="ag-login-button" type="submit">ENTER GAME CHANGER</button><div class="ag-login-error" id="agLoginError" role="alert"></div></form></div>`;
    const style=document.createElement('style');style.id='ag-login-style';style.textContent=`#ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif}#ag-login-gate .ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block;user-select:none}#ag-login-gate .ag-login-panel{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(442px,calc(100vw - 36px));padding:21px 31px;border:1px solid rgba(207,224,92,.72);border-radius:15px;background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78));box-shadow:0 18px 55px rgba(0,0,0,.6),0 0 26px rgba(180,210,60,.09),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(6px);color:#f4f3eb}#ag-login-gate .gc-login-brand{text-align:center;margin:0 0 18px;text-transform:uppercase}#ag-login-gate .gc-login-brand strong{display:block;font-size:26px;font-weight:950;letter-spacing:2.5px;line-height:1;color:#f4f3eb;text-shadow:0 2px 8px #000}#ag-login-gate .gc-login-brand strong span{color:#cfe85b}#ag-login-gate .gc-login-brand small{display:block;margin-top:8px;font-size:8px;font-weight:900;letter-spacing:2.4px;color:#f0f2ea}#ag-login-gate .gc-login-brand em{display:block;margin-top:7px;font-size:8px;font-style:normal;color:#c8cdc3}#ag-login-gate .gc-login-brand em b{color:#cfe85b}#ag-login-gate .ag-login-form{margin:0;padding:0;border:0}#ag-login-gate .ag-input-wrap{display:block;margin:0 0 13px;color:#bfc2b9;font-size:9px;font-weight:800;letter-spacing:1.3px}#ag-login-gate .ag-input-wrap>span{display:block;margin:0 0 5px}#ag-login-gate .ag-input-wrap input{width:100%;height:49px;box-sizing:border-box;border:1px solid rgba(190,198,180,.34);border-radius:8px;background:rgba(0,0,0,.38);color:#fff;outline:none;padding:0 13px;font:500 15px Arial,sans-serif}.ag-password-row{position:relative}.ag-password-row input{padding-right:44px!important}.ag-eye{position:absolute;right:4px;top:4px;width:36px;height:41px;border:0;background:transparent;color:#cfe05c;cursor:pointer;font-size:17px}.ag-remember{display:flex;align-items:center;gap:8px;margin:2px 0 15px;color:#c8cbc2;font-size:9px;font-weight:700;cursor:pointer}.ag-remember input{position:absolute;opacity:0}.ag-remember span{width:16px;height:16px;border:1px solid rgba(207,224,92,.65);border-radius:3px;background:rgba(0,0,0,.3);display:inline-block}.ag-remember input:checked+span{background:#cfe05c;box-shadow:inset 0 0 0 3px #151a13}.ag-login-button{width:100%;height:50px;border:0;border-radius:8px;background:linear-gradient(180deg,#cfe85b,#8cad21);color:#11160b;font:900 13px Arial,sans-serif;letter-spacing:1.35px;cursor:pointer}.ag-login-error{min-height:13px;margin-top:7px;text-align:center;color:#f0a08c;font:700 9px Arial,sans-serif}`;document.head.appendChild(style);document.body.appendChild(gate);document.documentElement.style.visibility='visible';document.body.style.visibility='visible';
    const usernameInput=gate.querySelector('#agUsername'),passwordInput=gate.querySelector('#agPassword'),rememberInput=gate.querySelector('#agRemember');
    if(!remembered){usernameInput.value='';passwordInput.value='';rememberInput.checked=false;requestAnimationFrame(()=>{usernameInput.value='';passwordInput.value='';});}
    rememberInput.addEventListener('change',()=>{if(!rememberInput.checked)localStorage.removeItem(REMEMBER_KEY);});gate.querySelector('.ag-eye').addEventListener('click',()=>{passwordInput.type=passwordInput.type==='password'?'text':'password';});
    gate.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const username=usernameInput.value.trim(),password=passwordInput.value,error=gate.querySelector('#agLoginError');error.textContent='';const account=USERS[username],hash=await sha256(password);if(!account||hash!==account.passwordSha256){error.textContent='INVALID USERNAME OR PASSWORD';return;}if(rememberInput.checked)localStorage.setItem(REMEMBER_KEY,JSON.stringify({username,password}));else localStorage.removeItem(REMEMBER_KEY);sessionStorage.setItem(SESSION_KEY,'1');sessionStorage.setItem(ROLE_KEY,account.role);sessionStorage.setItem('gamechanger.username',username);const landing=landingFor(account.role);if(landing!==currentPage()){location.replace(landing);return;}gate.remove();window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username,role:account.role}}));});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

/* Administrator UI enhancements: white workspace + working logout + official GAME CHANGER logo assets. */
(() => {
  if((location.pathname.split('/').pop()||'index.html').toLowerCase()!=='admin.html')return;
  const style=document.createElement('style');style.id='gc-admin-light-theme';style.textContent=`
    html,body{background:#fff!important;color:#20261f!important}
    .admin-shell{background:#fff!important}
    .admin-main{background:#fff!important;color:#20261f!important}
    .admin-main .topbar{border-bottom-color:#dfe4dc!important}
    .admin-main .topbar h1,.admin-main .panel h2,.admin-main .territory h2{color:#20261f!important}
    .admin-main .topbar p,.admin-main .panel-head span,.admin-main .metric span,.admin-main .territory-stat span,.admin-main .territory-head p,.admin-main .territory-stat em,.admin-main .admin-action span,.admin-main .u-info small{color:#6f786f!important}
    .admin-main .metric,.admin-main .panel,.admin-main .territory{background:#fff!important;border-color:#dfe4dc!important;box-shadow:0 7px 24px rgba(31,43,30,.08)!important}
    .admin-main .metric b,.admin-main .territory-stat b{color:#20261f!important}
    .admin-main .buildbar{background:#fff!important;border-color:#dfe4dc!important;color:#20261f!important}
    .admin-main .buildbar span{color:#6f786f!important}
    .admin-main .build-switch button{background:#fff!important;color:#3f493f!important;border-color:#ccd5c8!important}
    .admin-main .build-switch button.active{background:#eef6df!important;color:#4d681b!important;border-color:#a8d51f!important}
    .admin-main .territory-stat,.admin-main .user-row,.admin-main .admin-action{background:#fafbfa!important;border-color:#e4e8e2!important}
    .admin-main .progress{background:#e7ebe5!important}
    .admin-main .notice{background:#f3f8ea!important;color:#536052!important}
    .mission-modal{background:#fff!important;border-color:#d8e2d0!important;color:#20261f!important;box-shadow:0 30px 90px rgba(0,0,0,.25)!important}
    .mission-head{border-bottom-color:#e0e5df!important}.mission-head h2{color:#20261f!important}.mission-head small{color:#66851e!important}.close{color:#566056!important}
    .mission-body{background:#fff!important}.field label{color:#687168!important}.field input,.field select,.field textarea,.step input{background:#fff!important;color:#20261f!important;border-color:#d6ddd4!important}
    .workflow{border-top-color:#e0e5df!important}.step{background:#fafbfa!important;border-color:#e2e7e1!important}.step-num{background:#edf4e4!important;color:#5d761f!important}.remove-step{color:#687168!important}.mission-footer{border-top-color:#e0e5df!important}.btn.cancel{border-color:#d2d9d0!important;color:#4d564d!important}
    /* Use the actual uploaded GAME CHANGER artwork instead of text approximations. */
    .admin-side .gc-mark{box-sizing:border-box;width:100%;height:86px;margin:0 0 2px;background:url('assets/branding/game-changer/primary/game_changer_primary_white.svg') center left/contain no-repeat!important;font-size:0!important;line-height:0!important;color:transparent!important;letter-spacing:0!important}
    .admin-side .gc-mark span,.admin-side .gc-mark small{display:none!important}
    .admin-main .eyebrow{box-sizing:border-box;width:205px;height:44px;margin:0 0 5px;background:url('assets/branding/game-changer/horizontal/game_changer_horizontal_dark.svg') left center/contain no-repeat!important;font-size:0!important;line-height:0!important;color:transparent!important;letter-spacing:0!important}
    #gc-logout{margin-top:10px!important;border-top:1px solid rgba(190,214,139,.18)!important;color:#d8a8a8!important}
  `;document.head.appendChild(style);
  const nav=document.querySelector('.admin-nav');
  if(nav&&!document.getElementById('gc-logout')){const b=document.createElement('button');b.id='gc-logout';b.textContent='↪ LOG OUT';b.type='button';b.addEventListener('click',()=>{sessionStorage.removeItem('gamechanger.authenticated');sessionStorage.removeItem('gamechanger.role');sessionStorage.removeItem('gamechanger.username');location.replace('index.html');});nav.appendChild(b);}
})();
