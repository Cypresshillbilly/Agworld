/* AG WORLD login-only authentication gate — V1.4 */
(() => {
  const USERNAME = 'Admin';
  const PASSWORD_SHA256 = 'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee';
  const REMEMBER_KEY = 'agworld.rememberedLogin';
  const SESSION_KEY = 'agworld.authenticated';
  const LOGIN_IMAGE = '/Agworld/assets/ag_world_login_v2.jpg?v=20260903-0634';

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function getRemembered() { try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null'); } catch { return null; } }
  function install() {
    if (document.getElementById('ag-login-gate')) return;
    const remembered = getRemembered();
    const gate = document.createElement('div'); gate.id = 'ag-login-gate';
    gate.innerHTML = `<img class="ag-login-art" src="${LOGIN_IMAGE}" alt="" aria-hidden="true"><div class="ag-login-panel" role="dialog" aria-label="Enter AG World"><form class="ag-login-form" autocomplete="on"><label class="ag-input-wrap"><span>USERNAME</span><input id="agUsername" name="username" autocomplete="username" aria-label="Username" value="${remembered?.username === USERNAME ? USERNAME : ''}" required></label><label class="ag-input-wrap"><span>PASSWORD</span><div class="ag-password-row"><input id="agPassword" name="password" type="password" autocomplete="current-password" aria-label="Password" value="${remembered?.password || ''}" required><button type="button" class="ag-eye" aria-label="Show password">◉</button></div></label><label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span></span> REMEMBER ME</label><button class="ag-login-button" type="submit">ENTER AG WORLD</button><div class="ag-login-error" id="agLoginError" role="alert"></div></form></div>`;
    const style = document.createElement('style'); style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif}
      #ag-login-gate .ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block;user-select:none}
      #ag-login-gate .ag-login-panel{position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(442px,calc(100vw - 36px));padding:24px 31px 21px;border:1px solid rgba(207,224,92,.72);border-radius:15px;background:linear-gradient(145deg,rgba(8,13,11,.92),rgba(10,13,11,.76));box-shadow:0 18px 55px rgba(0,0,0,.6),0 0 26px rgba(180,210,60,.09),inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#f4f3eb}
      #ag-login-gate .ag-login-form{margin:0;padding:0;border:0}
      #ag-login-gate .ag-input-wrap{display:block;margin:0 0 13px;color:#bfc2b9;font-size:9px;font-weight:800;letter-spacing:1.3px}
      #ag-login-gate .ag-input-wrap>span{display:block;margin:0 0 5px}
      #ag-login-gate .ag-input-wrap input{width:100%;height:49px;box-sizing:border-box;border:1px solid rgba(190,198,180,.34);border-radius:8px;background:rgba(0,0,0,.38);color:#fff;outline:none;padding:0 13px;font:500 15px Arial,sans-serif;letter-spacing:.4px;box-shadow:inset 0 1px 4px rgba(0,0,0,.35)}
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
      @media(max-width:600px){#ag-login-gate .ag-login-panel{top:56%;width:min(420px,calc(100vw - 24px));padding:20px 25px 18px}.ag-input-wrap{margin-bottom:10px!important}.ag-input-wrap input{height:45px!important}.ag-remember{margin-bottom:12px!important}.ag-login-button{height:46px!important}}
      @media(max-height:650px) and (orientation:landscape){#ag-login-gate .ag-login-panel{top:56%;width:min(430px,calc(100vw - 30px));padding:14px 24px 12px}.ag-input-wrap{margin-bottom:7px!important}.ag-input-wrap>span{margin-bottom:3px!important}.ag-input-wrap input{height:34px!important}.ag-eye{height:27px!important}.ag-remember{margin-bottom:8px!important}.ag-login-button{height:36px!important}.ag-login-error{min-height:8px!important;margin-top:3px!important}}
    `;
    document.head.appendChild(style); document.body.appendChild(gate);
    gate.querySelector('.ag-eye').addEventListener('click',()=>{const input=gate.querySelector('#agPassword');input.type=input.type==='password'?'text':'password';});
    gate.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const username=gate.querySelector('#agUsername').value.trim();const password=gate.querySelector('#agPassword').value;const error=gate.querySelector('#agLoginError');error.textContent='';const hash=await sha256(password);if(username!==USERNAME||hash!==PASSWORD_SHA256){error.textContent='INVALID USERNAME OR PASSWORD';return;}if(gate.querySelector('#agRemember').checked)localStorage.setItem(REMEMBER_KEY,JSON.stringify({username,password}));else localStorage.removeItem(REMEMBER_KEY);sessionStorage.setItem(SESSION_KEY,'1');gate.remove();window.dispatchEvent(new CustomEvent('agworld:authenticated',{detail:{username}}));});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();