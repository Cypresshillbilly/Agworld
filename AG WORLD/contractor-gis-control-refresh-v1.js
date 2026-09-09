(function(){
'use strict';
let queued=false;
function refresh(){
  if(queued)return;
  queued=true;
  setTimeout(()=>{
    queued=false;
    if(typeof window.refreshTerritoryControl==='function') window.refreshTerritoryControl();
  },250);
}
['agworld:entity-updated','agworld:contractor-created','agworld:contractor-updated','agworld:contractor-deleted','agworld:farms-reset','agworld:demo-world-seeded'].forEach(name=>window.addEventListener(name,refresh));
})();