/* AG WORLD — profile menu refinement.
   Uses the approved AG WORLD logo asset and increases navigation readability.
   This file only affects the Menu section in Profile view.
*/
(() => {
  const css = `
    body.ag-profile-mode .sidebar .brand {
      box-sizing:border-box!important;
      width:100%!important;
      height:54px!important;
      margin:0!important;
      padding:0!important;
      background-image:url('assets/ag-world-logo.jpg')!important;
      background-repeat:no-repeat!important;
      background-position:left center!important;
      background-size:118px auto!important;
      font-size:0!important;
      letter-spacing:0!important;
    }
    body.ag-profile-mode .sidebar .brand:before,
    body.ag-profile-mode .sidebar .brand small {
      display:none!important;
      content:none!important;
    }
    body.ag-profile-mode .sidebar .nav {
      padding:9px 6px!important;
      gap:3px!important;
    }
    body.ag-profile-mode .sidebar .nav button {
      padding:9px 10px!important;
      font-size:10.5px!important;
      line-height:1.2!important;
      letter-spacing:.1px!important;
    }
  `;

  function install() {
    if (document.getElementById('ag-profile-menu-refinement-style')) return;
    const style = document.createElement('style');
    style.id = 'ag-profile-menu-refinement-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
