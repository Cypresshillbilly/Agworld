/* AG WORLD — live mission skill-star display. Restores rewards after the live mission renderer rebuilds cards. */
(()=>{
  const rewards={opportunity:[['People',2],['Management',1]],visit:[['Management',2],['People',1],['Product',1]],training:[['Technical',3],['Product',1]]};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function actionFor(card){
    if(rewards[card.dataset.action])return card.dataset.action;
    const t=(card.querySelector('strong')?.textContent||'').toLowerCase();
    if(t.includes('meeting')||t.includes('uncovered farm')||t.includes('opportunity'))return'opportunity';
    if(t.includes('service outcome')||t.includes('follow up'))return'visit';
    if(t.includes('repair assessment')||t.includes('training')||t.includes('knowledge challenge'))return'training';
    return null;
  }
  function apply(){document.querySelectorAll('html body.ag-profile-mode .missions .mission').forEach(card=>{const action=actionFor(card);if(!action)return;card.dataset.action=action;const old=card.querySelector('.mission-skill-stars');if(old)old.remove();const row=document.createElement('div');row.className='mission-skill-stars';row.innerHTML=`<span class="mission-skill-label">SKILL STARS</span><div class="mission-skill-list">${rewards[action].map(([skill,n])=>`<span class="mission-skill-chip"><b>★${n}</b><span>${esc(skill)}</span></span>`).join('')}</div>`;const reward=card.querySelector('.reward');if(reward)reward.insertAdjacentElement('afterend',row);else card.appendChild(row);});}
  const style=document.createElement('style');style.textContent=`
html body.ag-profile-mode .missions .mission-skill-stars{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:nowrap!important;margin:6px 22px 0 0!important;padding:5px 0 0!important;border-top:1px solid #e1e9ea!important;box-sizing:border-box!important;position:relative!important;z-index:20!important}
html body.ag-profile-mode .missions .mission-skill-label{display:block!important;flex:0 0 auto!important;color:#5b6d74!important;font:900 9px/1 Arial,sans-serif!important;letter-spacing:.35px!important;white-space:nowrap!important}
html body.ag-profile-mode .missions .mission-skill-list{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important;overflow:visible!important}
html body.ag-profile-mode .missions .mission-skill-chip{display:inline-flex!important;align-items:center!important;gap:4px!important;height:22px!important;padding:3px 6px!important;border:1px solid #c7d6d8!important;border-radius:5px!important;background:#f2f7f5!important;box-sizing:border-box!important;white-space:nowrap!important}
html body.ag-profile-mode .missions .mission-skill-chip b{display:inline-block!important;color:#d4a31f!important;font:900 13px/1 Arial,sans-serif!important}
html body.ag-profile-mode .missions .mission-skill-chip span{display:inline-block!important;color:#34474f!important;font:900 10px/1 Arial,sans-serif!important}
@media(max-width:1100px){html body.ag-profile-mode .missions .mission-skill-label{font-size:8px!important}.missions .mission-skill-chip{height:20px!important;padding:2px 5px!important}.missions .mission-skill-chip b{font-size:12px!important}.missions .mission-skill-chip span{font-size:9px!important}}
@media(max-width:900px){html body.ag-profile-mode .missions .mission-skill-stars{gap:4px!important}.missions .mission-skill-label{font-size:7px!important}.missions .mission-skill-chip{height:19px!important;padding:2px 4px!important}.missions .mission-skill-chip b{font-size:11px!important}.missions .mission-skill-chip span{font-size:8px!important}}
`;document.head.appendChild(style);
  let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(apply,40)};
  function start(){apply();[100,300,700,1500,3000].forEach(ms=>setTimeout(apply,ms));new MutationObserver(schedule).observe(document.querySelector('.missions')||document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.agWorldApplyMissionSkillRewards=apply;
})();
