/* GAME CHANGER — Agriculture profile Settings + Log Out */
(()=>{
  // Use the same session keys as the GAME CHANGER authentication gate.
  // Keep the remembered-login preference intact so it can still prefill the next login.
  window.agWorldLogout=async function(){
    // Supabase owns the AG World player session. Clearing only browser
    // compatibility keys would cause the bridge to immediately restore the
    // still-persisted Supabase user on the next refresh.
    try{
      let db=null;
      if(window.supabase?.createClient){
        db=window.supabase.createClient(
          'https://vcnkspaljmsjvonftfcw.supabase.co',
          'sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o'
        );
      }
      if(db?.auth) await db.auth.signOut();
    }catch(e){
      console.warn('AG World Supabase sign-out failed',e);
    }
    try{
      sessionStorage.removeItem('gamechanger.authenticated');
      sessionStorage.removeItem('gamechanger.role');
      sessionStorage.removeItem('gamechanger.username');
      sessionStorage.removeItem('agworld.authenticated');
      localStorage.removeItem('agworld.remembered.email');
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

  const install=()=>{
    addItems();
    const observer=new MutationObserver(addItems);
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(addItems,500);
    setTimeout(addItems,1500);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
