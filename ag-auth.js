/* GAME CHANGER role-based authentication gate — V2 */
(() => {
  const USERS = {
    Admin: {
      passwordSha256: '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121',
      role: 'administrator'
    },
    Salesman: {
      passwordSha256: '75b2324a77561a1b03e3be652b212d9aff91834466726080e138cbdc6466dae4',
      role: 'agriculture_sales'
    }
  };
  const REMEMBER_KEY = 'gamechanger.rememberedLogin';
  const SESSION_KEY = 'gamechanger.authenticated';
  const ROLE_KEY = 'gamechanger.role';
  const LOGIN_IMAGE = '/Agworld/assets/ag_world_login_v2.jpg?v=20260903-0646';

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function landingFor(role) {
    const registry = window.GAME_CHANGER_ROLES || {};
    return registry[role]?.landing || (role === 'administrator' ? 'admin.html' : 'index.html');
  }
  function currentPage() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }
  function routeExistingSession(role) {
    if (!role) return false;
    const page = currentPage();
    if (role === 'administrator' && page !== 'admin.html') { location.replace(landingFor(role)); return true; }
    if (role === 'agriculture_sales' && page === 'admin.html') { location.replace(landingFor(role)); return true; }
    return false;
  }
  function getRemembered() {
    try {
      const value = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
      return value && USERS[value.username] && typeof value.password === 'string' ? value : null;
    } catch { return null; }
  }
  function install() {
    if (document.getElementById('ag-login-gate')) return;
    const authenticated = sessionStorage.getItem(SESSION_KEY) === '1';
    const role = sessionStorage.getItem(ROLE_KEY);
    if (authenticated && role) {
      if (routeExistingSession(role)) return;
      document.documentElement.style.visibility = 'visible'; document.body.style.visibility = 'visible';
      window.dispatchEvent(new CustomEvent('gamechanger:authenticated', { detail: { username: sessionStorage.getItem('gamechanger.username') || '', role, restored: true } }));
      return;
    }
    const remembered = getRemembered();
    const gate = document.createElement('div'); gate.id = 'ag-login-gate';
    gate.innerHTML = `<img class="ag-login-art" src="${LOGIN_IMAGE}" alt="" aria-hidden="true"><div class="ag-login-panel" role="dialog" aria-label="Enter GAME CHANGER"><div class="gc-login-brand"><strong>GAME <span>CHANGER</span></strong><small>DOMINATE THE TERRITORY</small><em>Build relationships. Drive sales. <b>WIN THE FUTURE.</b></em></div><form class="ag-login-form" autocomplete="off"><label class="ag-input-wrap"><span>USERNAME</span><input id="agUsername" name="username" type="text" autocomplete="off" aria-label="Username" value="${remembered ? remembered.username : ''}" required></label><label class="ag-input-wrap"><span>PASSWORD</span><div class="ag-password-row"><input id="agPassword" name="password" type="password" autocomplete="new-password" aria-label="Password" value="${remembered ? remembered.password : ''}" required><button type="button" class="ag-eye" aria-label="Show password">◉</button></div></label><label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span></span> REMEMBER ME</label><button class="ag-login-button" type="submit">ENTER GAME CHANGER</button><div class="ag-login-error" id="agLoginError" role="alert"></div></form></div>`;
    const style = document.createElement('style'); style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif}
      #ag-login-gate .ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block;user-select:none}
      #ag-login-gate .ag-login-panel{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(442px,calc(100vw - 36px));padding:21px 31px 21px;border:1px solid rgba(207,224,92,.72);border-radius:15px;background:linear-gradient(145deg,rgba(8,13,11,.94),rgba(10,13,11,.78));box-shadow:0 18px 55px rgba(0,0,0,.6),0 0 26px rgba(180,210,60,.09),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#f4f3eb}
      #ag-login-gate .gc-login-brand{text-align:center;margin:0 0 18px;text-transform:uppercase}
      #ag-login-gate .gc-login-brand strong{display:block;font-size:26px;font-weight:950;letter-spacing:2.5px;line-height:1;color:#f4f3eb;text-shadow:0 2px 8px #000}
      #ag-login-gate .gc-login-brand strong span{color:#cfe85b}
      #ag-login-gate .gc-login-brand small{display:block;margin-top:8px;font-size:8px;font-weight:900;letter-spacing:2.4px;color:#f0f2ea}
      #ag-login-gate .gc-login-brand em{display:block;margin-top:7px;font-size:8px;font-style:normal;color:#c8cdc3;letter-spacing:.25px}
      #ag-login-gate .gc-login-brand em b{color:#cfe85b}
      #ag-login-gate .ag-login-form{margin:0;padding:0;border:0}
      #ag-login-gate .ag-input-wrap{display:block;margin:0 0 13px;color:#bfc2b9;font-size:9px;font-weight:800;letter-spacing:1.3px}
      #ag-login-gate .ag-input-wrap>span{display:block;margin:0 0 5px}
      #ag-login-gate .ag-input-wrap input{width:100%;height:49px;box-sizing:border-box;border:1px solid rgba(190,198,180,.34);border-radius:8px;background:rgba(0,0,0,.38);color:#fff;outline:none;padding:0 13px;font:500 15px Arial,sans-serif;letter-spacing:.4px}
      #ag-login-gate .ag-input-wrap input:focus{border-color:#cfe05c;box-shadow:0 0 0 2px rgba(207,224,92,.11),inset 0 1px 4px rgba(0,0,0,.35)}
      #ag-login-gate .ag-password-row{position:relative}
      #ag-login-gate .ag-password-row input{padding-right:44px}
      #ag-login-gate .ag-eye{position:absolute;right:4px;top:4px;width:36px;height:41px;border:0;background:transparent;color:#cfe05c;cursor:pointer;font-size:17px;opacity:.9}
      #ag-login-gate .ag-remember{display:flex;align-items:center;gap:8px;margin:2px 0 15px;color:#c8cbc2;font-size:9px;font-weight:700;letter-spacing:.6px;cursor:pointer}
      #ag-login-gate .ag-remember input{position:absolute;opacity:0;pointer-events:none}
      #ag-login-gate .ag-remember span{width:16px;height:16px;box-sizing:border-box;border:1px solid rgba(207,224,92,.65);border-radius:3px;background:rgba(0,0,0,.3);display:inline-block}
      #ag-login-gate .ag-remember input:checked+span{background:#cfe05c;box-shadow:inset 0 0 0 3px #151a13}
      #ag-login-gate .ag-login-button{width:100%;height:50px;border:0;border-radius:8px;background:linear-gradient(180deg,#cfe85b,#8cad21);color:#11160b;font:900 13px Arial,sans-serif;letter-spacing:1.35px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.35)}
      #ag-login-gate .ag-login-button:hover{filter:brightness(1.08);transform:translateY(-1px)}
      #ag-login-gate .ag-login-button:active{transform:translateY(0)}
      #ag-login-gate .ag-login-error{min-height:13px;margin-top:7px;text-align:center;color:#f0a08c;font:700 9px Arial,sans-serif;letter-spacing:.3px;text-shadow:0 1px 3px #000}
      @media(max-width:600px){#ag-login-gate .ag-login-panel{top:59%;width:min(420px,calc(100vw - 24px));padding:18px 25px 18px}.ag-input-wrap{margin-bottom:10px!important}.ag-input-wrap input{height:45px!important}.ag-remember{margin-bottom:12px!important}.ag-login-button{height:46px!important}}
    `;
    document.head.appendChild(style); document.body.appendChild(gate);
    document.documentElement.style.visibility = 'visible'; document.body.style.visibility = 'visible';
    const usernameInput = gate.querySelector('#agUsername'); const passwordInput = gate.querySelector('#agPassword'); const rememberInput = gate.querySelector('#agRemember');
    if (!remembered) { usernameInput.value=''; passwordInput.value=''; rememberInput.checked=false; requestAnimationFrame(()=>{usernameInput.value='';passwordInput.value='';}); }
    rememberInput.addEventListener('change',()=>{if(!rememberInput.checked)localStorage.removeItem(REMEMBER_KEY);});
    gate.querySelector('.ag-eye').addEventListener('click',()=>{passwordInput.type=passwordInput.type==='password'?'text':'password';});
    gate.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault(); const username=usernameInput.value.trim(); const password=passwordInput.value; const error=gate.querySelector('#agLoginError'); error.textContent=''; const account=USERS[username]; const hash=await sha256(password);
      if(!account||hash!==account.passwordSha256){error.textContent='INVALID USERNAME OR PASSWORD';return;}
      if(rememberInput.checked)localStorage.setItem(REMEMBER_KEY,JSON.stringify({username,password}));else localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.setItem(SESSION_KEY,'1'); sessionStorage.setItem(ROLE_KEY,account.role); sessionStorage.setItem('gamechanger.username',username);
      const landing=landingFor(account.role); if(landing!==currentPage()){location.replace(landing);return;} gate.remove(); window.dispatchEvent(new CustomEvent('gamechanger:authenticated',{detail:{username,role:account.role}}));
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
