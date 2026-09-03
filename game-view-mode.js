/* AG WORLD — three distinct views.
   1. Login screen       -> controlled by ag-auth.js
   2. Profile screen     -> authenticated legacy profile page
   3. Full game view     -> V1 full-screen game map

   Profile styling follows the supplied Profile-page reference image.
   The map area is intentionally left for later refinement.
*/
(() => {
  const css = `
    /* ==================== PROFILE PAGE ==================== */
    body.ag-profile-mode { display:block!important; background:#edf1f2!important; overflow:hidden!important; }
    body.ag-profile-mode .app-shell { position:fixed!important; inset:0!important; width:100vw!important; height:100vh!important; max-width:none!important; max-height:none!important; margin:0!important; transform:none!important; border-radius:0!important; box-shadow:none!important; overflow:hidden!important; background:#fff!important; }

    /* Three upper columns: navigation, missions, map. */
    body.ag-profile-mode .sidebar { position:absolute!important; left:0!important; top:0!important; bottom:23%!important; width:14.45%!important; box-sizing:border-box!important; background:linear-gradient(180deg,#162630 0%,#14232c 100%)!important; border-right:1px solid #31434d!important; color:#fff!important; z-index:30!important; }
    body.ag-profile-mode .missions { position:absolute!important; left:14.45%!important; top:0!important; bottom:23%!important; width:22.2%!important; height:auto!important; box-sizing:border-box!important; padding:15px 12px!important; background:#fff!important; border-right:1px solid #d8e0e3!important; overflow:hidden!important; z-index:25!important; }
    body.ag-profile-mode .map-area { position:absolute!important; left:36.65%!important; right:0!important; top:0!important; bottom:23%!important; width:auto!important; height:auto!important; background:#dfe7e4!important; z-index:10!important; }

    /* ----- LEFT MENU ----- */
    body.ag-profile-mode .sidebar .brand { margin:0!important; padding:17px 16px 13px!important; font:900 17px Arial,sans-serif!important; letter-spacing:.3px!important; color:#f6fafb!important; border-bottom:0!important; }
    body.ag-profile-mode .sidebar .brand:before { content:'✦'; color:#6ec247; font-size:18px; margin-right:7px; }
    body.ag-profile-mode .sidebar .brand small { display:block!important; margin:3px 0 0 26px!important; color:#91a4ad!important; font:700 6px Arial,sans-serif!important; letter-spacing:.7px!important; }
    body.ag-profile-mode .sidebar .nav { gap:2px!important; padding:4px 6px!important; }
    body.ag-profile-mode .sidebar .nav button { width:100%!important; box-sizing:border-box!important; padding:8px 9px!important; border:0!important; border-radius:4px!important; background:transparent!important; color:#b9c7cd!important; text-align:left!important; font:700 9px Arial,sans-serif!important; letter-spacing:.2px!important; }
    body.ag-profile-mode .sidebar .nav button.active, body.ag-profile-mode .sidebar .nav button:hover { background:#445762!important; color:#fff!important; }
    body.ag-profile-mode .sidebar .profile { left:15px!important; right:15px!important; bottom:12px!important; border-top:1px solid #30434c!important; padding-top:10px!important; color:#c6d1d5!important; font:700 7px Arial,sans-serif!important; }
    body.ag-profile-mode .sidebar .profile strong { display:block!important; color:#eef3f5!important; font-size:7px!important; letter-spacing:.4px!important; margin-bottom:3px!important; }

    /* ----- MISSION CONTROL ----- */
    body.ag-profile-mode .missions .eyebrow { margin:0!important; color:#6d7d84!important; font:800 7px Arial,sans-serif!important; letter-spacing:.7px!important; text-transform:uppercase!important; }
    body.ag-profile-mode .missions h1 { margin:3px 0 1px!important; color:#24343d!important; font:900 15px Arial,sans-serif!important; letter-spacing:.4px!important; }
    body.ag-profile-mode .missions .level { color:#6c7a81!important; font:700 7px Arial,sans-serif!important; }
    body.ag-profile-mode .missions .xpbar { height:5px!important; margin-top:7px!important; background:#e1e7e9!important; border-radius:0!important; overflow:hidden!important; }
    body.ag-profile-mode .missions .xpbar span { display:block!important; width:62.5%!important; height:100%!important; background:#3e9e9a!important; }
    body.ag-profile-mode .missions .xptext { display:flex!important; justify-content:space-between!important; margin:3px 0 11px!important; color:#829097!important; font:700 6px Arial,sans-serif!important; }
    body.ag-profile-mode .missions .section-title { padding-top:8px!important; border-top:1px solid #e2e7e9!important; color:#6b7a81!important; font:800 7px Arial,sans-serif!important; letter-spacing:.8px!important; text-transform:uppercase!important; }
    body.ag-profile-mode .missions .mission { margin:6px 0!important; padding:9px 9px 8px!important; min-height:0!important; border:1px solid #dce3e5!important; border-radius:7px!important; background:#fff!important; box-shadow:0 1px 5px rgba(35,55,65,.07)!important; }
    body.ag-profile-mode .missions .mission .tag { color:#15958d!important; font:900 6px Arial,sans-serif!important; letter-spacing:.5px!important; text-transform:uppercase!important; }
    body.ag-profile-mode .missions .mission strong { display:block!important; margin-top:4px!important; color:#253640!important; font:900 9px Arial,sans-serif!important; }
    body.ag-profile-mode .missions .mission p { margin:4px 0 0!important; color:#68777e!important; font:600 7px Arial,sans-serif!important; line-height:1.35!important; }
    body.ag-profile-mode .missions .mission .reward { margin-top:5px!important; color:#238d72!important; font:900 6px Arial,sans-serif!important; }
    body.ag-profile-mode .missions .mission:first-of-type { border-left:3px solid #35a596!important; }

    /* ----- FULL-WIDTH PROFILE FOOTER ----- */
    body.ag-profile-mode .bottom { position:absolute!important; left:0!important; right:0!important; bottom:0!important; width:100%!important; height:23%!important; box-sizing:border-box!important; padding:0!important; background:#fff!important; border-top:1px solid #d6dfe2!important; z-index:40!important; color:#26343d!important; overflow:hidden!important; }
    body.ag-profile-mode .bottom.ag-profile-footer { display:grid!important; grid-template-columns:25% 37% 22% 16%!important; }
    .ag-profile-footer .pf-section { position:relative!important; min-width:0!important; height:100%!important; box-sizing:border-box!important; padding:14px 18px!important; border-right:1px solid #dbe2e5!important; overflow:hidden!important; }
    .ag-profile-footer .pf-section:last-child { border-right:0!important; }
    .ag-profile-footer .pf-title { margin:0 0 12px!important; color:#263740!important; font:900 9px Arial,sans-serif!important; letter-spacing:.5px!important; text-transform:uppercase!important; }

    /* YOUR PROGRESS */
    .ag-progress-row { display:flex!important; align-items:center!important; gap:12px!important; }
    .ag-level-shield { width:58px!important; height:58px!important; flex:0 0 58px!important; background:#3f9140!important; color:#fff!important; clip-path:polygon(50% 0,88% 14%,100% 50%,86% 87%,50% 100%,14% 87%,0 50%,12% 14%)!important; display:flex!important; flex-direction:column!important; align-items:center!important; justify-content:center!important; box-shadow:inset 0 0 0 3px #78b967!important; }
    .ag-level-shield b { font:900 21px Arial,sans-serif!important; line-height:20px!important; }
    .ag-level-shield span { font:900 6px Arial,sans-serif!important; letter-spacing:.7px!important; }
    .ag-progress-main { flex:1!important; min-width:0!important; }
    .ag-progress-main strong { display:block!important; color:#263740!important; font:900 11px Arial,sans-serif!important; }
    .ag-progress-bar { height:8px!important; margin-top:8px!important; background:#dce3e6!important; border-radius:8px!important; overflow:hidden!important; }
    .ag-progress-bar i { display:block!important; width:62.5%!important; height:100%!important; background:#65b845!important; border-radius:8px!important; }
    .ag-progress-foot { display:flex!important; justify-content:space-between!important; margin-top:4px!important; color:#6f7e85!important; font:700 6px Arial,sans-serif!important; }
    .ag-progress-note { margin-top:7px!important; color:#697980!important; font:700 6px Arial,sans-serif!important; line-height:1.25!important; }

    /* BADGES EARNED */
    .ag-badges { display:flex!important; align-items:flex-start!important; gap:19px!important; }
    .ag-badge-item { width:52px!important; flex:0 0 52px!important; text-align:center!important; }
    .ag-badge { width:46px!important; height:46px!important; margin:0 auto 5px!important; border-radius:8px!important; display:flex!important; align-items:center!important; justify-content:center!important; color:#fff!important; font:900 19px Arial,sans-serif!important; background:#39769b!important; border:3px solid #d8b84d!important; box-shadow:0 2px 4px rgba(0,0,0,.12)!important; }
    .ag-badge.gold { background:#47728b!important; }
    .ag-badge.purple { background:#694a92!important; border-color:#b9a0d9!important; }
    .ag-badge.locked { background:#8f989d!important; border-color:#c6cdd0!important; color:#e8ecee!important; }
    .ag-badge-item span { display:block!important; color:#45545c!important; font:800 6px Arial,sans-serif!important; line-height:1.25!important; }

    /* WEEKLY LEADERBOARD */
    .ag-leader-list { display:flex!important; flex-direction:column!important; gap:3px!important; }
    .ag-leader-row { display:grid!important; grid-template-columns:20px 1fr auto!important; align-items:center!important; gap:6px!important; padding:4px 7px!important; border-radius:4px!important; color:#33434b!important; font:700 7px Arial,sans-serif!important; }
    .ag-leader-row.current { background:#e9f1f6!important; }
    .ag-rank { width:16px!important; height:16px!important; border-radius:50%!important; display:flex!important; align-items:center!important; justify-content:center!important; font-size:7px!important; background:#edf1f2!important; }
    .ag-leader-row:nth-child(1) .ag-rank { background:#f2c52e!important; }
    .ag-leader-row:nth-child(2) .ag-rank { background:#dce3e6!important; }
    .ag-leader-row:nth-child(3) .ag-rank { background:#d99859!important; }
    .ag-leader-xp { font-weight:900!important; }
    .ag-leader-link { margin-top:5px!important; color:#168aa0!important; font:800 6px Arial,sans-serif!important; }

    /* NEXT LEVEL REWARD */
    .ag-reward-drone { width:105px!important; height:46px!important; margin:0 auto 2px!important; position:relative!important; }
    .ag-drone-body { position:absolute!important; left:39px!important; top:19px!important; width:27px!important; height:11px!important; border-radius:50%!important; background:#475158!important; box-shadow:0 3px 3px rgba(0,0,0,.18)!important; }
    .ag-drone-arm { position:absolute!important; width:43px!important; height:4px!important; background:#59636a!important; top:22px!important; border-radius:3px!important; }
    .ag-drone-arm.left { left:4px!important; transform:rotate(-14deg)!important; }.ag-drone-arm.right { right:4px!important; transform:rotate(14deg)!important; }
    .ag-rotor { position:absolute!important; width:23px!important; height:23px!important; border:2px solid #7b858b!important; border-radius:50%!important; top:10px!important; }.ag-rotor.a{left:0!important}.ag-rotor.b{right:0!important}.ag-rotor:after{content:'';position:absolute;left:50%;top:-5px;width:2px;height:29px;background:#a0a8ac;transform:rotate(90deg)!important}
    .ag-reward-title { text-align:center!important; color:#26343d!important; font:900 10px Arial,sans-serif!important; }.ag-reward-sub{text-align:center!important;margin-top:3px!important;color:#718089!important;font:700 6px Arial,sans-serif!important}.ag-reward-bar{height:6px!important;background:#dce3e6!important;border-radius:8px!important;margin:7px 10px 0!important;overflow:hidden!important}.ag-reward-bar i{display:block!important;width:22%!important;height:100%!important;background:#63ad43!important}.ag-reward-xp{text-align:center!important;margin-top:3px!important;color:#718089!important;font:700 6px Arial,sans-serif!important}

    /* Logout belongs to Profile and sits at the footer's lower-right edge. */
    .ag-profile-logout { position:absolute!important; right:18px!important; bottom:12px!important; z-index:60!important; border:1px solid #ccd7dc!important; background:#fff!important; color:#26343d!important; border-radius:4px!important; padding:6px 10px!important; font:800 6px Arial,sans-serif!important; letter-spacing:.7px!important; cursor:pointer!important; }
    .ag-profile-logout:hover{background:#f0f6f7!important}

    /* ==================== FULL GAME VIEW — V1 UNCHANGED ==================== */
    body.ag-game-mode{display:block!important;background:#050706!important;overflow:hidden!important}
    body.ag-game-mode .app-shell{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;border-radius:0!important;box-shadow:none!important;background:#050706!important}
    body.ag-game-mode .ag-hud,body.ag-game-mode .sidebar,body.ag-game-mode .missions,body.ag-game-mode .bottom,body.ag-game-mode .map-header,body.ag-game-mode .map-status,body.ag-game-mode .farm-card,body.ag-game-mode .ag-profile-logout{display:none!important}
    body.ag-game-mode .map-area,body.ag-game-mode .map{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background:#050706!important}

    @media(max-width:1000px){
      body.ag-profile-mode .bottom.ag-profile-footer{grid-template-columns:25% 37% 22% 16%!important}
      .ag-profile-footer .pf-section{padding:10px 12px!important}.ag-badges{gap:8px!important}.ag-badge-item{width:43px!important;flex-basis:43px!important}.ag-badge{width:38px!important;height:38px!important;font-size:15px!important}
    }
  `;

  function install(){
    if(document.getElementById('ag-world-view-mode-style'))return;
    const style=document.createElement('style');style.id='ag-world-view-mode-style';style.textContent=css;document.head.appendChild(style);

    const enterProfile=()=>{document.body.classList.remove('ag-game-mode','ag-premium-mode');document.body.classList.add('ag-profile-mode');window.__AG_WORLD_VIEW='profile';window.__AG_WORLD_PREMIUM_MODE=false;};
    const enterGame=()=>{document.body.classList.remove('ag-profile-mode');document.body.classList.add('ag-game-mode','ag-premium-mode');window.__AG_WORLD_VIEW='game';window.__AG_WORLD_PREMIUM_MODE=true;};
    const logout=()=>{sessionStorage.removeItem('agworld.authenticated');document.body.classList.remove('ag-profile-mode','ag-game-mode','ag-premium-mode');window.__AG_WORLD_VIEW='login';window.__AG_WORLD_PREMIUM_MODE=false;window.location.reload();};

    window.agWorldEnterProfile=enterProfile;window.agWorldEnterPremium=enterGame;window.agWorldExitPremium=enterProfile;window.agWorldLogout=logout;

    const buildProfileFooter=()=>{const footer=document.querySelector('.bottom');if(!footer)return;footer.classList.add('ag-profile-footer');footer.innerHTML=`
      <section class="pf-section"><div class="pf-title">YOUR PROGRESS</div><div class="ag-progress-row"><div class="ag-level-shield"><b>7</b><span>LEVEL</span></div><div class="ag-progress-main"><strong>1,250 / 2,000 XP</strong><div class="ag-progress-bar"><i></i></div><div class="ag-progress-foot"><span>1,250 XP</span><span>62%</span></div><div class="ag-progress-note">Level 8 unlocks: Advanced Proposals</div></div></div></section>
      <section class="pf-section"><div class="pf-title">BADGES EARNED</div><div class="ag-badges"><div class="ag-badge-item"><div class="ag-badge">♙</div><span>First Meeting</span></div><div class="ag-badge-item"><div class="ag-badge gold">◈</div><span>Opportunity<br>Finder</span></div><div class="ag-badge-item"><div class="ag-badge purple">♛</div><span>Presentation<br>Pro</span></div><div class="ag-badge-item"><div class="ag-badge gold">⚒</div><span>Proposal<br>Pro</span></div><div class="ag-badge-item"><div class="ag-badge locked">▣</div><span>Top Performer<br>(LOCKED)</span></div></div></section>
      <section class="pf-section"><div class="pf-title">WEEKLY LEADERBOARD</div><div class="ag-leader-list"><div class="ag-leader-row"><span class="ag-rank">1</span><span>Sarah K.</span><span class="ag-leader-xp">2,450 XP</span></div><div class="ag-leader-row current"><span class="ag-rank">2</span><span>Mike Johnson</span><span class="ag-leader-xp">1,250 XP</span></div><div class="ag-leader-row"><span class="ag-rank">3</span><span>David L.</span><span class="ag-leader-xp">980 XP</span></div></div><div class="ag-leader-link">View Full Leaderboard</div></section>
      <section class="pf-section"><div class="pf-title">NEXT LEVEL REWARD</div><div class="ag-reward-drone"><div class="ag-rotor a"></div><div class="ag-rotor b"></div><div class="ag-drone-arm left"></div><div class="ag-drone-arm right"></div><div class="ag-drone-body"></div></div><div class="ag-reward-title">DJI Mavic 3</div><div class="ag-reward-sub">Sales Certification</div><div class="ag-reward-bar"><i></i></div><div class="ag-reward-xp">750 XP to go</div></section>`;};

    const buildMissions=()=>{const box=document.querySelector('.missions');if(!box)return;box.innerHTML=`
      <div class="eyebrow">Sales Rep · Territory 03</div><h1>MISSION CONTROL</h1><div class="level">Level 7 · 1,250 / 2,000 XP</div><div class="xpbar"><span></span></div><div class="xptext"><span>Current XP</span><span>62%</span></div><div class="section-title">Priority missions</div>
      <div class="mission"><div class="tag">AI STRATEGY · HIGH PRIORITY</div><strong>Conquer the uncovered farm</strong><p>Find and qualify a high-value farm without a company drone in your territory.</p><div class="reward">+450 XP</div></div>
      <div class="mission"><div class="tag">CUSTOMER · DUE TODAY</div><strong>Follow up on service outcome</strong><p>Confirm customer satisfaction after the latest drone service.</p><div class="reward">+180 XP</div></div>
      <div class="mission"><div class="tag">OPPORTUNITY</div><strong>Identify 3 New Opportunities</strong><p>Find 3 farms without drones in your area.</p><div class="reward">+120 XP · 0/3</div></div>
      <div class="mission"><div class="tag">SALES · NEXT ACTION</div><strong>Present Drone Solution</strong><p>Present a drone solution to a potential client.</p><div class="reward">+200 XP · 0/1</div></div>
      <div class="mission"><div class="tag">DAILY CHALLENGE</div><strong>Log 5 client interactions today</strong><p>Record meaningful customer activity in your territory.</p><div class="reward">+50 XP · 3/5</div></div>`;};

    const addLogout=()=>{if(document.querySelector('.ag-profile-logout'))return;const b=document.createElement('button');b.className='ag-profile-logout';b.type='button';b.textContent='LOG OFF';b.addEventListener('click',logout);document.body.appendChild(b);};

    document.addEventListener('pointerup',e=>{if(!document.body.classList.contains('ag-profile-mode'))return;const t=e.target instanceof Element?e.target:null;if(t&&t.closest('#map'))enterGame();},true);
    window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('ag-game-mode')){e.preventDefault();e.stopImmediatePropagation();enterProfile();}},true);
    window.addEventListener('agworld:authenticated',()=>{enterProfile();buildMissions();buildProfileFooter();addLogout();});
    if(sessionStorage.getItem('agworld.authenticated')==='1'){enterProfile();buildMissions();buildProfileFooter();addLogout();}else{document.body.classList.remove('ag-profile-mode','ag-game-mode','ag-premium-mode');window.__AG_WORLD_VIEW='login';window.__AG_WORLD_PREMIUM_MODE=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();