/* AG WORLD — Skill Tree graph
   Skill totals are intended to come from completed mission skill-star rewards.
   The graph is deliberately data-driven so the mission engine can replace the
   initial values without changing the visual component. */
(()=>{
  const SKILLS=[
    {key:'technical',name:'Technical knowledge',short:'TECHNICAL',icon:'⚙',color:'#3b7894',earned:0,max:25},
    {key:'operational',name:'Operational knowledge',short:'OPERATIONAL',icon:'◈',color:'#238f82',earned:0,max:25},
    {key:'product',name:'Product Knowledge',short:'PRODUCT',icon:'✦',color:'#6b5897',earned:0,max:25},
    {key:'management',name:'Management skills',short:'MANAGEMENT',icon:'◆',color:'#9b7430',earned:0,max:25},
    {key:'people',name:'People skills',short:'PEOPLE',icon:'●',color:'#4f8d4a',earned:0,max:25}
  ];
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const total=()=>SKILLS.reduce((n,s)=>n+s.earned,0);
  function render(){
    const modal=document.querySelector('.ag-user-profile-body');
    if(!modal||modal.querySelector('.ag-skill-tree'))return;
    const section=document.createElement('section');
    section.className='ag-skill-tree';
    section.innerHTML=`
      <div class="ag-skill-tree-head">
        <div><span>PROFESSIONAL DEVELOPMENT</span><h3>SKILL TREE</h3></div>
        <div class="ag-skill-total"><b>${total()}</b><small>TOTAL STARS EARNED</small></div>
      </div>
      <div class="ag-skill-graph" aria-label="Skill Tree graph">
        <svg class="ag-skill-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1="50" y1="50" x2="20" y2="22"/><line x1="50" y1="50" x2="80" y2="22"/><line x1="50" y1="50" x2="88" y2="72"/><line x1="50" y1="50" x2="50" y2="88"/><line x1="50" y1="50" x2="12" y2="72"/>
        </svg>
        <div class="ag-skill-core"><b>AG</b><span>WORLD</span><small>SKILLS</small></div>
        ${SKILLS.map((s,i)=>{
          const positions=['tl','tr','br','bc','bl'];
          const pct=Math.min(100,Math.round(s.earned/s.max*100));
          return `<div class="ag-skill-node ${positions[i]}" style="--skill-color:${s.color}">
            <div class="ag-skill-icon">${s.icon}</div><div class="ag-skill-node-copy"><b>${esc(s.short)}</b><span>${s.earned} ★</span></div>
            <div class="ag-skill-meter"><i style="width:${pct}%"></i></div><small>${s.earned} / ${s.max} stars</small>
          </div>`;
        }).join('')}
      </div>
      <div class="ag-skill-tree-note">Stars are earned by completing missions. A mission can strengthen multiple skills at the same time.</div>`;
    modal.appendChild(section);
  }
  function refresh(){
    const values=window.AG_WORLD_SKILL_TOTALS;
    if(values&&typeof values==='object')SKILLS.forEach(s=>{if(Number.isFinite(Number(values[s.key])))s.earned=Number(values[s.key]);});
    const existing=document.querySelector('.ag-skill-tree');
    if(existing){
      existing.querySelector('.ag-skill-total b').textContent=total();
      SKILLS.forEach(s=>{const n=existing.querySelector(`[data-skill="${s.key}"]`);if(n)n.textContent=s.earned;});
      return;
    }
    render();
  }
  const style=document.createElement('style');
  style.textContent=`
    .ag-skill-tree{margin-top:16px;border:1px solid #dce4e7;border-radius:10px;background:linear-gradient(145deg,#fbfcfc,#f2f6f5);overflow:hidden}
    .ag-skill-tree-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #dce4e7;background:#fff}
    .ag-skill-tree-head span{font:900 7px Arial,sans-serif;letter-spacing:1px;color:#7a898f}.ag-skill-tree-head h3{margin:3px 0 0;font:900 15px Arial,sans-serif;color:#263740}
    .ag-skill-total{text-align:right}.ag-skill-total b{display:block;font:900 20px Arial,sans-serif;color:#4b9843}.ag-skill-total small{font:800 6px Arial,sans-serif;color:#7a898f;letter-spacing:.5px}
    .ag-skill-graph{position:relative;height:350px;margin:2px 8px 0}.ag-skill-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.ag-skill-lines line{stroke:#b9c9c9;stroke-width:.55;stroke-dasharray:2 1.5}
    .ag-skill-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:82px;height:82px;border-radius:50%;background:#142733;border:5px solid #dce8e2;box-shadow:0 6px 18px rgba(20,39,51,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;z-index:3}.ag-skill-core b{font:900 22px Arial,sans-serif}.ag-skill-core span{font:900 6px Arial,sans-serif;letter-spacing:1px}.ag-skill-core small{margin-top:3px;color:#75c95b;font:900 5px Arial,sans-serif;letter-spacing:.8px}
    .ag-skill-node{position:absolute;width:124px;padding:8px 8px 7px;border:1px solid #d7e1e3;border-top:3px solid var(--skill-color);border-radius:8px;background:#fff;box-shadow:0 4px 12px rgba(35,54,62,.08);z-index:4}.ag-skill-node.tl{left:3%;top:5%}.ag-skill-node.tr{right:3%;top:5%}.ag-skill-node.br{right:0;top:63%}.ag-skill-node.bc{left:50%;bottom:1%;transform:translateX(-50%)}.ag-skill-node.bl{left:0;top:63%}
    .ag-skill-icon{float:left;width:25px;height:25px;margin-right:6px;border-radius:6px;background:var(--skill-color);color:#fff;display:flex;align-items:center;justify-content:center;font:900 12px Arial,sans-serif}.ag-skill-node-copy b{display:block;color:#31424a;font:900 7px Arial,sans-serif;line-height:1.15}.ag-skill-node-copy span{display:block;margin-top:2px;color:#e0ac24;font:900 9px Arial,sans-serif}.ag-skill-meter{clear:both;height:5px;margin-top:7px;background:#e4eaeb;border-radius:5px;overflow:hidden}.ag-skill-meter i{display:block;height:100%;background:var(--skill-color);border-radius:5px}.ag-skill-node>small{display:block;margin-top:3px;color:#819097;font:700 5.5px Arial,sans-serif}
    .ag-skill-tree-note{padding:8px 14px 10px;border-top:1px solid #e2e8e9;color:#718087;font:700 7px Arial,sans-serif;line-height:1.35}
    @media(max-width:650px){.ag-skill-graph{height:320px}.ag-skill-node{width:105px}.ag-skill-core{width:68px;height:68px}}
  `;
  document.head.appendChild(style);
  function init(){render();setTimeout(refresh,250);setTimeout(refresh,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.AG_WORLD_RENDER_SKILL_TREE=refresh;
})();
