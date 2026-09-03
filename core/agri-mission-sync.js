/* GAME CHANGER Agriculture build — Salesman Mission Control is driven only by Mission Library records. */
(function(){
  'use strict';
  if (/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const PROFILE = '.missions';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = () => { try { const x=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(x)?x:[]; } catch(_){ return []; } };

  function buildFolder(m){
    const raw=String(m?.build ?? m?.industryBuild ?? m?.buildName ?? '').trim().toLowerCase();
    if(raw==='agriculture'||raw==='agri'||raw==='agri build'||raw==='agriculture build') return 'Agri Build';
    return String(m?.build ?? m?.industryBuild ?? m?.buildName ?? '').trim();
  }
  function roleFolder(m){
    const raw=String(m?.role ?? m?.assignedRole ?? m?.missionRole ?? '').trim().toLowerCase();
    if(raw==='agriculture_sales'||raw==='salesman'||raw==='sales person'||raw==='salesperson'||raw==='agriculture sales representative') return 'Sales person';
    if(raw==='*') return 'All Sales People';
    return String(m?.role ?? m?.assignedRole ?? m?.missionRole ?? '').trim();
  }
  function isAgriSales(m){
    const path=String(m?.folderPath ?? m?.path ?? '').replace(/\\/g,'/').toLowerCase();
    if(path.includes('agri build/sales person')) return true;
    return buildFolder(m)==='Agri Build' && (roleFolder(m)==='Sales person'||roleFolder(m)==='All Sales People');
  }
  function idOf(m){ return String(m?.id ?? m?.missionId ?? m?.key ?? '').trim(); }

  function cardFor(m){
    const card=document.createElement('article');
    card.className='mission gc-library-mission';
    card.dataset.adminMissionId=idOf(m);
    card.dataset.action=String(m?.type||'custom').toLowerCase();
    const type=String(m?.type||'CUSTOM').trim().toUpperCase();
    const priority=String(m?.priority||'Normal').trim().toUpperCase();
    const objective=String(m?.objective||'').trim();
    const success=String(m?.success||m?.successCriteria||'').trim();
    const xp=Number(m?.xp ?? m?.profileXp ?? m?.profileXP ?? 0);
    card.innerHTML=`<div class="tag">${esc(type)} · ${esc(priority)} PRIORITY</div><strong>${esc(m?.name||'Untitled mission')}</strong>${objective?`<p>${esc(objective)}</p>`:'<p>Complete this mission according to the assigned workflow.</p>'}<div class="reward">+${Number.isFinite(xp)?xp:0} XP${success?` · ${esc(success)}`:''}</div>`;
    return card;
  }

  function style(){
    if(document.getElementById('gc-library-profile-style')) return;
    const s=document.createElement('style'); s.id='gc-library-profile-style';
    s.textContent=`
      .missions .gc-library-mission{margin:0 0 10px;padding:12px 13px;border:1px solid #dfe7e5;border-radius:7px;background:#fff;box-shadow:0 2px 8px rgba(19,39,46,.07);cursor:pointer}
      .missions .gc-library-mission:hover{box-shadow:0 4px 12px rgba(19,39,46,.1);border-color:#cbd8d5}
      .missions .gc-library-mission .tag{font-size:7px;letter-spacing:.8px;font-weight:900;color:#73858b;margin-bottom:5px}
      .missions .gc-library-mission strong{display:block;font-size:12px;line-height:1.25;color:#172d35;margin-bottom:5px}
      .missions .gc-library-mission p{font-size:8px;line-height:1.4;color:#718087;margin:0 0 8px}
      .missions .gc-library-mission .reward{font-size:7px;font-weight:900;color:#6d8e17;letter-spacing:.3px}
      .missions .gc-library-empty{cursor:default;background:#fafcfb}
      .missions .gc-library-empty:hover{box-shadow:0 2px 8px rgba(19,39,46,.07);border-color:#dfe7e5}
    `; document.head.appendChild(s);
  }

  function render(){
    const panel=document.querySelector(PROFILE); if(!panel) return false;
    style();
    const missions=read().filter(isAgriSales).filter(m=>idOf(m));
    const ids=new Set(missions.map(idOf));
    panel.querySelectorAll('.mission').forEach(card=>{ if(!ids.has(String(card.dataset.adminMissionId||''))) card.remove(); });
    panel.querySelectorAll('.gc-library-empty').forEach(e=>e.remove());
    const title=panel.querySelector('.section-title'); if(title) title.textContent='Assigned missions';
    const existing=[...panel.querySelectorAll('.mission[data-admin-mission-id]')];
    existing.forEach(c=>c.remove());
    const anchor=title||panel.lastElementChild;
    if(!missions.length){
      const empty=document.createElement('article'); empty.className='mission gc-library-empty';
      empty.innerHTML='<div class="tag">MISSION LIBRARY</div><strong>No missions assigned</strong><p>There are currently no missions under Agri Build / Sales person.</p><div class="reward">MISSIONS COME FROM THE ADMINISTRATOR MISSION LIBRARY</div>';
      anchor?.insertAdjacentElement('afterend',empty); return true;
    }
    missions.forEach(m=>anchor?.insertAdjacentElement('afterend',cardFor(m)));
    return true;
  }

  function start(){
    let busy=false;
    const refresh=()=>{ if(busy) return; busy=true; render(); busy=false; };
    const boot=setInterval(()=>{ if(render()){ clearInterval(boot); } },100);
    refresh();
    window.addEventListener('storage',e=>{if(e.key===KEY) refresh();});
    window.addEventListener('gamechanger:missions-changed',refresh);
    const watch=setInterval(refresh,1000);
    window.addEventListener('beforeunload',()=>clearInterval(watch));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
