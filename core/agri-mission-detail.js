/* GAME CHANGER Agriculture — real Mission Library detail window + completion. */
(function(){
  'use strict';
  if (/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY='gamechanger.missions';
  const STATUS_KEY='gamechanger.mission-status';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
  const statuses=()=>{try{const x=JSON.parse(localStorage.getItem(STATUS_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return{}}};
  const saveStatuses=x=>localStorage.setItem(STATUS_KEY,JSON.stringify(x));
  const missionById=id=>read().find(m=>String(m?.id||m?.missionId||m?.key||'')===String(id));

  function ensureModal(){
    if(document.getElementById('gcMissionDetailModal')) return document.getElementById('gcMissionDetailModal');
    const modal=document.createElement('div'); modal.id='gcMissionDetailModal'; modal.className='gc-md-modal';
    modal.innerHTML=`<div class="gc-md-backdrop" data-close="1"></div><section class="gc-md-window" role="dialog" aria-modal="true" aria-labelledby="gcMdTitle"><header class="gc-md-head"><div><div class="gc-md-kicker">AGRI BUILD · SALES PERSON</div><h2 id="gcMdTitle">MISSION</h2></div><button type="button" class="gc-md-close" data-close="1">×</button></header><div class="gc-md-body"><div class="gc-md-grid"><div><span>MISSION TYPE</span><strong id="gcMdType">—</strong></div><div><span>PRIORITY</span><strong id="gcMdPriority">—</strong></div><div><span>PROFILE XP</span><strong id="gcMdXp">—</strong></div><div><span>STATUS</span><strong id="gcMdStatus">ACTIVE</strong></div></div><div class="gc-md-section"><label>MISSION OBJECTIVE</label><p id="gcMdObjective">—</p></div><div class="gc-md-section"><label>SUCCESS CRITERIA</label><p id="gcMdSuccess">—</p></div><div class="gc-md-section"><label>WORKFLOW</label><ol id="gcMdWorkflow"></ol></div></div><footer class="gc-md-foot"><button type="button" class="gc-md-secondary" data-close="1">CLOSE</button><button type="button" id="gcMdComplete" class="gc-md-complete">COMPLETE MISSION</button></footer></section>`;
    document.body.appendChild(modal);
    const style=document.createElement('style'); style.id='gc-md-style'; style.textContent=`
      .gc-md-modal{display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center}.gc-md-modal.open{display:flex}.gc-md-backdrop{position:absolute;inset:0;background:rgba(8,20,25,.58);backdrop-filter:blur(2px)}.gc-md-window{position:relative;width:min(620px,calc(100vw - 34px));max-height:calc(100vh - 50px);overflow:auto;background:#fff;border-radius:10px;box-shadow:0 24px 70px rgba(0,0,0,.28);border:1px solid #dbe4e1}.gc-md-head{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 22px 15px;border-bottom:1px solid #e6ece9}.gc-md-kicker{font-size:8px;font-weight:900;letter-spacing:1.3px;color:#78951d}.gc-md-head h2{margin:5px 0 0;font-size:19px;color:#183039;letter-spacing:.5px}.gc-md-close{border:0;background:transparent;font-size:25px;color:#74828a;cursor:pointer}.gc-md-body{padding:18px 22px}.gc-md-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}.gc-md-grid>div{background:#f5f8f6;border:1px solid #e2e9e5;border-radius:7px;padding:10px}.gc-md-grid span,.gc-md-section label{display:block;font-size:7px;font-weight:900;letter-spacing:.8px;color:#7a898f;margin-bottom:5px}.gc-md-grid strong{font-size:10px;color:#20363e}.gc-md-section{border-top:1px solid #edf1ef;padding:14px 0}.gc-md-section p{margin:0;font-size:10px;line-height:1.5;color:#52636a}.gc-md-section ol{margin:0;padding-left:20px;color:#52636a;font-size:10px;line-height:1.8}.gc-md-foot{display:flex;justify-content:flex-end;gap:9px;padding:14px 22px;background:#f8faf9;border-top:1px solid #e5ebe8}.gc-md-secondary,.gc-md-complete{border-radius:6px;padding:9px 13px;font-size:8px;font-weight:900;letter-spacing:.7px;cursor:pointer}.gc-md-secondary{border:1px solid #d7dfdb;background:#fff;color:#5f6d73}.gc-md-complete{border:1px solid #799b16;background:#8eaf20;color:#fff}.gc-md-complete:hover{background:#789516}.gc-md-complete:disabled{opacity:.55;cursor:default}@media(max-width:560px){.gc-md-grid{grid-template-columns:repeat(2,1fr)}}`;
    document.head.appendChild(style);
    modal.addEventListener('click',e=>{if(e.target.dataset.close) close()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape') close()});
    return modal;
  }
  function close(){document.getElementById('gcMissionDetailModal')?.classList.remove('open');}
  function open(id){
    const m=missionById(id); if(!m)return;
    const modal=ensureModal(), s=statuses(), done=s[id]?.status==='completed';
    document.getElementById('gcMdTitle').textContent=m.name||'Untitled mission';
    document.getElementById('gcMdType').textContent=String(m.type||'CUSTOM').toUpperCase();
    document.getElementById('gcMdPriority').textContent=String(m.priority||'NORMAL').toUpperCase();
    document.getElementById('gcMdXp').textContent=`+${Number(m.xp??m.profileXp??0)} XP`;
    document.getElementById('gcMdStatus').textContent=done?'COMPLETED':'ACTIVE';
    document.getElementById('gcMdObjective').textContent=m.objective||'No objective supplied.';
    document.getElementById('gcMdSuccess').textContent=m.success||m.successCriteria||'No success criteria supplied.';
    const workflow=document.getElementById('gcMdWorkflow'); workflow.innerHTML='';
    const steps=Array.isArray(m.workflow)?m.workflow:(Array.isArray(m.steps)?m.steps:[]);
    if(steps.length) steps.forEach(step=>{const li=document.createElement('li');li.textContent=typeof step==='string'?step:(step?.name||step?.title||step?.description||'Workflow step');workflow.appendChild(li)});
    else {const li=document.createElement('li');li.textContent='Complete the mission objective and meet the success criteria.';workflow.appendChild(li)}
    const button=document.getElementById('gcMdComplete'); button.disabled=done; button.textContent=done?'MISSION COMPLETED':'COMPLETE MISSION'; button.onclick=()=>{if(done)return;const x=statuses();x[id]={status:'completed',completedAt:new Date().toISOString()};saveStatuses(x);document.getElementById('gcMdStatus').textContent='COMPLETED';button.disabled=true;button.textContent='MISSION COMPLETED';window.dispatchEvent(new CustomEvent('gamechanger:mission-completed',{detail:{missionId:id}}));};
    modal.classList.add('open');
  }
  function bind(){
    document.querySelectorAll('.missions .gc-library-mission[data-admin-mission-id]').forEach(card=>{if(card.dataset.detailBound)return;card.dataset.detailBound='1';card.addEventListener('click',()=>open(card.dataset.adminMissionId));});
  }
  function start(){bind();new MutationObserver(bind).observe(document.querySelector('.missions')||document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
