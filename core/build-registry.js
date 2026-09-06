/* GAME CHANGER Build Registry — master platform owns build selection. */
(function(){
 'use strict';
 const KEY='gamechanger.activeBuild';
 const registry={
   agriculture:{
     id:'agriculture',label:'Agriculture',description:'Agriculture intelligence, territory management and sales execution.',
     status:'active',statusLabel:'LIVE',roleCount:1,
     loginBackground:'assets/ag_world_login_v2.jpg',landing:'index.html',admin:'admin.html',
     assetsRoot:'builds/agriculture/assets/',dataNamespace:'agriculture',manifest:'builds/agriculture/build.manifest.js'
   },
   financial_services:{
     id:'financial_services',label:'Financial Services',description:'Reserved build slot for a future isolated industry environment.',
     status:'planned',statusLabel:'PLANNED',roleCount:0,
     loginBackground:null,landing:null,admin:null,
     assetsRoot:'builds/financial-services/assets/',dataNamespace:'financial_services',manifest:null
   }
 };
 const aliases={agriculture:'agriculture',agri:'agriculture',other:'financial_services',financial_services:'financial_services','financial services':'financial_services'};
 const normalize=v=>aliases[String(v||'').trim().toLowerCase()]||'agriculture';
 const get=()=>normalize(localStorage.getItem(KEY));
 const apply=()=>{const id=get();document.documentElement.dataset.gamechangerBuild=id;if(document.body)document.body.dataset.gamechangerBuild=id;};
 const set=v=>{const id=normalize(v);localStorage.setItem(KEY,id);apply();window.dispatchEvent(new CustomEvent('gamechanger:build-changed',{detail:{build:id,definition:registry[id]}}));return registry[id];};
 window.GAME_CHANGER_BUILDS=Object.freeze(registry);
 window.GAME_CHANGER_BUILD=Object.freeze({get,set,current:()=>registry[get()],is:id=>get()===normalize(id)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();