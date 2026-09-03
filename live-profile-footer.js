/* AG WORLD — live profile footer. Reads real user/profile/leaderboard data from API. */
(()=>{
const USER_ID='user-nico-van-rooyen';
const API=(window.AG_WORLD_CONFIG&&window.AG_WORLD_CONFIG.API_BASE_URL)||(window.AG_WORLD_API&&window.AG_WORLD_API.baseUrl)||'https://ag-world-api.onrender.com';
let rendered=false;
let loading=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xpPct=(xp,next)=>next?Math.max(0,Math.min(100,(Number(xp)/Number(next))*100)):0;
async function getJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${url}`);return r.json();}
async function load(){
 const profile=await getJson(`${API}/api/users/${USER_ID}/profile`);
 let leaderboard={territory:profile.territory,leaders:[]};
 try{leaderboard=await getJson(`${API}/api/users/${USER_ID}/leaderboard`);}catch(e){console.warn('AG World leaderboard unavailable:',e);}
 return {p:profile,l:leaderboard};
}
function render({p,l}){
 const f=document.querySelector('.bottom');if(!f)return;
 f.classList.add('ag-profile-footer');
 const earned=Array.isArray(p.achievements)?p.achievements:[];
 const rewards=Array.isArray(p.rewards)?p.rewards:[];
 const next=rewards.find(r=>r.status==='locked')||rewards.find(r=>Number(r.requiredLevel)>Number(p.level));
 const pct=xpPct(p.xp,p.xpToNextLevel);
 const leaders=(Array.isArray(l.leaders)?l.leaders:[]).slice(0,5);
 const leaderRows=leaders.length?leaders.map((r,i)=>`<div class="ag-leader-row ${r.id===p.id?'current':''}"><span class="ag-rank">${i+1}</span><span>${esc(r.name)}</span><span class="ag-leader-xp">${Number(r.xp).toLocaleString()} XP</span></div>`).join(''):`<div class="ag-progress-note">Regional leaderboard unavailable</div>`;
 const badgeRows=earned.slice(0,5).map((a,i)=>`<div class="ag-badge-item"><div class="ag-badge ${i%3===1?'gold':i%3===2?'purple':''}">★</div><span>${esc(a.achievementName)}</span></div>`).join('')||'<div class="ag-progress-note">No achievements recorded yet</div>';
 f.innerHTML=`<section class="pf-section live-progress"><div class="pf-title">YOUR PROGRESS</div><div class="ag-progress-row"><div class="ag-level-shield"><b>${esc(p.level)}</b><span>LEVEL</span></div><div class="ag-progress-main"><strong>${Number(p.xp).toLocaleString()} / ${Number(p.xpToNextLevel).toLocaleString()} XP</strong><div class="ag-progress-bar"><i style="width:${pct}%"></i></div><div class="ag-progress-foot"><span>Level ${esc(p.level)}</span><span>${Math.round(pct)}%</span></div><div class="ag-progress-note">${next?`Next reward: ${esc(next.rewardName)}`:'All current rewards unlocked'}</div></div></div></section><section class="pf-section live-badges"><div class="pf-title">BADGES EARNED</div><div class="ag-badges">${badgeRows}</div></section><section class="pf-section live-leaderboard"><div class="pf-title">${esc(l.territory||p.territory)} LEADERBOARD</div><div class="ag-leader-list">${leaderRows}</div><div class="ag-leader-link">Regional position: ${esc(p.regionalPosition??'—')}</div></section><section class="pf-section live-reward"><div class="pf-title">NEXT LEVEL REWARD</div><div class="ag-reward-drone" aria-hidden="true"><div class="ag-rotor a"></div><div class="ag-rotor b"></div><div class="ag-drone-arm left"></div><div class="ag-drone-arm right"></div><div class="ag-drone-body"></div></div><div class="ag-reward-title">${next?esc(next.rewardName):'No pending reward'}</div><div class="ag-reward-sub">${next?.requiredLevel?`Unlocks at Level ${esc(next.requiredLevel)}`:'All current rewards unlocked'}</div><div class="ag-reward-bar"><i style="width:${pct}%"></i></div><div class="ag-reward-xp">${next?.requiredXp?`${Math.max(0,Number(next.requiredXp)-Number(p.xp)).toLocaleString()} XP to go`:'Complete'}</div></section>`;
 rendered=true;
}
async function init(){
 if(loading)return;
 const f=document.querySelector('.bottom');
 if(!f)return;
 loading=true;
 try{render(await load());}
 catch(e){
  console.error('AG World live footer failed:',e);
  /* Never destroy a successfully rendered live footer because a later refresh fails. */
  if(!rendered&&!f.querySelector('.live-progress')){
    f.innerHTML='<section class="pf-section footer-connection-error"><div class="pf-title">PROFILE DATA</div><div class="ag-progress-note">Connecting to live profile data…</div></section>';
  }
 }finally{loading=false;}
}
window.agWorldRefreshProfileFooter=init;
document.addEventListener('DOMContentLoaded',init);
setTimeout(init,1200);
})();
