/* GAME CHANGER Mission Store — single mission data contract.
   UI modules must use this API rather than reading/writing mission storage directly. */
(function(){
  'use strict';
  const KEY='gamechanger.missions';
  const safeRead=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
  const emit=()=>window.dispatchEvent(new CustomEvent('gamechanger:missions-changed',{detail:{missions:safeRead()}}));
  const write=list=>{localStorage.setItem(KEY,JSON.stringify(Array.isArray(list)?list:[]));emit();return safeRead()};
  const normalize=input=>({
    id:input.id||('mission_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
    name:String(input.name||'Untitled mission').trim(),
    build:String(input.build||'Agriculture').trim(),
    role:input.role||'*',
    type:input.type||'Custom',
    priority:input.priority||'Normal',
    objective:input.objective||'',
    success:input.success||'',
    workflow:Array.isArray(input.workflow)?input.workflow:[],
    xp:Number(input.xp||0),
    createdAt:input.createdAt||new Date().toISOString()
  });
  const store={
    list:()=>safeRead(),
    get:id=>safeRead().find(m=>String(m.id)===String(id))||null,
    create:mission=>{const next=safeRead();next.push(normalize(mission));write(next);return next[next.length-1]},
    replace:mission=>{const next=safeRead();const i=next.findIndex(m=>String(m.id)===String(mission.id));if(i<0) return null;next[i]=normalize({...next[i],...mission});write(next);return next[i]},
    remove:id=>{const before=safeRead();const next=before.filter(m=>String(m.id)!==String(id));if(next.length!==before.length) write(next);return next.length!==before.length},
    query:({build,role}={})=>safeRead().filter(m=>{
      const buildOk=!build||String(m.build).toLowerCase()===String(build).toLowerCase();
      const roleOk=!role||m.role==='*'||String(m.role)===String(role);
      return buildOk&&roleOk;
    })
  };
  window.GAME_CHANGER_MISSIONS=store;
})();