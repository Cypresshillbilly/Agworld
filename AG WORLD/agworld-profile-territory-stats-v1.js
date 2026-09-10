/* AG World Player Profile Territory Stats v1
   Dedicated Player Profile implementation.
   This module owns only body.ag-profile-mode and intentionally does not modify
   Full Game territory geometry. */
(()=>{
'use strict';
const ROOT_ID='agProfileTerritoryStats';
const STYLE_ID='agProfileTerritoryStatsStyle';

function isProfile(){return document.body.classList.contains('ag-profile-mode');}
function n(v){return Number.isFinite(Number(v))?Number(v):0;}
function summary(){
  const api=window.AGWorldTerritoryControl;
  const s=api?.summary?.();
  if(s?.combined)return s;
  return {combined:{total:0,company:0,competitor:0,neutral:0,companyPct:0,competitorPct:0,neutralPct:0},farms:{total:0},contractors:{total:0}};
}
function fmt(v){return n(v).toLocaleString();}
function pct(v){return Math.max(0,Math.min(100,n(v)));}
function panelHTML(){
 return '<div class="agpts-shell">'+
   '<div class="agpts-head"><div><span class="agpts-kicker">LIVE TERRITORY INTELLIGENCE</span><strong>TERRITORY CONTROL</strong></div><span class="agpts-live"><i></i>LIVE</span></div>'+
   '<div class="agpts-control"><div class="agpts-control-top"><span>COMPANY CONTROL</span><b data-agpts="control">0%</b></div><div class="agpts-bar"><span data-agpts="bar"></span></div></div>'+
   '<div class="agpts-stack">'+
     '<article><span>ACTIVE ASSETS</span><strong data-agpts="total">0</strong></article>'+
     '<article><span>COMPANY CONTROLLED</span><strong data-agpts="company">0</strong></article>'+
     '<article><span>COMPETITOR CONTROLLED</span><strong data-agpts="competitor">0</strong></article>'+
     '<article><span>NEUTRAL</span><strong data-agpts="neutral">0</strong></article>'+
     '<article><span>FARMS / CONTRACTORS</span><strong><em data-agpts="farms">0</em><small>/</small><em data-agpts="contractors">0</em></strong></article>'+
   '</div>'+
   '<div class="agpts-legend"><span><i class="company"></i>COMPANY</span><span><i class="competitor"></i>COMPETITOR</span><span><i class="neutral"></i>NEUTRAL</span></div>'+
 '</div>';
}
function ensureStyle(){
 if(document.getElementById(STYLE_ID))return;
 const style=document.createElement('style');style.id=STYLE_ID;
 style.textContent=
 'body.ag-profile-mode #territoryInfoPanel,body.ag-profile-mode #territoryStatsDrawer{display:none!important}'+
 '#'+ROOT_ID+'{position:absolute;right:0;top:18px;z-index:2600;height:auto;display:flex;flex-direction:row;align-items:stretch;justify-content:flex-end;pointer-events:auto}'+
 '#'+ROOT_ID+' .agpts-toggle{width:30px;min-width:30px;border:1px solid rgba(184,230,32,.48);border-left:0;border-radius:0 10px 10px 0;background:linear-gradient(180deg,#173c45,#102b36);color:#f4f3ed;cursor:pointer;padding:8px 0;display:flex;align-items:center;justify-content:center;gap:7px;writing-mode:vertical-rl;letter-spacing:1px;font:800 8px Arial,sans-serif}'+
 '#'+ROOT_ID+' .agpts-toggle b{font-size:15px;line-height:1;font-weight:400}'+
 '#'+ROOT_ID+' .agpts-panel{width:260px;min-width:260px;height:100%;overflow:hidden;border:1px solid rgba(184,230,32,.42);border-right:0;border-radius:14px 0 0 14px;background:linear-gradient(150deg,#173c45 0%,#102b36 55%,#0a2029 100%);box-shadow:0 16px 34px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.07);color:#f4f3ed}'+
 '#'+ROOT_ID+'.is-collapsed .agpts-panel{display:none}'+
 '#'+ROOT_ID+' .agpts-shell{height:100%;box-sizing:border-box;padding:13px 12px;display:flex;flex-direction:column;gap:9px;overflow:hidden}'+
 '#'+ROOT_ID+' .agpts-head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:9px;border-bottom:1px solid rgba(217,218,213,.16)}'+
 '#'+ROOT_ID+' .agpts-head strong{display:block;font:900 13px/1.1 Arial,sans-serif;letter-spacing:.35px}'+
 '#'+ROOT_ID+' .agpts-kicker{display:block;font:800 7px/1.2 Arial,sans-serif;letter-spacing:1.25px;color:#b8e620;margin-bottom:4px}'+
 '#'+ROOT_ID+' .agpts-live{font:800 7px Arial,sans-serif;letter-spacing:.9px;color:#cddbd2;display:flex;align-items:center;gap:4px}'+
 '#'+ROOT_ID+' .agpts-live i{width:6px;height:6px;border-radius:50%;background:#b8e620;display:inline-block;box-shadow:0 0 8px rgba(184,230,32,.7)}'+
 '#'+ROOT_ID+' .agpts-control{padding:10px;border:1px solid rgba(217,218,213,.15);border-radius:11px;background:rgba(11,44,32,.32)}'+
 '#'+ROOT_ID+' .agpts-control-top{display:flex;justify-content:space-between;align-items:end;gap:8px}'+
 '#'+ROOT_ID+' .agpts-control-top span{font:800 7px Arial,sans-serif;letter-spacing:1px;color:#cddbd2}'+
 '#'+ROOT_ID+' .agpts-control-top b{font:900 25px/1 Arial,sans-serif;color:#b8e620}'+
 '#'+ROOT_ID+' .agpts-bar{height:7px;margin-top:8px;border-radius:99px;overflow:hidden;background:rgba(0,0,0,.34);border:1px solid rgba(217,218,213,.12)}'+
 '#'+ROOT_ID+' .agpts-bar span{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#0d6a38,#b8e620);transition:width .25s ease}'+
 '#'+ROOT_ID+' .agpts-stack{display:grid;grid-template-columns:1fr;grid-template-rows:repeat(5,minmax(0,1fr));gap:7px;flex:1 1 auto;min-height:0}'+
 '#'+ROOT_ID+' .agpts-stack article{min-height:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid rgba(217,218,213,.14);border-radius:10px;background:rgba(11,44,32,.30)}'+
 '#'+ROOT_ID+' .agpts-stack span{font:800 7px/1.2 Arial,sans-serif;letter-spacing:.9px;color:#cddbd2;max-width:56%}'+
 '#'+ROOT_ID+' .agpts-stack strong{font:900 21px/1 Arial,sans-serif;color:#f4f3ed;text-align:right;white-space:nowrap}'+
 '#'+ROOT_ID+' .agpts-stack em{font-style:normal;font-size:17px}'+
 '#'+ROOT_ID+' .agpts-stack small{font-size:11px;color:#83988e;margin:0 3px}'+
 '#'+ROOT_ID+' .agpts-legend{display:grid;grid-template-columns:1fr;gap:5px;padding-top:8px;border-top:1px solid rgba(217,218,213,.14)}'+
 '#'+ROOT_ID+' .agpts-legend span{font:800 7px Arial,sans-serif;letter-spacing:.7px;color:#cddbd2;display:flex;align-items:center;gap:6px}'+
 '#'+ROOT_ID+' .agpts-legend i{width:7px;height:7px;border-radius:50%;display:inline-block}'+
 '#'+ROOT_ID+' .agpts-legend .company{background:#b8e620}.agpts-legend .competitor{background:#d69212}.agpts-legend .neutral{background:#d9dad5}';
 document.head.appendChild(style);
}
function ensure(){
 if(!isProfile())return null;
 ensureStyle();
 const map=document.querySelector('.map-area');if(!map)return null;
 let root=document.getElementById(ROOT_ID);
 if(!root){
   root=document.createElement('aside');root.id=ROOT_ID;root.className='is-collapsed';
   root.innerHTML='<section class="agpts-panel" aria-label="Territory control statistics">'+panelHTML()+'</section><button type="button" class="agpts-toggle" aria-expanded="false" aria-label="Open Territory Stats"><span>TERRITORY STATS</span><b>‹</b></button>';
   map.appendChild(root);
   root.querySelector('.agpts-toggle').addEventListener('click',()=>{root.classList.toggle('is-collapsed');const open=!root.classList.contains('is-collapsed');root.querySelector('.agpts-toggle').setAttribute('aria-expanded',String(open));root.querySelector('.agpts-toggle').querySelector('b').textContent=open?'›':'‹';layout();});
 }
 return root;
}
function update(){
 const root=ensure();if(!root)return;
 const s=summary(),c=s.combined||{};
 const values={control:pct(c.companyPct)+'%',total:fmt(c.total),company:fmt(c.company),competitor:fmt(c.competitor),neutral:fmt(c.neutral),farms:fmt(s.farms?.total),contractors:fmt(s.contractors?.total)};
 Object.entries(values).forEach(([k,v])=>{const el=root.querySelector('[data-agpts="'+k+'"]');if(el)el.textContent=v;});
 const bar=root.querySelector('[data-agpts="bar"]');if(bar)bar.style.width=pct(c.companyPct)+'%';
}
function layout(){
 const root=ensure();if(!root)return;
 const map=document.querySelector('.map-area'),command=document.getElementById('entityInformationSection');
 if(!map)return;
 const mr=map.getBoundingClientRect();
 const top=18,gap=16;
 // Player Page Command Center: centred horizontally within the cropped map,
 // floating above the bottom edge with visible map on all exposed sides.
 if(command){
   const desiredW=Math.min(Math.round(mr.width*.72),Math.max(360,Math.round(mr.width-72)));
   const desiredH=Math.min(Math.round(mr.height*.30),220);
   const bottomInset=Math.max(18,Math.round(mr.height*.035));
   const left=Math.max(18,Math.round((mr.width-desiredW)/2));
   command.style.setProperty('position','absolute','important');
   command.style.setProperty('left',left+'px','important');
   command.style.setProperty('right','auto','important');
   command.style.setProperty('width',desiredW+'px','important');
   command.style.setProperty('height',desiredH+'px','important');
   command.style.setProperty('bottom',bottomInset+'px','important');
   command.style.setProperty('top','auto','important');
   command.style.setProperty('z-index','1500','important');
 }
 const cr=command?.getBoundingClientRect();
 let bottom=18;
 if(cr&&cr.width&&cr.height){
   // Territory Stats and Command Center are physically separated: stats stop
   // above the command center and leave a persistent visual breathing gap.
   bottom=Math.max(18,Math.round(mr.bottom-cr.top)+gap);
 }
 root.style.top=top+'px';root.style.bottom=bottom+'px';root.style.height='auto';
 root.dataset.commandClearance=String(bottom);
}
function refresh(){if(!isProfile())return;ensure();update();layout();}
function start(){
 refresh();
 window.addEventListener('agworld:territory-control-updated',refresh);
 window.addEventListener('agworld:entity-updated',refresh);
 window.addEventListener('resize',layout);
 [0,80,250,600,1200,2500].forEach(ms=>setTimeout(refresh,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();