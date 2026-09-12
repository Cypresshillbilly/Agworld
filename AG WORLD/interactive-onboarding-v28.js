// AG World Interactive Chapter 1 Experiences v28
(() => {
  const KEY = 'agworld-chapter1-interactive-v1';
  const state = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; } })();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  const data = {
    'c1-welcome': {
      eyebrow:'CHAPTER 1 · INTRODUCTION',
      title:'Welcome to The Company',
      body:'You are joining The Company at the beginning of your AG World journey. The Company grows through its people, its farm intelligence and its ability to build trusted relationships across agricultural territories.',
      task:'Acknowledge your role in the Company.',
      render: () => '<label class="ag-check"><input type="checkbox" data-step="role"> I understand that my actions contribute to The Company.</label><label class="ag-check"><input type="checkbox" data-step="growth"> I understand that farms and assets influence territory control.</label>'
    },
    'c1-hr': {
      eyebrow:'CHAPTER 1 · HR ONBOARDING',
      title:'Complete HR Onboarding',
      body:'Complete your employee onboarding checklist. This creates the foundation for your player identity and future responsibilities.',
      task:'Complete all required onboarding fields.',
      render: () => '<div class="ag-form-grid"><label>Preferred name<input data-field="name" placeholder="Your name"></label><label>Job title<input data-field="role" placeholder="e.g. Sales Representative"></label><label>Mobile contact<input data-field="phone" placeholder="Contact number"></label><label>Base region<input data-field="region" placeholder="Province / region"></label></div><label class="ag-check"><input type="checkbox" data-step="accurate"> I confirm that the information provided is accurate.</label>'
    },
    'c1-documents': {
      eyebrow:'CHAPTER 1 · COMPLIANCE',
      title:'Submit Required Documents',
      body:'The Company needs to know that your employment and professional requirements are complete before field operations begin.',
      task:'Confirm all required document categories.',
      render: () => '<label class="ag-check"><input type="checkbox" data-doc="id"> Identity / employment documentation</label><label class="ag-check"><input type="checkbox" data-doc="qualifications"> Relevant qualifications</label><label class="ag-check"><input type="checkbox" data-doc="licences"> Required licences / certifications</label><label class="ag-check"><input type="checkbox" data-doc="company"> Company policy acknowledgement</label>'
    },
    'c1-safety': {
      eyebrow:'CHAPTER 1 · MANDATORY TRAINING',
      title:'Mandatory Safety Training',
      body:'Before entering the field, every employee must understand the basic operating principles expected by The Company.',
      task:'Answer all three safety questions correctly.',
      render: () => '<div class="ag-question" data-answer="a"><b>1. Before beginning field work you should:</b><label><input type="radio" name="q1" value="a"> Assess the environment and follow the approved procedure.</label><label><input type="radio" name="q1" value="b"> Begin immediately to save time.</label></div><div class="ag-question" data-answer="b"><b>2. Client and farm information should be:</b><label><input type="radio" name="q2" value="a"> Shared freely with anyone who asks.</label><label><input type="radio" name="q2" value="b"> Handled responsibly according to Company requirements.</label></div><div class="ag-question" data-answer="a"><b>3. If an operational risk is identified you should:</b><label><input type="radio" name="q3" value="a"> Stop, assess and follow the correct reporting process.</label><label><input type="radio" name="q3" value="b"> Ignore it if the mission is urgent.</label></div>'
    },
    'c1-company-training': {
      eyebrow:'CHAPTER 1 · COMPANY FOUNDATIONS',
      title:'How AG World Works',
      body:'Your work creates intelligence. Intelligence identifies opportunities. Opportunities create farms and assets. Farm assets determine control. Control shapes the Company’s position across AG World.',
      task:'Put the Company growth chain in the correct order.',
      render: () => '<div class="ag-foundation-options"><button data-chain="Farms">Farms</button><button data-chain="Assets">Assets</button><button data-chain="Territories">Territories</button><button data-chain="Company Control">Company Control</button></div><div class="ag-chain-result">Select the four stages in order.</div>'
    },
    'c1-briefing': {
      eyebrow:'CHAPTER 1 · FIRST ASSIGNMENT',
      title:'Accept Your First Assignment',
      body:'Your onboarding is complete. The Company is ready to move you from employee induction into field learning.',
      task:'Accept your responsibility to begin Chapter 2.',
      render: () => '<label class="ag-check"><input type="checkbox" data-step="assignment"> I accept my first assignment and am ready to learn the AG World field systems.</label>'
    }
  };

  function modal() {
    let el = document.getElementById('agInteractiveMissionModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agInteractiveMissionModal';
      el.innerHTML = '<div class="ag-interactive-window"><button class="ag-interactive-close">×</button><div id="agInteractiveContent"></div></div>';
      document.body.appendChild(el);
      el.querySelector('.ag-interactive-close').onclick = close;
    }
    return el;
  }

  function open(id) {
    const mission = data[id];
    if (!mission) return;
    const el = modal();
    const content = el.querySelector('#agInteractiveContent');
    content.innerHTML = '<div class="ag-interactive-eyebrow">' + mission.eyebrow + '</div><h2>' + mission.title + '</h2><p class="ag-interactive-body">' + mission.body + '</p><div class="ag-interactive-task"><b>YOUR TASK</b><span>' + mission.task + '</span></div><div class="ag-interactive-work">' + mission.render() + '</div><div class="ag-interactive-footer"><span id="agInteractiveStatus">Complete the requirements to continue.</span><button id="agInteractiveFinish" disabled>COMPLETE MISSION</button></div>';
    state.current = { id, chain: [] }; save();
    bindExperience(id, content);
    validate(id, content);
    el.classList.add('show');
  }

  function close() { document.getElementById('agInteractiveMissionModal')?.classList.remove('show'); }

  function bindExperience(id, content) {
    content.addEventListener('input', () => validate(id, content));
    content.addEventListener('change', () => validate(id, content));
    if (id === 'c1-company-training') {
      content.querySelectorAll('[data-chain]').forEach(btn => btn.onclick = () => {
        const chain = state.current.chain || [];
        if (chain.length < 4 && !chain.includes(btn.dataset.chain)) chain.push(btn.dataset.chain);
        state.current.chain = chain; save();
        content.querySelector('.ag-chain-result').textContent = chain.length ? chain.join(' → ') : 'Select the four stages in order.';
        validate(id, content);
      });
    }
    content.querySelector('#agInteractiveFinish').onclick = () => finish(id, content);
  }

  function valid(id, content) {
    if (id === 'c1-welcome') return [...content.querySelectorAll('[data-step]')].every(x => x.checked);
    if (id === 'c1-hr') return [...content.querySelectorAll('[data-field]')].every(x => x.value.trim()) && !!content.querySelector('[data-step="accurate"]')?.checked;
    if (id === 'c1-documents') return [...content.querySelectorAll('[data-doc]')].every(x => x.checked);
    if (id === 'c1-safety') return ['q1','q2','q3'].every((name, i) => content.querySelector('input[name="' + name + '"]:checked')?.value === ['a','b','a'][i]);
    if (id === 'c1-company-training') return (state.current?.chain || []).join('|') === 'Farms|Assets|Territories|Company Control';
    if (id === 'c1-briefing') return !!content.querySelector('[data-step="assignment"]')?.checked;
    return false;
  }

  function validate(id, content) {
    const ok = valid(id, content);
    const button = content.querySelector('#agInteractiveFinish');
    const status = content.querySelector('#agInteractiveStatus');
    button.disabled = !ok;
    status.textContent = ok ? 'Requirements complete. You may continue.' : 'Complete the requirements to unlock mission completion.';
  }

  function finish(id, content) {
    if (!valid(id, content)) return;
    state[id] = true; save();
    close();
    window.AGWorldProgression?.completeMission(id);
  }

  window.AGWorldOnboarding={startMission(id){if(!data[id])return false;open(id);return true;}};

  // Capture clicks before the progression engine's direct onclick handler.
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-progression-complete]');
    if (!button) return;
    const id = button.dataset.progressionComplete;
    if (!data[id]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(id);
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    #agInteractiveMissionModal{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}
    #agInteractiveMissionModal.show{display:flex}.ag-interactive-window{position:relative;width:min(620px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(101,216,117,.38);border-radius:18px;background:#10191c;color:#eef4ef;box-shadow:0 30px 90px rgba(0,0,0,.6);padding:28px}
    .ag-interactive-close{position:absolute;right:17px;top:13px;border:0;background:transparent;color:#dce7df;font-size:28px;cursor:pointer}.ag-interactive-eyebrow{font-size:10px;letter-spacing:1.5px;font-weight:900;color:#65d875}.ag-interactive-window h2{font-size:28px;margin:8px 35px 8px 0}.ag-interactive-body{color:#b6c1b8;line-height:1.55}.ag-interactive-task{margin:20px 0 14px;padding:12px;border-left:3px solid #65d875;background:rgba(101,216,117,.06)}.ag-interactive-task b{display:block;font-size:9px;letter-spacing:1px;color:#65d875}.ag-interactive-task span{display:block;margin-top:4px;font-size:12px}.ag-interactive-work{display:grid;gap:10px}.ag-check{display:flex;gap:10px;align-items:flex-start;padding:11px;border:1px solid rgba(255,255,255,.08);border-radius:9px;font-size:12px;color:#c8d2ca}.ag-check input{margin-top:2px}.ag-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ag-form-grid label{font-size:10px;color:#a8b5aa}.ag-form-grid input{width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border-radius:7px;border:1px solid #36423b;background:#0b1215;color:white}.ag-question{padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:9px}.ag-question b{display:block;font-size:12px;margin-bottom:7px}.ag-question label{display:block;font-size:11px;color:#b9c4bc;margin:6px 0}.ag-foundation-options{display:flex;flex-wrap:wrap;gap:8px}.ag-foundation-options button{border:1px solid rgba(101,216,117,.35);background:rgba(101,216,117,.06);color:#d9e8dc;border-radius:7px;padding:9px 11px;cursor:pointer}.ag-chain-result{margin-top:12px;padding:12px;background:#0a1114;border-radius:8px;font-size:12px;color:#65d875}.ag-interactive-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;padding-top:16px;border-top:1px solid rgba(255,255,255,.09)}#agInteractiveStatus{font-size:10px;color:#94a299}.ag-interactive-footer button{border:1px solid rgba(101,216,117,.5);background:#65d875;color:#0d1711;border-radius:7px;padding:10px 13px;font-weight:900;font-size:10px;cursor:pointer}.ag-interactive-footer button:disabled{opacity:.35;cursor:not-allowed}@media(max-width:600px){.ag-form-grid{grid-template-columns:1fr}.ag-interactive-window{padding:20px}}
  `;
  document.head.appendChild(style);
})();