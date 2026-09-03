/* AG WORLD — final footer layout guard. Keeps the Skill Tree graph visible between Badges and Leaderboard. */
(()=>{
const skills=[
  {key:'technical',name:'TECHNICAL',icon:'⚙'},
  {key:'operational',name:'OPERATIONAL',icon:'◈'},
  {key:'product',name:'PRODUCT',icon:'✦'},
  {key:'management',name:'MANAGEMENT',icon:'◆'},
  {key:'people',name:'PEOPLE',icon:'●'}
];
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function values(){const v=window.AG_WORLD_SKILL_TOTALS||{};return skills.map(s=>Math.max(0,Number(v[s.key])||0))}
function skillMarkup(){
  const earned=values();
  const total=earned.reduce((a,b)=>a+b,0);
  return `<section class="pf-section live-skills final-skill-tree"><div class="pf-title">SKILL TREE</div><div class="final-skill-subtitle">${total} ★ TOTAL SKILL STARS</div><div class="final-skill-graph" aria-label="Skill Tree graph"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="50" x2="18" y2="22"/><line x1="50" y1="50" x2="82" y2="22"/><line x1="50" y1="50" x2="88" y2="72"/><line x1="50" y1="50" x2="50" y2="90"/><line x1="50" y1="50" x2="12" y2="72"/></svg><div class="final-skill-core"><b>AG</b><span>SKILLS</span></div>${skills.map((s,i)=>`<div class="final-skill-node n${i}" data-skill="${s.key}"><div class="final-skill-orb">${s.icon}</div><b>${esc(s.name)}</b><span>${earned[i]} ★</span></div>`).join('')}</div></section>`;
}
function fix(){
  const f=document.querySelector('.bottom.ag-profile-footer,.bottom');
  if(!f)return;
  f.classList.add('ag-profile-footer');
  const old=f.querySelector('.final-skill-tree');if(old)old.remove();
  const sections=[...f.children];
  let leader=f.querySelector('.live-leaderboard');
  if(!leader)leader=sections.find(s=>(s.textContent||'').toUpperCase().includes('LEADERBOARD'));
  if(!leader)return;
  const holder=document.createElement('div');holder.innerHTML=skillMarkup();
  f.insertBefore(holder.firstElementChild,leader);
  f.querySelectorAll('.pf-section').forEach(s=>{const title=(s.querySelector('.pf-title')?.textContent||'').toUpperCase();if(title.includes('NEXT LEVEL REWARD'))s.remove()});
}
function loadCss(){if(document.getElementById('ag-final-footer-css'))return;const l=document.createElement('link');l.id='ag-final-footer-css';l.rel='stylesheet';l.href='footer-final-layout.css?v=20260913';document.head.appendChild(l)}
function start(){loadCss();fix();const f=document.querySelector('.bottom');if(f)new MutationObserver(()=>{if(!f.querySelector('.final-skill-tree'))fix()}).observe(f,{childList:true});setTimeout(fix,500);setTimeout(fix,1200);setTimeout(fix,2500)}
document.addEventListener('DOMContentLoaded',start);setTimeout(start,1500)})();
