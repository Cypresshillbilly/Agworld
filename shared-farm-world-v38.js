// AG World Shared Farm World v38
(()=>{const U='https://vcnkspaljmsjvonftfcw.supabase.co',K='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';let db,sub,last={};
const client=()=>db||(db=window.supabase?.createClient?.(U,K));
const farmId=f=>String(f?.id||f?.farmId||f?.name||'').trim();
const apply=(ev)=>{const fs=window.__AG_WORLD_FARMS||[];const f=fs.find(x=>farmId(x)===String(ev.farm_id));if(!f)return;f.assets=f.assets||[];if(ev.event_type==='add_our_drone'&&!f.assets.some(a=>String(a?.name||a).toLowerCase().includes('our drone')))f.assets.push({name:'Our Drone',source:'shared'});
if(ev.event_type==='add_competitor'&&!f.assets.some(a=>String(a?.name||a).toLowerCase().includes('competitor')))f.assets.push({name:ev.payload?.name||'Competitor Drone',source:'shared'});
if(ev.event_type==='remove_competitor')f.assets=f.assets.filter(a=>!String(a?.name||a).toLowerCase().includes('competitor'));
window.AGWorldControlDashboard?.render?.();window.AGWorldCompany?.render?.();window.dispatchEvent(new CustomEvent('agworld:farm-sync',{detail:ev}));};
async function sync(){const c=client(),u=window.AGWorldBackend?.getUser?.();if(!c||!u)return false;const{data,error}=await c.from('ag_farm_events').select('*').order('created_at',{ascending:true});if(error)return false;(data||[]).forEach(e=>{if(!last[e.id]){last[e.id]=1;apply(e)}});return true}
async function event(f,type,payload={}){const c=client(),u=window.AGWorldBackend?.getUser?.();if(!c||!u)throw new Error('Sign in to update the shared AG World.');const row={player_id:u.id,farm_id:farmId(f),event_type:type,payload};const{data,error}=await c.from('ag_farm_events').insert(row).select().single();if(error)throw error;last[data.id]=1;apply(data);return data}
function connect(){const c=client();if(!c||sub)return;sub=c.channel('agworld-farm-events').on('postgres_changes',{event:'INSERT',schema:'public',table:'ag_farm_events'},p=>{if(!last[p.new.id]){last[p.new.id]=1;apply(p.new)}}).subscribe()}
function find(farm){const fs=window.__AG_WORLD_FARMS||[];return fs.find(x=>farmId(x)===String(farm))||farm}
window.AGWorldSharedFarms={sync,event,addOurDrone:f=>event(find(f),'add_our_drone'),addCompetitor:(f,name)=>event(find(f),'add_competitor',{name}),removeCompetitor:f=>event(find(f),'remove_competitor'),connect};
const hook=()=>{const old=window.AGWorldBackend?.sync;if(!old||old.__farm)return;window.AGWorldBackend.sync=async()=>{const r=await old();await sync();connect();return r};window.AGWorldBackend.sync.__farm=true};
setInterval(()=>{hook();connect();if(window.AGWorldBackend?.getUser?.())sync()},3000);
})();