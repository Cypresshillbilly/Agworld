/* AgWorld brand guide V1.3: approved artwork, forest foundation and lime focus.
   Appearance only. The canonical layout still owns every panel boundary. */
(()=>{
  'use strict';
  if(window.AGWorldSidebar)return;
  const icons={
    dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    pipeline:'<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
    clients:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
    products:'<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7 5.8l9 5"/>',
    'after-sales':'<path d="M14 4a6 6 0 0 0-7 7L3 15a3 3 0 0 0 6 6l4-4a6 6 0 0 0 7-7l-4 4-4-4z"/>',
    'mission-history':'<path d="M8 4H5v17h14V4h-3M8 3h8v4H8zM8 13l2 2 5-5M8 18h7"/>',
    'ai-assistant':'<rect x="4" y="7" width="16" height="14" rx="4"/><path d="M12 3v4M2 12v5M22 12v5M8 16h8"/><circle cx="8" cy="12" r=".6"/><circle cx="16" cy="12" r=".6"/>',
    'territory-campaigns':'<path d="M5 22V3c5-4 9 4 14 0v12c-5 4-9-4-14 0"/>',
    'territory-graphics':'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
    settings:'<path d="m9 3 1-1h4l1 3 3 1 3 1v4l-3 1-1 3 1 3-3 3-3-1-3 1-3-3 1-3-1-3-3-1V7l3-1z"/><circle cx="12" cy="11" r="3"/>',
    logout:'<path d="M9 4H4v16h5M10 12h11M17 8l4 4-4 4"/>'
  };
  const mask=shape=>'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+shape+'</svg>')+'")';
  const css=`
html body .app-shell #agPrimarySidebar {
  --rail-forest:#0B2C20;--rail-lime:#B8E620;--rail-ink:#F4F3ED;
  display:flex!important;flex-direction:column!important;padding:0!important;
  background:linear-gradient(180deg,#071914 0%,#081b1b 55%,#0B2C20 100%)!important;
  border:0!important;border-right:1px solid #28504d!important;
  box-shadow:inset -1px 0 0 rgba(184,230,32,.08)!important;overflow:hidden!important;
}
html body #agPrimarySidebar .brand {
  display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
  flex:0 0 190px!important;min-height:190px!important;height:190px!important;
  width:100%!important;margin:0!important;padding:36px 16px 14px!important;
  background:#071914!important;border:0!important;overflow:visible!important;
}
html body #agPrimarySidebar .brand::before,html body #agPrimarySidebar .brand::after{content:none!important}
html body #agPrimarySidebar .brand .brand-logo {
  width:156px!important;max-width:100%!important;height:auto!important;min-height:0!important;
  max-height:140px!important;object-fit:contain!important;filter:none!important;
  transform:none!important;clip-path:none!important;opacity:1!important;
}
html body #agPrimarySidebar .nav {
  display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important;
  padding:4px 10px 12px!important;margin:0!important;gap:5px!important;
  overflow-x:hidden!important;overflow-y:auto!important;scrollbar-width:thin;scrollbar-color:#386046 transparent;
}
html body #agPrimarySidebar .nav button[data-ag-screen] {
  position:relative!important;display:flex!important;align-items:center!important;gap:11px!important;
  flex:0 0 auto!important;min-height:42px!important;height:auto!important;width:100%!important;
  padding:10px 10px!important;margin:0!important;border:1px solid transparent!important;border-radius:6px!important;
  background:transparent!important;color:#D9DAD5!important;box-shadow:none!important;
  font:600 13px/1.25 'Segoe UI',Arial,sans-serif!important;letter-spacing:.05px!important;text-transform:none!important;
  text-align:left!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;text-shadow:none!important;
  cursor:pointer!important;transition:background .15s ease,border-color .15s ease,color .15s ease!important;
}
html body #agPrimarySidebar .nav button[data-ag-screen]::before {
  content:''!important;position:static!important;display:block!important;flex:0 0 19px!important;
  width:19px!important;height:19px!important;margin:0!important;padding:0!important;
  background:currentColor!important;mask:var(--rail-icon) center/contain no-repeat!important;
  -webkit-mask:var(--rail-icon) center/contain no-repeat!important;pointer-events:none!important;
}
html body #agPrimarySidebar .nav button[data-ag-screen]::after{content:none!important}
html body #agPrimarySidebar .nav button[data-ag-screen]:hover {
  color:#F4F3ED!important;background:rgba(13,106,56,.26)!important;border-color:#31564a!important;
}
html body #agPrimarySidebar .nav button[data-ag-screen].active {
  color:#F4F3ED!important;background:linear-gradient(110deg,#164b2c,#0B2C20)!important;
  border-color:#B8E620!important;box-shadow:inset 3px 0 0 #B8E620,inset 0 0 14px rgba(184,230,32,.13),0 0 9px rgba(184,230,32,.13)!important;
}
html body #agPrimarySidebar .nav button[data-ag-screen].active::before{background:#B8E620!important}
html body #agPrimarySidebar .nav button[data-ag-screen]:focus-visible {
  outline:2px solid #B8E620!important;outline-offset:2px!important;
}
html body #agPrimarySidebar .nav button[data-ag-screen="settings"]{margin-top:8px!important;border-top-color:#28483b!important}
html body #agPrimarySidebar .nav button[data-ag-screen="logout"]{color:#b8c6bb!important}
html body #developerModeBtn {
  position:fixed!important;left:8px!important;top:7px!important;right:auto!important;bottom:auto!important;
  z-index:1250!important;display:inline-flex!important;align-items:center!important;gap:6px!important;
  min-width:0!important;width:auto!important;height:25px!important;padding:0 8px!important;
  border:1px solid #345444!important;border-radius:4px!important;background:#0B2C20!important;
  color:#D9DAD5!important;font:600 10px/1 'Segoe UI',Arial,sans-serif!important;letter-spacing:0!important;
  cursor:pointer!important;box-shadow:none!important;
}
html body #developerModeBtn:hover,html body #developerModeBtn:focus-visible{color:#B8E620!important;border-color:#B8E620!important}
html body:not(.agworld-layout-ready) #developerModeBtn{display:none!important}
@media(max-width:1400px){
  html body #agPrimarySidebar .brand{height:170px!important;min-height:170px!important;flex-basis:170px!important}
  html body #agPrimarySidebar .brand .brand-logo{width:132px!important;max-height:118px!important}
  html body #agPrimarySidebar .nav{padding-left:8px!important;padding-right:8px!important;gap:4px!important}
  html body #agPrimarySidebar .nav button[data-ag-screen]{font-size:12px!important;gap:9px!important;padding:9px 8px!important;min-height:40px!important}
}
@media(prefers-reduced-motion:reduce){html body #agPrimarySidebar .nav button[data-ag-screen]{transition:none!important}}
html body.agmp-reduced-motion #agPrimarySidebar .nav button[data-ag-screen]{transition:none!important}
`+Object.entries(icons).map(([key,shape])=>'#agPrimarySidebar [data-ag-screen="'+key+'"]{--rail-icon:'+mask(shape)+'}').join('\n');
  function ensureDeveloperButton(){
    let button=document.getElementById('developerModeBtn');
    if(!button){button=document.createElement('button');button.id='developerModeBtn';}
    button.type='button';button.textContent='⚙ Developer Mode ↗';
    button.setAttribute('aria-label','Open Developer Mode diagnostics');
    button.title='Open live component diagnostics in a separate tab';
    if(button.parentElement!==document.body)document.body.appendChild(button);
    button.onclick=()=>window.open('developer-mode.html?v=brand-diagnostics-20260912','agworldDeveloperMode');
    return button;
  }
  function start(){
    const sidebar=document.querySelector('.sidebar');if(!sidebar)return;
    sidebar.id='agPrimarySidebar';sidebar.querySelector('.nav')?.setAttribute('aria-label','AgWorld player menu');
    if(!document.getElementById('ag-branded-sidebar-style')){
      const style=document.createElement('style');style.id='ag-branded-sidebar-style';style.textContent=css;document.head.appendChild(style);
    }
    ensureDeveloperButton();
  }
  window.AGWorldSidebar={ensureDeveloperButton};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
