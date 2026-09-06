/* Agriculture build login module. */
(function(){
  'use strict';
  const apply=()=>{
    if(!window.GAME_CHANGER_BUILD||!window.GAME_CHANGER_BUILD.is('agriculture')) return;
    const manifest=window.GAME_CHANGER_AGRICULTURE_BUILD;
    const image=manifest?.login?.background||window.GAME_CHANGER_BUILD.current()?.loginBackground;
    if(image) window.GAME_CHANGER_ACTIVE_LOGIN={build:'agriculture',background:image};
    window.dispatchEvent(new CustomEvent('gamechanger:agriculture-login-ready',{detail:{build:'agriculture',background:image}}));
  };
  if(window.GAME_CHANGER_READY) window.GAME_CHANGER_READY.then(apply); else window.addEventListener('gamechanger:core-ready',apply,{once:true});
})();