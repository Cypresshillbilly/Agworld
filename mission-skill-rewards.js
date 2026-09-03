/* AG WORLD — mission skill-star display */
(()=>{
  const rewards={
    'Set Meeting with Top Client':[['People skills',2],['Management skills',1]],
    'Follow Up Opportunity':[['Management skills',2],['People skills',1],['Product Knowledge',1]],
    'DJI Repair Assessment':[['Technical knowledge',3],['Product Knowledge',1]]
  };
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function apply(){
    document.querySelectorAll('.missions .mission').forEach(card=>{
      const old=card.querySelector('.mission-skill-stars');
      if(old)old.remove();
      const title=card.querySelector('strong')?.textContent?.trim();
      const data=rewards[title];
      if(!data)return;
      const row=document.createElement('div');
      row.className='mission-skill-stars';
      row.setAttribute('aria-label','Skill stars awarded by this mission');
      row.innerHTML='<span class="mission-skill-label">SKILL STARS</span>'+data.map(([skill,stars])=>`<span class="mission-skill-chip"><b>★</b><span>${esc(skill)}</span><strong>+${stars}</strong></span>`).join('');
      card.appendChild(row);
    });
  }
  const style=document.createElement('style');
  style.textContent=`
    html body.ag-profile-mode .missions .mission-skill-stars{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:5px!important;margin:9px 0 0!important;padding:7px 0 0!important;border-top:1px solid #edf1f2!important;width:100%!important;box-sizing:border-box!important}
    html body.ag-profile-mode .missions .mission-skill-label{width:100%!important;margin:0 0 1px!important;color:#66777d!important;font:800 10px/1.2 Arial,sans-serif!important;letter-spacing:.55px!important;text-transform:uppercase!important}
    html body.ag-profile-mode .missions .mission-skill-chip{display:inline-flex!important;align-items:center!important;gap:4px!important;padding:4px 6px!important;border:1px solid #d2dee0!important;border-radius:5px!important;background:#f4f8f7!important;color:#42535a!important;font:700 10px/1.15 Arial,sans-serif!important;white-space:nowrap!important;box-sizing:border-box!important}
    html body.ag-profile-mode .missions .mission-skill-chip b{color:#d9a923!important;font:900 12px/1 Arial,sans-serif!important}
    html body.ag-profile-mode .missions .mission-skill-chip span{font:700 10px/1.15 Arial,sans-serif!important;color:#42535a!important}
    html body.ag-profile-mode .missions .mission-skill-chip strong{display:inline!important;margin:0!important;padding:0!important;color:#238d72!important;font:900 10px/1.15 Arial,sans-serif!important}
    @media(max-width:1100px){html body.ag-profile-mode .missions .mission-skill-label{font-size:9px!important}.missions .mission-skill-chip,.missions .mission-skill-chip span,.missions .mission-skill-chip strong{font-size:9px!important}.missions .mission-skill-chip b{font-size:11px!important}}
    @media(max-width:900px){html body.ag-profile-mode .missions .mission-skill-stars{gap:4px!important}.missions .mission-skill-label{font-size:8px!important}.missions .mission-skill-chip,.missions .mission-skill-chip span,.missions .mission-skill-chip strong{font-size:8px!important}.missions .mission-skill-chip b{font-size:10px!important}}
  `;
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,500);setTimeout(apply,1500);});
})();
