(function(global){
'use strict';

// AG World world-data mode.
// DEMO keeps the controlled testing population visible.
// USER switches the live world to entities created by users, while preserving
// demo records in storage for future testing.
const KEY='agworld:world-data-mode-v1';
const MODES={DEMO:'demo',USER:'user'};

function readMode(){
  const query=new URLSearchParams(global.location?.search||'').get('worldMode');
  if(query==='demo'||query==='user') return query;
  const stored=global.localStorage?.getItem(KEY);
  return stored===MODES.USER?MODES.USER:MODES.DEMO;
}
function mode(){return readMode();}
function setMode(next,{reload=true}={}){
  if(next!==MODES.DEMO&&next!==MODES.USER) throw new Error('Unsupported AG World data mode.');
  global.localStorage?.setItem(KEY,next);
  global.AG_WORLD_DEMO_MODE=next===MODES.DEMO;
  global.dispatchEvent(new CustomEvent('agworld:world-data-mode-changed',{detail:{mode:next}}));
  if(reload) global.location.reload();
  return next;
}
function isDemoRecord(type,record){
  const id=String(record?.id||'');
  const details=record?.details&&typeof record.details==='object'?record.details:{};
  const source=String(record?.source||details.source||'').toLowerCase();
  if(record?.demo===true||details.demo===true||details.seeded===true) return true;
  if(source==='demo'||source==='seed'||source==='seeded'||source==='simulation') return true;
  if(id.startsWith('demo-')||id.startsWith('seed-')) return true;
  return false;
}
function shouldInclude(type,record){
  return mode()===MODES.DEMO||!isDemoRecord(type,record);
}

global.AGWorldWorldDataMode={
  modes:MODES,
  getMode:mode,
  isDemoMode:()=>mode()===MODES.DEMO,
  isUserMode:()=>mode()===MODES.USER,
  setMode,
  isDemoRecord,
  shouldInclude
};
global.AG_WORLD_DEMO_MODE=mode()===MODES.DEMO;
})(window);
