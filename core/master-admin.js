/* GAME CHANGER Master Platform — build switcher only */
(function(){
  'use strict';
  const ready=window.GAME_CHANGER_READY||Promise.resolve();
  ready.then(()=>{
    const registry=window.GAME_CHANGER_BUILDS||{};
    const switcher=document.getElementById('buildSwitch');
    const enter=document.getElementById('enterBuild');
    const note=document.getElementById('selectionNote');
    if(!switcher||!enter)return;
    let selected=window.GAME_CHANGER_BUILD?.get?.()||'agriculture';

    const render=()=>{
      switcher.innerHTML=Object.values(registry).map(build=>{
        const isSelected=build.id===selected;
        const icon=build.id==='agriculture'?'🌾':'💼';
        const state=build.id==='agriculture'?'PRIMARY REFERENCE BUILD':'NEXT INDUSTRY BUILD';
        return '<button type="button" class="build-option '+(isSelected?'selected':'')+'" data-build="'+build.id+'">'+
          '<div class="build-icon">'+icon+'</div><h3>'+build.label+'</h3><p>'+build.description+'</p>'+
          '<span class="build-state">'+state+'</span></button>';
      }).join('');
      const build=registry[selected];
      note.textContent=build?'Selected: '+build.label+'.':''; 
      enter.textContent=selected==='agriculture'?'ENTER AG WORLD':'SELECT NETWORK COLLECTIONS';
    };

    switcher.addEventListener('click',event=>{
      const button=event.target.closest('[data-build]');
      if(!button)return;
      selected=button.dataset.build;
      window.GAME_CHANGER_BUILD.set(selected);
      render();
    });

    enter.addEventListener('click',()=>{
      const build=registry[selected];
      if(!build)return;
      window.GAME_CHANGER_BUILD.set(build.id);
      if(build.id==='agriculture'){
        location.href=build.admin||'admin.html';
        return;
      }
      note.textContent='Network Collections is now the active build. Its dedicated game environment will be created after Ag World is proven as the reference build.';
    });

    render();
  });

  document.getElementById('masterLogout')?.addEventListener('click',()=>{
    sessionStorage.removeItem('gamechanger.authenticated');
    sessionStorage.removeItem('gamechanger.role');
    sessionStorage.removeItem('gamechanger.username');
    location.reload();
  });
})();