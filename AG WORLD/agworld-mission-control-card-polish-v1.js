/* AG WORLD — MISSION CONTROL CARD SYSTEM v2
   Card-level production controller. It deliberately does not alter the locked
   Mission Control outer boundary contract owned by agworld-player-progression-stack-v1.js. */
(()=>{
'use strict';
const SID='agworld-mission-control-card-system-v2-style';
const PLAYER_CARD='agPlayerMissionProfile';
const ADVISOR_BAY='agAdvisorBay';
const COMMANDER='agStrategicCommanderPanel';
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

/* Conditional Sales surface: hidden from all non-Sales states. */
#entityInformationSection.ag-sales-commander-active>:not(#${COMMANDER}){display:none!important}
#${COMMANDER}{display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;min-height:0!important;padding:16px!important;border-radius:14px!important;background:linear-gradient(145deg,#173c45 0%,#102b36 65%,#0a2029 100%)!important;border:1px solid rgba(153,205,185,.28)!important;box-shadow:0 10px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.07)!important;color:#edf7f2!important;overflow:auto!important}
#${COMMANDER} .agsc-kicker{color:#c2e95d!important;font:900 8px/1 Arial,sans-serif!important;letter-spacing:1.1px!important}
#${COMMANDER} h2{margin:6px 0 5px!important;color:#fff!important;font:900 22px/1.08 Arial,sans-serif!important}
#${COMMANDER} p{margin:0 0 12px!important;color:#b9ccc5!important;font:700 10px/1.45 Arial,sans-serif!important}
#${COMMANDER} .agsc-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
#${COMMANDER} .agsc-metric{padding:10px!important;border-radius:10px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(176,214,215,.10)!important}
#${COMMANDER} .agsc-metric span{display:block!important;color:#8fb4ba!important;font:900 7px/1 Arial,sans-serif!important;letter-spacing:.65px!important}
#${COMMANDER} .agsc-metric b{display:block!important;margin-top:6px!important;color:#dff58a!important;font:900 18px/1 Arial,sans-serif!important}
`;

function installStyle(){let el=document.getElementById(SID);if(!el){el=document.createElement('style');el.id=SID;document.head.appendChild(el)}el.textContent=css}

function progressionState(){
 const p=window.AGWorldProgression;
 const st=p?.getState?.()||{};
 return {progression:p,state:st};
}

function canonicalPlayer(){
 const player=window.AGWorldPlayer||{};
 const {state}=progressionState();
 const read=(...keys)=>{
   for(const k of keys){
     const sources=[player,state];
     for(const src of sources){if(src&&src[k]!==undefined&&src[k]!==null&&String(src[k]).trim()!=='')return src[k]}
     const a=sessionStorage.getItem('gamechanger.'+k),b=localStorage.getItem('gamechanger.'+k);
     if(a!==null&&a!=='')return a;if(b!==null&&b!=='')return b;
   }
   return null;
 };
 const name=String(read('display_name','displayName','name','username')||'PLAYER').trim().toUpperCase();
 const role=String(read('role','title','position')||'AGWORLD FIELD COMMANDER').trim().toUpperCase();
 const level=Math.max(1,Number(read('level')||1));
 const chapter=Math.max(1,Number(read('chapter','currentChapter')||1));
 const xp=Math.max(0,Number(read('xp','totalXp','total_xp','experience')||0));
 const next=Math.max(1000,Math.ceil((xp+1)/1000)*1000);
 const pct=Math.max(0,Math.min(100,Math.round((xp/next)*100)));
 return {name,role,level,chapter,xp,next,pct,initial:(name[0]||'P')};
}

function renderPlayer(){
 const card=document.getElementById(PLAYER_CARD);if(!card)return;
 const d=canonicalPlayer();
 card.innerHTML='<div class="ag-player-identity"><div class="ag-player-avatar-frame"><div class="ag-player-avatar" aria-hidden="true">'+esc(d.initial)+'</div><span class="ag-player-online-dot"></span></div><div class="ag-player-summary"><span class="ag-player-kicker">ACTIVE PLAYER</span><strong class="ag-player-name">'+esc(d.name)+'</strong><span class="ag-player-role">'+esc(d.role)+'</span><div class="ag-player-meta"><span class="ag-player-level">LVL '+d.level+'</span><span class="ag-player-chapter">CH '+d.chapter+'</span></div><div class="ag-player-xp-label"><span>XP EARNED</span><b>'+d.pct+'%</b></div><span class="ag-player-xp-track"><i class="ag-player-xp-fill" style="width:'+d.pct+'%"></i></span><span class="ag-player-xp-text"><b>'+d.xp.toLocaleString()+' XP EARNED</b><b>NEXT '+d.next.toLocaleString()+'</b></span></div></div>';
 card.dataset.agPlayerData='canonical-v2';
}

function portraitData(id,label){
 const file='assets/advisors/'+id+'-commander.png';
 const initials=label.split(/\s+/).map(x=>x[0]).join('').slice(0,2);
 const palette={compliance:['#173c45','#70b5c3','#d4a37e','#1f1714'],sales:['#263d18','#c2e95d','#d8a27d','#342017'],product:['#173b54','#66b8df','#c98769','#1b1715'],operations:['#493a21','#d4ad5d','#bd7e60','#251d18'],technical:['#30214b','#a88add','#c98b70','#18151d']}[id]||['#173c45','#c2e95d','#d4a37e','#201714'];
 const [bg,accent,skin,hair]=palette;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="'+bg+'"/><stop offset="1" stop-color="#07151b"/></linearGradient><radialGradient id="s" cx=".32" cy=".22"><stop stop-color="#f3c9a6"/><stop offset=".72" stop-color="'+skin+'"/><stop offset="1" stop-color="#754737"/></radialGradient></defs><rect width="200" height="240" rx="24" fill="url(#g)"/><circle cx="155" cy="42" r="52" fill="'+accent+'" opacity=".15"/><path d="M18 238c10-58 42-84 82-84s72 26 82 84" fill="'+accent+'" opacity=".92"/><ellipse cx="100" cy="103" rx="50" ry="62" fill="url(#s)"/><path d="M50 90c3-48 23-70 51-70 32 0 51 26 49 67-17-14-31-19-49-18-20 0-34 7-51 21" fill="'+hair+'"/><path d="M70 110c7 5 16 5 23 0M108 110c7 5 16 5 23 0" stroke="#3b2720" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="83" cy="107" r="3" fill="#17212b"/><circle cx="117" cy="107" r="3" fill="#17212b"/><path d="M84 138c10 7 22 7 33 0" stroke="#7a4038" stroke-width="4" fill="none" stroke-linecap="round"/><text x="100" y="220" text-anchor="middle" fill="#fff" opacity=".84" font-family="Arial" font-size="15" font-weight="800" letter-spacing="3">'+initials+'</text></svg>';
 return {file,fallback:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg)};
}

function installAdvisorPortraits(){
 const bay=document.getElementById(ADVISOR_BAY);if(!bay)return;
 bay.querySelectorAll('.ag-advisor').forEach(btn=>{
   const id=btn.dataset.advisor,label=(btn.querySelector('.ag-advisor-label')?.textContent||id).trim(),d=portraitData(id,label);
   let img=btn.querySelector('.ag-advisor-portrait');
   if(!img){img=document.createElement('img');img.className='ag-advisor-portrait';img.alt=label+' Commander';btn.prepend(img)}
   img.onerror=()=>{if(img.src!==d.fallback)img.src=d.fallback};
   img.src=d.file;
   img.dataset.agPortraitSource=d.file;
   btn.classList.add('ag-advisor-photo-tab');
 });
}

function removeStrategicCommander(){
 const panel=document.getElementById(COMMANDER);
 const host=panel?.parentElement||document.getElementById('entityInformationSection');
 panel?.remove();
 host?.classList.remove('ag-sales-commander-active');
 document.body.dataset.agStrategicCommander='off';
}

function showStrategicCommander(){
 const host=document.getElementById('entityInformationSection');if(!host)return;
 let panel=document.getElementById(COMMANDER);
 if(!panel){panel=document.createElement('section');panel.id=COMMANDER;panel.setAttribute('aria-label','Strategic Commander');host.appendChild(panel)}
 host.classList.add('ag-sales-commander-active');
 const p=canonicalPlayer();
 panel.innerHTML='<div class="agsc-kicker">SALES COMMANDER ACTIVE</div><h2>STRATEGIC COMMANDER</h2><p>Strategic sales command is active for '+esc(p.name)+'. This surface exists only while the Sales Commander is selected on the My Missions screen.</p><div class="agsc-grid"><div class="agsc-metric"><span>PLAYER LEVEL</span><b>'+p.level+'</b></div><div class="agsc-metric"><span>XP EARNED</span><b>'+p.xp.toLocaleString()+'</b></div><div class="agsc-metric"><span>CHAPTER</span><b>'+p.chapter+'</b></div></div>';
 document.body.dataset.agStrategicCommander='sales-active';
}

function selectAdvisor(btn){
 const bay=document.getElementById(ADVISOR_BAY);if(!bay)return;
 const id=btn.dataset.advisor;
 const was=btn.classList.contains('is-active');
 bay.querySelectorAll('.ag-advisor').forEach(x=>x.classList.remove('is-active'));
 if(was){
   window.AGWorldAdvisorState=null;
   removeStrategicCommander();
   window.dispatchEvent(new CustomEvent('agworld:advisor-deselected',{detail:{id}}));
   return;
 }
 btn.classList.add('is-active');
 window.AGWorldAdvisorState={id,label:btn.querySelector('.ag-advisor-label')?.textContent||id,screen:'mission-control'};
 if(id==='sales')showStrategicCommander();else removeStrategicCommander();
 window.dispatchEvent(new CustomEvent('agworld:advisor-selected',{detail:window.AGWorldAdvisorState}));
}


// Mission Control is the sole owner of the Sales hologram state.
window.AGWorldStrategicCommander=window.AGWorldStrategicCommander||{
 show(){
   const host=document.getElementById('entityInformationSection');
   if(!host)return;
   showStrategicCommander();
   const root=document.querySelector('.ag-system-guide');
   root?.classList.remove('show','avatar-only');
   root?.setAttribute('aria-hidden','true');
 },
 hide(){
   removeStrategicCommander();
   const root=document.querySelector('.ag-system-guide');
   root?.classList.remove('show','avatar-only');
   root?.setAttribute('aria-hidden','true');
   document.querySelector('.ag-guide-reopen')?.classList.remove('show');
 }
};
\nfunction bindAdvisors(){
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
const observer=new MutationObserver(()=>requestAnimationFrame(run));
observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(renderPlayer,1500);
})();