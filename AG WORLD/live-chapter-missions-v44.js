// AG World live Chapter Mission List v45
// The visible My Missions sidebar is driven by the authenticated player's chapter.
// Territory-generated campaign missions only take over once Chapter 3 is reached.
(()=>{
  function current(){
    const api=window.AGWorldProgression;
    const s=api?.getState?.(), chapters=api?.getChapters?.();
    if(!s||!chapters) return null;
    return {api,s,chapter:chapters.find(x=>Number(x.id)===Number(s.currentChapter))};
  }

  function missionCard(m,done,isCurrent){
    return '<div class="chapter-mission-card '+(done?'done':isCurrent?'current':'locked')+'" '+(isCurrent?'data-chapter-mission="'+m.id+'"':'')+
      '><div class="chapter-mission-top"><span>'+ (done?'COMPLETED':isCurrent?m.type:'LOCKED')+'</span><b>'+ (done?'✓':isCurrent?'CURRENT':'LOCKED')+'</b></div>'+
      '<strong>'+m.title+'</strong><p>'+m.objective+'</p><div class="chapter-mission-bottom"><span>+'+m.xp+' XP'+(m.skill?' · '+m.skill:'')+'</span>'+
      (isCurrent?'<button type="button" data-start-chapter-mission="'+m.id+'">START MISSION</button>':'')+'</div></div>';
  }

  function renderSidebar(){
    const ctx=current(), side=document.querySelector('.missions');
    if(!ctx||!side||!ctx.chapter) return false;
    const {s,chapter}=ctx;

    // Chapter 3 uses the dynamic Territory Campaign mission generator.
    if(Number(s.currentChapter)>=3 && !chapter.missions.length) {
      document.getElementById('chapterMissionList')?.remove();
      return true;
    }

    side.querySelector('.eyebrow')?.replaceChildren(document.createTextNode('PLAYER CAREER · CHAPTER '+chapter.id));
    side.querySelector('h1')?.replaceChildren(document.createTextNode('CHAPTER '+chapter.id+' · '+chapter.title));
    side.querySelector('.section-title')?.replaceChildren(document.createTextNode('CHAPTER '+chapter.id+' MISSIONS'));

    let box=document.getElementById('chapterMissionList');
    if(!box){
      box=document.createElement('div');
      box.id='chapterMissionList';
      const title=side.querySelector('.section-title');
      if(title) title.insertAdjacentElement('afterend',box); else side.appendChild(box);
    }

    const completed=s.completed||{};
    let firstOpen=null;
    box.innerHTML=chapter.missions.map((m,i)=>{
      const done=!!completed[m.id];
      const blocked=chapter.missions.slice(0,i).some(x=>!completed[x.id]);
      const isCurrent=!done&&!blocked;
      if(isCurrent&&!firstOpen) firstOpen=m.id;
      return missionCard(m,done,isCurrent);
    }).join('');

    box.querySelectorAll('[data-start-chapter-mission]').forEach(btn=>{
      btn.onclick=()=>{
        const id=btn.dataset.startChapterMission;
        if(window.AGWorldJourney?.start(id))return;
        const card=btn.closest('.chapter-mission-card');
        // The interactive Chapter 1/2 engines listen for the selected mission event.
        window.dispatchEvent(new CustomEvent('agworld:chapter-mission-selected',{detail:{missionId:id,chapter:s.currentChapter}}));
        window.dispatchEvent(new CustomEvent('agworld:start-mission',{detail:{missionId:id,chapter:s.currentChapter}}));
        // Compatibility with the existing interactive onboarding implementation.
        if(window.AGWorldOnboarding?.startMission) window.AGWorldOnboarding.startMission(id);
        else if(window.startOnboardingMission) window.startOnboardingMission(id);
        else card?.classList.add('selected');
      };
    });
    return true;
  }

  function renderHud(){
    const ctx=current(), box=document.querySelector('.ag-hud .ag-missions');
    if(!ctx||!box||!ctx.chapter) return;
    const {s,chapter}=ctx, completed=s.completed||{};
    if(Number(s.currentChapter)>=3 && !chapter.missions.length) return;
    box.innerHTML='<div class="ag-missions-head"><strong>CHAPTER '+chapter.id+' · '+chapter.title+'</strong><span>PLAYER MISSIONS</span></div>'+
      chapter.missions.map((m,i)=>{
        const done=!!completed[m.id], currentMission=!done&&!chapter.missions.slice(0,i).some(x=>!completed[x.id]);
        return '<div class="ag-mission '+(done?'ag-mission-done':currentMission?'ag-mission-current':'ag-mission-locked')+'"><small>'+(done?'✓ COMPLETED':currentMission?'CURRENT MISSION · '+m.type:'LOCKED')+'</small><strong>'+m.title+'</strong><p>'+m.objective+'</p><div class="reward">+'+m.xp+' XP</div></div>';
      }).join('');
  }

  function render(){renderSidebar();renderHud();}
  function bind(){
    render();
    window.addEventListener('agworld:player-ready',()=>setTimeout(render,50));
    window.addEventListener('agworld:mission-completed',()=>setTimeout(render,100));
    setInterval(render,1000);
  }

  const style=document.createElement('style');
  style.textContent=`
    #chapterMissionList{padding:10px 0 18px}
    .chapter-mission-card{margin:8px 0;padding:10px 11px;border-radius:9px;border:1px solid rgba(90,110,116,.16);border-left:3px solid #718087;background:rgba(255,255,255,.035)}
    .chapter-mission-card.current{border-left-color:#b6c95b;background:rgba(182,201,91,.08)}
    .chapter-mission-card.done{border-left-color:#56a36a;opacity:.75}
    .chapter-mission-card.locked{opacity:.42}
    .chapter-mission-top{display:flex;justify-content:space-between;gap:8px;font-size:8px;font-weight:900;letter-spacing:.8px;color:#839096}
    .chapter-mission-top b{font-size:7px;color:#b7c46d}
    .chapter-mission-card strong{display:block;margin-top:5px;font-size:12px;color:#2f3d42}
    .chapter-mission-card p{margin:5px 0 7px;font-size:9px;line-height:1.4;color:#748087}
    .chapter-mission-bottom{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:8px;font-weight:900;color:#7f9b46}
    .chapter-mission-bottom button{border:0;border-radius:5px;padding:6px 8px;background:#819f42;color:white;font-size:7px;font-weight:900;cursor:pointer}
    .chapter-mission-card.locked .chapter-mission-bottom{color:#8a9295}
  `;
  document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();