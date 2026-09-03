/* AG WORLD — live mission cards. Cards expand in place to reveal the full mission brief. */
(()=>{
  const details={
    opportunity:{
      objective:'Identify the farm, establish the decision-maker relationship and qualify the opportunity.',
      actions:['Review the farm record and available intelligence.','Contact the farmer or decision-maker.','Book and complete the first meeting.','Record the opportunity outcome.'],
      success:'A qualified opportunity with the next action and customer outcome recorded.'
    },
    visit:{
      objective:'Protect the customer relationship by confirming the latest service outcome.',
      actions:['Contact the customer after service.','Confirm satisfaction and any outstanding issues.','Capture feedback and customer score.','Create a follow-up action where required.'],
      success:'Customer feedback is recorded and any required follow-up is scheduled.'
    },
    training:{
      objective:'Complete the technician knowledge challenge and strengthen the support handover.',
      actions:['Open the repair assessment.','Complete the technical knowledge challenge.','Review incorrect answers and guidance.','Record the completed training result.'],
      success:'Assessment completed and the resulting skill progress is recorded.'
    }
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function apply(){
    document.querySelectorAll('.missions .mission').forEach(card=>{
      if(card.dataset.missionInteractive==='1')return;
      const key=card.dataset.action, d=details[key];
      if(!d)return;
      card.dataset.missionInteractive='1';
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-expanded','false');
      const more=document.createElement('div');
      more.className='mission-details';
      more.innerHTML=`<div class="mission-detail-objective"><b>OBJECTIVE</b><span>${esc(d.objective)}</span></div><div class="mission-detail-actions"><b>MISSION STEPS</b><ol>${d.actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div><div class="mission-detail-success"><b>SUCCESS</b><span>${esc(d.success)}</span></div>`;
      card.appendChild(more);
      const toggle=()=>{const open=card.classList.toggle('is-expanded');card.setAttribute('aria-expanded',String(open));};
      card.addEventListener('click',e=>{if(e.target.closest('button,a,input,select,textarea'))return;toggle()});
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
    });
  }
  const style=document.createElement('style');
  style.textContent=`
    html body.ag-profile-mode .missions .mission{transition:box-shadow .16s ease,transform .16s ease!important}
    html body.ag-profile-mode .missions .mission:hover{box-shadow:0 4px 12px rgba(30,50,60,.13)!important;transform:translateY(-1px)!important}
    html body.ag-profile-mode .missions .mission:focus-visible{outline:2px solid #69b847!important;outline-offset:2px!important}
    html body.ag-profile-mode .missions .mission-details{display:none!important;margin:10px 0 0!important;padding:10px 0 0!important;border-top:1px solid #e5ebed!important;color:#4d5e65!important;font:600 11px/1.4 Arial,sans-serif!important}
    html body.ag-profile-mode .missions .mission.is-expanded .mission-details{display:block!important}
    html body.ag-profile-mode .missions .mission-detail-objective,.missions .mission-detail-success{display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;gap:7px!important;margin-bottom:7px!important}
    html body.ag-profile-mode .missions .mission-details b{color:#6f8086!important;font:900 9px/1.2 Arial,sans-serif!important;letter-spacing:.45px!important}
    html body.ag-profile-mode .missions .mission-details span{color:#4d5e65!important;font:600 10px/1.35 Arial,sans-serif!important}
    html body.ag-profile-mode .missions .mission-detail-actions b{display:block!important;margin-bottom:3px!important}
    html body.ag-profile-mode .missions .mission-detail-actions ol{margin:0 0 0 16px!important;padding:0!important}
    html body.ag-profile-mode .missions .mission-detail-actions li{margin:1px 0!important;padding:0!important;color:#4d5e65!important;font:600 10px/1.3 Arial,sans-serif!important}
    html body.ag-profile-mode .missions .mission.is-expanded{padding-bottom:12px!important}
  `;
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,300);setTimeout(apply,900);setTimeout(apply,1800)});
})();
