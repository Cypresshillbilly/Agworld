/* Filter controls delegate to the canonical board and shared farm records. */
(()=>{
 const state={countries:true,'country-icons':true,'province-icons':true,control:true,relationships:true,municipalities:true,towns:true,contractors:true,competitors:true,facilities:true,territory:true,farms:true,opportunities:true,'company-drones':true,'competitor-drones':false,crops:false,livestock:false,machinery:false,water:false,infrastructure:false,provinces:true};
 window.agWorldSetLayerVisibility=(layer,visible)=>{
  if(!(layer in state))return;state[layer]=!!visible;
  if(layer==='relationships'){if(!visible)window.clearRelationshipNetwork?.();else{const selection=window.__AGWORLD_RELATIONSHIP_CANONICAL_STATE__?.selected;if(selection)window.scheduleRelationshipNetwork?.(selection);}}
  if(typeof refreshMapVisibility==='function')refreshMapVisibility();
  window.dispatchEvent(new CustomEvent('agworld:map-filters-changed',{detail:{...state}}));
 };
 window.agWorldGetLayerState=()=>({...state});
})();
