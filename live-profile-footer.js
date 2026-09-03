/* AG WORLD — live profile footer. Single-owner layout: Progress / Badges / Leaderboard. */
(()=>{
const USER_ID='user-nico-van-rooyen';
const API=(window.AG_WORLD_CONFIG&&window.AG_WORLD_CONFIG.API_BASE_URL)||(window.AG_WORLD_API&&window.AG_WORLD_API.baseUrl)||'https://ag-world-api.onrender.com';
let profileData=null,leaderboardData=null,loading=false;
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.max(0,Math.min(100,Number(a)/Number(b)*100)):0;
async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`${r.status}`);return r.json()}
function loadCssLast(){
 if(!document.getElementById('ag-live-footer-css-last')){const l=document.createElement('link');l.id='ag-live-footer-css-last';l.rel='stylesheet';l.href='live-profile-footer.css?v=20260921';document.head.appendChild(l)}
 if(!document.getElementById('ag-footer-layout-fix-css')){const f=document.createElement('link');f.id='ag-footer-layout-fix-css';f.rel='stylesheet';f.href='footer-layout-fix.css?v=20260921';document.head.appendChild(f)}
}
function badgeIcon(i){const icons=[
'<svg viewBox="0 0 48 48"><path d="M10 25l7-7 8 5 6-8 7 6"/><path d="M7 29l6 6 7-7 7 6 14-14"/><circle cx="17" cy="18" r="3"/><circle cx="31" cy="15" r="3"/></svg>',
'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="13"/><path d="M24 8v8M24 32v8M8 24h8M32 24h8M14 14l6 6M28 28l6 6"/><path d="M24 17l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.5-4.4 6.2-.9z"/></svg>',
'<svg viewBox="0 0 48 48"><path d="M16 9h16v7c0 8-4 13-8 13s-8-5-8-13z"/><path d="M16 13H9v4c0 6 4 9 9 9M32 13h7v4c0 6-4 9-9 9"/><path d="M24 29v8M17 40h14"/><path d="M20 14h8"/></svg>',
'<svg viewBox="0 0 48 48"><path d="M24 7l4.8 10 10.8 1.5-7.8 7.5 1.9 10.7L24 32l-9.7 4.7 1.9-10.7-7.8-7.5L19.2 17z"/><path d="M24 12v18M18 20h12"/></svg>',
'<svg viewBox="0 0 48 48"><rect x="13" y="21" width="22" height="18" rx="3"/><path d="M18 21v-5c0-8 12-8 12 0v5"/><circle cx="24" cy="29" r="2"/><path d="M24 31v4"/></svg>'
];return icons[i%icons.length]}
function radarSkillData(p){const t=p.skillTotals||window.AG_WORLD_SKILL_TOTALS||{};return [['TECHNICAL','Technical',Number(t.technical||0)],['OPERATIONAL','Operational',Number(t.operational||0)],['PRODUCT','Product',Number(t.product||0)],['MANAGEMENT','Management',Number(t.management||0)],['PEOPLE','People',Number(t.people||0)]]}
function skillTree(p){
 const data=radarSkillData(p),cx=120,cy=76,r=53,max=Math.max(10,...data.map(d=>d[2]));
 const pointFor=(i,v)=>{const a=(-Math.PI/2)+(i*2*Math.PI/data.length),n=Math.max(0,Math.min(max,v))/max;return{x:cx+Math.cos(a)*r*n,y:cy+Math.sin(a)*r*n,ax:cx+Math.cos(a)*r,ay:cy+Math.sin(a)*r,a}};
 const pts=data.map((d,i)=>pointFor(i,d[2])),poly=pts.map(q=>`${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
 const grid=[1,.75,.5,.25].map(v=>data.map((d,i)=>{const q=pointFor(i,max*v);return`${q.x.toFixed(1)},${q.y.toFixed(1)}`}).join(' '));
 const axes=pts.map(q=>`<line x1="${cx}" y1="${cy}" x2="${q.ax.toFixed(1)}" y2="${q.ay.toFixed(1)}"/>`).join('');
 const labels=data.map((d,i)=>{const q=pts[i],lx=cx+Math.cos(q.a)*(r+12),ly=cy+Math.sin(q.a)*(r+12),anchor=Math.abs(Math.cos(q.a))<.2?'middle':(Math.cos(q.a)>0?'start':'end');return`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}">${d[0]}</text>`}).join('');
 return `<div class="final-radar-wrap"><svg class="final-radar-chart" viewBox="0 0 240 152" role="img" aria-label="Player skill radar"><g class="final-radar-grid">${grid.map(g=>`<polygon points="${g}"/>`).join('')}</g><g class="final-radar-axes">${axes}</g><polygon class="final-radar-fill" points="${poly}"/><polygon class="final-radar-outline" points="${poly}"/>${pts.map(q=>`<circle class="final-radar-points" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="2.8"/>`).join('')}<circle class="final-radar-center" cx="${cx}" cy="${cy}" r="4"/><g class="final-radar-labels">${labels}</g></svg></div>`;
}
function badgesMarkup(a){return a.slice(0,5).map((x,i)=>`<div class="ag-badge-item"><div class="ag-badge badge-${i%5}"><div class="ag-badge-ribbon"></div><div class="ag-badge-face"><span>${badgeIcon(i)}</span></div></div><span>${esc(x.achievementName)}</span></div>`).join('')||'<div class="ag-progress-note">No achievements recorded</div>'}
function markup(p,l){
 const a=Array.isArray(p.achievements)?p.achievements:[],progress=pct(p.xp,p.xpToNextLevel),leaders=(Array.isArray(l?.leaders)?l.leaders:[]).slice(0,5);
 const rows=leaders.map((r,i)=>`<div class="ag-leader-row ${r.id===p.id?'current':''}"><span class="ag-rank">${i+1}</span><span>${esc(r.name)}</span><span class="ag-leader-xp">${Number(r.xp).toLocaleString()} XP</span></div>`).join('')||'<div class="ag-progress-note">No regional data available</div>';
 return `<section class="pf-section live-progress"><div class="pf-title">YOUR PROGRESS</div><div class="ag-progress-row"><div class="ag-level-shield"><b>${esc(p.level)}</b><span>LEVEL</span></div><div class="ag-progress-main"><strong>${Number(p.xp).toLocaleString()} / ${Number(p.xpToNextLevel).toLocaleString()} XP</strong><div class="ag-progress-bar"><i style="width:${progress}%"></i></div><div class="ag-progress-foot"><span>Level ${esc(p.level)}</span><span>${Math.round(progress)}%</span></div></div></div></section><section class="pf-section live-badges"><div class="pf-title">BADGES EARNED</div><div class="ag-badges">${badgesMarkup(a)}</div></section><section class="pf-section live-skills"><div class="pf-title">SKILL PROFILE</div><div class="ag-skill-caption">PLAYER MASTERY</div>${skillTree(p)}</section><section class="pf-section live-leaderboard"><div class="pf-title">${esc(l?.territory||p.territory)} LEADERBOARD</div><div class="ag-leader-list">${rows}</div><div class="ag-leader-link">Regional position: ${esc(p.regionalPosition??'—')}</div></section>`;
}
function cleanFooter(f){if(!f)return;f.querySelectorAll('.ag-reward-drone,.ag-reward-title,.ag-reward-sub,.ag-reward-bar,.ag-reward-xp').forEach(e=>e.remove());[...f.children].forEach(x=>{if(!x.matches('.live-progress,.live-badges,.live-skills,.live-leaderboard'))x.remove()})}
function movePanels(){
 const f=document.querySelector('.bottom'),m=document.querySelector('.missions');if(!f||!m)return;
 /* Remove every previous destination copy before moving the single live nodes. */
 m.querySelectorAll('.missions-badges,.missions-skill-profile').forEach(e=>e.remove());
 const badges=f.querySelector('.live-badges'),skills=f.querySelector('.live-skills'),heading=m.querySelector('h1');
 if(skills){skills.classList.add('missions-skill-profile');skills.style.display='block';skills.removeAttribute('aria-hidden');if(heading)m.insertBefore(skills,heading);else m.insertBefore(skills,m.firstElementChild)}
 if(badges){badges.style.display='block';badges.removeAttribute('aria-hidden')}
}
function render(){const f=document.querySelector('.bottom');if(!f||!profileData)return;f.classList.add('ag-profile-footer');f.innerHTML=markup(profileData,leaderboardData||{territory:profileData.territory,leaders:[]});cleanFooter(f);movePanels()}
const fallbackProfile={id:USER_ID,name:'Nico van Rooyen',territory:'Territory 03',level:7,xp:6820,xpToNextLevel:10000,regionalPosition:2,achievements:[{achievementName:'First Meeting'},{achievementName:'Opportunity Finder'},{achievementName:'Presentation Pro'},{achievementName:'Proposal Pro'}],skillTotals:{technical:8,operational:6,product:11,management:9,people:13}};
async function init(){loadCssLast();if(loading)return;const f=document.querySelector('.bottom');if(!f)return;loading=true;try{const p=await json(`${API}/api/users/${USER_ID}/profile`);profileData=p;window.AG_WORLD_SKILL_TOTALS=p.skillTotals||window.AG_WORLD_SKILL_TOTALS||{};try{leaderboardData=await json(`${API}/api/users/${USER_ID}/leaderboard`)}catch(e){leaderboardData={territory:p.territory,leaders:[]}}render()}catch(e){console.warn('AG World profile API unavailable; using local profile fallback:',e);profileData=fallbackProfile;leaderboardData={territory:fallbackProfile.territory,leaders:[{id:USER_ID,name:'Nico van Rooyen',xp:fallbackProfile.xp},{id:'user-2',name:'Sarah K.',xp:6400},{id:'user-3',name:'David L.',xp:5980}]};window.AG_WORLD_SKILL_TOTALS=fallbackProfile.skillTotals;render()}finally{loading=false}}
function protect(){const f=document.querySelector('.bottom');if(!f||!profileData)return;cleanFooter(f);movePanels();if(!f.querySelector('.live-progress')||!f.querySelector('.live-badges')||!f.querySelector('.live-leaderboard'))render()}
window.agWorldRefreshProfileFooter=init;
document.addEventListener('DOMContentLoaded',()=>{loadCssLast();init();const f=document.querySelector('.bottom');if(f)new MutationObserver(protect).observe(f,{childList:true,subtree:true})});
setTimeout(init,800);setTimeout(init,2000);
})();