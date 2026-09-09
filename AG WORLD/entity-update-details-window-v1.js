(function(){
  'use strict';

  let activeEntity=null;
  let lastEntityKey=null;
  const STORAGE_KEY='agworld:entity-detail-overrides:v1';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const entityKey=e=>String(e?.type||'entity')+'::'+String(e?.id||e?.name||'unknown');

  function overrides(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(_){return {};}
  }
  function persistOverride(entity){
    if(!entity) return;
    const all=overrides();
    all[entityKey(entity)]={
      name:entity.name,
      status:entity.status,
      details:entity.details||{},
      metadata:entity.metadata||{},
      location:entity.location,
      address:entity.address,
      updatedAt:new Date().toISOString()
    };
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(all));}catch(_){}
  }
  function applyOverride(entity){
    if(!entity) return entity;
    const saved=overrides()[entityKey(entity)];
    if(!saved) return entity;
    if(saved.name!==undefined) entity.name=saved.name;
    if(saved.status!==undefined) entity.status=saved.status;
    entity.details=Object.assign({},entity.details||{},saved.details||{});
    entity.metadata=Object.assign({},entity.metadata||{},saved.metadata||{});
    if(saved.location!==undefined) entity.location=saved.location;
    if(saved.address!==undefined) entity.address=saved.address;
    return entity;
  }

  function setActive(detail){
    const entity=detail?.entity||detail?.farm||detail;
    if(!entity || typeof entity!=='object') return;
    activeEntity=applyOverride(entity);
    lastEntityKey=entityKey(activeEntity);
  }
  ['agworld:farm-selected','agworld:dynamic-entity-selected','agworld:v2-entity-selected'].forEach(type=>window.addEventListener(type,event=>setActive(event.detail)));

  function ensureModal(){
    let modal=document.getElementById('agworldUpdateDetailsModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='agworldUpdateDetailsModal';
    modal.className='agworld-action-modal';
    modal.innerHTML=
      '<div class="agworld-action-modal-card" role="dialog" aria-modal="true" aria-labelledby="agworldUpdateDetailsTitle">'+
        '<div class="agworld-action-modal-head">'+
          '<div><div class="agworld-action-modal-eyebrow">ENTITY MANAGEMENT</div><h2 id="agworldUpdateDetailsTitle">UPDATE DETAILS</h2><div id="agworldUpdateDetailsSubtitle" class="agworld-action-modal-subtitle"></div></div>'+
          '<button type="button" class="agworld-action-modal-close" data-agworld-close-update aria-label="Close">×</button>'+
        '</div>'+
        '<form id="agworldUpdateDetailsForm" class="agworld-update-details-form">'+
          '<div id="agworldUpdateDetailsFields" class="agworld-update-details-fields"></div>'+
          '<div class="agworld-action-modal-footer">'+
            '<div id="agworldUpdateDetailsMessage" class="agworld-update-details-message"></div>'+
            '<div class="agworld-action-modal-buttons"><button type="button" data-agworld-close-update>CANCEL</button><button type="submit" class="primary">SAVE DETAILS</button></div>'+
          '</div>'+
        '</form>'+
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click',event=>{
      if(event.target===modal || event.target.closest('[data-agworld-close-update]')) closeModal();
    });
    modal.querySelector('form').addEventListener('submit',saveDetails);
    return modal;
  }

  function field(name,label,value,opts){
    const type=opts?.type||'text';
    const placeholder=opts?.placeholder||'';
    const readonly=opts?.readonly?' readonly':'';
    if(type==='textarea'){
      return '<label class="agworld-field agworld-field-wide"><span>'+esc(label)+'</span><textarea name="'+esc(name)+'" placeholder="'+esc(placeholder)+'"'+readonly+'>'+esc(value)+'</textarea></label>';
    }
    if(type==='select'){
      return '<label class="agworld-field"><span>'+esc(label)+'</span><select name="'+esc(name)+'">'+opts.options.map(o=>'<option value="'+esc(o.value)+'"'+(String(o.value)===String(value)?' selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select></label>';
    }
    return '<label class="agworld-field"><span>'+esc(label)+'</span><input type="'+esc(type)+'" name="'+esc(name)+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'"'+readonly+'></label>';
  }

  function entityFields(entity){
    const d=entity.details||{}, m=entity.metadata||{};
    const location=d.location??entity.location??m.location??'';
    const territory=(entity.territoryIds||d.territoryIds||[entity.territoryId||d.territoryId]).filter(Boolean).join(', ');
    const staff=d.staffCount??d.employees??entity.staffCount??entity.employees??m.staffCount??'';
    const address=d.address??entity.address??m.address??'';
    const type=String(entity.type||'entity');
    let html='';
    html+=field('name','ENTITY NAME',entity.name||'');
    html+=field('status','STATUS',entity.status||'active',{type:'select',options:[
      {value:'active',label:'ACTIVE'},{value:'inactive',label:'INACTIVE'},{value:'pending',label:'PENDING'}
    ]});
    html+=field('entityType','ENTITY TYPE',type.replace(/_/g,' ').toUpperCase(),{readonly:true});
    html+=field('location','LOCATION / TOWN',location);
    html+=field('territory','TERRITORY',territory,{placeholder:'e.g. KwaZulu-Natal'});
    html+=field('staffCount','STAFF / EMPLOYEES',staff,{type:'number'});
    html+=field('address','ADDRESS',address,{type:'textarea'});
    if(type==='farm'){
      html+=field('farmSize','FARM SIZE',entity.farmSize??m.farmSize??'');
      const crops=Array.isArray(entity.crops)?entity.crops:(Array.isArray(m.crops)?m.crops:[]);
      html+=field('crops','CROPS',crops.join(', '),{type:'textarea',placeholder:'Separate crops with commas'});
    }else if(type==='company_facility'||type==='companyFacility'){
      html+=field('facilityType','FACILITY ROLE / TYPE',d.facilityType??d.type??d.primaryFunction??'');
      html+=field('province','PROVINCE',d.province??m.province??'');
    }
    return html;
  }

  function openModal(){
    if(!activeEntity) return false;
    const modal=ensureModal();
    modal.querySelector('#agworldUpdateDetailsSubtitle').textContent=(activeEntity.name||'Selected entity')+' · '+String(activeEntity.type||'entity').replace(/_/g,' ');
    modal.querySelector('#agworldUpdateDetailsFields').innerHTML=entityFields(activeEntity);
    modal.querySelector('#agworldUpdateDetailsMessage').textContent='';
    modal.classList.add('show');
    document.body.classList.add('agworld-action-modal-open');
    setTimeout(()=>modal.querySelector('input[name="name"]')?.focus(),0);
    return true;
  }

  function closeModal(){
    document.getElementById('agworldUpdateDetailsModal')?.classList.remove('show');
    document.body.classList.remove('agworld-action-modal-open');
  }

  function refreshVisibleSummary(entity){
    const card=document.getElementById('farmCard');
    if(!card) return;
    const heading=card.querySelector('.agworld-entity-command-summary h2');
    if(heading) heading.textContent=entity.name||'Unnamed entity';
    const status=card.querySelector('.agworld-entity-command-status');
    if(status) status.textContent=String(entity.status||'active').toUpperCase();
    const metrics=card.querySelectorAll('.agworld-entity-command-summary-grid > div');
    metrics.forEach(metric=>{
      const label=(metric.querySelector('span')?.textContent||'').trim().toUpperCase();
      const value=metric.querySelector('b');
      if(!value) return;
      if(label==='STATUS') value.textContent=String(entity.status||'active').toUpperCase();
      if(label==='LOCATION') value.textContent=(entity.details?.location||entity.location||entity.metadata?.location||'Mapped entity');
      if(label==='STAFF') value.textContent=String(entity.details?.staffCount??entity.details?.employees??entity.metadata?.staffCount??'');
      if(label==='TERRITORY') value.textContent=(entity.territoryIds||entity.details?.territoryIds||[entity.territoryId||entity.details?.territoryId]).filter(Boolean).join(', ')||'Not assigned';
      if(label==='FARM SIZE') value.textContent=String(entity.farmSize??entity.metadata?.farmSize??'');
    });
  }

  function saveDetails(event){
    event.preventDefault();
    if(!activeEntity) return;
    const form=event.currentTarget;
    const data=new FormData(form);
    const get=name=>String(data.get(name)??'').trim();
    const d=activeEntity.details||(activeEntity.details={});
    const m=activeEntity.metadata||(activeEntity.metadata={});

    activeEntity.name=get('name')||activeEntity.name;
    activeEntity.status=get('status')||activeEntity.status;
    const location=get('location');
    if(location){d.location=location; activeEntity.location=location; m.location=location;}
    const address=get('address');
    if(address){d.address=address; activeEntity.address=address; m.address=address;}
    const territory=get('territory');
    if(territory){
      const ids=territory.split(',').map(v=>v.trim()).filter(Boolean);
      d.territoryIds=ids;
      activeEntity.territoryIds=ids;
    }
    const staff=get('staffCount');
    if(staff!==''){
      const n=Number(staff);
      d.staffCount=Number.isFinite(n)?n:staff;
      m.staffCount=d.staffCount;
    }
    if(activeEntity.type==='farm'){
      const size=get('farmSize');
      if(size!==''){activeEntity.farmSize=size;m.farmSize=size;}
      const crops=get('crops');
      if(crops){const list=crops.split(',').map(v=>v.trim()).filter(Boolean);activeEntity.crops=list;m.crops=list;}
    }
    if(activeEntity.type==='company_facility'||activeEntity.type==='companyFacility'){
      const facilityType=get('facilityType');
      const province=get('province');
      if(facilityType) d.facilityType=facilityType;
      if(province){d.province=province;m.province=province;}
    }

    persistOverride(activeEntity);
    refreshVisibleSummary(activeEntity);
    window.dispatchEvent(new CustomEvent('agworld:entity-details-updated',{detail:{entity:activeEntity,source:'entity-command-update-details'}}));
    window.dispatchEvent(new CustomEvent('agworld:dynamic-layer-updated',{detail:{entity:activeEntity,reason:'entity-details-updated'}}));

    const message=form.querySelector('#agworldUpdateDetailsMessage');
    message.textContent='DETAILS SAVED';
    message.classList.add('success');
    setTimeout(closeModal,500);
  }

  // Capture-phase delegation deliberately owns only UPDATE DETAILS. The other
  // three Entity Command Centre actions remain untouched.
  document.addEventListener('click',event=>{
    const button=event.target.closest('#farm3d');
    if(!button) return;
    const card=document.getElementById('farmCard');
    if(!card || !card.contains(button)) return;
    if(!activeEntity) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openModal();
  },true);

  document.addEventListener('keydown',event=>{if(event.key==='Escape') closeModal();});

  const style=document.createElement('style');
  style.textContent=
    '.agworld-action-modal{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,7,10,.68);backdrop-filter:blur(5px)}'+
    '.agworld-action-modal.show{display:flex}.agworld-action-modal-card{width:min(760px,94vw);max-height:min(760px,90vh);display:flex;flex-direction:column;background:linear-gradient(145deg,#132126,#091317);border:1px solid rgba(117,224,132,.42);border-radius:14px;box-shadow:0 28px 80px rgba(0,0,0,.55);color:#e8f1ea;overflow:hidden}'+
    '.agworld-action-modal-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08)}.agworld-action-modal-eyebrow{font-size:9px;letter-spacing:1.5px;font-weight:900;color:#75e084}.agworld-action-modal-head h2{margin:5px 0 3px;font-size:22px}.agworld-action-modal-subtitle{font-size:11px;color:#9eb0a4}.agworld-action-modal-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(255,255,255,.04);color:#dbe8df;font-size:23px;cursor:pointer}'+
    '.agworld-update-details-form{display:flex;flex-direction:column;min-height:0}.agworld-update-details-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:18px 20px;overflow:auto}.agworld-field{display:flex;flex-direction:column;gap:6px}.agworld-field-wide{grid-column:1/-1}.agworld-field span{font-size:8px;font-weight:900;letter-spacing:1px;color:#91a69a}.agworld-field input,.agworld-field select,.agworld-field textarea{box-sizing:border-box;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#0a1519;color:#edf5ef;padding:10px 11px;font:inherit;font-size:12px;outline:none}.agworld-field textarea{min-height:72px;resize:vertical}.agworld-field input:focus,.agworld-field select:focus,.agworld-field textarea:focus{border-color:#75e084;box-shadow:0 0 0 2px rgba(117,224,132,.12)}.agworld-field input[readonly]{opacity:.58}'+
    '.agworld-action-modal-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 20px;border-top:1px solid rgba(255,255,255,.08)}.agworld-update-details-message{font-size:10px;letter-spacing:.8px;color:#75e084;font-weight:900}.agworld-action-modal-buttons{display:flex;gap:8px}.agworld-action-modal-buttons button{border:1px solid rgba(255,255,255,.15);border-radius:7px;background:rgba(255,255,255,.04);color:#dce8df;padding:9px 12px;font-size:9px;font-weight:900;letter-spacing:.7px;cursor:pointer}.agworld-action-modal-buttons .primary{background:#2f8794;border-color:#48a6b2;color:white}.agworld-action-modal-open{overflow:hidden!important}@media(max-width:620px){.agworld-update-details-fields{grid-template-columns:1fr}.agworld-action-modal{padding:10px}.agworld-action-modal-card{max-height:96vh}.agworld-action-modal-footer{align-items:flex-end;flex-direction:column}}';
  document.head.appendChild(style);
  window.AGWorldEntityUpdateDetails={open:openModal,close:closeModal,getActive:()=>activeEntity};
})();