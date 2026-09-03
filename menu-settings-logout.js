/* AG WORLD — Settings + Log Out menu items */
(()=>{
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
      b.addEventListener('click',()=>{
        if(typeof window.agWorldLogout==='function') window.agWorldLogout();
        else { sessionStorage.removeItem('agworld.authenticated'); window.location.reload(); }
      });
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
