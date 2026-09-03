/* AG WORLD login-only authentication gate — V1.1 */
(() => {
  const USERNAME = 'Admin';
  const PASSWORD_SHA256 = 'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee';
  const REMEMBER_KEY = 'agworld.rememberedLogin';
  const SESSION_KEY = 'agworld.authenticated';
  const LOGIN_IMAGE = '/Agworld/assets/ag_world_login_v2.jpg?v=20260903-0621';

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getRemembered() {
    try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null'); } catch { return null; }
  }

  function install() {
    if (document.getElementById('ag-login-gate')) return;
    const remembered = getRemembered();
    const gate = document.createElement('div');
    gate.id = 'ag-login-gate';
    gate.innerHTML = `
      <img class="ag-login-art" src="${LOGIN_IMAGE}" alt="" aria-hidden="true">
      <div class="ag-login-panel" role="dialog" aria-label="Enter AG World">
        <div class="ag-panel-brand"><span class="ag">AG</span> WORLD</div>
        <div class="ag-panel-line"></div>
        <div class="ag-panel-title">ENTER AG WORLD</div>
        <div class="ag-panel-subtitle">YOUR TERRITORY AWAITS</div>
        <form class="ag-login-form" autocomplete="on">
          <label class="ag-input-wrap">
            <span>USERNAME</span>
            <input id="agUsername" name="username" autocomplete="username" aria-label="Username" value="${remembered?.username === USERNAME ? USERNAME : ''}" required>
          </label>
          <label class="ag-input-wrap">
            <span>PASSWORD</span>
            <div class="ag-password-row">
              <input id="agPassword" name="password" type="password" autocomplete="current-password" aria-label="Password" value="${remembered?.password || ''}" required>
              <button type="button" class="ag-eye" aria-label="Show password">◉</button>
            </div>
          </label>
          <div class="ag-login-options">
            <label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span></span> REMEMBER ME</label>
          </div>
          <button class="ag-login-button" type="submit">ENTER AG WORLD</button>
          <div class="ag-login-error" id="agLoginError" role="alert"></div>
        </form>
      </div>`;

    const style = document.createElement('style');
    style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif}
      #ag-login-gate .ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block;user-select:none}
      #ag-login-gate .ag-login-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(390px,calc(100vw - 40px));max-height:calc(100vh - 40px);padding:30px 34px 28px;border:1px solid rgba(207,224,92,.72);border-radius:18px;background:linear-gradient(145deg,rgba(8,13,11,.93),rgba(10,13,11,.78));box-shadow:0 20px 70px rgba(0,0,0,.62),0 0 30px rgba(180,210,60,.10),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);color:#f4f3eb}
      #ag-login-gate .ag-panel-brand{text-align:center;font-size:34px;font-weight:900;letter-spacing:1px;line-height:1;margin-bottom:12px;text-shadow:0 2px 8px rgba(0,0,0,.7)}
      #ag-login-gate .ag-panel-brand .ag{color:#cfe05c}
      #ag-login-gate .ag-panel-line{height:1px;background:linear-gradient(90deg,transparent,rgba(207,224,92,.85),transparent);margin:0 5% 18px}
      #ag-login-gate .ag-panel-title{text-align:center;font-size:17px;font-weight:800;letter-spacing:2px}
      #ag-login-gate .ag-panel-subtitle{text-align:center;color:#cfe05c;font-size:9px;font-weight:800;letter-spacing:2.4px;margin-top:6px;margin-bottom:23px}
      #ag-login-gate .ag-login-form{margin:0;padding:0;border:0}
      #ag-login-gate .ag-input-wrap{display:block;margin:0 0 15px;color:#bfc2b9;font-size:9px;font-weight:800;letter-spacing:1.5px}
      #ag-login-gate .ag-input-wrap>span{display:block;margin:0 0 7px}
      #ag-login-gate .ag-input-wrap input{width:100%;height:45px;box-sizing:border-box;border:1px solid rgba(190,198,180,.34);border-radius:8px;background:rgba(0,0,0,.35);color:#fff;outline:none;padding:0 13px;font:500 14px Arial,sans-serif;letter-spacing:.5px;box-shadow:inset 0 1px 5px rgba(0,0,0,.35)}
      #ag-login-gate .ag-input-wrap input:focus{border-color:#cfe05c;box-shadow:0 0 0 2px rgba(207,224,92,.12),inset 0 1px 5px rgba(0,0,0,.35)}
      #ag-login-gate .ag-password-row{position:relative}
      #ag-login-gate .ag-password-row input{padding-right:45px}
      #ag-login-gate .ag-eye{position:absolute;right:5px;top:5px;width:35px;height:35px;border:0;background:transparent;color:#cfe05c;cursor:pointer;font-size:17px;opacity:.9}
      #ag-login-gate .ag-login-options{display:flex;justify-content:space-between;align-items:center;margin:2px 0 18px}
      #ag-login-gate .ag-remember{display:flex;align-items:center;gap:8px;color:#c8cbc2;font-size:9px;font-weight:700;letter-spacing:.6px;cursor:pointer}
      #ag-login-gate .ag-remember input{position:absolute;opacity:0;pointer-events:none}
      #ag-login-gate .ag-remember span{width:15px;height:15px;box-sizing:border-box;border:1px solid rgba(207,224,92,.65);border-radius:3px;background:rgba(0,0,0,.3);display:inline-block}
      #ag-login-gate .ag-remember input:checked+span{background:#cfe05c;box-shadow:inset 0 0 0 3px #151a13}
      #ag-login-gate .ag-login-button{width:100%;height:46px;border:0;border-radius:8px;background:linear-gradient(180deg,#cfe85b,#8cad21);color:#11160b;font:900 13px Arial,sans-serif;letter-spacing:1.4px;cursor:pointer;box-shadow:0 7px 22px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35)}
      #ag-login-gate .ag-login-button:hover{filter:brightness(1.08);transform:translateY(-1px)}
      #ag-login-gate .ag-login-button:active{transform:translateY(0)}
      #ag-login-gate .ag-login-error{min-height:15px;margin-top:10px;text-align:center;color:#f0a08c;font:700 10px Arial,sans-serif;letter-spacing:.4px;text-shadow:0 1px 3px #000}
      @media(max-width:600px){#ag-login-gate .ag-login-panel{width:min(370px,calc(100vw - 24px));padding:23px 24px 21px;border-radius:14px}.ag-panel-brand{font-size:29px!important}.ag-panel-title{font-size:15px!important}.ag-panel-subtitle{margin-bottom:17px!important}.ag-input-wrap{margin-bottom:11px!important}.ag-input-wrap input{height:42px!important}.ag-login-button{height:43px!important}}
      @media(max-height:620px) and (orientation:landscape){#ag-login-gate .ag-login-panel{padding:14px 25px 12px;width:min(420px,calc(100vw - 30px));border-radius:12px}.ag-panel-brand{font-size:25px!important;margin-bottom:6px!important}.ag-panel-line{margin-bottom:9px!important}.ag-panel-title{font-size:13px!important}.ag-panel-subtitle{margin-top:3px!important;margin-bottom:10px!important}.ag-input-wrap{margin-bottom:8px!important}.ag-input-wrap>span{margin-bottom:4px!important}.ag-input-wrap input{height:34px!important}.ag-login-options{margin-bottom:9px!important}.ag-login-button{height:36px!important}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(gate);

    gate.querySelector('.ag-eye').addEventListener('click', () => {
      const input = gate.querySelector('#agPassword');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    gate.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const username = gate.querySelector('#agUsername').value.trim();
      const password = gate.querySelector('#agPassword').value;
      const error = gate.querySelector('#agLoginError');
      error.textContent = '';
      const hash = await sha256(password);
      if (username !== USERNAME || hash !== PASSWORD_SHA256) {
        error.textContent = 'INVALID USERNAME OR PASSWORD';
        return;
      }
      if (gate.querySelector('#agRemember').checked) localStorage.setItem(REMEMBER_KEY, JSON.stringify({username,password}));
      else localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.setItem(SESSION_KEY, '1');
      gate.remove();
      window.dispatchEvent(new CustomEvent('agworld:authenticated',{detail:{username}}));
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();