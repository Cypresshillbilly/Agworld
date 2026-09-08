(function(){
'use strict';
function refresh(){
  if(typeof window.refreshTerritoryControl==='function') window.refreshTerritoryControl();
}
['agworld:entity-updated','agworld:contractor-created','agworld:contractor-updated','agworld:contractor-deleted','agworld:farms-reset'].forEach(name=>window.addEventListener(name,()=>setTimeout(refresh,0)));
window.addEventListener('agworld:territory-control-updated',()=>setTimeout(refresh,0));
setInterval(refresh,5000);
})();