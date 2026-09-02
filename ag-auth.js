/* AG WORLD authentication gate. Prototype credential check: replace with server-side/Supabase auth before production. */
(() => {
  const USERNAME = 'Admin';
  const PASSWORD_SHA256 = 'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee';
  const KEY = 'agworld.rememberedLogin';
  const GATE = 'agworld.authenticated';

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function install() {
    if (document.getElementById('ag-login-gate')) return;
    const remembered = (() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } })();
    const gate = document.createElement('div');
    gate.id = 'ag-login-gate';
    gate.innerHTML = `
      <div class="ag-login-bg"></div>
      <div class="ag-login-vignette"></div>
      <div class="ag-login-brand"><img src="assets/ag-world-logo.jpg" alt="AG WORLD"><div class="ag-login-tagline">DOMINATE THE TERRITORY</div><div class="ag-login-subtitle">BUILD RELATIONSHIPS. EQUIP FARMS. WIN THE FUTURE.</div></div>
      <form class="ag-login-card" autocomplete="on">
        <div class="ag-login-title">ENTER AG WORLD</div>
        <div class="ag-login-caption">YOUR TERRITORY AWAITS</div>
        <label><span>USERNAME</span><input id="agUsername" name="username" autocomplete="username" value="${remembered?.username === USERNAME ? USERNAME : ''}" required></label>
        <label><span>PASSWORD</span><input id="agPassword" name="password" type="password" autocomplete="current-password" value="${remembered?.password || ''}" required></label>
        <label class="ag-remember"><input id="agRemember" type="checkbox" ${remembered ? 'checked' : ''}><span>REMEMBER MY LOGIN DETAILS</span></label>
        <button class="ag-enter" type="submit">ENTER AG WORLD <b>›</b></button>
        <div class="ag-login-error" id="agLoginError"></div>
      </form>
      <div class="ag-login-globe"><img src="assets/ag-globe.jpg" alt="World map"><div><strong>WORLD MENU</strong><span>Territory Navigation</span></div><b>⌃</b></div>`;
    const style = document.createElement('style');
    style.id = 'ag-login-style';
    style.textContent = `
      #ag-login-gate{position:fixed;inset:0;z-index:100000;overflow:hidden;background:#070a09;color:#eee9d8;font-family:Georgia,'Times New Roman',serif;display:block}
      #ag-login-gate.ag-hidden{display:none}
      .ag-login-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(116,105,66,.22),transparent 32%),linear-gradient(180deg,#111719 0%,#21261f 45%,#0c120e 100%);}
      .ag-login-bg:after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,transparent 18%,rgba(0,0,0,.18) 55%,rgba(0,0,0,.68) 100%)}
      .ag-login-vignette{position:absolute;inset:0;box-shadow:inset 0 0 180px rgba(0,0,0,.75),inset 0 -120px 140px rgba(0,0,0,.55);pointer-events:none}
      .ag-login-brand{position:absolute;top:4.5%;left:50%;transform:translateX(-50%);width:min(760px,62vw);text-align:center;filter:drop-shadow(0 8px 18px rgba(0,0,0,.6))}
      .ag-login-brand img{display:block;width:100%;height:auto;border:0}
      .ag-login-tagline{margin-top:4px;font:900 clamp(11px,1.3vw,17px) Arial,sans-serif;letter-spacing:5px;color:#cbd659}
      .ag-login-subtitle{margin-top:8px;font:700 clamp(8px,0.9vw,12px) Arial,sans-serif;letter-spacing:3px;color:#d8d5cb}
      .ag-login-card{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:min(430px,34vw);padding:28px 30px 26px;background:linear-gradient(160deg,rgba(11,14,13,.96),rgba(22,25,20,.91));border:1px solid rgba(214,202,150,.46);box-shadow:0 25px 90px rgba(0,0,0,.6),inset 0 1px rgba(255,255,255,.1);backdrop-filter:blur(7px)}
      .ag-login-title{text-align:center;color:#cddc55;font:900 clamp(19px,2vw,29px) Arial,sans-serif;letter-spacing:2px}
      .ag-login-caption{text-align:center;margin:6px 0 22px;font:700 10px Arial,sans-serif;letter-spacing:4px;color:#eee9d8}
      .ag-login-card label:not(.ag-remember){display:block;margin:0 0 12px}
      .ag-login-card label:not(.ag-remember) span{display:block;margin:0 0 5px;font:700 8px Arial,sans-serif;letter-spacing:2px;color:#a9a58d}
      .ag-login-card input[type=text],.ag-login-card input[type=password]{width:100%;box-sizing:border-box;padding:13px 14px;background:rgba(0,0,0,.47);color:#f4f1e6;border:1px solid rgba(223,213,172,.3);outline:0;font:600 14px Arial,sans-serif}
      .ag-login-card input:focus{border-color:#cbd659;box-shadow:0 0 0 1px rgba(203,214,89,.16)}
      .ag-remember{display:flex;align-items:center;gap:9px;margin:5px 0 16px;font:700 8px Arial,sans-serif;letter-spacing:1.4px;color:#bcb9ab;cursor:pointer}
      .ag-remember input{accent-color:#cbd659;width:14px;height:14px}
      .ag-enter{width:100%;height:52px;border:1px solid #9eae36;background:linear-gradient(180deg,#9cae40,#66762a);color:#fff;font:900 13px Arial,sans-serif;letter-spacing:2px;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.25),0 7px 18px rgba(0,0,0,.32)}
      .ag-enter:hover{filter:brightness(1.08)} .ag-enter b{float:right;font-size:25px;line-height:12px;font-weight:400}
      .ag-login-error{min-height:18px;margin-top:10px;text-align:center;color:#df8b77;font:700 9px Arial,sans-serif}
      .ag-login-globe{position:absolute;left:2.7%;bottom:4.2%;display:flex;align-items:center;gap:12px;min-width:250px}
      .ag-login-globe img{width:118px;height:118px;object-fit:cover;border-radius:50%;border:1px solid #bac64d;box-shadow:0 8px 30px rgba(0,0,0,.6),0 0 0 5px rgba(181,195,68,.06)}
      .ag-login-globe div{min-width:135px;padding:10px 18px;background:rgba(8,12,11,.78);border:1px solid rgba(181,195,68,.35);border-left:0}
      .ag-login-globe strong{display:block;color:#cbd659;font:900 10px Arial,sans-serif;letter-spacing:2px}.ag-login-globe span{display:block;margin-top:4px;color:#aaa58e;font:700 7px Arial,sans-serif;letter-spacing:1px}.ag-login-globe>b{color:#cbd659;font:900 20px Arial,sans-serif;margin-left:-34px;margin-top:45px}
      @media(max-width:900px){.ag-login-brand{width:88vw;top:7%}.ag-login-tagline{letter-spacing:3px}.ag-login-subtitle{letter-spacing:1.5px}.ag-login-card{width:min(430px,88vw);top:59%}.ag-login-globe{left:10px;bottom:10px;transform:scale(.75);transform-origin:left bottom}}
    `;
    document.head.appendChild(style); document.body.appendChild(gate);
    const form = gate.querySelector('form');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const u = gate.querySelector('#agUsername').value.trim();
      const p = gate.querySelector('#agPassword').value;
      const hash = await sha256(p);
      const error = gate.querySelector('#agLoginError');
      if (u !== USERNAME || hash !== PASSWORD_SHA256) { error.textContent = 'INVALID USERNAME OR PASSWORD'; return; }
      if (gate.querySelector('#agRemember').checked) localStorage.setItem(KEY, JSON.stringify({username:u,password:p}));
      else localStorage.removeItem(KEY);
      sessionStorage.setItem(GATE, '1');
      gate.classList.add('ag-hidden');
      window.dispatchEvent(new CustomEvent('agworld:authenticated', { detail: { username:u } }));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
