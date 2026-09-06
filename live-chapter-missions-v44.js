// AG World live Chapter Mission List v44
// Renders the authenticated player's current chapter into the existing HUD Missions area.
(()=>{
  function missionsBox(){return document.querySelector('.ag-hud .ag-missions')}
  function render(){
    const box=missionsBox();
    const api=window.AGWorldProgression;
    if(!box||!api) return false;
    const s=api.getState?.(); const chapters=api.getChapters?.();
    if(!s||!chapters) return false;
    const c=chapters.find(x=>x.id===s.currentChapter);
    if(!c) return false;
    const completed=s.completed||{};
    box.innerHTML='<div class="ag-missions-head"><strong>CHAPTER '+c.id+' · '+c.title+'</strong><span>'+Object.keys(completed).filter(id=>c.missions.some(m=>m.id===id)).length+' / '+c.missions.length+' COMPLETE</span></div>'+
      c.missions.map((m,i)=>{
        const done=!!completed[m.id];
        const current=!done&&!c.missions.slice(0,i).some(x=>!completed[x.id]);
        return '<div class="ag-mission '+(done?'ag-mission-done':current?'ag-mission-current':'ag-mission-locked')+'" '+(current?'data-progression-complete="'+m.id+'"':'')+'><small>'+(done?'✓ COMPLETED':current?'CURRENT MISSION · '+m.type:'LOCKED · COMPLETE PREVIOUS MISSION')+'</small><strong>'+m.title+'</strong><p>'+m.objective+'</p><div class="reward">+'+m.xp+' XP'+(m.skill?' · '+m.skill:'')+'</div></div>';
      }).join('');
    return true;
  }
  function bind(){
    render();
    window.addEventListener('agworld:player-ready',render);
    window.addEventListener('agworld:mission-completed',()=>setTimeout(render,100));
    const obs=new MutationObserver(render);
    if(document.body) obs.observe(document.body,{childList:true,subtree:true});
    setInterval(render,1200);
  }
  const style=document.createElement('style');
  style.textContent='.ag-mission-current{border-left:2px solid #d7df79!important;padding-left:8px!important}.ag-mission-locked{opacity:.38;cursor:not-allowed!important}.ag-mission-done{opacity:.7}.ag-mission-done strong{text-decoration:line-through}.ag-mission-current:hover{background:rgba(214,194,132,.08)}';
  document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();