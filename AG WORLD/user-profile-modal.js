/* AG WORLD — clickable user profile window. */
(()=>{
  const USER={
    fullName:'Nico van Rooyen',
    username:'Admin',
    role:'Sales Representative',
    territory:'Territory 03',
    level:7,
    xp:6820,
    xpNext:10000,
    territoryControl:74,
    regionalRank:2,
    nationalRank:11,
    controlledFarms:18,
    opportunities:14,
    droneFleet:27,
    achievements:[
      {icon:'♙',name:'First Meeting',status:'Earned'},
      {icon:'◈',name:'Opportunity Finder',status:'Earned'},
      {icon:'♛',name:'Presentation Pro',status:'Earned'},
      {icon:'⚒',name:'Proposal Pro',status:'Earned'},
      {icon:'▣',name:'Top Performer',status:'Locked'}
    ],
    nextReward:'DJI Mavic 3 — Sales Certification',
    rewardXp:750
  };

  function install(){
    if(document.getElementById('ag-user-profile-modal-style')) return;
    const style=document.createElement('style');
    style.id='ag-user-profile-modal-style';
    style.textContent=`
      .ag-profile-clickable{cursor:pointer!important;text-decoration:none!important}
      .ag-profile-clickable:hover{color:#fff!important}
      #agUserProfileModal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(5,18,25,.62);z-index:10000;padding:24px;box-sizing:border-box}
      #agUserProfileModal.open{display:flex}
      .ag-user-profile-window{width:min(760px,92vw);max-height:88vh;overflow:auto;background:#fff;border-radius:12px;box-shadow:0 22px 70px rgba(0,0,0,.35);color:#263740;font-family:Arial,sans-serif}
      .ag-user-profile-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:#142733;color:#fff;border-radius:12px 12px 0 0}
      .ag-user-profile-head strong{font-size:18px;font-weight:900;letter-spacing:.3px}.ag-user-profile-head span{display:block;margin-top:4px;color:#9fb2ba;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px}
      .ag-user-profile-close{width:32px;height:32px;border:0;border-radius:6px;background:#304651;color:#fff;font-size:22px;line-height:1;cursor:pointer}.ag-user-profile-close:hover{background:#415a66}
      .ag-user-profile-body{padding:22px 24px 24px}
      .ag-user-profile-identity{display:grid;grid-template-columns:76px 1fr;gap:16px;align-items:center;padding-bottom:20px;border-bottom:1px solid #e1e7e9}
      .ag-user-profile-avatar{width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#344b56;border:2px solid #9eb1b8;color:#fff;font-size:28px;font-weight:900}
      .ag-user-profile-identity h2{margin:0;font-size:22px;font-weight:900}.ag-user-profile-identity p{margin:5px 0 0;color:#64757d;font-size:12px;font-weight:700}.ag-user-profile-connected{display:inline-block;margin-top:7px;color:#3f9840;font-size:10px;font-weight:900;text-transform:uppercase}
      .ag-user-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.ag-user-profile-card{border:1px solid #dce4e7;border-radius:8px;padding:14px}.ag-user-profile-card h3{margin:0 0 11px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#61727a}.ag-user-profile-card p{margin:7px 0;font-size:13px;font-weight:800}.ag-user-profile-card p span{float:right;color:#263740}.ag-user-profile-progress{height:8px;background:#dce3e6;border-radius:8px;overflow:hidden}.ag-user-profile-progress i{display:block;height:100%;background:#69b847;width:68.2%}.ag-user-profile-small{margin-top:5px;color:#718087;font-size:10px;font-weight:700;display:flex;justify-content:space-between}
      .ag-user-profile-achievements{display:flex;flex-wrap:wrap;gap:9px}.ag-user-profile-achievement{min-width:92px;flex:1;border:1px solid #dce4e7;border-radius:7px;padding:9px;text-align:center}.ag-user-profile-achievement b{display:flex;width:32px;height:32px;margin:0 auto 5px;border-radius:7px;align-items:center;justify-content:center;background:#39769b;color:#fff;font-size:15px}.ag-user-profile-achievement.locked b{background:#90999e}.ag-user-profile-achievement span{font-size:9px;font-weight:800}.ag-user-profile-achievement small{display:block;margin-top:3px;color:#718087;font-size:7px;font-weight:700;text-transform:uppercase}
      .ag-user-profile-footer{margin-top:16px;padding-top:14px;border-top:1px solid #e1e7e9;color:#6c7b82;font-size:10px;font-weight:700}.ag-user-profile-footer strong{color:#263740}
      @media(max-width:650px){.ag-user-profile-grid{grid-template-columns:1fr}.ag-user-profile-body{padding:18px}.ag-user-profile-head{padding:17px 18px}}
    `;
    document.head.appendChild(style);

    const modal=document.createElement('div');
    modal.id='agUserProfileModal';
    modal.innerHTML=`<div class="ag-user-profile-window" role="dialog" aria-modal="true" aria-labelledby="agUserProfileTitle">
      <div class="ag-user-profile-head"><div><strong id="agUserProfileTitle">USER PROFILE</strong><span>AG WORLD · EMPLOYEE PROFILE</span></div><button class="ag-user-profile-close" type="button" aria-label="Close profile">×</button></div>
      <div class="ag-user-profile-body">
        <div class="ag-user-profile-identity"><div class="ag-user-profile-avatar">N</div><div><h2>${USER.fullName}</h2><p>${USER.role} · ${USER.territory}</p><span class="ag-user-profile-connected">● Connected</span></div></div>
        <div class="ag-user-profile-grid">
          <div class="ag-user-profile-card"><h3>Account</h3><p>Username <span>${USER.username}</span></p><p>Role <span>${USER.role}</span></p><p>Territory <span>${USER.territory}</span></p></div>
          <div class="ag-user-profile-card"><h3>Progression</h3><p>Level <span>${USER.level}</span></p><p>${USER.xp.toLocaleString()} / ${USER.xpNext.toLocaleString()} XP</p><div class="ag-user-profile-progress"><i></i></div><div class="ag-user-profile-small"><span>Current progress</span><span>${Math.round(USER.xp/USER.xpNext*100)}%</span></div></div>
          <div class="ag-user-profile-card"><h3>Territory Performance</h3><p>Controlled <span>${USER.territoryControl}%</span></p><p>Regional position <span>#${USER.regionalRank}</span></p><p>National position <span>#${USER.nationalRank}</span></p></div>
          <div class="ag-user-profile-card"><h3>Portfolio</h3><p>Controlled farms <span>${USER.controlledFarms}</span></p><p>Opportunities <span>${USER.opportunities}</span></p><p>Drone fleet <span>${USER.droneFleet}</span></p></div>
        </div>
        <div class="ag-user-profile-card" style="margin-top:12px"><h3>Achievements</h3><div class="ag-user-profile-achievements">${USER.achievements.map(a=>`<div class="ag-user-profile-achievement ${a.status==='Locked'?'locked':''}"><b>${a.icon}</b><span>${a.name}</span><small>${a.status}</small></div>`).join('')}</div></div>
        <div class="ag-user-profile-footer"><strong>Next reward:</strong> ${USER.nextReward} · ${USER.rewardXp} XP to go</div>
      </div></div>`;
    document.body.appendChild(modal);

    const close=()=>modal.classList.remove('open');
    modal.querySelector('.ag-user-profile-close').addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});

    document.addEventListener('click',e=>{
      const name=e.target.closest('.sidebar .profile strong');
      if(name){e.preventDefault();e.stopPropagation();modal.classList.add('open');}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
