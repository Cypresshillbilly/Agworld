/* AG WORLD — MISSION CONTROL CARD SYSTEM v2
   Card-level production controller. It deliberately does not alter the locked
   Mission Control outer boundary contract owned by agworld-player-progression-stack-v1.js. */
(()=>{
'use strict';
const SID='agworld-mission-control-card-system-v2-style';
const PLAYER_CARD='agPlayerMissionProfile';
const ADVISOR_BAY='agAdvisorBay';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const css=String.raw`
/* Player Profile: authoritative internal layout only; no outer panel geometry. */
#${PLAYER_CARD} .ag-player-identity{display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;gap:10px!important;align-items:start!important;min-width:0!important;height:100%!important}
#${PLAYER_CARD} .ag-player-avatar-frame{position:relative!important;width:56px!important;height:58px!important;margin-top:-4px!important;align-self:start!important}
#${PLAYER_CARD} .ag-player-avatar{width:54px!important;height:54px!important;display:grid!important;place-items:center!important;font-size:20px!important}
#${PLAYER_CARD} .ag-player-online-dot{right:0!important;bottom:1px!important}
#${PLAYER_CARD} .ag-player-summary{min-width:0!important;padding:0!important;align-self:start!important}
#${PLAYER_CARD} .ag-player-kicker{display:block!important;margin-bottom:2px!important}
#${PLAYER_CARD} .ag-player-name{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#${PLAYER_CARD} .ag-player-role{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#${PLAYER_CARD} .ag-player-xp-label{margin-top:4px!important}
#${PLAYER_CARD} .ag-player-xp-text b:first-child{color:#dff58a!important}

/* Advisory Bay shares the canonical dark command-card material. */
#${ADVISOR_BAY}{background:linear-gradient(145deg,#173c45 0%,#102b36 65%,#0a2029 100%)!important;border:1px solid rgba(153,205,185,.28)!important;box-shadow:0 10px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.07)!important}
#${ADVISOR_BAY} .ag-advisor{position:relative!important}
#${ADVISOR_BAY} .ag-advisor.is-active{border-color:rgba(194,233,93,.82)!important;background:linear-gradient(155deg,rgba(194,233,93,.18),rgba(4,20,26,.28))!important;box-shadow:0 0 0 1px rgba(194,233,93,.16),0 10px 20px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.12)!important}
#${ADVISOR_BAY} .ag-advisor.is-active::after{content:'ACTIVE';position:absolute;right:4px;top:4px;color:#dff58a;font:900 5.5px/1 Arial,sans-serif;letter-spacing:.6px;z-index:4}
#${ADVISOR_BAY} .ag-advisor-portrait{position:absolute!important;left:50%!important;top:3px!important;transform:translateX(-50%)!important;width:44px!important;height:52px!important;object-fit:cover!important;object-position:center top!important;border-radius:10px 10px 7px 7px!important;filter:drop-shadow(0 5px 7px rgba(0,0,0,.42)) contrast(1.04) saturate(1.08)!important}
#${ADVISOR_BAY} .ag-advisor-icon{display:none!important}
#${ADVISOR_BAY} .ag-advisor-label{position:relative!important;z-index:3!important}

`;

function installStyle(){let el=document.getElementById(SID);if(!el){el=document.createElement('style');el.id=SID;el.textContent=css;document.head.appendChild(el)}}

function progressionState(){
 const p=window.AGWorldProgression;
 const st=p?.getState?.()||{};
 return {progression:p,state:st};
}

function canonicalPlayer(){
 const player=window.AGWorldPlayer||{};
 const {state}=progressionState();
 const read=(...keys)=>{
   const sources=state.playerName?[state,player]:[player,state];
   for(const src of sources)for(const k of keys){if(src&&src[k]!==undefined&&src[k]!==null&&String(src[k]).trim()!=='')return src[k]}
   for(const k of keys){
     const a=sessionStorage.getItem('gamechanger.'+k),b=localStorage.getItem('gamechanger.'+k);
     if(a!==null&&a!=='')return a;if(b!==null&&b!=='')return b;
   }
   return null;
 };
 const name=String(read('playerName','display_name','displayName','name','username')||'PLAYER').trim().toUpperCase();
 const role=String(read('role','title','position')||'AGWORLD FIELD COMMANDER').trim().toUpperCase();
 const level=Math.max(1,Number(read('level')||1));
 const chapter=Math.max(1,Number(read('chapter','currentChapter')||1));
 const xp=Math.max(0,Number(read('xp','totalXp','total_xp','experience')||0));
 const floor=level<=10?(level-1)*250:2250+(level-10)*400;
 const next=level<10?level*250:2250+(level-9)*400;
 const pct=Math.max(0,Math.min(100,Math.round((xp-floor)/(next-floor)*100)));
 return {name,role,level,chapter,xp,next,pct,initial:(name[0]||'P')};
}

const renderedPlayers=new WeakMap();
function renderPlayer(){
 const card=document.getElementById(PLAYER_CARD);if(!card)return;
 const d=canonicalPlayer();
 const signature=JSON.stringify(d),previous=renderedPlayers.get(card);
 if(previous?.signature===signature && previous.content===card.firstElementChild) return;
 card.innerHTML='<div class="ag-player-card-heading">PLAYER PROFILE<span aria-hidden="true">⌖</span></div><div class="ag-player-identity"><div class="ag-player-avatar-frame"><div class="ag-player-avatar" aria-hidden="true"><img src="assets/advisors/agworld_sales_commander_round(1).png" alt=""></div><span class="ag-player-level-badge"><small>LVL</small>'+d.level+'</span></div><div class="ag-player-summary"><strong class="ag-player-name">'+esc(d.name)+'</strong><span class="ag-player-role">'+esc(d.role.replace(/[_-]/g,' '))+'</span><div class="ag-player-reference-stats"><div><small>CHAPTER</small><b>'+d.chapter+'</b></div><div><small>TOTAL XP EARNED</small><b>'+d.xp.toLocaleString()+'</b></div><div><small>NEXT LEVEL</small><b>'+d.next.toLocaleString()+'</b></div></div><div class="ag-player-progress"><span class="ag-player-xp-track" role="progressbar" aria-label="Player experience" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+d.pct+'"><i class="ag-player-xp-fill" style="width:'+d.pct+'%"></i></span><b>'+d.pct+'%</b></div></div></div>';
 card.dataset.agPlayerData='canonical-v2';
 renderedPlayers.set(card,{signature,content:card.firstElementChild});
}

const ADVISOR_ASSETS={
 'system-administrator':'assets/advisors/system-administrator.webp',
 compliance:'assets/advisors/agworld_compliance_commander_round(1).png',
 sales:'assets/advisors/agworld_sales_commander_round(1).png',
 product:'assets/advisors/agworld_product_commander_round(1).png',
 operations:'assets/advisors/agworld_operations_commander_round(1).png',
 technical:'assets/advisors/agworld_technical_commander_round(1).png'
};
function portraitData(id,label){return {file:ADVISOR_ASSETS[id]||''};}
function installAdvisorPortraits(){
 const bay=document.getElementById(ADVISOR_BAY);if(!bay)return;
 bay.querySelectorAll('.ag-advisor').forEach(btn=>{
   const id=btn.dataset.advisor,label=(btn.querySelector('.ag-advisor-label')?.textContent||id).trim(),d=portraitData(id,label);
   let img=btn.querySelector('.ag-advisor-portrait');
   if(!img){img=document.createElement('img');img.className='ag-advisor-portrait';img.alt=id==='system-administrator'?'System Administrator':label+' Commander';btn.prepend(img)}
   img.onerror=()=>{btn.dataset.agAdvisorAssetError='true';img.removeAttribute('src')};
   if(img.getAttribute('src')!==d.file) img.src=d.file;
   img.dataset.agPortraitSource=d.file;
   btn.classList.add('ag-advisor-photo-tab');
 });
}

function setStrategicCommanderVisible(visible){
 const guide=window.AGWorldStrategicCommander;
 if(visible) guide?.show?.();
 else guide?.hide?.();
 document.body.dataset.agStrategicCommander=visible?'system-administrator-active':'off';
}

function selectAdvisor(btn){
 const bay=document.getElementById(ADVISOR_BAY);if(!bay)return;
 const id=btn.dataset.advisor;
 const wasActive=btn.classList.contains('is-active');
 bay.querySelectorAll('.ag-advisor').forEach(x=>{x.classList.remove('is-active');x.setAttribute('aria-pressed','false');});

 if(wasActive){
   window.AGWorldAdvisorState=null;
   setStrategicCommanderVisible(false);
   window.dispatchEvent(new CustomEvent('agworld:advisor-deselected',{detail:{id,screen:'mission-control'}}));
   return;
 }

 btn.classList.add('is-active');btn.setAttribute('aria-pressed','true');
 window.AGWorldAdvisorState={id,label:btn.querySelector('.ag-advisor-label')?.textContent||id,screen:'mission-control'};
 setStrategicCommanderVisible(id==='system-administrator');
 window.dispatchEvent(new CustomEvent('agworld:advisor-selected',{detail:window.AGWorldAdvisorState}));
 if(id==='system-administrator')window.AG_WORLD_GUIDE?.welcome?.({speak:true});
}

function bindAdvisors(){
 const bay=document.getElementById(ADVISOR_BAY);if(!bay)return;
 installAdvisorPortraits();
 if(bay.dataset.agAdvisorController==='v2')return;
 bay.dataset.agAdvisorController='v2';
 bay.addEventListener('click',e=>{
   const btn=e.target.closest('.ag-advisor');
   if(!btn||!bay.contains(btn))return;
   e.preventDefault();e.stopPropagation();
   selectAdvisor(btn);
 },true);
}

function run(){installStyle();renderPlayer();bindAdvisors()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
['agworld:player-ready','agworld:player-state','agworld:mission-completed','agworld:landing-layout-ready'].forEach(e=>addEventListener(e,()=>setTimeout(run,0)));
let runQueued=false;
const observer=new MutationObserver(()=>{
 if(runQueued) return;
 runQueued=true;
 requestAnimationFrame(()=>{runQueued=false;run();});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(renderPlayer,1500);
})();
