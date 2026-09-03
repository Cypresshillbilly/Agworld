/* AG WORLD — three distinct views.
   1. Login screen       -> controlled by ag-auth.js
   2. Profile screen     -> legacy authenticated profile page
   3. Full game view     -> V1 full-screen game map
*/
(() => {
  const css = `
    body.ag-profile-mode { display:block !important; background:#eef1f3 !important; overflow:hidden !important; }
    body.ag-profile-mode .app-shell { position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important; max-width:none !important; max-height:none !important; margin:0 !important; transform:none !important; border-radius:0 !important; box-shadow:none !important; }
    body.ag-profile-mode .sidebar { width:14.0625vw !important; }
    body.ag-profile-mode .missions { left:14.0625vw !important; width:22.265625vw !important; height:79.2682927vh !important; }
    body.ag-profile-mode .map-area { left:36.328125vw !important; height:79.2682927vh !important; }
    body.ag-profile-mode .bottom { left:0 !important; width:100vw !important; height:20.7317073vh !important; bottom:0 !important; }

    /* PROFILE FOOTER — login-screen visual language: charcoal, warm gold, subtle agricultural green. */
    body.ag-profile-mode .bottom.ag-profile-footer { display:grid !important; grid-template-columns:minmax(280px,1.05fr) minmax(380px,1.7fr) minmax(330px,1.15fr) !important; gap:0 !important; padding:0 !important; overflow:hidden !important; background:linear-gradient(135deg,#111716 0%,#1c211c 55%,#252719 100%) !important; border:1px solid rgba(214,196,134,.55) !important; border-top:2px solid #d6c481 !important; color:#eee9dc !important; box-shadow:0 -8px 30px rgba(0,0,0,.24) !important; }
    .ag-profile-footer .pf-panel { position:relative; min-width:0; height:100%; padding:14px 20px; border-right:1px solid rgba(214,196,134,.2); overflow:hidden; }
    .ag-profile-footer .pf-panel:last-child { border-right:0; }
    .ag-profile-footer .pf-eyebrow { font:700 7px Arial,sans-serif; letter-spacing:1.7px; color:#cdbf86; text-transform:uppercase; }
    .ag-profile-footer .pf-title { margin-top:3px; font:900 17px Georgia,'Times New Roman',serif; letter-spacing:1px; color:#f0eadb; }
    .ag-profile-footer .pf-role { margin-top:3px; font:700 7px Arial,sans-serif; letter-spacing:1.2px; color:#aaa48f; text-transform:uppercase; }
    .ag-profile-footer .pf-avatar { position:absolute; left:20px; bottom:13px; width:58px; height:58px; border-radius:50%; overflow:hidden; border:2px solid #d6c481; background:#0b100e; box-shadow:0 0 0 3px rgba(214,196,134,.08),0 5px 16px rgba(0,0,0,.55); }
    .ag-profile-footer .pf-avatar svg { width:100%; height:100%; display:block; }
    .ag-profile-footer .pf-identity { margin-left:74px; padding-top:2px; }
    .ag-profile-footer .pf-level { margin-top:10px; font:900 9px Arial,sans-serif; letter-spacing:1.5px; color:#dfcd87; }
    .ag-profile-footer .pf-xp { height:4px; margin-top:5px; background:#090c0b; border:1px solid rgba(214,196,134,.18); }
    .ag-profile-footer .pf-xp i { display:block; width:68%; height:100%; background:linear-gradient(90deg,#8f7b3f,#e1ce7d); }
    .ag-profile-footer .pf-xptext { display:flex; justify-content:space-between; margin-top:4px; font:700 6px Arial,sans-serif; color:#aaa48f; }

    .ag-profile-footer .pf-skill-head { display:flex; justify-content:space-between; align-items:end; }
    .ag-profile-footer .pf-skill-head .pf-title { font-size:14px; }
    .ag-profile-footer .pf-skill-points { font:700 7px Arial,sans-serif; color:#aaa48f; letter-spacing:.8px; }
    .ag-profile-footer .pf-tree { position:relative; height:76px; margin:7px 2px 0; }
    .ag-profile-footer .pf-tree-line { position:absolute; left:11%; right:11%; top:28px; height:1px; background:linear-gradient(90deg,transparent,rgba(214,196,134,.55),transparent); }
    .ag-profile-footer .pf-tree-line2 { position:absolute; left:27%; right:27%; top:28px; height:28px; border-left:1px solid rgba(214,196,134,.35); border-right:1px solid rgba(214,196,134,.35); }
    .ag-profile-footer .pf-node { position:absolute; top:0; transform:translateX(-50%); text-align:center; width:92px; }
    .ag-profile-footer .pf-node:nth-of-type(3){left:12%}.ag-profile-footer .pf-node:nth-of-type(4){left:31%}.ag-profile-footer .pf-node:nth-of-type(5){left:50%}.ag-profile-footer .pf-node:nth-of-type(6){left:69%}.ag-profile-footer .pf-node:nth-of-type(7){left:88%}
    .ag-profile-footer .pf-node-dot { width:22px; height:22px; margin:0 auto 4px; border-radius:50%; border:1px solid #d6c481; background:radial-gradient(circle,#d6c481 0 25%,#30351f 27% 100%); box-shadow:0 0 10px rgba(214,196,134,.18); }
    .ag-profile-footer .pf-node.locked .pf-node-dot { border-color:#66675b; background:#1c211c; box-shadow:none; opacity:.75; }
    .ag-profile-footer .pf-node strong { display:block; font:900 6px Arial,sans-serif; letter-spacing:.7px; color:#eee9dc; }
    .ag-profile-footer .pf-node span { display:block; margin-top:2px; font:700 5px Arial,sans-serif; color:#a9a38e; }
    .ag-profile-footer .pf-skill-progress { font:700 6px Arial,sans-serif; color:#a9a38e; letter-spacing:.6px; }

    .ag-profile-footer .pf-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:10px; }
    .ag-profile-footer .pf-stat { padding:7px 8px; border:1px solid rgba(214,196,134,.18); background:rgba(255,255,255,.035); }
    .ag-profile-footer .pf-stat small { display:block; font:700 6px Arial,sans-serif; letter-spacing:1px; color:#a9a38e; }
    .ag-profile-footer .pf-stat strong { display:block; margin-top:3px; font:900 13px Georgia,serif; color:#eee9dc; }
    .ag-profile-footer .pf-stat em { margin-left:3px; font:700 6px Arial,sans-serif; color:#d7c77e; font-style:normal; }
    .ag-profile-footer .pf-territory-bar { height:4px; margin-top:8px; background:#0b0e0d; }
    .ag-profile-footer .pf-territory-bar i { display:block; width:74%; height:100%; background:#7d9560; }
    .ag-profile-footer .pf-logout { position:absolute; right:18px; bottom:13px; border:1px solid rgba(214,196,134,.45); background:rgba(10,12,11,.55); color:#d7c77e; border-radius:3px; padding:6px 10px; font:900 6px Arial,sans-serif; letter-spacing:1px; cursor:pointer; }
    .ag-profile-footer .pf-logout:hover { background:rgba(214,196,134,.12); border-color:#e2cf83; }

    /* Full Game View remains V1 and separate from the Profile screen. */
    body.ag-game-mode { display:block !important; background:#050706 !important; overflow:hidden !important; }
    body.ag-game-mode .app-shell { position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important; max-width:none !important; max-height:none !important; margin:0 !important; transform:none !important; border-radius:0 !important; box-shadow:none !important; background:#050706 !important; }
    body.ag-game-mode .ag-hud,body.ag-game-mode .sidebar,body.ag-game-mode .missions,body.ag-game-mode .bottom,body.ag-game-mode .map-header,body.ag-game-mode .map-status,body.ag-game-mode .farm-card,body.ag-game-mode .ag-profile-logout { display:none !important; }
    body.ag-game-mode .map-area,body.ag-game-mode .map { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; background:#050706 !important; }
    @media(max-width:1000px){ body.ag-profile-mode .bottom.ag-profile-footer{grid-template-columns:1fr 1.35fr 1fr !important}.ag-profile-footer .pf-panel{padding:12px}.ag-profile-footer .pf-avatar{left:12px}.ag-profile-footer .pf-identity{margin-left:68px}.ag-profile-footer .pf-stat{padding:5px}.ag-profile-footer .pf-stat strong{font-size:11px}.ag-profile-footer .pf-node{width:72px} }
  `;

  function install() {
    if (document.getElementById('ag-world-view-mode-style')) return;
    const style = document.createElement('style'); style.id='ag-world-view-mode-style'; style.textContent=css; document.head.appendChild(style);

    const enterProfile=()=>{ document.body.classList.remove('ag-game-mode','ag-premium-mode'); document.body.classList.add('ag-profile-mode'); window.__AG_WORLD_VIEW='profile'; window.__AG_WORLD_PREMIUM_MODE=false; };
    const enterGame=()=>{ document.body.classList.remove('ag-profile-mode'); document.body.classList.add('ag-game-mode','ag-premium-mode'); window.__AG_WORLD_VIEW='game'; window.__AG_WORLD_PREMIUM_MODE=true; };
    const logout=()=>{ sessionStorage.removeItem('agworld.authenticated'); document.body.classList.remove('ag-profile-mode','ag-game-mode','ag-premium-mode'); window.__AG_WORLD_VIEW='login'; window.__AG_WORLD_PREMIUM_MODE=false; window.location.reload(); };

    window.agWorldEnterProfile=enterProfile; window.agWorldEnterPremium=enterGame; window.agWorldExitPremium=enterProfile; window.agWorldLogout=logout;

    const buildProfileFooter=()=>{
      const footer=document.querySelector('.bottom'); if(!footer) return;
      footer.classList.add('ag-profile-footer');
      footer.innerHTML=`
        <section class="pf-panel pf-person">
          <div class="pf-eyebrow">AG WORLD · EMPLOYEE PROFILE</div>
          <div class="pf-identity"><div class="pf-title">NICO</div><div class="pf-role">SALES REPRESENTATIVE</div><div class="pf-level">LEVEL 7</div><div class="pf-xp"><i></i></div><div class="pf-xptext"><span>6,820 / 10,000 XP</span><span>68%</span></div></div>
          <div class="pf-avatar" aria-label="Employee avatar"><svg viewBox="0 0 100 100" role="img" aria-label="Employee avatar illustration"><defs><linearGradient id="avbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4e5a50"/><stop offset="1" stop-color="#111613"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#avbg)"/><circle cx="50" cy="38" r="17" fill="#b98f73"/><path d="M32 35c3-19 35-25 39 2-9-7-25-8-39-2Z" fill="#25251e"/><path d="M23 92c3-25 16-37 27-37s25 12 27 37Z" fill="#39463f"/><path d="M31 63c10 7 28 7 38 0l6 29H25Z" fill="#27322e"/></svg></div>
        </section>
        <section class="pf-panel pf-skills">
          <div class="pf-skill-head"><div><div class="pf-eyebrow">PROGRESSION</div><div class="pf-title">SKILLS TREE</div></div><div class="pf-skill-points">12 SKILL POINTS AVAILABLE</div></div>
          <div class="pf-tree"><div class="pf-tree-line"></div><div class="pf-tree-line2"></div>
            <div class="pf-node"><div class="pf-node-dot"></div><strong>SALES</strong><span>LEVEL 4</span></div>
            <div class="pf-node"><div class="pf-node-dot"></div><strong>AGRICULTURE</strong><span>LEVEL 3</span></div>
            <div class="pf-node"><div class="pf-node-dot"></div><strong>DRONE</strong><span>LEVEL 2</span></div>
            <div class="pf-node locked"><div class="pf-node-dot"></div><strong>LEADERSHIP</strong><span>LOCKED</span></div>
            <div class="pf-node locked"><div class="pf-node-dot"></div><strong>STRATEGY</strong><span>LOCKED</span></div>
          </div>
          <div class="pf-skill-progress">NEXT UNLOCK · 4 SKILL POINTS REQUIRED</div>
        </section>
        <section class="pf-panel pf-right">
          <div class="pf-eyebrow">PERFORMANCE · TERRITORY</div>
          <div class="pf-stats"><div class="pf-stat"><small>TERRITORY</small><strong>03 <em>74%</em></strong></div><div class="pf-stat"><small>REGIONAL</small><strong>#2</strong></div><div class="pf-stat"><small>NATIONAL</small><strong>#11</strong></div></div>
          <div class="pf-stats"><div class="pf-stat"><small>FARMS</small><strong>18</strong></div><div class="pf-stat"><small>OPPORTUNITIES</small><strong>14</strong></div><div class="pf-stat"><small>ACHIEVEMENTS</small><strong>7</strong></div></div>
          <div class="pf-territory-bar"><i></i></div>
          <button class="pf-logout" type="button">LOG OFF</button>
        </section>`;
      footer.querySelector('.pf-logout').addEventListener('click',logout);
    };

    document.addEventListener('pointerup',e=>{ if(!document.body.classList.contains('ag-profile-mode')) return; const t=e.target instanceof Element?e.target:null; if(t&&t.closest('#map')) enterGame(); },true);
    window.addEventListener('keydown',e=>{ if(e.key==='Escape'&&document.body.classList.contains('ag-game-mode')){e.preventDefault();e.stopImmediatePropagation();enterProfile();} },true);
    window.addEventListener('agworld:authenticated',()=>{enterProfile();buildProfileFooter();});
    if(sessionStorage.getItem('agworld.authenticated')==='1'){enterProfile();buildProfileFooter();}else{document.body.classList.remove('ag-profile-mode','ag-game-mode','ag-premium-mode');window.__AG_WORLD_VIEW='login';window.__AG_WORLD_PREMIUM_MODE=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();