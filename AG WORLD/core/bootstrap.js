/* GAME CHANGER bootstrap — one deterministic core startup sequence. */
(function(){
  'use strict';
  const core=[
    'core/build-registry.js?v=architecture-v1',
    'core/mission-store.js?v=architecture-v1'
  ];
  const load=src=>new Promise((resolve,reject)=>{
    if(document.querySelector('script[data-gc-core="'+src+'"]')) return resolve();
    const s=document.createElement('script');s.src=src;s.defer=false;s.dataset.gcCore=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  const loadActiveBuildManifest=()=>{
    const build=window.GAME_CHANGER_BUILD&&window.GAME_CHANGER_BUILD.current();
    return build&&build.manifest?load(build.manifest+'?v=phase2'):Promise.resolve();
  };
  window.GAME_CHANGER_READY=core.reduce((p,src)=>p.then(()=>load(src)),Promise.resolve())
    .then(()=>loadActiveBuildManifest()).then(()=>window.dispatchEvent(new CustomEvent('gamechanger:core-ready')))
    .catch(error=>console.error('GAME CHANGER core bootstrap failed',error));
})();