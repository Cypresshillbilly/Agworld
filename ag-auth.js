/* AG WORLD login-only authentication gate — V1.0 */
(() => {
  const USERNAME = 'Admin';
  const PASSWORD_SHA256 = 'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee';
  const REMEMBER_KEY = 'agworld.rememberedLogin';
  const SESSION_KEY = 'agworld.authenticated';

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
      <div class="ag-login-bg" aria-hidden="true"></div>
      <form class="ag-login-card" autocomplete="on">
        <div class="ag-login-title">ENTER AG WORLD</div>
        <div class="ag-login-caption">YOUR TERRITORY AWAITS</div>
        <label><span class="sr-only">Username</span><input id="agUsername" name="username" autocomplete="username" placeholder="USERNAME" value="${remembered?.username === USERNAME ? USERNAME : ''}" required></label>
        <label><span class="sr-only">Password</span><div class="ag-password-wrap"><input id="agPassword" name="password" type="password" autocomplete="current-password" placeholder="PASSWORD" value="${remembered?.password || ''}" required><button type="button" class="ag-show-password" aria-label="Show password">◉</button></div></label>
        <label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span>REMEMBER MY LOGIN DETAILS</span></label>
        <button class="ag-enter" type="submit">ENTER AG WORLD <b>›</b></button>
        <div class="ag-login-error" id="agLoginError" role="alert"></div>
      </form>`;

    const style = document.createElement('style');
    style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;color:#eee9d8;font-family:Arial,Helvetica,sans-serif}
      #ag-login-gate .ag-login-bg{position:absolute;inset:0;background-image:url('assets/ag_world_login_v1.jpg');background-position:center center;background-size:cover;background-repeat:no-repeat}
      #ag-login-gate .ag-login-bg:after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 43%,rgba(0,0,0,0) 12%,rgba(0,0,0,.08) 48%,rgba(0,0,0,.48) 100%),linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.22));pointer-events:none}
      #ag-login-gate .ag-login-card{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);width:min(430px,31vw);padding:0;background:rgba(8,10,9,.76);border:1px solid rgba(216,211,196,.55);border-radius:10px;box-shadow:0 18px 60px rgba(0,0,0,.52),inset 0 1px rgba(255,255,255,.08);overflow:hidden;backdrop-filter:blur(3px)}
      #ag-login-gate .ag-login-card:before{content:'';display:block;height:1px;background:linear-gradient(90deg,transparent,rgba(226,226,214,.75),transparent)}
      #ag-login-gate .ag-login-title{padding-top:28px;text-align:center;color:#cfe05c;font:800 29px Arial,sans-serif;letter-spacing:2.3px;text-transform:uppercase}
      #ag-login-gate .ag-login-caption{text-align:center;margin:7px 0 24px;font:500 13px Arial,sans-serif;letter-spacing:4px;color:#f0eee8}
      #ag-login-gate .ag-login-card>label{display:block;margin:0 26px 13px}
      #ag-login-gate .ag-login-card input[type=text],#ag-login-gate .ag-login-card input[type=password]{width:100%;height:54px;box-sizing:border-box;padding:0 16px;background:rgba(2,3,3,.63);color:#f7f4ec;border:1px solid rgba(215,211,199,.55);border-radius:8px;outline:0;font:500 16px Arial,sans-serif;letter-spacing:.4px;box-shadow:inset 0 1px 9px rgba(0,0,0,.18)}
      #ag-login-gate .ag-password-wrap{position:relative}.ag-password-wrap input{padding-right:52px!important}.ag-show-password{position:absolute;right:9px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;background:transparent;color:#ededeb;font-size:18px;opacity:.9;cursor:pointer}
      #ag-login-gate .ag-login-card input:focus{border-color:#d4df6d;box-shadow:0 0 0 1px rgba(212,223,109,.22),inset 0 1px 9px rgba(0,0,0,.18)}
      #ag-login-gate .ag-remember{display:flex;align-items:center;gap:10px;margin:4px 27px 18px!important;font:500 12px Arial,sans-serif;letter-spacing:1.1px;color:#e2dfd7;cursor:pointer}.ag-remember input{accent-color:#cfdc5b;width:16px;height:16px;margin:0}
      #ag-login-gate .ag-enter{width:calc(100% - 52px);margin:0 26px 26px;height:56px;border:1px solid #a7b93d;border-radius:8px;background:linear-gradient(180deg,#a6b943,#77852d);color:#fff;font:800 15px Arial,sans-serif;letter-spacing:2px;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.28),0 7px 18px rgba(0,0,0,.3)}
      #ag-login-gate .ag-enter:hover{filter:brightness(1.06)}.ag-enter b{float:right;font-size:27px;line-height:12px;font-weight:400}
      #ag-login-gate .ag-login-error{min-height:18px;margin:-12px 26px 14px;text-align:center;color:#e39a86;font:700 10px Arial,sans-serif}
      #ag-login-gate .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      @media(max-width:900px){#ag-login-gate .ag-login-card{width:min(430px,88vw);top:60%}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(gate);

    gate.querySelector('.ag-show-password').addEventListener('click', () => {
      const input = gate.querySelector('#agPassword');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    gate.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const username = gate.querySelector('#agUsername').value.trim();
      const password = gate.querySelector('#agPassword').value;
      const error = gate.querySelector('#agLoginError');
      const hash = await sha256(password);
      if (username !== USERNAME || hash !== PASSWORD_SHA256) { error.textContent = 'INVALID USERNAME OR PASSWORD'; return; }
      if (gate.querySelector('#agRemember').checked) localStorage.setItem(REMEMBER_KEY, JSON.stringify({username,password})); else localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.setItem(SESSION_KEY, '1');
      gate.remove();
      window.dispatchEvent(new CustomEvent('agworld:authenticated',{detail:{username}}));
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();