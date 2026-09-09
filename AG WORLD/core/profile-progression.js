/* GAME CHANGER Profile Progression — mission completion is the authoritative progression input. */
(function(){
  'use strict';
  // AG World live player profiles are owned by player-progression-v27.js.
  // Do not let the old localStorage progression system overwrite Supabase data.
  if (window.__AGWORLD_USE_PLAYER_PROGRESSION === true) return;
  const STATUS_KEY='gamechanger.mission-status';
  const BASE_KEY='gamechanger.profile-base-xp';
  const DEFAULT_BASE_XP=6820;

  const readStatuses=()=>{try{const x=JSON.parse(localStorage.getItem(STATUS_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return{}}};
  const baseXp=()=>{const n=Number(localStorage.getItem(BASE_KEY));return Number.isFinite(n)&&n>=0?n:DEFAULT_BASE_XP};
  const missionXp=()=>{
    const missions=window.GAME_CHANGER_MISSIONS?.list?.()||[];
    const statuses=readStatuses();
    return missions.reduce((total,m)=>{
      const id=String(m?.id||'');
      return statuses[id]?.status==='completed' ? total+(Number(m?.xp)||0) : total;
    },0);
  };
  const state=()=>{
    const xp=Math.max(0,baseXp()+missionXp());
    const level=Math.floor(xp/1000)+1;
    const floor=(level-1)*1000;
    const progress=xp-floor;
    const target=1000;
    return {xp,level,progress,target,percent:Math.max(0,Math.min(100,Math.round((progress/target)*100)))};
  };
  const format=n=>Number(n||0).toLocaleString('en-US');

  function render(){
    const s=state();
    document.querySelectorAll('.menu-user-level').forEach(el=>el.textContent='LEVEL '+s.level);
    document.querySelectorAll('.menu-user-xp span').forEach(el=>el.style.width=s.percent+'%');
    document.querySelectorAll('.menu-user-xptext span').forEach(el=>el.textContent=format(s.progress)+' / '+format(s.target)+' XP');
    document.querySelectorAll('.menu-user-xptext b').forEach(el=>el.textContent=s.percent+'%');

    const missionLevel=document.querySelector('.missions .level');
    if(missionLevel) missionLevel.textContent='Level '+s.level+' · '+format(s.progress)+' / '+format(s.target)+' XP';
    document.querySelectorAll('.missions .xpbar span').forEach(el=>el.style.width=s.percent+'%');
    const missionXpText=document.querySelector('.missions .xptext');
    if(missionXpText&&missionXpText.children.length>=2) missionXpText.children[1].textContent=s.percent+'%';

    document.querySelectorAll('.user-level strong').forEach(el=>el.textContent='LEVEL '+s.level);
    document.querySelectorAll('.profile-xpbar span').forEach(el=>el.style.width=s.percent+'%');
    document.querySelectorAll('.profile-xptext').forEach(el=>{
      if(el.children.length>=2){el.children[0].textContent=format(s.progress)+' / '+format(s.target)+' XP';el.children[1].textContent=s.percent+'%';}
    });
    window.dispatchEvent(new CustomEvent('gamechanger:profile-progressed',{detail:s}));
  }

  window.GAME_CHANGER_PROGRESSION={state,render,baseXp,setBaseXp(value){
    const n=Math.max(0,Number(value)||0);localStorage.setItem(BASE_KEY,String(n));render();return state();
  }};

  window.addEventListener('gamechanger:mission-completed',render);
  window.addEventListener('gamechanger:missions-changed',render);
  window.addEventListener('storage',e=>{if(e.key===STATUS_KEY||e.key==='gamechanger.missions'||e.key===BASE_KEY)render();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();