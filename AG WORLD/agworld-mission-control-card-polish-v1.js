/* AG WORLD — MY MISSIONS CARD POLISH v1
   Visual/content refinement only. The locked Mission Control boundary geometry
   is intentionally not modified by this file. */
(()=>{
'use strict';
const SID='agworld-mission-control-card-polish-v1-style';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const css=`
/* Player card internals — no outer Mission Control geometry is touched. */
#agPlayerMissionProfile .ag-player-identity{display:grid!important;grid-template-columns:60px minmax(0,1fr)!important;column-gap:10px!important;align-items:start!important;height:100%!important;min-width:0!important}
#agPlayerMissionProfile .ag-player-avatar-frame{position:relative!important;width:56px!important;height:62px!important;align-self:start!important;justify-self:start!important;margin-top:-3px!important}
#agPlayerMissionProfile .ag-player-avatar{width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;font-size:21px!important;line-height:54px!important}
#agPlayerMissionProfile .ag-player-online-dot{right:0!important;bottom:5px!important}
#agPlayerMissionProfile .ag-player-summary{min-width:0!important;align-self:start!important;justify-content:flex-start!important;padding-top:0!important}
#agPlayerMissionProfile .ag-player-kicker{font-size:6.4px!important}
#agPlayerMissionProfile .ag-player-name{font-size:12px!important;line-height:1.08!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#agPlayerMissionProfile .ag-player-role{font-size:6.6px!important;line-height:1.25!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#agPlayerMissionProfile .ag-player-meta{display:flex!important;gap:4px!important;margin-top:3px!important}
#agPlayerMissionProfile .ag-player-level,#agPlayerMissionProfile .ag-player-chapter{font-size:6.2px!important;padding:3px 5px!important}
#agPlayerMissionProfile .ag-player-xp-label{margin-top:4px!important;font-size:6px!important}
#agPlayerMissionProfile .ag-player-xp-track{height:6px!important;margin:3px 0!important}
#agPlayerMissionProfile .ag-player-xp-text{font-size:6.2px!important}

/* Advisor Bay uses the exact canonical panel family. */
#agAdvisorBay{background:linear-gradient(145deg,#173c45 0%,#102b36 65%,#0a2029 100%)!important;border-color:rgba(153,205,185,.28)!important;border-radius:12px!important}
#agAdvisorBay .ag-advisor{position:relative!important}
#agAdvisorBay .ag-advisor.is-active{border-color:#c2e95d!important;background:linear-gradient(145deg,rgba(194,233,93,.18),rgba(29,125,130,.10))!important;box-shadow:0 0 0 1px rgba(194,233,93,.22),0 10px 20px rgba(0,0,0,.26),0 0 18px rgba(194,233,93,.12)!important}
#agAdvisorBay .ag-advisor.is-active::after{content:"ACTIVE"!important;position:absolute!important;right:4px!important;top:4px!important;color:#dff58a!important;font:900 5.5px/1 Arial,sans-serif!important;letter-spacing:.55px!important}
#agAdvisorBay .ag-advisor-portrait{position:absolute!important;left:50%!important;top:4px!important;transform:translateX(-50%)!important;width:42px!important;height:50px!important;object-fit:cover!important;object-position:center top!important;border-radius:10px 10px 6px 6px!important;filter:drop-shadow(0 5px 6px rgba(0,0,0,.38)) saturate(1.08) contrast(1.05)!important}
#agAdvisorBay .ag-advisor-icon{display:none!important}
#agAdvisorBay .ag-advisor-label{position:relative!important;z-index:2!important}

/* Sales-only Strategic Commander. It is created only while Sales is active. */
#entityInformationSection.ag-sales-commander-active>:not(#agStrategicCommanderPanel){display:none!important}#agStrategicCommanderPanel{position:relative!important;margin:0!important;min-height:0!important;height:100%!important;box-sizing:border-box!important;padding:14px!important;border-radius:14px!important;background:linear-gradient(145deg,#173c45 0%,#102b36 65%,#0a2029 100%)!important;border:1px solid rgba(153,205,185,.28)!important;box-shadow:0 10px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.07)!important;color:#edf7f2!important;overflow:auto!important}
#agStrategicCommanderPanel .agsc-kicker{color:#c2e95d!important;font:900 8px/1 Arial,sans-serif!important;letter-spacing:1.2px!important}
#agStrategicCommanderPanel h2{margin:6px 0 4px!important;color:#fff!important;font:900 22px/1.1 Arial,sans-serif!important}
#agStrategicCommanderPanel p{margin:0 0 12px!important;color:#b9ccc5!important;font:700 10px/1.45 Arial,sans-serif!important}
#agStrategicCommanderPanel .agsc-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
#agStrategicCommanderPanel .agsc-metric{padding:10px!important;border-radius:10px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(176,214,215,.10)!important}
#agStrategicCommanderPanel .agsc-metric span{display:block!important;color:#8fb4ba!important;font:900 7px/1 Arial,sans-serif!important;letter-spacing:.7px!important}
#agStrategicCommanderPanel .agsc-metric b{display:block!important;margin-top:6px!important;color:#dff58a!important;font:900 19px/1 Arial,sans-serif!important}
`;

function install(){
 let style=document.getElementById(SID);
 if(!style){style=document.createElement('style');style.id=SID;document.head.appendChild(style)}
 style.textContent=css;
}

function playerData(){
 host.classList?.add('ag-sales-commander-active');
 const p=window.AGWorldPlayer||{};
 const get=(...keys)=>keys.map(k=>p[k]??sessionStorage.getItem('gamechanger.'+k)??localStorage.getItem('gamechanger.'+k)).find(v=>v!==null&&v!==undefined&&String(v).trim()!=='');
 const name=String(get('display_name','name','username')||'PLAYER').trim().toUpperCase();
 const role=String(get('role','title','position')||'AGWORLD FIELD COMMANDER').trim().toUpperCase();
 const level=Math.max(1,Number(get('level')||1));
 const chapter=Math.max(1,Number(get('chapter','currentChapter')||1));
 const xp=Math.max(0,Number(get('xp','total_xp','totalXp')||0));
 const next=Math.max(1000,Math.ceil((xp+1)/1000)*1000);
 const pct=Math.max(0,Math.min(100,Math.round((xp/next)*100)));
 return {name,role,level,chapter,xp,next,pct,initial:(name[0]||'P').toUpperCase()};
}

function syncPlayer(){
 const card=document.getElementById('agPlayerMissionProfile');
 if(!card)return;
 const d=playerData();
 const set=(sel,v)=>{const el=card.querySelector(sel);if(el)el.textContent=v;};
 set('.ag-player-name',d.name);
 set('.ag-player-role',d.role);
 set('.ag-player-level','LVL '+d.level);
 set('.ag-player-chapter','CH '+d.chapter);
 set('.ag-player-xp-label span','XP EARNED');
 set('.ag-player-xp-label b',d.pct+'%');
 const fill=card.querySelector('.ag-player-xp-fill');if(fill)fill.style.width=d.pct+'%';
 const xp=card.querySelector('.ag-player-xp-text');if(xp)xp.innerHTML='<b>'+d.xp.toLocaleString()+' XP EARNED</b><b>NEXT '+d.next.toLocaleString()+'</b>';
 const avatar=card.querySelector('.ag-player-avatar');if(avatar)avatar.textContent=d.initial;
 card.dataset.agPlayerData='live';
}

function portraitSvg(id,label){
 const palettes={
  compliance:['#183a4c','#76b7c5','#d7a783','#251a18'],
  sales:['#263d18','#c2e95d','#d7a783','#3b2318'],
  product:['#163b54','#59a9d8','#c98968','#1b1715'],
  operations:['#4a3a20','#d0a85a','#b87a5d','#231b17'],
  technical:['#2c214b','#a787d8','#c68b70','#17151c']
 };
 const [bg,accent,skin,hair]=palettes[id]||palettes.sales;
 const initials=label.split(/\s+/).map(x=>x[0]).join('').slice(0,2);
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="'+bg+'"/><stop offset="1" stop-color="#07151b"/></linearGradient><radialGradient id="s" cx=".35" cy=".25"><stop stop-color="#f1c7a5"/><stop offset=".72" stop-color="'+skin+'"/><stop offset="1" stop-color="#6f4233"/></radialGradient></defs><rect width="200" height="240" rx="24" fill="url(#b)"/><circle cx="154" cy="42" r="48" fill="'+accent+'" opacity=".16"/><path d="M18 225c12-56 43-79 82-79s70 23 82 79" fill="'+accent+'" opacity=".9"/><ellipse cx="100" cy="101" rx="49" ry="61" fill="url(#s)"/><path d="M51 88c3-45 23-67 50-67 31 0 50 25 49 64-18-15-32-19-50-18-19 0-33 7-49 21" fill="'+hair+'"/><path d="M70 110c7 5 16 5 23 0M108 110c7 5 16 5 23 0" stroke="#3c271f" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M83 137c11 7 23 7 34 0" stroke="#7a4038" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="83" cy="107" r="3" fill="#17212b"/><circle cx="117" cy="107" r="3" fill="#17212b"/><text x="100" y="218" text-anchor="middle" fill="#fff" opacity=".82" font-family="Arial" font-size="15" font-weight="800" letter-spacing="3">'+initials+'</text></svg>';
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}

function installPortraits(){
 const bay=document.getElementById('agAdvisorBay');if(!bay)return;
 bay.querySelectorAll('.ag-advisor').forEach(btn=>{
   const id=btn.dataset.advisor,label=(btn.querySelector('.ag-advisor-label')?.textContent||id).trim();
   let img=btn.querySelector('.ag-advisor-portrait');
   if(!img){img=document.createElement('img');img.className='ag-advisor-portrait';img.alt=label+' advisor portrait';btn.prepend(img)}
   const fallback=portraitSvg(id,label);
   const preferred='assets/advisors/'+id+'-commander.webp';
   if(!img.dataset.agPortraitBound){
     img.dataset.agPortraitBound='1';
     img.onerror=()=>{if(img.src!==fallback)img.src=fallback;};
   }
   if(!img.getAttribute('src'))img.src=preferred;
 });
}

function removeStrategicCommander(){
 const panel=document.getElementById('agStrategicCommanderPanel');
 const host=panel?.parentElement||document.getElementById('entityInformationSection');
 panel?.remove();
 host?.classList?.remove('ag-sales-commander-active');
 document.body.dataset.agStrategicCommander='off';
}

function showStrategicCommander(){
 const host=document.getElementById('entityInformationSection')||document.querySelector('.map-area');
 if(!host)return;
 let panel=document.getElementById('agStrategicCommanderPanel');
 if(!panel){
   panel=document.createElement('section');
   panel.id='agStrategicCommanderPanel';
   panel.setAttribute('aria-label','Strategic Commander');
   host.appendChild(panel);
 }
 const p=window.AGWorldPlayer||{};
 const company=String(p.company_name||p.company||'YOUR SALES COMMAND').toUpperCase();
 panel.innerHTML='<div class="agsc-kicker">SALES ADVISOR ACTIVE</div><h2>STRATEGIC COMMANDER</h2><p>Live strategic command for '+esc(company)+'. This surface exists only while the Sales Commander is actively selected.</p><div class="agsc-grid"><div class="agsc-metric"><span>ACTIVE LEADS</span><b>6</b></div><div class="agsc-metric"><span>PIPELINE VALUE</span><b>71</b></div><div class="agsc-metric"><span>WINS</span><b>4</b></div></div>';
 document.body.dataset.agStrategicCommander='sales-active';
}

function setAdvisor(bay,btn){
 const id=btn.dataset.advisor;
 const active=btn.classList.contains('is-active');
 if(active){
   bay.querySelectorAll('.ag-advisor').forEach(x=>x.classList.remove('is-active'));
   window.AGWorldAdvisorState=null;
   removeStrategicCommander();
   window.dispatchEvent(new CustomEvent('agworld:advisor-deselected',{detail:{id}}));
   return;
 }
 bay.querySelectorAll('.ag-advisor').forEach(x=>x.classList.toggle('is-active',x===btn));
 window.AGWorldAdvisorState={id,label:btn.querySelector('.ag-advisor-label')?.textContent||id};
 if(id==='sales')showStrategicCommander();else removeStrategicCommander();
 window.dispatchEvent(new CustomEvent('agworld:advisor-selected',{detail:window.AGWorldAdvisorState}));
}

function bindAdvisorBay(){
 const bay=document.getElementById('agAdvisorBay');if(!bay)return;
 installPortraits();
 if(bay.dataset.agCardPolishBound)return;
 bay.dataset.agCardPolishBound='1';
 bay.addEventListener('click',e=>{
   const btn=e.target.closest('.ag-advisor');
   if(!btn||!bay.contains(btn))return;
   e.preventDefault();
   e.stopImmediatePropagation();
   setAdvisor(bay,btn);
 },true);
}

function run(){install();syncPlayer();bindAdvisorBay();}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
['agworld:player-profile','agworld:player-ready','agworld:player-state','agworld:mission-completed','agworld:landing-layout-ready'].forEach(e=>addEventListener(e,()=>setTimeout(run,0)));
const observer=new MutationObserver(()=>requestAnimationFrame(run));
observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(syncPlayer,1500);
})();
