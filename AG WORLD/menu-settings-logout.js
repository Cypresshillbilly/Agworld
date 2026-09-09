/* GAME CHANGER — Agriculture profile Settings + Log Out */
(()=>{
  // Use the same session keys as the GAME CHANGER authentication gate.
  // Keep the remembered-login preference intact so it can still prefill the next login.
  window.agWorldLogout=function(){
    try{
      sessionStorage.removeItem('gamechanger.authenticated');
      sessionStorage.removeItem('gamechanger.role');
      sessionStorage.removeItem('gamechanger.username');
      // Clear the legacy key as well for older sessions.
      sessionStorage.removeItem('agworld.authenticated');
    }catch(e){}
    window.location.replace('index.html?loggedout='+Date.now());
  };

  function addItems(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    if(!nav.querySelector('[data-menu="settings"]')){
      const b=document.createElement('button');
      b.type='button';
      b.dataset.menu='settings';
      b.textContent='Settings';
      b.addEventListener('click',()=>{
        nav.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        window.dispatchEvent(new CustomEvent('agworld:settings'));
      });
      nav.appendChild(b);
    }
    if(!nav.querySelector('[data-menu="logout"]')){
      const b=document.createElement('button');
      b.type='button';
      b.dataset.menu='logout';
      b.textContent='Log Out';
      b.className='ag-menu-logout';
      b.addEventListener('click',window.agWorldLogout);
      nav.appendChild(b);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    addItems();
    const observer=new MutationObserver(addItems);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(addItems,500);
    setTimeout(addItems,1500);
  });
})();
