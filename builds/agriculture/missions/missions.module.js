/* Agriculture mission scope adapter. */
(function(){
  'use strict';
  const ready=()=>{
    const scope=window.GAME_CHANGER_AGRI_MISSIONS||{build:'Agriculture',role:'agriculture_sales'};
    window.GAME_CHANGER_AGRI_MISSION_SCOPE=Object.freeze(scope);
  };
  if(window.GAME_CHANGER_READY) window.GAME_CHANGER_READY.then(ready); else window.addEventListener('gamechanger:core-ready',ready,{once:true});
})();