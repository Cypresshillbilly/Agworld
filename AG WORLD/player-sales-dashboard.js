/* Player-owned sales activity. Company map totals are never attributed to a player. */
(()=>{
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let owner=null,events=[],status='loading',request=0,pending=null,refreshAgain=false;
 const publish=()=>window.dispatchEvent(new CustomEvent('agworld:sales-data'));
 function getModel(){
   const user=window.AGWorldBackend?.getUser?.();
   if(!user||user.id!==owner)return {status:'loading',rows:[],engaged:0,open:0,clients:0,actions:0,percent:0};
   const world=window.AG_WORLD_WORLD||{},farms=Array.isArray(world.farms)?world.farms:(window.__AG_WORLD_FARMS||[]);
   const ids=[...new Set(events.map(e=>e.farm_id).filter(Boolean).map(String))];
   const rows=ids.map(id=>{const farm=farms.find(f=>String(f.id)===id);return {id,farm,name:farm?.name||'Farm record awaiting map sync',control:farm?(window.AGWorldTerritoryControl?.control?.(farm)||'neutral'):'unknown',actions:events.filter(e=>String(e.farm_id)===id).length};});
   const clients=rows.filter(r=>r.control==='company').length,open=rows.filter(r=>r.control==='neutral'||r.control==='competitor').length;
   return {status,rows,engaged:ids.length,open,clients,unresolved:rows.filter(r=>r.control==='unknown').length,actions:events.length,percent:ids.length?Math.round(clients/ids.length*100):0};
 }
 async function refresh(){
   const user=window.AGWorldBackend?.getUser?.(),db=window.AGWorldBackend?.getClient?.();
   if(!user||!db){request++;owner=null;events=[];status='loading';publish();return;}
   if(pending&&owner===user.id){refreshAgain=true;return pending;}
   const token=++request;owner=user.id;events=[];status='loading';publish();
   pending=(async()=>{try{
     const rows=[];let offset=0;
     for(;;){const result=await db.from('ag_farm_events').select('id,farm_id,event_type,created_at').eq('player_id',user.id).order('id',{ascending:true}).range(offset,offset+499);
       if(result.error)throw result.error;if(token!==request)return;
       const batch=Array.isArray(result.data)?result.data:[];rows.push(...batch);if(batch.length<500)break;offset+=500;
     }
     if(token===request){events=rows;status='ready';}
   }catch(_){if(token===request){events=[];status='error';}}
   finally{if(token===request){pending=null;publish();if(refreshAgain){refreshAgain=false;refresh();}}}})();
   return pending;
 }
 function cardMarkup(){
   const d=getModel(),ready=d.status==='ready';
   const stages=[['Engaged farms',d.engaged,d.engaged?100:0],['Open relationships',d.open,d.engaged?d.open/d.engaged*100:0],['Company clients',d.clients,d.percent]];
   return '<div class="agsf-head"><strong>SALES FUNNEL</strong><button type="button" data-sales-open aria-label="Open your sales funnel">VIEW ALL ↗</button></div><div class="agsf-body"><div class="agsf-funnel" aria-hidden="true"><span>⌖</span><i></i><i></i><i></i></div><div class="agsf-stages">'+stages.map(([label,n,p])=>'<div class="agsf-stage"><span>'+label+'</span><b>'+ (ready?n:'—')+'</b><div class="agsf-track"><i style="width:'+p+'%"></i></div></div>').join('')+'</div></div><div class="agsf-footer">'+(ready?'<span>'+d.actions+' recorded actions'+(d.unresolved?' · '+d.unresolved+' awaiting map sync':'')+'</span><b>'+d.percent+'% clients</b>':d.status==='error'?'<span>Sales activity could not be loaded.</span><button type="button" data-sales-retry>RETRY</button>':'<span>Connecting your sales activity…</span>')+'</div>';
 }
 function workspaceMarkup(){
   const d=getModel();
   return '<section class="agmp-card agmp-dark"><h2>Your sales activity</h2><p>Farms you have worked on, matched to their current Company relationship. These are your recorded actions, not assigned leads or quoted revenue.</p>'+cardMarkup()+'</section><section class="agmp-card"><h2>Your relationships</h2>'+(d.status==='loading'?'<p>Loading your recorded activity…</p>':d.status==='error'?'<p>Activity is unavailable. Try again.</p><button type="button" class="agmp-button" data-sales-retry>RETRY</button>':d.rows.length?d.rows.map(r=>'<article class="agmp-entry"><span class="agmp-status">'+esc(r.control==='company'?'Company client':r.control==='competitor'?'Competitor relationship':r.control==='neutral'?'Prospect':'Awaiting map sync')+'</span><h3>'+esc(r.name)+'</h3><p>'+r.actions+' recorded action'+(r.actions===1?'':'s')+'</p>'+(r.farm?'<button type="button" class="agmp-button agmp-secondary" data-panel-action="entity" data-value="farm:'+esc(r.id)+'">VIEW ON MAP</button>':'')+'</article>').join(''):'<p>Your sales journey starts here. Explore the territory and record your first farm interaction to build your funnel.</p>')+'</section>';
 }
 window.AGWorldSalesDashboard={getModel,refresh,cardMarkup,workspaceMarkup};
 document.addEventListener('click',e=>{if(e.target.closest('[data-sales-open]'))window.AGWorldPlayerMenu?.select?.('pipeline');if(e.target.closest('[data-sales-retry]'))refresh();});
 addEventListener('agworld:player-ready',refresh);
 addEventListener('agworld:farm-sync',e=>{if(e.detail?.player_id===owner)refresh();else publish();});
 addEventListener('agworld:territory-control-updated',publish);
 addEventListener('agworld:dynamic-layers-loaded',publish);
 refresh();
})();
