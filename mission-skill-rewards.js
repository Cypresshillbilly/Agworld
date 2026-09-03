/* AG WORLD — mission skill-star display
   Mission definitions live in the database. This UI layer mirrors the initial seeded
   missions until the mission API is connected, and is intentionally data-shaped so it
   can be replaced by API data without changing the card renderer. */
(()=>{
  const rewards={
    'Set Meeting with Top Client':[
      ['People skills',2],
      ['Management skills',1]
    ],
    'Follow Up Opportunity':[
      ['Management skills',2],
      ['People skills',1],
      ['Product Knowledge',1]
    ],
    'DJI Repair Assessment':[
      ['Technical knowledge',3],
      ['Product Knowledge',1]
    ]
  };
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function apply(){
    document.querySelectorAll('.missions .mission').forEach(card=>{
      if(card.querySelector('.mission-skill-stars'))return;
      const title=card.querySelector('strong')?.textContent?.trim();
      const data=rewards[title];
      if(!data)return;
      const row=document.createElement('div');
      row.className='mission-skill-stars';
      row.setAttribute('aria-label','Skill stars awarded by this mission');
      row.innerHTML='<span class="mission-skill-label">SKILL STARS</span>'+data.map(([skill,stars])=>`<span class="mission-skill-chip"><b>★</b> ${esc(skill)} +${stars}</span>`).join('');
      card.appendChild(row);
    });
  }
  const style=document.createElement('style');
  style.textContent=`
    .missions .mission-skill-stars{display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin-top:7px;padding-top:6px;border-top:1px solid #edf1f2}
    .missions .mission-skill-label{width:100%;color:#7b898f;font:900 5.5px Arial,sans-serif;letter-spacing:.5px}
    .missions .mission-skill-chip{display:inline-flex;align-items:center;gap:2px;padding:3px 4px;border:1px solid #d7e1e3;border-radius:4px;background:#f7faf9;color:#42535a;font:800 5px Arial,sans-serif;white-space:nowrap}
    .missions .mission-skill-chip b{color:#e4b52b;font-size:8px;line-height:1}
  `;
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,500);setTimeout(apply,1500);});
})();
