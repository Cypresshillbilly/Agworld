/* GAME CHANGER Master Admin Console */
(function(){
 'use strict';
 const ready=window.GAME_CHANGER_READY||Promise.resolve();
 ready.then(()=>{
   const registry=window.GAME_CHANGER_BUILDS||{};
   const cards=document.getElementById('buildCards');
   if(!cards)return;
   const active=Object.values(registry).filter(b=>b.status!=='planned').length;
   document.getElementById('activeBuildCount').textContent=String(active);
   document.getElementById('registeredBuildCount').textContent=String(Object.keys(registry).length);
   cards.innerHTML=Object.values(registry).map(build=>{
     const live=build.status!=='planned' && !!build.admin;
     return '<article class="build-card '+(live?'active':'')+'">'+
       '<div class="build-kicker">'+(live?'ACTIVE BUILD':'REGISTERED · NOT CONFIGURED')+'</div>'+
       '<h3>'+build.label+'</h3><p>'+build.description+'</p>'+
       '<div class="build-meta"><div><span>STATUS</span><b>'+build.statusLabel+'</b></div><div><span>ROLES</span><b>'+build.roleCount+'</b></div><div><span>ADMIN</span><b>'+ (live?'READY':'PENDING') +'</b></div></div>'+
       '<button class="build-action '+(!live?'disabled':'')+'" '+(!live?'disabled':'')+' data-build="'+build.id+'">'+(live?'ENTER '+build.label.toUpperCase()+' ADMIN':'BUILD NOT CONFIGURED')+'</button></article>';
   }).join('');
   cards.querySelectorAll('[data-build]:not(.disabled)').forEach(btn=>btn.addEventListener('click',()=>{
     const build=registry[btn.dataset.build]; if(!build)return;
     window.GAME_CHANGER_BUILD.set(build.id);
     location.href=build.admin;
   }));
 });
 document.getElementById('masterLogout')?.addEventListener('click',()=>{
   sessionStorage.removeItem('gamechanger.authenticated');sessionStorage.removeItem('gamechanger.role');sessionStorage.removeItem('gamechanger.username');location.reload();
 });
})();