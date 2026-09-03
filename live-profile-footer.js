/* AG WORLD — live profile footer. Database-backed, premium visual layer. */
(()=>{
const USER_ID='user-nico-van-rooyen';
const API=(window.AG_WORLD_CONFIG&&window.AG_WORLD_CONFIG.API_BASE_URL)||(window.AG_WORLD_API&&window.AG_WORLD_API.baseUrl)||'https://ag-world-api.onrender.com';
let profileData=null, leaderboardData=null, loading=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.max(0,Math.min(100,Number(a)/Number(b)*100)):0;
async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`${r.status}`);return r.json();}
function loadCssLast(){if(document.getElementById('ag-live-footer-css-last'))return;const l=document.createElement('link');l.id='ag-live-footer-css-last';l.rel='stylesheet';l.href='live-profile-footer.css?v=20260906-final';document.head.appendChild(l);}
function badgeIcon(i){return ['✦','★','◆','✧','⬢'][i]||'★';}
function skillTree(p){
 const achievements=Array.isArray(p.achievements)?p.achievements:[];
 const names=achievements.map(a=>String(a.achievementName||'').toLowerCase());
 const has=term=>names.some(n=>n.includes(term));
 const level=Number(p.level)||0;
 const nodes=[
  {name:'Technical knowledge',on:level>=4||has('technical')},
  {name:'Operational knowledge',on:level>=5||has('operational')},
  {name:'Product Knowledge',on:level>=3||has('product')||has('presentation')},
  {name:'Management skills',on:level>=7||has('management')},
  {name:'People skills',on:level>=6||has('people')||has('meeting')}
 ];
 return `<div class="ag-skill-tree">${nodes.map((n,i)=>`<div class="ag-skill-node ${n.on?'unlocked':'locked'}" data-node="${i}"><div class="ag-skill-orb"><span>${n.on?'✓':'+'}</span></div><div class="ag-skill-name">${esc(n.name)}</div><div class="ag-skill-state">${n.on?'MASTERED':'IN DEVELOPMENT'}</div></div>`).join('')}<div class="ag-skill-line l1"></div><div class="ag-skill-line l2"></div><div class="ag-skill-line l3"></div><div class="ag-skill-line l4"></div></div>`;
}
function markup(p,l){
 const achievements=Array.isArray(p.achievements)?p.achievements:[];
 const progress=pct(p.xp,p.xpToNextLevel);
 const leaders=(Array.isArray(l?.leaders)?l.leaders:[]).slice(0,5);
 const rows=leaders.map((r,i)=>`<div class="ag-leader-row ${r.id===p.id?'current':''}"><span class="ag-rank">${i+1}</span><span>${esc(r.name)}</span><span class="ag-leader-xp">${Number(r.xp).toLocaleString()} XP</span></div>`).join('')||'<div class="ag-progress-note">No regional data available</div>';
 const badges=achievements.slice(0,5).map((a,i)=>`<div class="ag-badge-item"><div class="ag-badge badge-${i%5}"><div class="ag-badge-ribbon"></div><div class="ag-badge-face"><span>${badgeIcon(i)}</span></div></div><span>${esc(a.achievementName)}</span></div>`).join('')||'<div class="ag-progress-note">No achievements recorded</div>';
 return `<section class="pf-section live-progress"><div class="pf-title">YOUR PROGRESS</div><div class="ag-progress-row"><div class="ag-level-shield"><b>${esc(p.level)}</b><span>LEVEL</span></div><div class="ag-progress-main"><strong>${Number(p.xp).toLocaleString()} / ${Number(p.xpToNextLevel).toLocaleString()} XP</strong><div class="ag-progress-bar"><i style="width:${progress}%"></i></div><div class="ag-progress-foot"><span>Level ${esc(p.level)}</span><span>${Math.round(progress)}%</span></div></div></div><div class="ag-badges-label">BADGES EARNED</div><div class="ag-badges">${badges}</div></section><section class="pf-section live-skills"><div class="pf-title">SKILL TREE</div><div class="ag-skill-caption">Build your professional mastery</div>${skillTree(p)}</section><section class="pf-section live-leaderboard"><div class="pf-title">${esc(l?.territory||p.territory)} LEADERBOARD</div><div class="ag-leader-list">${rows}</div><div class="ag-leader-link">Regional position: ${esc(p.regionalPosition??'—')}</div></section>`;
}
function render(){const f=document.querySelector('.bottom');if(!f||!profileData)return;f.classList.add('ag-profile-footer');f.innerHTML=markup(profileData,leaderboardData||{territory:profileData.territory,leaders:[]});}
async function init(){loadCssLast();if(loading)return;const f=document.querySelector('.bottom');if(!f)return;loading=true;try{const p=await json(`${API}/api/users/${USER_ID}/profile`);profileData=p;try{leaderboardData=await json(`${API}/api/users/${USER_ID}/leaderboard`);}catch(e){leaderboardData={territory:p.territory,leaders:[]};}render();}catch(e){console.warn('AG World profile API unavailable:',e);}finally{loading=false;}}
function protect(){const f=document.querySelector('.bottom');if(!f)return;if(profileData&&!f.querySelector('.live-progress'))render();}
window.agWorldRefreshProfileFooter=init;
document.addEventListener('DOMContentLoaded',()=>{loadCssLast();init();const f=document.querySelector('.bottom');if(f)new MutationObserver(protect).observe(f,{childList:true,subtree:false});});
setTimeout(init,800);setTimeout(init,2000);
})();
