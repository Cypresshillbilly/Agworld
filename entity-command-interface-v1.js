// AG World Entity Command Interface v1
// Presentation layer only: preserves the existing Farm Card, V2 entity engine,
// quick actions and their event handlers while reorganising them into the primary
// game command interface.
(()=>{'use strict';
const W=window,D=document;
const expected=['details','intelligence','lifecycle','spatial','relationships','activity','documents','media','notes'];
function q(s,r=D){return r.querySelector(s)}
function qa(s,r=D){return [...r.querySelectorAll(s)]}
function style(){
 if(D.getElementById('agEntityCommandInterfaceStyles'))return;
 const s=D.createElement('style');s.id='agEntityCommandInterfaceStyles';
 s.textContent=`
 #entityInformationSection{background:linear-gradient(145deg,#eef3f4,#dce5e8)!important;padding:0!important}
 #entityInformationSection .farm-card{display:grid!important;grid-template-columns:minmax(235px,27%) 1fr!important;grid-template-rows:auto 1fr auto!important;gap:0!important;padding:0!important;background:linear-gradient(135deg,#f9fbfb 0%,#e7eef0 100%)!important;border:1px solid #aebfc5!important;border-radius:14px!important;box-shadow:0 14px 30px rgba(17,40,48,.22),inset 0 1px 0 rgba(255,255,255,.95)!important;overflow:hidden!important;color:#21323a!important}
 #entityInformationSection .farm-card::before{content:'ENTITY COMMAND';position:absolute;right:14px;top:10px;font-size:8px;letter-spacing:1.6px;font-weight:900;color:#66808a;opacity:.8}
 #entityInformationSection #farmName{grid-column:1;grid-row:1;margin:0!important;padding:18px 20px 3px!important;font-size:18px!important;line-height:1.1!important;color:#17343d!important;letter-spacing:.2px}
 #entityInformationSection #farmMeta{grid-column:1;grid-row:1;margin:42px 20px 12px!important;align-self:end;font-size:9px!important;color:#6d8189!important}
 #entityInformationSection .stats{grid-column:1;grid-row:2!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:minmax(54px,auto)!important;gap:8px!important;padding:0 14px 10px!important;align-content:start}
 #entityInformationSection .stat{margin:0!important;padding:10px 9px!important;background:linear-gradient(145deg,#ffffff,#e9f0f1)!important;border:1px solid #c7d4d8!important;border-radius:9px!important;box-shadow:0 4px 9px rgba(40,70,80,.08),inset 0 1px 0 #fff!important}
 #entityInformationSection .stat b{display:block!important;font-size:17px!important;color:#1a5d69!important;line-height:1.1}
 #entityInformationSection .stat span{display:block!important;margin-top:4px;font-size:7px!important;font-weight:900;letter-spacing:.8px;color:#71858c}
 #entityInformationSection .farm-extra{grid-column:1;grid-row:3!important;display:grid!important;grid-template-columns:1fr!important;gap:0!important;padding:8px 16px!important;border-top:1px solid #cbd8db!important;background:#dce7e9!important}
 #entityInformationSection .farm-extra>div{display:flex!important;justify-content:space-between!important;align-items:center!important;padding:4px 0!important;border-bottom:1px solid rgba(90,115,123,.12)}
 #entityInformationSection .farm-extra>div:last-child{border-bottom:0}
 #entityInformationSection .farm-extra span{font-size:7px!important;font-weight:900;letter-spacing:.8px;color:#657981}
 #entityInformationSection .farm-extra b{font-size:9px!important;color:#26434c}
 #entityInformationSection #farmDetailText{display:none!important}
 #entityInformationSection #agworldV2FarmDetailHost{grid-column:2!important;grid-row:1 / span 2!important;display:block!important;visibility:visible!important;opacity:1!important;margin:0!important;padding:13px 16px 10px!important;border:0!important;min-width:0!important;overflow:auto!important;background:rgba(255,255,255,.38)!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-panel{height:100%!important;display:flex!important;flex-direction:column!important;color:#20343b!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-header{flex:0 0 auto!important;margin:0 0 10px!important;padding:0 0 8px!important;border-bottom:1px solid #cbd7da!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-entity-type{font-size:8px!important;letter-spacing:1.4px!important;color:#16738a!important}
 #entityInformationSection #agworldV2FarmDetailHost h2{font-size:16px!important;letter-spacing:.2px!important;color:#173d48!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-status{display:inline-block!important;margin-top:3px!important;padding:3px 7px!important;border-radius:999px!important;background:#dff1e4!important;color:#24713b!important;font-weight:900!important;letter-spacing:.7px}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs{flex:0 0 auto!important;display:grid!important;grid-template-columns:repeat(9,minmax(62px,1fr))!important;gap:5px!important;margin:0 0 10px!important;padding:6px!important;background:#dfe8ea!important;border:1px solid #c6d3d6!important;border-radius:10px!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button{min-width:0!important;margin:0!important;padding:7px 4px!important;border-radius:6px!important;background:rgba(255,255,255,.7)!important;color:#61747b!important;border:1px solid transparent!important;font-size:7px!important;font-weight:900!important;letter-spacing:.25px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button:hover{border-color:#5e9dab!important;color:#176d7f!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button.is-active{background:linear-gradient(135deg,#167e91,#145a69)!important;color:#fff!important;border-color:#0f5664!important;box-shadow:0 4px 9px rgba(20,90,105,.24)!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=details],#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=intelligence]{border-bottom:2px solid #58a7b6!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=relationships],#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=activity]{border-bottom:2px solid #78a55a!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=documents],#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=media],#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab=notes]{border-bottom:2px solid #b28b55!important}
 #entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;padding:13px!important;border-radius:10px!important;border:1px solid #cbd8db!important;background:linear-gradient(145deg,#fff,#f3f7f8)!important;box-shadow:inset 0 1px 0 #fff!important;font-size:10px!important;line-height:1.45!important}
 #entityInformationSection #farmActions{grid-column:2!important;grid-row:3!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;padding:8px 16px!important;margin:0!important;border-top:1px solid #c6d4d7!important;background:linear-gradient(180deg,#e7eef0,#d9e3e6)!important}
 #entityInformationSection #farmActions button{width:auto!important;margin:0!important;padding:8px 10px!important;border-radius:7px!important;font-size:8px!important;font-weight:900!important;letter-spacing:.4px!important;background:#f7fafb!important;color:#31505a!important;border:1px solid #b8c8cc!important;box-shadow:0 2px 5px rgba(20,40,48,.09)!important}
 #entityInformationSection #farmActions .save-farm,#entityInformationSection #farmActions button:first-child{background:linear-gradient(135deg,#167d90,#145d6b)!important;color:#fff!important;border-color:#145d6b!important}
 @media(max-width:1050px){#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs{grid-template-columns:repeat(5,1fr)!important}#entityInformationSection .farm-card{grid-template-columns:31% 1fr!important}}
 `;
 D.head.appendChild(s);
}
function update(){
 const card=D.getElementById('farmCard'),host=D.getElementById('agworldV2FarmDetailHost');
 if(!card)return;
 card.classList.add('agworld-entity-command-interface');
 const buttons=host?qa('[data-tab]',host):[];
 buttons.forEach(b=>{
   b.classList.remove('ag-command-core','ag-command-world','ag-command-intel');
   if(['details','intelligence'].includes(b.dataset.tab))b.classList.add('ag-command-core');
   else if(['lifecycle','spatial','relationships','activity'].includes(b.dataset.tab))b.classList.add('ag-command-world');
   else b.classList.add('ag-command-intel');
 });
 const r=card.getBoundingClientRect(),er=D.getElementById('entityInformationSection')?.getBoundingClientRect();
 const actionIds=['farm3d','fleetTransactionAction','fleetHistoryAction','farmHistoryBtn'];
 const actions=actionIds.map(id=>!!D.getElementById(id));
 const tabs=buttons.map(b=>b.dataset.tab);
 const runtime=W.__AGWORLD_ENTITY_PANEL_RUNTIME__||{};
 W.__AGWORLD_ENTITY_COMMAND_DIAGNOSTIC__={
   cardPresent:!!card,
   sectionPresent:!!er,
   cardFillsSection:!!r&&!!er&&Math.abs(r.width-er.width)<4&&Math.abs(r.height-er.height)<4,
   v2HostPresent:!!host,
   v2PanelPresent:!!host&&!!q('.agworld-v2-detail-panel',host),
   visible:!!card&&getComputedStyle(card).display!=='none',
   summaryMetrics:['farmDrones','farmTractors','farmCrops','farmScore','farmLivestock','farmHarvest','farmService'].map(id=>!!D.getElementById(id)),
   quickActions:actions,
   tabs,
   expectedTabs:expected,
   activeTab:runtime.activeTab||q('[data-tab].is-active',host)?.dataset.tab||'NONE',
   tabCoverage:expected.filter(x=>tabs.includes(x)).length,
   renderedAt:Date.now()
 };
}
style();update();
const obs=new MutationObserver(()=>{update()});
const start=()=>{const card=D.getElementById('farmCard');if(card)obs.observe(card,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
W.addEventListener('agworld:entity-panel-rendered',()=>setTimeout(update,0));
W.addEventListener('agworld:farm-selected',()=>setTimeout(update,180));
W.addEventListener('agworld:dynamic-entity-selected',()=>setTimeout(update,220));
setInterval(update,1800);
})();