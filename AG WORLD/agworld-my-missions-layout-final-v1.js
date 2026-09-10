/* AgWorld Mission Layout — recovery baseline
 *
 * The canonical player surface is owned by profile-menu-refinement.js.
 * This recovery shim intentionally performs no DOM movement, deletion,
 * hiding, sizing, or styling. In particular it must never remove:
 *   #agPlayerMissionProfile
 *   #agMissionSkillProfile
 *   #agLandingMissionCard
 *   #agAdvisorBay
 *
 * This restores the last known working ownership model while the player
 * surface is stabilised. A future Mission V2 iteration must be introduced
 * behind an explicit isolated mount rather than mutating this live surface.
 */
(function(){
  'use strict';
  const mark=()=>{
    const missions=document.querySelector('.missions');
    if(!missions)return;
    missions.dataset.agMissionLayout='baseline-recovery';
    missions.dataset.agMissionLayer='profile-menu-canonical';
    window.dispatchEvent(new CustomEvent('agworld:mission-layout-recovered'));
  };
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',mark,{once:true});
  }else{
    mark();
  }
})();