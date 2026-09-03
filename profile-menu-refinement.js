/* AG WORLD — Profile menu refinement.
   Places the approved AG World brand mark prominently at the very top of the Profile menu.
   Keeps the original menu/user functionality intact; this file only controls Profile-menu presentation.
*/
(() => {
  const css = `
    body.ag-profile-mode .sidebar {
      padding: 10px 7px 22px!important;
    }

    body.ag-profile-mode .sidebar .brand {
      box-sizing:border-box!important;
      width:100%!important;
      height:72px!important;
      margin:0 0 7px!important;
      padding:0!important;
      background-image:url('assets/ag-world-logo.jpg')!important;
      background-repeat:no-repeat!important;
      background-position:center center!important;
      background-size:166px auto!important;
      font-size:0!important;
      letter-spacing:0!important;
      border:0!important;
    }

    body.ag-profile-mode .sidebar .brand:before,
    body.ag-profile-mode .sidebar .brand small {
      display:none!important;
      content:none!important;
    }

    body.ag-profile-mode .sidebar .menu-user {
      margin:0 2px 7px!important;
      padding:8px 6px 9px!important;
      border-top:1px solid rgba(214,196,134,.18)!important;
      border-bottom:1px solid rgba(214,196,134,.18)!important;
      text-align:center!important;
    }

    body.ag-profile-mode .sidebar .nav {
      padding:7px 3px!important;
      gap:3px!important;
      margin-top:0!important;
    }

    body.ag-profile-mode .sidebar .nav button {
      width:100%!important;
      box-sizing:border-box!important;
      padding:10px 9px!important;
      font-size:10.5px!important;
      line-height:1.2!important;
      letter-spacing:.15px!important;
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
