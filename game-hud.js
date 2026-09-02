/* AG World game HUD. Keeps the game world unobstructed until the player opens a control. */
(() => {
  const css = `
  body{display:block!important;background:#000!important}
  .app-shell{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;box-shadow:none!important;border-radius:0!important;background:#000!important}
  .sidebar,.missions,.bottom{display:none!important}
  .map-area{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background:#000!important}
  .map-header,.map-status,.farm-card{display:none!important}
  .map{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
  .game-hud{position:fixed;inset:0;z-index:20;pointer-events:none;font-family:Arial,Helvetica,sans-serif;color:#fff}
  .player-hud{position:absolute;top:22px;left:22px;width:360px;min-height:108px;padding:12px 16px 12px 118px;background:linear-gradient(110deg,rgba(10,16,19,.94),rgba(10,16,19,.72));border:1px solid rgba(180,205,65,.48);border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:auto;backdrop-filter:blur(8px)}
  .player-avatar{position:absolute;left:10px;top:9px;width:88px;height:88px;border-radius:50%;display:grid;place-items:center;font-size:42px;background:radial-gradient(circle at 38% 28%,#b9c5a4 0 8%,#4b5b55 9% 30%,#1d292d 31% 100%);border:2px solid #b5c83c;box-shadow:0 0 0 3px rgba(181,200,60,.12),0 0 22px rgba(181,200,60,.16)}
  .player-name{font-size:19px;font-weight:800;letter-spacing:1.6px}.player-role{font-size:9px;color:#9eafb5;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px}.player-level{margin-top:8px;font-size:12px;color:#c3d44d;font-weight:700;letter-spacing:1px}.player-xp{height:7px;background:#26322c;border-radius:99px;overflow:hidden;margin-top:5px}.player-xp span{display:block;width:84.2%;height:100%;background:linear-gradient(90deg,#91aa2f,#c5d94c)}.player-xp-text{font-size:9px;color:#cbd3d0;margin-top:4px}
  .mission-hud{position:absolute;top:22px;right:22px;width:330px;pointer-events:auto}.mission-tab{width:100%;border:1px solid rgba(180,205,65,.48);background:rgba(10,16,19,.91);color:#fff;border-radius:12px;padding:13px 18px;text-align:left;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.35);backdrop-filter:blur(8px)}
  .mission-tab:hover{border-color:#c5d94c}.mission-label{color:#c5d94c;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}.mission-title{font-size:16px;font-weight:800;letter-spacing:.8px;margin-top:7px}.mission-sub{font-size:10px;color:#9eafb5;margin-top:4px}.mission-chevron{float:right;color:#c5d94c;font-size:18px;transition:transform .2s}.mission-hud.open .mission-chevron{transform:rotate(180deg)}
  .mission-panel{display:none;margin-top:7px;padding:16px 18px;background:rgba(10,16,19,.96);border:1px solid rgba(180,205,65,.38);border-radius:12px;box-shadow:0 15px 40px rgba(0,0,0,.4)}.mission-hud.open .mission-panel{display:block}.mission-panel h3{margin:0;color:#c5d94c;font-size:10px;letter-spacing:1.4px}.mission-panel strong{display:block;margin-top:7px;font-size:16px}.mission-panel p{font-size:10px;color:#aeb9b8;line-height:1.45}.mission-objectives{list-style:none;margin:12px 0 0;padding:0}.mission-objectives li{font-size:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08)}.mission-reward{margin-top:11px;color:#c5d94c;font-size:10px;font-weight:700}
  .world-control{position:absolute;left:24px;bottom:24px;pointer-events:auto}.globe-button{width:104px;height:104px;border-radius:50%;border:1px solid rgba(190,213,70,.7);background:radial-gradient(circle at 35% 28%,#5e7890 0,#213b4d 35%,#0b2028 70%,#050d11 100%);box-shadow:0 0 0 5px rgba(190,213,70,.08),0 12px 32px rgba(0,0,0,.45),inset -15px -12px 24px rgba(0,0,0,.35);cursor:pointer;color:#c5d94c;position:relative;overflow:hidden}.globe-button:before{content:'🌍';position:absolute;inset:0;display:grid;place-items:center;font-size:62px;filter:saturate(.8) contrast(1.1);text-shadow:0 4px 12px rgba(0,0,0,.55)}.globe-button:after{content:'';position:absolute;inset:7px;border-radius:50%;border:1px solid rgba(255,255,255,.16);box-shadow:inset 8px 8px 18px rgba(255,255,255,.1)}.world-label{position:absolute;left:116px;bottom:18px;width:138px;padding:10px 13px;background:rgba(10,16,19,.9);border:1px solid rgba(180,205,65,.42);border-radius:10px;color:#c5d94c;font-size:10px;font-weight:800;letter-spacing:1.2px;white-space:nowrap;pointer-events:none}.world-menu{display:none;position:absolute;left:118px;bottom:64px;width:190px;padding:10px;background:rgba(10,16,19,.96);border:1px solid rgba(180,205,65,.42);border-radius:12px;box-shadow:0 15px 40px rgba(0,0,0,.45)}.world-control.open .world-menu{display:grid;gap:5px}.world-menu button{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#dce4e1;border-radius:7px;text-align:left;padding:9px 11px;font-size:10px;cursor:pointer}.world-menu button:hover{border-color:#c5d94c;color:#c5d94c;background:rgba(197,217,76,.06)}
  .game-brand{position:absolute;left:50%;top:20px;transform:translateX(-50%);font-size:11px;font-weight:800;letter-spacing:4px;color:rgba(255,255,255,.72);text-shadow:0 2px 8px #000;pointer-events:none}.game-brand span{color:#c5d94c}
  @media(max-width:700px){.player-hud{top:12px;left:12px;width:290px;transform:scale(.86);transform-origin:top left}.mission-hud{top:12px;right:12px;width:250px}.globe-button{width:84px;height:84px}.globe-button:before{font-size:50px}.world-label{left:94px}.world-menu{left:94px}}
  `;
  const style=document.createElement('style'); style.id='ag-world-game-hud-style'; style.textContent=css; document.head.appendChild(style);

  function install(){
    if(document.querySelector('.game-hud')) return;
    const hud=document.createElement('div'); hud.className='game-hud'; hud.innerHTML=`
      <div class="game-brand"><span>AG</span> WORLD</div>
      <section class="player-hud" aria-label="Player profile">
        <div class="player-avatar">👨🏽‍🌾</div><div class="player-name">NICO</div><div class="player-role">SALES REPRESENTATIVE · TERRITORY 03</div><div class="player-level">LEVEL 12</div><div class="player-xp"><span></span></div><div class="player-xp-text">8,420 / 10,000 XP</div>
      </section>
      <section class="mission-hud" aria-label="Active mission">
        <button class="mission-tab" type="button"><span class="mission-label">◉ ACTIVE MISSION</span><span class="mission-chevron">⌄</span><div class="mission-title">MEET YOUR TERRITORY</div><div class="mission-sub">2 objectives remaining</div></button>
        <div class="mission-panel"><h3>ACTIVE MISSION</h3><strong>MEET YOUR TERRITORY</strong><p>Your first objective is to understand the territory and identify the highest-value opportunity.</p><ul class="mission-objectives"><li>○ Identify your assigned territory</li><li>○ Visit your first target farm</li><li>○ Record the commercial opportunity</li></ul><div class="mission-reward">REWARD · +850 XP · TERRITORY PROGRESS</div></div>
      </section>
      <section class="world-control" aria-label="World menu">
        <button class="globe-button" type="button" aria-label="Open world menu"></button><div class="world-label">WORLD MENU</div>
        <nav class="world-menu"><button data-game-view="territory">◎ TERRITORY MAP</button><button data-game-view="farms">◇ MY FARMS</button><button data-game-view="opportunities">◆ OPPORTUNITIES</button><button data-game-view="customers">● CUSTOMERS</button><button data-game-view="missions">★ MISSIONS</button><button data-game-view="training">△ TRAINING</button><button data-game-view="leaderboard">♜ LEADERBOARD</button></nav>
      </section>`;
    document.body.appendChild(hud);
    const mission=hud.querySelector('.mission-hud'); hud.querySelector('.mission-tab').addEventListener('click',()=>mission.classList.toggle('open'));
    const world=hud.querySelector('.world-control'); hud.querySelector('.globe-button').addEventListener('click',()=>world.classList.toggle('open'));
    hud.querySelectorAll('[data-game-view]').forEach(btn=>btn.addEventListener('click',()=>{world.classList.remove('open');const id=btn.dataset.gameView;if(id==='territory') document.getElementById('nationalBtn')?.click();else if(id==='missions') mission.classList.add('open');else if(window.showToast) window.showToast(btn.textContent.trim()+' opened');}));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
