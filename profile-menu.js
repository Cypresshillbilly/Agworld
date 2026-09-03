/* AG WORLD — Profile page Menu user header. */
(() => {
  const css = `
    body.ag-profile-mode .sidebar .menu-user-header{display:block!important;margin:2px 8px 8px!important;padding:10px 8px 12px!important;border-top:1px solid rgba(214,196,134,.18)!important;border-bottom:1px solid rgba(214,196,134,.18)!important;text-align:center!important}
    body.ag-profile-mode .sidebar .menu-user-avatar{width:54px!important;height:54px!important;margin:0 auto 7px!important;border-radius:50%!important;position:relative!important;overflow:hidden!important;border:2px solid #d6c481!important;background:radial-gradient(circle at 50% 35%,#d4a783 0 17%,transparent 18%),radial-gradient(ellipse at 50% 79%,#43545a 0 39%,transparent 40%),linear-gradient(145deg,#718087,#17242b)!important;box-shadow:0 3px 12px rgba(0,0,0,.35),inset 0 0 0 2px rgba(255,255,255,.08)!important}
    body.ag-profile-mode .sidebar .menu-user-avatar:before{content:''!important;position:absolute!important;left:14px!important;top:7px!important;width:22px!important;height:25px!important;border-radius:50% 50% 46% 46%!important;background:#c79676!important;box-shadow:0 -4px 0 2px #3a302b!important}
    body.ag-profile-mode .sidebar .menu-user-avatar:after{content:''!important;position:absolute!important;left:8px!important;bottom:-2px!important;width:38px!important;height:28px!important;border-radius:50% 50% 0 0!important;background:#35464d!important}
    body.ag-profile-mode .sidebar .menu-user-name{color:#fff!important;font:900 10px Arial,sans-serif!important;letter-spacing:.7px!important;text-transform:uppercase!important}
    body.ag-profile-mode .sidebar .menu-user-role{margin-top:3px!important;color:#9fb0b7!important;font:700 6px Arial,sans-serif!important;letter-spacing:.6px!important;text-transform:uppercase!important}
    body.ag-profile-mode .sidebar .menu-user-level{display:inline-block!important;margin-top:7px!important;padding:4px 8px!important;border-radius:4px!important;background:#394b54!important;color:#fff!important;font:900 7px Arial,sans-serif!important;letter-spacing:.7px!important}
    body.ag-profile-mode .sidebar .menu-user-xp{height:5px!important;margin:8px 2px 0!important;background:#35434a!important;border-radius:6px!important;overflow:hidden!important}
    body.ag-profile-mode .sidebar .menu-user-xp span{display:block!important;width:68%!important;height:100%!important;background:#6e9d55!important;border-radius:6px!important}
    body.ag-profile-mode .sidebar .menu-user-xptext{display:flex!important;justify-content:space-between!important;margin-top:4px!important;color:#8fa1a8!important;font:700 5.5px Arial,sans-serif!important}
    body.ag-profile-mode .sidebar .menu-user-xptext b{color:#d6c481!important}
    body.ag-profile-mode .sidebar .nav{margin-top:7px!important}
    body.ag-profile-mode .sidebar .profile{display:none!important}
  `;
  function install(){
    if(!document.getElementById('ag-profile-menu-style')){const s=document.createElement('style');s.id='ag-profile-menu-style';s.textContent=css;document.head.appendChild(s)}
    const render=()=>{const sidebar=document.querySelector('.sidebar');if(!sidebar||!document.body.classList.contains('ag-profile-mode'))return;if(sidebar.querySelector('.menu-user-header'))return;const nav=sidebar.querySelector('.nav');if(!nav)return;const header=document.createElement('div');header.className='menu-user-header';header.innerHTML=`<div class="menu-user-avatar" aria-label="Nico van Rooyen profile picture"></div><div class="menu-user-name">NICO VAN ROOYEN</div><div class="menu-user-role">SALES REPRESENTATIVE</div><div class="menu-user-level">LEVEL 7</div><div class="menu-user-xp"><span></span></div><div class="menu-user-xptext"><span>6,820 / 10,000 XP</span><b>68%</b></div>`;nav.parentNode.insertBefore(header,nav)};
    window.addEventListener('agworld:authenticated',render);if(sessionStorage.getItem('agworld.authenticated')==='1')render();new MutationObserver(render).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();