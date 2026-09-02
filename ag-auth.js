/* AG WORLD login-only authentication gate — V1.0 */
(() => {
  const USERNAME = 'Admin';
  const PASSWORD_SHA256 = 'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee';
  const REMEMBER_KEY = 'agworld.rememberedLogin';
  const SESSION_KEY = 'agworld.authenticated';
  const HERO = 'assets/ag-world-login-approved-v1.jpg';

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
      <div class="ag-login-art" aria-hidden="true"></div>
      <form class="ag-login-form" autocomplete="on">
        <label class="ag-field ag-user"><span>Username</span><input id="agUsername" name="username" autocomplete="username" placeholder="USERNAME" value="${remembered?.username === USERNAME ? USERNAME : ''}" required></label>
        <label class="ag-field ag-pass"><span>Password</span><input id="agPassword" name="password" type="password" autocomplete="current-password" placeholder="PASSWORD" value="${remembered?.password || ''}" required></label>
        <label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span>REMEMBER MY LOGIN DETAILS</span></label>
        <button class="ag-login-submit" type="submit" aria-label="Enter AG World"></button>
        <div class="ag-login-error" id="agLoginError" role="alert"></div>
      </form>`;

    const style = document.createElement('style');
    style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#050706;color:#fff;font-family:Arial,sans-serif}
      #ag-login-gate .ag-login-art{position:absolute;inset:0;background-image:url('${HERO}');background-position:center;background-size:cover;background-repeat:no-repeat}
      #ag-login-gate .ag-login-form{position:absolute;left:50%;top:46.8%;width:min(430px,28vw);height:310px;transform:translateX(-50%);margin:0;padding:0;background:transparent;border:0;box-shadow:none}
      #ag-login-gate .ag-field{position:absolute;left:0;width:100%;height:56px;margin:0}
      #ag-login-gate .ag-field span{position:absolute;left:-9999px}
      #ag-login-gate .ag-field input{box-sizing:border-box;width:100%;height:56px;padding:0 52px;background:rgba(0,0,0,.02);border:0;outline:0;color:#eee;font:600 15px Arial,sans-serif;letter-spacing:.4px}
      #ag-login-gate .ag-field input::placeholder{color:rgba(225,225,225,.72)}
      #ag-login-gate .ag-field input:focus{background:rgba(0,0,0,.08)}
      #ag-login-gate .ag-user{top:58px}
      #ag-login-gate .ag-pass{top:126px}
      #ag-login-gate .ag-remember{position:absolute;top:184px;left:14px;display:flex;align-items:center;gap:8px;margin:0;font:700 8px Arial,sans-serif;letter-spacing:1.2px;color:#d7d2c7;text-shadow:0 1px 3px #000;cursor:pointer}
      #ag-login-gate .ag-remember input{width:14px;height:14px;accent-color:#b5c84b;margin:0}
      #ag-login-gate .ag-login-submit{position:absolute;left:0;top:202px;width:100%;height:56px;border:0;background:transparent;cursor:pointer}
      #ag-login-gate .ag-login-submit:focus-visible{outline:2px solid #b8c94e;outline-offset:2px}
      #ag-login-gate .ag-login-error{position:absolute;top:270px;left:0;width:100%;text-align:center;color:#ffad9c;font:700 9px Arial,sans-serif;letter-spacing:1px;text-shadow:0 1px 4px #000;min-height:16px}
      #ag-login-gate.ag-authenticated{display:none}
      @media(max-width:900px){
        #ag-login-gate .ag-login-form{width:min(430px,72vw);top:45%;}
        #ag-login-gate .ag-login-submit{top:202px}
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(gate);

    const form = gate.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const username = gate.querySelector('#agUsername').value.trim();
      const password = gate.querySelector('#agPassword').value;
      const error = gate.querySelector('#agLoginError');
      const hash = await sha256(password);
      if (username !== USERNAME || hash !== PASSWORD_SHA256) {
        error.textContent = 'INVALID USERNAME OR PASSWORD';
        return;
      }
      if (gate.querySelector('#agRemember').checked) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
      else localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.setItem(SESSION_KEY, '1');
      gate.remove();
      window.dispatchEvent(new CustomEvent('agworld:authenticated', { detail: { username } }));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();