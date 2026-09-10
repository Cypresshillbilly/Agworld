/* AG WORLD — Canonical Mission Card v1
 *
 * Single-purpose renderer.
 * Ownership:
 *   AGWorldProgression -> mission adapter -> #agCanonicalMissionCard
 *
 * It never modifies Player Profile, Skill Profile, Advisory Bay or mission-engine
 * state. Legacy visual cards are removed only by positively identified roots.
 */
(()=>{
  'use strict';

  const CARD_ID='agCanonicalMissionCard';
  const SLOT_ID='agCanonicalMissionSlot';
  const STYLE_ID='agCanonicalMissionCardStyle';
  const LEGACY_SELECTOR=[
    '#agLandingMissionCard',
    '#agMissionCardV2',
    '#agMissionCard',
    '#agLegacyMissionCard',
    '.ag-landing-mission',
    '[data-ag-mission-card-legacy="true"]',
    '[data-ag-mission-card-v2="true"]'
  ].join(',');

  const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);

  function installStyles(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=`
      html body .missions{
        position:relative!important;
      }
      html body .missions #${SLOT_ID}{
        position:absolute!important;
        left:10px!important;
        right:10px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        box-sizing:border-box!important;
        z-index:56!important;
        pointer-events:none!important;
      }
      html body .missions #${CARD_ID}{
        width:100%!important;
        max-height:100%!important;
        min-height:0!important;
        height:auto!important;
        flex:0 1 auto!important;
        box-sizing:border-box!important;
        overflow:auto!important;
        pointer-events:auto!important;
        margin:0!important;
        padding:12px!important;
        border:1px solid rgba(104,170,155,.58)!important;
        border-radius:12px!important;
        background:linear-gradient(145deg,#173d46 0%,#102c35 58%,#0a2028 100%)!important;
        color:#f4faf7!important;
        box-shadow:0 12px 28px rgba(4,20,25,.22),inset 0 1px 0 rgba(255,255,255,.08)!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-kicker{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:8px!important;
        margin:0 0 6px!important;
        color:#b9d9d1!important;
        font:900 7px/1 Arial,sans-serif!important;
        letter-spacing:1.05px!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-state{
        flex:0 0 auto!important;
        color:#dff48a!important;
        border:1px solid rgba(194,233,93,.32)!important;
        border-radius:999px!important;
        background:rgba(194,233,93,.10)!important;
        padding:3px 6px!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-title{
        margin:0!important;
        color:#fff!important;
        font:900 13px/1.2 Arial,sans-serif!important;
        letter-spacing:.18px!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-objective{
        margin:6px 0 8px!important;
        color:#c8d9d6!important;
        font:700 8.4px/1.42 Arial,sans-serif!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-footer{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:8px!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-reward{
        display:inline-flex!important;
        align-items:center!important;
        min-height:24px!important;
        padding:0 8px!important;
        border-radius:7px!important;
        color:#dff48a!important;
        background:rgba(194,233,93,.11)!important;
        border:1px solid rgba(194,233,93,.24)!important;
        font:900 7.4px/1 Arial,sans-serif!important;
        letter-spacing:.45px!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-start{
        min-height:26px!important;
        padding:6px 10px!important;
        border-radius:7px!important;
        border:1px solid rgba(194,233,93,.46)!important;
        background:linear-gradient(180deg,#c8ed68,#9cc73c)!important;
        color:#13271b!important;
        font:900 7.6px/1 Arial,sans-serif!important;
        letter-spacing:.65px!important;
        cursor:pointer!important;
      }
      html body .missions #${CARD_ID} .ag-canonical-mission-start:disabled{
        opacity:.65!important;
        cursor:default!important;
      }
      html body .missions #${CARD_ID}[data-status="loading"] .ag-canonical-mission-footer{
        display:none!important;
      }
    `;
  }

  function missionData(){
    const progression=window.AGWorldProgression;
    const state=progression?.getState?.();
    const chapters=progression?.getChapters?.();
    if(!state||!Array.isArray(chapters))return null;

    const chapterId=Number(state.currentChapter||1);
    const chapter=chapters.find(item=>Number(item.id)===chapterId)||chapters[0];
    const list=Array.isArray(chapter?.missions)?chapter.missions:[];
    const completed=state.completed||{};
    const index=list.findIndex(item=>!completed[item.id]);
    if(index<0)return null;

    return {progression,state,chapter,mission:list[index],index};
  }

  function removeLegacyVisualCards(missions){
    if(!missions)return;
    Array.from(missions.querySelectorAll(LEGACY_SELECTOR)).forEach(node=>{
      if(node.id===CARD_ID||node.closest('#agMissionHub')||node.closest('#agAdvisorBay'))return;
      node.remove();
    });
  }

  function ensureSlot(missions){
    let slot=missions.querySelector('#'+SLOT_ID);
    if(!slot){
      slot=document.createElement('div');
      slot.id=SLOT_ID;
      slot.setAttribute('aria-label','Current mission area');
      const skill=missions.querySelector('#agMissionSkillProfile,.ag-mission-skill-profile');
      if(skill)skill.insertAdjacentElement('afterend',slot);
      else missions.appendChild(slot);
    }
    return slot;
  }

  function ensureCard(slot){
    let card=slot.querySelector('#'+CARD_ID);
    if(!card){
      card=document.createElement('section');
      card.id=CARD_ID;
      card.setAttribute('aria-label','Current or next mission');
      card.dataset.agCanonicalMissionCard='true';
      slot.appendChild(card);
    }
    return card;
  }

  function positionSlot(){
    const missions=document.querySelector('.missions');
    const slot=missions?.querySelector('#'+SLOT_ID);
    const skill=missions?.querySelector('#agMissionSkillProfile,.ag-mission-skill-profile');
    const bay=missions?.querySelector('#agAdvisorBay');
    if(!missions||!slot||!skill)return;

    const missionRect=missions.getBoundingClientRect();
    const skillRect=skill.getBoundingClientRect();
    const bayRect=bay?.getBoundingClientRect();

    const top=Math.max(0,Math.round(skillRect.bottom-missionRect.top)+10);
    const bayTop=bayRect?Math.round(bayRect.top-missionRect.top):Math.round(missionRect.height-10);
    const bottom=Math.max(top+44,bayTop-12);
    const height=Math.max(44,bottom-top);

    slot.style.setProperty('top',top+'px','important');
    slot.style.setProperty('height',height+'px','important');
  }

  function render(){
    const missions=document.querySelector('.missions');
    if(!missions)return;

    installStyles();
    removeLegacyVisualCards(missions);

    const slot=ensureSlot(missions);
    const card=ensureCard(slot);
    const data=missionData();

    if(!data){
      card.dataset.status='loading';
      card.innerHTML=
        '<div class="ag-canonical-mission-kicker"><span>MISSION COMMAND</span><span class="ag-canonical-mission-state">SYNCING</span></div>'+
        '<h3 class="ag-canonical-mission-title">Mission briefing loading</h3>'+
        '<p class="ag-canonical-mission-objective">Connecting to the mission engine and preparing your current assignment.</p>'+
        '<div class="ag-canonical-mission-footer"></div>';
      positionSlot();
      return;
    }

    const {progression,chapter,mission}=data;
    const missionId=String(mission.id||'');
    card.dataset.status='current';
    card.dataset.missionId=missionId;
    card.innerHTML=
      '<div class="ag-canonical-mission-kicker"><span>CHAPTER '+escapeHTML(chapter.id)+' · '+escapeHTML(mission.type||'MISSION')+'</span><span class="ag-canonical-mission-state">CURRENT</span></div>'+
      '<h3 class="ag-canonical-mission-title">'+escapeHTML(mission.title||'Current Mission')+'</h3>'+
      '<p class="ag-canonical-mission-objective">'+escapeHTML(mission.objective||'Continue your current assignment.')+'</p>'+
      '<div class="ag-canonical-mission-footer">'+
        '<span class="ag-canonical-mission-reward">+'+Number(mission.xp||0).toLocaleString()+' XP</span>'+
        '<button class="ag-canonical-mission-start" type="button">START MISSION</button>'+
      '</div>';

    const button=card.querySelector('.ag-canonical-mission-start');
    button.addEventListener('click',()=>{
      if(button.disabled)return;
      button.disabled=true;
      const active=window.AGWorldProgression||progression;
      try{
        if(typeof active?.startMission==='function')active.startMission(missionId);
        else if(typeof active?.completeMission==='function')active.completeMission(missionId);
      }finally{
        window.dispatchEvent(new CustomEvent('agworld:canonical-mission-action',{detail:{missionId}}));
        setTimeout(()=>{button.disabled=false;render();},150);
      }
    });

    positionSlot();
  }

  let queued=false;
  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      render();
    });
  }

  function boot(){
    installStyles();
    queue();
    window.addEventListener('resize',queue);
    window.addEventListener('agworld:mission-completed',queue);
    window.addEventListener('agworld:player-ready',queue);
    window.addEventListener('agworld:canonical-mission-action',queue);

    setInterval(()=>{
      // The mission engine may initialise after the UI. Re-render from the
      // canonical engine source and remove only positively identified legacy
      // visual roots; no generic mission-engine records are touched.
      render();
    },1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();