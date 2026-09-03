/* AG WORLD — mission skill-star display. */
(()=>{
  const rewards={
    opportunity:[['People',2],['Management',1]],
    visit:[['Management',2],['People',1],['Product',1]],
    training:[['Technical',3],['Product',1]]
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function apply(){
    document.querySelectorAll('.missions .mission').forEach(card=>{
      const old=card.querySelector('.mission-skill-stars'); if(old)old.remove();
      const data=rewards[card.dataset.action]; if(!data)return;
      const row=document.createElement('div');
      row.className='mission-skill-stars';
      row.setAttribute('aria-label','Skill stars awarded by this mission');
      row.innerHTML=`<span class="mission-skill-label">SKILL REWARDS</span><div class="mission-skill-list">${data.map(([skill,stars])=>`<span class="mission-skill-chip"><b>★</b><span>${esc(skill)}</span><strong>+${stars}</strong></span>`).join('')}</div>`;
      card.appendChild(row);
    });
  }
  const style=document.createElement('style');
  style.textContent=`
    html body.ag-profile-mode .missions .mission-skill-stars{display:flex!important;align-items:center!important;gap:7px!important;margin:8px 24px 0 0!important;padding:7px 0 0!important;border-top:1px solid #edf1f2!important;width:auto!important;box-sizing:border-box!important}
    html body.ag-profile-mode .missions .mission-skill-label{flex:0 0 auto!important;width:auto!important;margin:0!important;color:#66777d!important;font:900 10px/1 Arial,sans-serif!important;letter-spacing:.45px!important;text-transform:uppercase!important}
    html body.ag-profile-mode .missions .mission-skill-list{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:5px!important;min-width:0!important}
    html body.ag-profile-mode .missions .mission-skill-chip{display:inline-flex!important;align-items:center!important;gap:3px!important;padding:3px 5px!important;border:1px solid #d2dee0!important;border-radius:4px!important;background:#f4f8f7!important;color:#42535a!important;white-space:nowrap!important;box-sizing:border-box!important}
    html body.ag-profile-mode .missions .mission-skill-chip b{color:#d6a51f!important;font:900 13px/1 Arial,sans-serif!important}
    html body.ag-profile-mode .missions .mission-skill-chip span{color:#42535a!important;font:800 10px/1 Arial,sans-serif!important}
    html body.ag-profile-mode .missions .mission-skill-chip strong{display:inline!important;margin:0!important;padding:0!important;color:#238d72!important;font:900 10px/1 Arial,sans-serif!important}
    @media(max-width:1100px){html body.ag-profile-mode .missions .mission-skill-stars{gap:5px!important}.missions .mission-skill-label{font-size:9px!important}.missions .mission-skill-chip b{font-size:12px!important}.missions .mission-skill-chip span,.missions .mission-skill-chip strong{font-size:9px!important}}
    @media(max-width:900px){html body.ag-profile-mode .missions .mission-skill-label{font-size:8px!important}.missions .mission-skill-chip b{font-size:11px!important}.missions .mission-skill-chip span,.missions .mission-skill-chip strong{font-size:8px!important}}
  `;
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,300);setTimeout(apply,900);setTimeout(apply,1800)});
})();
