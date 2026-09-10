/* AG WORLD — Mission History + premium green Skill Profile */
(()=>{
  const HISTORY_ID='agMissionHistoryPanel';

  const css=document.createElement('style');
  css.id='ag-mission-history-premium-style';
  css.textContent=`
  /* Completed missions belong in Mission History, never in the active feed. */
  .missions .mission.done,.missions .ag-mission-card.done{display:none!important}

  /* Premium AgWorld green intelligence treatment for the My Skills radar. */
  html body.ag-profile-mode .missions #agMissionSkillProfile,
  html body.ag-profile-mode .missions .ag-mission-skill-profile{
    background:
      radial-gradient(circle at 50% 42%,rgba(193,233,93,.16),transparent 34%),
      radial-gradient(circle at 14% 100%,rgba(29,125,130,.20),transparent 48%),
      linear-gradient(145deg,#193f43 0%,#12333a 48%,#0a2027 100%)!important;
    border:1px solid rgba(156,220,91,.48)!important;
    box-shadow:0 16px 30px rgba(8,35,37,.24),0 0 0 1px rgba(194,233,93,.08),inset 0 1px 0 rgba(255,255,255,.10)!important;
    position:relative!important;
  }
  html body.ag-profile-mode .missions #agMissionSkillProfile:before{
    content:""!important;position:absolute!important;inset:7px!important;border-radius:10px!important;
    border:1px solid rgba(194,233,93,.12)!important;pointer-events:none!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-head{
    position:relative!important;z-index:1!important;
    background:linear-gradient(90deg,rgba(194,233,93,.10),rgba(29,125,130,.03),transparent)!important;
    border-bottom-color:rgba(194,233,93,.18)!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-head span{color:#b8dc9b!important}
  html body.ag-profile-mode .missions .ag-mission-skill-head b{color:#fff!important}
  html body.ag-profile-mode .missions .ag-mission-skill-head>strong{
    color:#17311f!important;background:linear-gradient(145deg,#e0f99b,#a9df4e)!important;
    border-color:rgba(239,255,190,.65)!important;box-shadow:0 0 18px rgba(194,233,93,.22)!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart{
    background:
      radial-gradient(circle at 50% 48%,rgba(194,233,93,.11),rgba(13,43,48,.18) 48%,rgba(4,18,24,.28))!important;
    border-radius:12px!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-grid polygon{
    stroke:#78b94f!important;stroke-width:1.25!important;opacity:.58!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-axes line{
    stroke:#6dba85!important;stroke-width:1.1!important;opacity:.52!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-fill{
    fill:rgba(171,225,78,.27)!important;filter:drop-shadow(0 0 7px rgba(194,233,93,.18))!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-outline{
    stroke:#c7ef62!important;stroke-width:2.5!important;filter:drop-shadow(0 0 4px rgba(194,233,93,.42))!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-points circle{
    fill:#dff88d!important;stroke:#4f9b5c!important;stroke-width:2!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-center{
    fill:#c7ef62!important;stroke:#f0ffc0!important;stroke-width:1.4!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-chart .ag-radar-labels text{
    fill:#d9f0cf!important;font-weight:900!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-list{
    background:rgba(5,26,31,.22)!important;border-top-color:rgba(194,233,93,.14)!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-list div{
    background:linear-gradient(145deg,rgba(194,233,93,.07),rgba(255,255,255,.015))!important;
    border:1px solid rgba(194,233,93,.12)!important;border-radius:8px!important;
    padding:6px 3px!important;
  }
  html body.ag-profile-mode .missions .ag-mission-skill-list span{color:#c4d8cf!important}
  html body.ag-profile-mode .missions .ag-mission-skill-list b{color:#d9f87d!important;text-shadow:0 0 8px rgba(194,233,93,.22)!important}

  #${HISTORY_ID}{position:fixed;inset:0;z-index:5000;display:none;align-items:flex-start;justify-content:center;padding:5vh 20px;background:rgba(3,14,18,.52);backdrop-filter:blur(8px);box-sizing:border-box}
  #${HISTORY_ID}.open{display:flex}
  .ag-history-window{width:min(820px,94vw);max-height:88vh;overflow:auto;border-radius:20px;background:linear-gradient(145deg,#173b42,#102b34 62%,#0a2027);border:1px solid rgba(194,233,93,.36);box-shadow:0 28px 80px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.09)}
  .ag-history-head{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 18px;border-bottom:1px solid rgba(194,233,93,.16);background:radial-gradient(circle at 82% 0,rgba(194,233,93,.13),transparent 34%)}
  .ag-history-kicker{display:block;color:#b9e568;font:900 9px Arial,sans-serif;letter-spacing:1.5px}
  .ag-history-head h2{margin:5px 0 0;color:#fff;font:900 22px Arial,sans-serif;letter-spacing:.5px}
  .ag-history-close{width:36px;height:36px;border-radius:10px;border:1px solid rgba(194,233,93,.24);background:rgba(255,255,255,.06);color:#dff88d;font-size:22px;cursor:pointer}
  .ag-history-body{padding:18px 22px 24px}
  .ag-history-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .ag-history-stat{padding:13px 14px;border-radius:12px;background:linear-gradient(145deg,rgba(194,233,93,.12),rgba(29,125,130,.10));border:1px solid rgba(194,233,93,.16)}
  .ag-history-stat span{display:block;color:#9fc1b7;font:800 8px Arial,sans-serif;letter-spacing:1px}.ag-history-stat b{display:block;margin-top:6px;color:#fff;font:900 19px Arial,sans-serif}
  .ag-history-section{margin-top:18px;color:#c7ed75;font:900 10px Arial,sans-serif;letter-spacing:1.3px}
  .ag-history-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:10px}
  .ag-history-card{position:relative;padding:14px 14px 13px 16px;border-radius:14px;overflow:hidden;background:linear-gradient(145deg,#1a4850,#102f37);border:1px solid rgba(94,177,113,.36);box-shadow:0 8px 18px rgba(0,0,0,.14)}
  .ag-history-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(#d9f87d,#72b84a,#1d7d82)}
  .ag-history-card .ag-history-badge{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:rgba(194,233,93,.14);border:1px solid rgba(194,233,93,.26);color:#dff88d;font-size:15px;margin-bottom:8px}
  .ag-history-card strong{display:block;color:#fff;font:900 12px Arial,sans-serif}.ag-history-card p{margin:5px 0 0;color:#aac4bc;font:700 8px/1.45 Arial,sans-serif}.ag-history-card .ag-history-meta{margin-top:10px;color:#c7ed75;font:900 8px Arial,sans-serif}
  .ag-history-empty{padding:26px;border:1px dashed rgba(194,233,93,.22);border-radius:14px;color:#aac4bc;text-align:center;font:800 10px Arial,sans-serif}
  @media(max-width:600px){.ag-history-summary{grid-template-columns:1fr}.ag-history-window{max-height:92vh}.ag-history-head{padding:18px}.ag-history-body{padding:14px}}
  `;
  document.head.appendChild(css);

  function hideCompleted(root=document){
    root.querySelectorAll?.('.missions .mission.done,.missions .ag-mission-card.done').forEach(el=>{el.style.setProperty('display','none','important');});
  }

  function progressionHistory(){
    const api=window.AGWorldProgression;
    if(!api)return [];
    const state=api.getState?.()||{};
    const completed=state.completed||{};
    const chapters=api.getChapters?.()||[];
    return chapters.flatMap(ch=>(ch.missions||[]).filter(m=>completed[m.id]).map(m=>({
      id:'progress-'+m.id,title:m.title,subtitle:m.subtitle||'',xp:Number(m.xp)||0,
      chapter:ch.title||('Chapter '+ch.id),badge:ch.id===1?'✦':ch.id===2?'◆':'◈'
    })));
  }
  function territoryHistory(){
    let states={};try{states=JSON.parse(localStorage.getItem('agworld-territory-missions-v1')||'{}')}catch(_){}
    const missions=Array.isArray(window.__AG_WORLD_ACTIVE_MISSIONS)?window.__AG_WORLD_ACTIVE_MISSIONS:[];
    return missions.filter(m=>states[m.id]?.completed).map(m=>({
      id:'territory-'+m.id,title:m.title,subtitle:m.objective||'',xp:Number(m.xp)||0,
      chapter:'Territory Campaign',badge:'⬢'
    }));
  }
  function allHistory(){return [...progressionHistory(),...territoryHistory()]}
  function ensurePanel(){
    let panel=document.getElementById(HISTORY_ID);if(panel)return panel;
    panel=document.createElement('div');panel.id=HISTORY_ID;
    panel.innerHTML='<div class="ag-history-window" role="dialog" aria-modal="true" aria-label="Mission History"><div class="ag-history-head"><div><span class="ag-history-kicker">AG WORLD PLAYER RECORD</span><h2>MISSION HISTORY</h2></div><button class="ag-history-close" aria-label="Close Mission History">×</button></div><div class="ag-history-body"></div></div>';
    panel.addEventListener('click',e=>{if(e.target===panel)panel.classList.remove('open');});
    panel.querySelector('.ag-history-close').addEventListener('click',()=>panel.classList.remove('open'));
    document.body.appendChild(panel);return panel;
  }
  function renderHistory(){
    const panel=ensurePanel(),body=panel.querySelector('.ag-history-body'),items=allHistory();
    const xp=items.reduce((n,x)=>n+x.xp,0);
    body.innerHTML='<div class="ag-history-summary"><div class="ag-history-stat"><span>MISSIONS COMPLETED</span><b>'+items.length+'</b></div><div class="ag-history-stat"><span>XP EARNED</span><b>'+xp.toLocaleString()+'</b></div><div class="ag-history-stat"><span>BADGES EARNED</span><b>'+items.length+'</b></div></div><div class="ag-history-section">COMPLETED MISSIONS & BADGES</div>'+(items.length?'<div class="ag-history-grid">'+items.map(x=>'<article class="ag-history-card"><div class="ag-history-badge">'+x.badge+'</div><strong>'+escapeHtml(x.title)+'</strong><p>'+escapeHtml(x.subtitle)+'</p><div class="ag-history-meta">'+escapeHtml(x.chapter)+' · +'+x.xp+' XP</div></article>').join('')+'</div>':'<div class="ag-history-empty">No completed missions yet. Complete your active missions to build your career record.</div>');
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
  function openHistory(){renderHistory();ensurePanel().classList.add('open')}
  function bindHistoryNav(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(!/mission history/i.test(txt)||el.dataset.agHistoryBound)return;
      el.dataset.agHistoryBound='1';
      el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openHistory();},true);
    });
  }

  const observer=new MutationObserver(()=>{hideCompleted();bindHistoryNav();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  hideCompleted();bindHistoryNav();
  window.addEventListener('agworld:mission-completed',()=>setTimeout(()=>{hideCompleted();renderHistory();},100));
  window.addEventListener('agworld:territory-mission-completed',()=>setTimeout(()=>{hideCompleted();renderHistory();},100));
  window.AGWorldMissionHistory={open:openHistory,render:renderHistory,get:allHistory};
})();
