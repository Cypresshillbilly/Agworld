/* GAME CHANGER Build Registry — single industry-build contract. */
(function(){
  'use strict';
  const KEY='gamechanger.activeBuild';
  const registry={
    agriculture:{
      id:'agriculture',
      label:'Agriculture',
      loginBackground:'assets/ag_world_login_v2.jpg',
      landing:'index.html',
      assetsRoot:'builds/agriculture/assets/',
      dataNamespace:'agriculture'
    },
    financial_services:{
      id:'financial_services',
      label:'Financial Services',
      loginBackground:null,
      landing:null,
      assetsRoot:'builds/financial-services/assets/',
      dataNamespace:'financial_services'
    }
  };
  const aliases={agriculture:'agriculture',agri:'agriculture','other':'financial_services',financial_services:'financial_services','financial services':'financial_services'};
  const normalize=value=>aliases[String(value||'').trim().toLowerCase()]||'agriculture';
  const get=()=>normalize(localStorage.getItem(KEY));
  const set=value=>{
    const id=normalize(value);
    localStorage.setItem(KEY,id);
    window.dispatchEvent(new CustomEvent('gamechanger:build-changed',{detail:{build:id,definition:registry[id]}}));
    return registry[id];
  };
  window.GAME_CHANGER_BUILDS=Object.freeze(registry);
  window.GAME_CHANGER_BUILD={get, set, current:()=>registry[get()], is:id=>get()===normalize(id)};
  function apply(){
    const id=get();
    document.documentElement.dataset.gamechangerBuild=id;
    if(document.body) document.body.dataset.gamechangerBuild=id;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
  window.addEventListener('gamechanger:build-changed',apply);
})();