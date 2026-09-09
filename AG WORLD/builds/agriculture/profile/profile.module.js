/* Agriculture profile module loader. */
(function(){
  'use strict';
  const load=src=>new Promise(resolve=>{
    if(document.querySelector('script[data-gc-agri="'+src+'"]')) return resolve();
    const s=document.createElement('script');s.src=src+'?v=phase2-agri-profile';s.dataset.gcAgri=src;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s);
  });
  const start=()=>{
    if(!window.GAME_CHANGER_BUILD?.is('agriculture')) return;
    const modules=window.GAME_CHANGER_AGRI_PROFILE?.modules||[];
    modules.reduce((p,src)=>p.then(()=>load(src)),Promise.resolve())
      .then(()=>window.dispatchEvent(new CustomEvent('gamechanger:agriculture-profile-ready')));
  };
  if(window.GAME_CHANGER_READY) window.GAME_CHANGER_READY.then(start); else window.addEventListener('gamechanger:core-ready',start,{once:true});
})();