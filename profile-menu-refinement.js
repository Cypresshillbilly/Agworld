/* AG WORLD — Profile menu logo fix.
   The Profile view rebuilds the sidebar dynamically, so the approved logo is
   inserted as a real <img> element rather than relying on a CSS background.
*/
(() => {
  const LOGO_SRC = 'assets/ag-world-logo.jpg';

  const css = `
    body.ag-profile-mode .sidebar {
      padding: 10px 7px 22px!important;
      box-sizing: border-box!important;
    }

    body.ag-profile-mode .sidebar .brand {
      box-sizing:border-box!important;
      width:100%!important;
      height:88px!important;
      margin:0 0 7px!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      background:none!important;
      font-size:0!important;
      letter-spacing:0!important;
      border:0!important;
      overflow:hidden!important;
    }

    body.ag-profile-mode .sidebar .brand .ag-world-menu-logo {
      display:block!important;
      width:100%!important;
      max-width:176px!important;
      height:auto!important;
      max-height:78px!important;
      object-fit:contain!important;
      object-position:center!important;
      margin:0 auto!important;
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

  function installStyles() {
    if (document.getElementById('ag-profile-menu-refinement-style')) return;
    const style = document.createElement('style');
    style.id = 'ag-profile-menu-refinement-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectLogo() {
    if (!document.body.classList.contains('ag-profile-mode')) return;
    const brand = document.querySelector('body.ag-profile-mode .sidebar .brand');
    if (!brand) return;

    let logo = brand.querySelector('.ag-world-menu-logo');
    if (!logo) {
      brand.textContent = '';
      logo = document.createElement('img');
      logo.className = 'ag-world-menu-logo';
      logo.alt = 'AG World';
      logo.src = LOGO_SRC + '?v=20260903';
      logo.decoding = 'async';
      logo.loading = 'eager';
      brand.appendChild(logo);
    } else if (!logo.src.includes('ag-world-logo.jpg')) {
      logo.src = LOGO_SRC + '?v=20260903';
    }
  }

  function install() {
    installStyles();
    injectLogo();

    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('ag-profile-mode')) injectLogo();
    });
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
