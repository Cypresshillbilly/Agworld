/* AG WORLD — Skill Tree graph. Renders in the footer and in the employee profile window. */
(()=>{
const SKILLS=[
  {key:'technical',name:'Technical knowledge',short:'TECHNICAL',icon:'⚙'},
  {key:'operational',name:'Operational knowledge',short:'OPERATIONAL',icon:'◈'},
  {key:'product',name:'Product knowledge',short:'PRODUCT',icon:'✦'},
  {key:'management',name:'Management skills',short:'MANAGEMENT',icon:'◆'},
  {key:'people',name:'People skills',short:'PEOPLE',icon:'●'}
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function earned(){const v=window.AG_WORLD_SKILL_TOTALS||{};return SKILLS.map(s=>Math.max(0,Number(v[s.key])||0));}
function modalMarkup(){
  const vals=earned(),total=vals.reduce((a,b)=>a+b,0);
  return `<section class="ag-skill-tree"><div class="ag-skill-tree-head"><div><span>PROFESSIONAL DEVELOPMENT</span><h3>SKILL TREE</h3></div><div class="ag-skill-total"><b>${total}</b><small>TOTAL STARS EARNED</small></div></div><div class="ag-skill-graph"><svg class="ag-skill-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="50" x2="18" y2="20"/><line x1="50" y1="50" x2="82" y2="20"/><line x1="50" y1="50" x2="88" y2="75"/><line x1="50" y1="50" x2="50" y2="91"/><line x1="50" y1="50" x2="12" y2="75"/></svg><div class="ag-skill-core"><b>AG</b><span>WORLD</span><small>SKILLS</small></div>${SKILLS.map((s,i)=>`<div class="ag-skill-node ${['tl','tr','br','bc','bl'][i]}" data-skill="${s.key}"><div class="ag-skill-icon">${s.icon}</div><div class="ag-skill-node-copy"><b>${esc(s.short)}</b><span data-stars>${vals[i]} ★</span></div><div class="ag-skill-meter"><i data-meter style="width:${Math.min(100,Math.round(vals[i]/25*100))}%"></i></div><small data-detail>${vals[i]} / 25 stars</small></div>`).join('')}</div><div class="ag-skill-tree-note">Each completed mission can award stars to multiple skills.</div></section>`;
}
function renderModal(){
  const body=document.querySelector('.ag-user-profile-body');
  if(!body||body.querySelector('.ag-skill-tree'))return;
  body.insertAdjacentHTML('beforeend',modalMarkup());
}
function refreshModal(){
  const tree=document.querySelector('.ag-user-profile-body .ag-skill-tree');if(!tree)return;
  const vals=earned();tree.querySelector('.ag-skill-total b').textContent=vals.reduce((a,b)=>a+b,0);
  SKILLS.forEach((s,i)=>{const n=tree.querySelector(`[data-skill="${s.key}"]`);if(!n)return;n.querySelector('[data-stars]').textContent=`${vals[i]} ★`;n.querySelector('[data-meter]').style.width=`${Math.min(100,Math.round(vals[i]/25*100))}%`;n.querySelector('[data-detail]').textContent=`${vals[i]} / 25 stars`;});
}
function injectStyle(){
  if(document.getElementById('ag-skill-tree-style'))return;
  const style=document.createElement('style');style.id='ag-skill-tree-style';style.textContent=`
.ag-skill-tree{margin-top:16px;border:1px solid #dce4e7;border-radius:10px;background:linear-gradient(145deg,#fbfcfc,#f2f6f5);overflow:hidden}.ag-skill-tree-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #dce4e7;background:#fff}.ag-skill-tree-head span{font:900 8px Arial,sans-serif;letter-spacing:1px;color:#7a898f}.ag-skill-tree-head h3{margin:3px 0 0;font:900 16px Arial,sans-serif;color:#263740}.ag-skill-total{text-align:right}.ag-skill-total b{display:block;font:900 21px Arial,sans-serif;color:#4b9843}.ag-skill-total small{font:800 7px Arial,sans-serif;color:#7a898f;letter-spacing:.5px}.ag-skill-graph{position:relative;height:360px;margin:2px 8px 0}.ag-skill-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.ag-skill-lines line{stroke:#aebfc2;stroke-width:.55;stroke-dasharray:2 1.5}.ag-skill-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:86px;height:86px;border-radius:50%;background:linear-gradient(145deg,#27434f,#102630);border:5px solid #dce8e2;box-shadow:0 7px 18px rgba(20,39,51,.2),inset 2px 2px 3px rgba(255,255,255,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;z-index:3}.ag-skill-core b{font:900 23px Arial,sans-serif}.ag-skill-core span{font:900 7px Arial,sans-serif;letter-spacing:1px}.ag-skill-core small{margin-top:3px;color:#8bd06b;font:900 6px Arial,sans-serif;letter-spacing:.8px}.ag-skill-node{position:absolute;width:138px;padding:9px 9px 8px;border:1px solid #d7e1e3;border-top:3px solid #55a55b;border-radius:8px;background:#fff;box-shadow:0 4px 12px rgba(35,54,62,.1);z-index:4;box-sizing:border-box}.ag-skill-node.tl{left:2%;top:4%}.ag-skill-node.tr{right:2%;top:4%}.ag-skill-node.br{right:0;top:62%}.ag-skill-node.bc{left:50%;bottom:0;transform:translateX(-50%)}.ag-skill-node.bl{left:0;top:62%}.ag-skill-icon{float:left;width:28px;height:28px;margin-right:7px;border-radius:7px;background:#4d9955;color:#fff;display:flex;align-items:center;justify-content:center;font:900 13px Arial,sans-serif}.ag-skill-node-copy b{display:block;color:#31424a;font:900 8px Arial,sans-serif;line-height:1.15}.ag-skill-node-copy span{display:block;margin-top:2px;color:#d29e19;font:900 10px Arial,sans-serif}.ag-skill-meter{clear:both;height:6px;margin-top:8px;background:#e4eaeb;border-radius:5px;overflow:hidden}.ag-skill-meter i{display:block;height:100%;background:#55a55b;border-radius:5px}.ag-skill-node>small{display:block;margin-top:3px;color:#819097;font:700 6px Arial,sans-serif}.ag-skill-tree-note{padding:9px 14px 11px;border-top:1px solid #e2e8e9;color:#718087;font:700 8px Arial,sans-serif;line-height:1.35}@media(max-width:650px){.ag-skill-graph{height:320px}.ag-skill-node{width:108px}.ag-skill-core{width:70px;height:70px}}
`;
  document.head.appendChild(style);
}
function start(){injectStyle();renderModal();refreshModal();setTimeout(renderModal,500);setTimeout(renderModal,1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.AG_WORLD_RENDER_SKILL_TREE=()=>{renderModal();refreshModal();};
new MutationObserver(()=>{if(document.querySelector('.ag-user-profile-body')&&!document.querySelector('.ag-user-profile-body .ag-skill-tree'))renderModal();}).observe(document.body,{childList:true,subtree:true});
})();
