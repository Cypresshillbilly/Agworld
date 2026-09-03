/* GAME CHANGER core Mission Engine enhancements. Missions are organised by industry build and role. */
(function(){
  'use strict';
  const ROLE_REGISTRY = window.GAME_CHANGER_ROLES || {};
  const roleForBuild = build => {
    const key = String(build || '').toLowerCase().replace(/[^a-z0-9]+/g,'_');
    const matches = Object.values(ROLE_REGISTRY).filter(r => r && r.id !== 'administrator' && String(r.environment || '').toLowerCase() === key);
    return matches.length ? matches : Object.values(ROLE_REGISTRY).filter(r => r && r.id !== 'administrator');
  };

  function addRoleField(buildSelect){
    const grid = buildSelect.closest('.form-grid');
    if (!grid || document.getElementById('missionRole')) return;
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = '<label>MISSION ROLE</label><select id="missionRole"></select>';
    buildSelect.parentElement.insertAdjacentElement('afterend', field);
    const roleSelect = field.querySelector('select');
    const refresh = () => {
      roleSelect.innerHTML = '';
      const all = document.createElement('option'); all.value='*'; all.textContent='ALL ROLES IN THIS BUILD'; roleSelect.appendChild(all);
      roleForBuild(buildSelect.value).forEach(role => { const o=document.createElement('option'); o.value=role.id; o.textContent=role.label; roleSelect.appendChild(o); });
    };
    buildSelect.addEventListener('change', refresh); refresh();
  }

  function addOrganisationNote(){
    const workflow=document.querySelector('.workflow');
    if(!workflow || document.getElementById('missionScopeNote')) return;
    const note=document.createElement('div'); note.id='missionScopeNote';
    note.style.cssText='margin-top:16px;padding:11px 13px;border-left:3px solid #a8d51f;background:rgba(168,213,31,.055);color:#687166;font-size:9px;line-height:1.5';
    note.textContent='MISSION ORGANISATION · Every mission is defined by BUILD + ROLE. Select ALL ROLES for a build-wide mission, or select a specific role for a role-specific mission.';
    workflow.insertAdjacentElement('beforebegin',note);
  }

  function install(){
    const buildSelect=[...document.querySelectorAll('.mission-modal .field select')].find(s=>s.closest('.field')?.querySelector('label')?.textContent.trim()==='INDUSTRY BUILD');
    if(!buildSelect) return;
    addRoleField(buildSelect); addOrganisationNote();
    const save=document.getElementById('missionSave');
    if(!save || save.dataset.scopeEnhanced) return;
    save.dataset.scopeEnhanced='1';
    save.addEventListener('click',function(){
      const name=document.getElementById('missionName')?.value.trim(); if(!name) return;
      const missions=(()=>{try{const x=JSON.parse(localStorage.getItem('gamechanger.missions')||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}})();
      const type=document.querySelector('.mission-modal .field select')?.value || 'Custom';
      const priority=[...document.querySelectorAll('.mission-modal .field select')].find(s=>s.closest('.field')?.querySelector('label')?.textContent.trim()==='PRIORITY')?.value || 'Normal';
      const objective=document.querySelector('.mission-modal textarea')?.value.trim() || '';
      const success=[...document.querySelectorAll('.mission-modal .field input')].find(i=>i.closest('.field')?.querySelector('label')?.textContent.trim()==='SUCCESS CRITERIA')?.value.trim() || '';
      const xpInput=[...document.querySelectorAll('.mission-modal .field input')].find(i=>i.closest('.field')?.querySelector('label')?.textContent.trim()==='PROFILE XP REWARD');
      const role=document.getElementById('missionRole')?.value || '*';
      const build=buildSelect.value || 'Agriculture';
      missions.push({id:'mission_'+Date.now(),name,build,role,type,priority,objective,success,xp:Number(xpInput?.value || 0),createdAt:new Date().toISOString()});
      localStorage.setItem('gamechanger.missions',JSON.stringify(missions));
      window.dispatchEvent(new CustomEvent('gamechanger:missions-changed'));
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
