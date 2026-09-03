/* GAME CHANGER core Mission Engine enhancements.
   Missions are organised by industry build and role. */
(function(){
  'use strict';

  const ROLE_REGISTRY = window.GAME_CHANGER_ROLES || {};

  const roleForBuild = (build) => {
    const key = String(build || '').toLowerCase().replace(/[^a-z0-9]+/g,'_');
    const matches = Object.values(ROLE_REGISTRY).filter(r => {
      if (!r || !r.id || r.id === 'administrator') return false;
      const env = String(r.environment || '').toLowerCase();
      return env === key || (key === 'agriculture' && env === 'agriculture');
    });
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
      const build = buildSelect.value;
      const roles = roleForBuild(build);
      roleSelect.innerHTML = '';
      const all = document.createElement('option');
      all.value = '*';
      all.textContent = 'ALL ROLES IN THIS BUILD';
      roleSelect.appendChild(all);
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.label;
        roleSelect.appendChild(option);
      });
    };
    buildSelect.addEventListener('change', refresh);
    refresh();
  }

  function addOrganisationNote(){
    const body = document.querySelector('.mission-body');
    const workflow = document.querySelector('.workflow');
    if (!body || !workflow || document.getElementById('missionScopeNote')) return;
    const note = document.createElement('div');
    note.id = 'missionScopeNote';
    note.style.cssText = 'margin-top:16px;padding:11px 13px;border-left:3px solid #a8d51f;background:rgba(168,213,31,.055);color:#687166;font-size:9px;line-height:1.5';
    note.textContent = 'MISSION ORGANISATION · Every mission is defined by BUILD + ROLE. Select ALL ROLES to create a build-wide mission, or select a specific role for a role-specific mission.';
    workflow.insertAdjacentElement('beforebegin', note);
  }

  function install(){
    const buildSelect = [...document.querySelectorAll('.mission-modal .field select')].find(s => {
      const label = s.closest('.field')?.querySelector('label');
      return label && label.textContent.trim() === 'INDUSTRY BUILD';
    });
    if (!buildSelect) return;
    addRoleField(buildSelect);
    addOrganisationNote();

    const save = document.getElementById('missionSave');
    if (!save || save.dataset.scopeEnhanced) return;
    save.dataset.scopeEnhanced = '1';
    save.addEventListener('click', function(){
      const name = document.getElementById('missionName')?.value.trim();
      const role = document.getElementById('missionRole')?.value || '*';
      const build = buildSelect.value;
      if (!name) return;
      const missions = JSON.parse(localStorage.getItem('gamechanger.missions') || '[]');
      missions.push({
        id: 'mission_' + Date.now(),
        name,
        build,
        role,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('gamechanger.missions', JSON.stringify(missions));
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
