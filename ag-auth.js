/* AG WORLD login-only authentication gate — V1.0 */
(() => {
  const USERNAME = 'Admin';
  const PASSWORD_SHA256 = 'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee';
  const REMEMBER_KEY = 'agworld.rememberedLogin';
  const SESSION_KEY = 'agworld.authenticated';
  // V2 is the corrected 16:9 login artwork. Cache-buster forces GitHub Pages to fetch it again.
  const LOGIN_IMAGE = '/Agworld/assets/ag_world_login_v2.jpg?v=20260903-0614';

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
      <form class="ag-login-form" autocomplete="on">
        <label class="ag-field ag-user-field"><span class="sr-only">Username</span><input id="agUsername" name="username" autocomplete="username" aria-label="Username" value="${remembered?.username === USERNAME ? USERNAME : ''}" required></label>
        <label class="ag-field ag-pass-field"><span class="sr-only">Password</span><input id="agPassword" name="password" type="password" autocomplete="current-password" aria-label="Password" value="${remembered?.password || ''}" required></label>
        <button type="button" class="ag-eye-hotspot" aria-label="Show password"></button>
        <label class="ag-remember-hotspot"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span class="remember-hitbox"></span></label>
        <button class="ag-enter-hotspot" type="submit" aria-label="Enter AG World"></button>
        <div class="ag-login-error" id="agLoginError" role="alert"></div>
      </form>`;

    const style = document.createElement('style');
    style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;font-family:Arial,Helvetica,sans-serif}
      #ag-login-gate .ag-login-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block;user-select:none}
      #ag-login-gate .ag-login-form{position:absolute;left:50%;top:48.2%;width:min(29.85vw,382px);height:min(14.8vw,190px);transform:translateX(-50%);margin:0;padding:0;background:transparent;border:0}
      #ag-login-gate .ag-field{position:absolute;left:0;width:100%;height:22%;margin:0;display:block}
      #ag-login-gate .ag-user-field{top:1%}
      #ag-login-gate .ag-pass-field{top:28%}
      #ag-login-gate .ag-field input{width:100%;height:100%;box-sizing:border-box;background:transparent;border:0;outline:0;color:#f6f4eb;font:500 15px Arial,sans-serif;letter-spacing:.6px;padding:0 48px 0 48px;text-shadow:0 1px 2px rgba(0,0,0,.65)}
      #ag-login-gate .ag-field input::selection{background:rgba(207,224,92,.35)}
      #ag-login-gate .ag-eye-hotspot{position:absolute;right:2%;top:28%;width:12%;height:22%;border:0;background:transparent;cursor:pointer;padding:0}
      #ag-login-gate .ag-remember-hotspot{position:absolute;left:0;top:52%;width:82%;height:18%;margin:0;cursor:pointer;display:block}
      #ag-login-gate .ag-remember-hotspot input{position:absolute;left:1%;top:8%;width:8%;height:78%;margin:0;opacity:0;cursor:pointer}
      #ag-login-gate .ag-remember-hotspot .remember-hitbox{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
      #ag-login-gate .ag-remember-hotspot:has(input:checked) .remember-hitbox:after{content:'✓';position:absolute;left:1.5%;top:-3%;font:800 15px Arial,sans-serif;color:#cfe05c;text-shadow:0 1px 2px rgba(0,0,0,.8)}
      #ag-login-gate .ag-enter-hotspot{position:absolute;left:0;bottom:0;width:100%;height:24%;border:0;background:transparent;cursor:pointer;padding:0}
      #ag-login-gate .ag-login-error{position:absolute;left:0;bottom:-28px;width:100%;min-height:16px;margin:0;text-align:center;color:#e39a86;font:700 10px Arial,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none}
      #ag-login-gate .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      @media(max-width:900px){#ag-login-gate .ag-login-form{width:min(29.85vw,382px);height:min(14.8vw,190px)}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(gate);

    gate.querySelector('.ag-show-password')?.addEventListener('click', () => {
      const input = gate.querySelector('#agPassword');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
    gate.querySelector('.ag-eye-hotspot').addEventListener('click', () => {
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