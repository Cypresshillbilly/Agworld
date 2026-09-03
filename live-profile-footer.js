/* AG WORLD — live profile footer. Database-backed, premium visual layer. */
(()=>{
const USER_ID='user-nico-van-rooyen';
const API=(window.AG_WORLD_CONFIG&&window.AG_WORLD_CONFIG.API_BASE_URL)||(window.AG_WORLD_API&&window.AG_WORLD_API.baseUrl)||'https://ag-world-api.onrender.com';
let profileData=null, leaderboardData=null, loading=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.max(0,Math.min(100,Number(a)/Number(b)*100)):0;
async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`${r.status}`);return r.json();}
function loadCssLast(){
 if(document.getElementById('ag-live-footer-css-last'))return;
 const l=document.createElement('link');l.id='ag-live-footer-css-last';l.rel='stylesheet';l.href='live-profile-footer.css?v=20260904-final';document.head.appendChild(l);
}
function markup(p,l){
 const achievements=Array.isArray(p.achievements)?p.achievements:[];
 const rewards=Array.isArray(p.rewards)?p.rewards:[];
 const next=rewards.find(r=>r.status==='locked')||rewards.find(r=>Number(r.requiredLevel)>Number(p.level));
 const progress=pct(p.xp,p.xpToNextLevel);
 const leaders=(Array.isArray(l?.leaders)?l.leaders:[]).slice(0,5);
 const rows=leaders.map((r,i)=>`<div class="ag-leader-row ${r.id===p.id?'current':''}"><span class="ag-rank">${i+1}</span><span>${esc(r.name)}</span><span class="ag-leader-xp">${Number(r.xp).toLocaleString()} XP</span></div>`).join('')||'<div class="ag-progress-note">No regional data available</div>';
 const badges=achievements.slice(0,5).map((a,i)=>`<div class="ag-badge-item"><div class="ag-badge ${i%3===1?'gold':i%3===2?'purple':''}"><span>${['◆','★','◇','✦','●'][i]||'★'}</span></div><span>${esc(a.achievementName)}</span></div>`).join('')||'<div class="ag-progress-note">No achievements recorded</div>';
 return `<section class="pf-section live-progress"><div class="pf-title">YOUR PROGRESS</div><div class="ag-progress-row"><div class="ag-level-shield"><b>${esc(p.level)}</b><span>LEVEL</span></div><div class="ag-progress-main"><strong>${Number(p.xp).toLocaleString()} / ${Number(p.xpToNextLevel).toLocaleString()} XP</strong><div class="ag-progress-bar"><i style="width:${progress}%"></i></div><div class="ag-progress-foot"><span>Level ${esc(p.level)}</span><span>${Math.round(progress)}%</span></div><div class="ag-progress-note">${next?`Next reward: ${esc(next.rewardName)}`:'All current rewards unlocked'}</div></div></div></section><section class="pf-section live-badges"><div class="pf-title">BADGES EARNED</div><div class="ag-badges">${badges}</div></section><section class="pf-section live-leaderboard"><div class="pf-title">${esc(l?.territory||p.territory)} LEADERBOARD</div><div class="ag-leader-list">${rows}</div><div class="ag-leader-link">Regional position: ${esc(p.regionalPosition??'—')}</div></section><section class="pf-section live-reward"><div class="pf-title">NEXT LEVEL REWARD</div><div class="ag-reward-drone" aria-hidden="true"><div class="ag-rotor a"></div><div class="ag-rotor b"></div><div class="ag-drone-arm left"></div><div class="ag-drone-arm right"></div><div class="ag-drone-body"></div></div><div class="ag-reward-title">${next?esc(next.rewardName):'No pending reward'}</div><div class="ag-reward-sub">${next?.requiredLevel?`Unlocks at Level ${esc(next.requiredLevel)}`:'All current rewards unlocked'}</div><div class="ag-reward-bar"><i style="width:${progress}%"></i></div><div class="ag-reward-xp">${next?.requiredXp?`${Math.max(0,Number(next.requiredXp)-Number(p.xp)).toLocaleString()} XP to go`:'Complete'}</div></section>`;
}
function render(){
 const f=document.querySelector('.bottom');
 if(!f||!profileData)return;
 f.classList.add('ag-profile-footer');
 f.innerHTML=markup(profileData,leaderboardData||{territory:profileData.territory,leaders:[]});
}
async function init(){
 loadCssLast();
 if(loading)return;
 const f=document.querySelector('.bottom');if(!f)return;
 loading=true;
 try{
  const p=await json(`${API}/api/users/${USER_ID}/profile`);
  profileData=p;
  try{leaderboardData=await json(`${API}/api/users/${USER_ID}/leaderboard`);}catch(e){leaderboardData={territory:p.territory,leaders:[]};}
  render();
 }catch(e){
  console.warn('AG World profile API unavailable:',e);
  /* Do not replace an existing footer with an error screen. */
 }finally{loading=false;}
}
function protect(){
 const f=document.querySelector('.bottom');if(!f)return;
 if(profileData && !f.querySelector('.live-progress')) render();
}
window.agWorldRefreshProfileFooter=init;
document.addEventListener('DOMContentLoaded',()=>{
 loadCssLast();
 init();
 const f=document.querySelector('.bottom');
 if(f)new MutationObserver(protect).observe(f,{childList:true,subtree:false});
});
setTimeout(init,800);
setTimeout(init,2000);
})();
