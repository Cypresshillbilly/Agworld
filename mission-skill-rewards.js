/* AG WORLD — live mission skill-star display. */
(()=>{
  const rewards={
    opportunity:[['People',2],['Management',1]],
    visit:[['Management',2],['People',1],['Product',1]],
    training:[['Technical',3],['Product',1]]
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function apply(){
    document.querySelectorAll('.missions .mission').forEach(card=>{
      const data=rewards[card.dataset.action];
      if(!data)return;
      const old=card.querySelector('.mission-skill-stars');
      if(old)old.remove();
      const row=document.createElement('div');
      row.className='mission-skill-stars';
      row.setAttribute('aria-label','Skill stars awarded by this mission');
      row.innerHTML=data.map(([skill,stars])=>`<span class="mission-skill-chip"><b>★${stars}</b><span>${esc(skill)}</span></span>`).join('');
      const reward=card.querySelector('.reward');
      if(reward)reward.insertAdjacentElement('afterend',row); else card.appendChild(row);
    });
  }
  const style=document.createElement('style');
  style.textContent=`
    html body.ag-profile-mode .missions .mission-skill-stars{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;margin:6px 24px 0 0!important;padding:5px 0 0!important;border-top:1px solid #edf1f2!important;width:auto!important;box-sizing:border-box!important;position:relative!important;z-index:5!important}
    html body.ag-profile-mode .missions .mission-skill-chip{display:inline-flex!important;align-items:center!important;gap:4px!important;padding:3px 6px!important;border:1px solid #cbd8da!important;border-radius:4px!important;background:#f5f9f8!important;white-space:nowrap!important;box-sizing:border-box!important;height:22px!important}
    html body.ag-profile-mode .missions .mission-skill-chip b{display:inline-block!important;color:#d4a51f!important;font:900 13px/1 Arial,sans-serif!important;letter-spacing:0!important}
    html body.ag-profile-mode .missions .mission-skill-chip span{display:inline-block!important;color:#40525a!important;font:900 10px/1 Arial,sans-serif!important}
    @media(max-width:1100px){html body.ag-profile-mode .missions .mission-skill-stars{gap:4px!important;margin-top:5px!important;padding-top:4px!important}.missions .mission-skill-chip{height:20px!important;padding:2px 5px!important}.missions .mission-skill-chip b{font-size:12px!important}.missions .mission-skill-chip span{font-size:9px!important}}
    @media(max-width:900px){html body.ag-profile-mode .missions .mission-skill-chip{height:19px!important;padding:2px 4px!important}.missions .mission-skill-chip b{font-size:11px!important}.missions .mission-skill-chip span{font-size:8px!important}}
  `;
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',apply);
  [250,600,1200,2200].forEach(ms=>setTimeout(apply,ms));
  const observer=new MutationObserver(muts=>{
    if(muts.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.mission')||n.querySelector?.('.mission')))))apply();
  });
  document.addEventListener('DOMContentLoaded',()=>observer.observe(document.querySelector('.missions')||document.body,{childList:true,subtree:true}));
  window.agWorldApplyMissionSkillRewards=apply;
})();
