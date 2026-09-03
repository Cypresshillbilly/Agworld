/* GAME CHANGER build environment context — persistent administrator build selection. */
(function(){
  'use strict';
  const KEY='gamechanger.activeBuild';
  const AGRI='agriculture';
  const OTHER='other';
  const get=()=>String(localStorage.getItem(KEY)||AGRI).toLowerCase()==='other'?OTHER:AGRI;
  const set=build=>{const value=String(build||'').toLowerCase()==='other'?OTHER:AGRI;localStorage.setItem(KEY,value);window.dispatchEvent(new CustomEvent('gamechanger:build-changed',{detail:{build:value}}));return value;};
  window.GAME_CHANGER_BUILD={get,set,isAgriculture:()=>get()===AGRI};
  function apply(){
    const build=get();
    document.documentElement.dataset.gamechangerBuild=build;
    if(document.body){document.body.dataset.gamechangerBuild=build;document.body.classList.toggle('agri-build-active',build===AGRI);document.body.classList.toggle('agriculture-build',build===AGRI);}
  }
  function wireAdmin(){
    if(!/\/admin\.html$/i.test(location.pathname)) return;
    const buttons=[...document.querySelectorAll('.build-switch button')];
    if(!buttons.length) return;
    const refresh=()=>{const build=get();buttons.forEach(button=>{const agri=/agri|agriculture/i.test(button.textContent||'');const other=/other/i.test(button.textContent||'');const active=(build===AGRI&&agri)||(build===OTHER&&other);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});};
    buttons.forEach(button=>{if(button.dataset.gcBuildBound)return;button.dataset.gcBuildBound='1';button.addEventListener('click',()=>{set(/other/i.test(button.textContent||'')?OTHER:AGRI);refresh();});});
    refresh();
  }
  function start(){apply();wireAdmin();window.addEventListener('gamechanger:build-changed',()=>{apply();wireAdmin();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
