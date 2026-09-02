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
        <label><span>USERNAME</span><input id="agUsername" name="username" autocomplete="username" placeholder="USERNAME" value="${remembered?.username === USERNAME ? USERNAME : ''}" required></label>
        <label><span>PASSWORD</span><input id="agPassword" name="password" type="password" autocomplete="current-password" placeholder="PASSWORD" value="${remembered?.password || ''}" required></label>
        <label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span>REMEMBER MY LOGIN DETAILS</span></label>
        <button class="ag-enter" type="submit">ENTER AG WORLD <b>›</b></button>
        <div class="ag-login-error" id="agLoginError" role="alert"></div>
      </form>`;

    const style = document.createElement('style');
    style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;color:#eee9d8;font-family:Georgia,'Times New Roman',serif}
      #ag-login-gate .ag-login-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(111,108,74,.22),transparent 30%),linear-gradient(180deg,#111719 0%,#252a22 45%,#0b100d 100%);}
      #ag-login-gate .ag-login-bg:after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,transparent 15%,rgba(0,0,0,.18) 55%,rgba(0,0,0,.72) 100%)}
      #ag-login-gate .ag-login-card{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:min(430px,34vw);padding:28px 30px 26px;background:linear-gradient(160deg,rgba(11,14,13,.96),rgba(22,25,20,.91));border:1px solid rgba(214,202,150,.46);box-shadow:0 25px 90px rgba(0,0,0,.6),inset 0 1px rgba(255,255,255,.1)}
      #ag-login-gate .ag-login-title{text-align:center;color:#cddc55;font:900 clamp(19px,2vw,29px) Arial,sans-serif;letter-spacing:2px}
      #ag-login-gate .ag-login-caption{text-align:center;margin:6px 0 22px;font:700 10px Arial,sans-serif;letter-spacing:4px;color:#eee9d8}
      #ag-login-gate .ag-login-card label:not(.ag-remember){display:block;margin:0 0 12px}.ag-login-card label:not(.ag-remember) span{display:block;margin:0 0 5px;font:700 8px Arial,sans-serif;letter-spacing:2px;color:#a9a58d}
      #ag-login-gate .ag-login-card input[type=text],#ag-login-gate .ag-login-card input[type=password]{width:100%;box-sizing:border-box;padding:13px 14px;background:rgba(0,0,0,.47);color:#f4f1e6;border:1px solid rgba(223,213,172,.3);outline:0;font:600 14px Arial,sans-serif}
      #ag-login-gate .ag-login-card input:focus{border-color:#cbd659;box-shadow:0 0 0 1px rgba(203,214,89,.16)}
      #ag-login-gate .ag-remember{display:flex;align-items:center;gap:9px;margin:5px 0 16px;font:700 8px Arial,sans-serif;letter-spacing:1.4px;color:#bcb9ab;cursor:pointer}.ag-remember input{accent-color:#cbd659;width:14px;height:14px}
      #ag-login-gate .ag-enter{width:100%;height:52px;border:1px solid #9eae36;background:linear-gradient(180deg,#9cae40,#66762a);color:#fff;font:900 13px Arial,sans-serif;letter-spacing:2px;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.25),0 7px 18px rgba(0,0,0,.32)}
      #ag-login-gate .ag-enter:hover{filter:brightness(1.08)}.ag-enter b{float:right;font-size:25px;line-height:12px;font-weight:400}
      #ag-login-gate .ag-login-error{min-height:18px;margin-top:10px;text-align:center;color:#df8b77;font:700 9px Arial,sans-serif}
      @media(max-width:900px){#ag-login-gate .ag-login-card{width:min(430px,88vw);top:59%}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(gate);

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