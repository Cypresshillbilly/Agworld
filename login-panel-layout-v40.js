// AG World wide rectangular login panel v40
(()=>{
  const install=()=>{
    const gate=document.getElementById('ag-login-gate');
    const panel=gate?.querySelector('.ag-login-panel');
    const brand=panel?.querySelector('.gc-login-brand');
    const form=panel?.querySelector('.ag-login-form');
    if(!gate||!panel||!brand||!form)return;

    if(!brand.querySelector('img.ag-official-gamechanger-logo')){
      brand.innerHTML='';
      const img=document.createElement('img');
      img.className='ag-official-gamechanger-logo';
      img.src='assets/branding/game-changer/horizontal/game_changer_horizontal_dark.png';
      img.alt='GAME CHANGER';
      brand.appendChild(img);
    }

    if(!panel.querySelector('.ag-login-wide')){
      const wide=document.createElement('div');
      wide.className='ag-login-wide';
      const left=document.createElement('div');
      left.className='ag-login-logo-side';
      const right=document.createElement('div');
      right.className='ag-login-fields-side';
      panel.insertBefore(wide,brand);
      wide.append(left,right);
      left.appendChild(brand);
      right.appendChild(form);
      panel.classList.add('ag-login-panel-wide');
    }

    const formButton=form.querySelector('.ag-login-button');
    if(formButton)formButton.textContent='ENTER AG WORLD';
  };

  const style=document.createElement('style');
  style.textContent=`
#ag-login-gate .ag-login-panel.ag-login-panel-wide{
  width:min(920px,calc(100vw - 48px));
  max-width:920px;
  top:58%;
  padding:0;
  overflow:hidden;
  border-radius:14px;
  border:1px solid rgba(207,224,92,.68);
  background:linear-gradient(100deg,rgba(5,10,8,.96),rgba(10,15,12,.91));
  box-shadow:0 24px 70px rgba(0,0,0,.72);
}
#ag-login-gate .ag-login-wide{
  min-height:300px;
  display:grid;
  grid-template-columns:40% 60%;
}
#ag-login-gate .ag-login-logo-side{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:42px 48px;
  background:
    radial-gradient(circle at 28% 50%,rgba(194,222,64,.13),transparent 38%),
    linear-gradient(135deg,rgba(15,27,18,.96),rgba(5,10,8,.96));
  border-right:1px solid rgba(207,224,92,.24);
}
#ag-login-gate .ag-login-logo-side:after{
  content:'';
  position:absolute;
  top:18%;bottom:18%;right:-1px;
  width:3px;
  background:linear-gradient(180deg,transparent,#cfe85b,transparent);
  opacity:.65;
}
#ag-login-gate .ag-login-logo-side .gc-login-brand{
  width:100%;
  margin:0;
  text-align:left;
}
#ag-login-gate .ag-official-gamechanger-logo{
  display:block;
  width:100%;
  max-width:355px;
  aspect-ratio:1200/520;
  height:auto;
  object-fit:contain;
  background:transparent;
}
#ag-login-gate .gc-login-brand strong{
  font-size:clamp(34px,4vw,58px);
  line-height:.92;
  letter-spacing:4px;
  text-shadow:0 6px 20px rgba(0,0,0,.45);
}
#ag-login-gate .gc-login-brand small{
  margin-top:15px;
  font-size:10px;
  letter-spacing:3px;
  color:#d9dfd2;
}
#ag-login-gate .gc-login-brand em{
  margin-top:12px;
  max-width:260px;
  font-size:9px;
  line-height:1.5;
  letter-spacing:1px;
  color:#aeb8ad;
}
#ag-login-gate .ag-login-fields-side{
  display:flex;
  align-items:center;
  padding:30px 44px;
}
#ag-login-gate .ag-login-form{
  width:100%;
  max-width:430px;
  margin:0 auto;
}
#ag-login-gate .ag-input-wrap{margin-bottom:11px}
#ag-login-gate .ag-input-wrap input{height:45px}
#ag-login-gate .ag-remember{margin:4px 0 13px}
#ag-login-gate .ag-login-button,
#ag-login-gate .ag-login-form [data-company-auth],
#ag-login-gate .ag-login-form [data-company-login]{
  width:100%!important;
  height:46px!important;
  box-sizing:border-box!important;
  margin-top:0!important;
  border-radius:7px!important;
}
#ag-login-gate .ag-login-form [data-company-auth],
#ag-login-gate .ag-login-form [data-company-login]{
  margin-top:10px!important;
}
#ag-login-gate .ag-login-form [data-company-auth],
#ag-login-gate .ag-login-form [data-company-login]{
  background:rgba(207,232,91,.10)!important;
  color:#dbe99c!important;
  border:1px solid rgba(207,224,92,.55)!important;
}
@media(max-width:720px){
  #ag-login-gate .ag-login-panel.ag-login-panel-wide{width:min(94vw,520px);top:54%;overflow:auto;max-height:90vh}
  #ag-login-gate .ag-login-wide{grid-template-columns:1fr}
  #ag-login-gate .ag-login-logo-side{padding:28px 30px;border-right:0;border-bottom:1px solid rgba(207,224,92,.24)}
  #ag-login-gate .ag-login-logo-side:after{display:none}
  #ag-login-gate .ag-login-logo-side .gc-login-brand{text-align:center}
  #ag-login-gate .gc-login-brand em{margin-left:auto;margin-right:auto}
  #ag-login-gate .ag-login-fields-side{padding:24px 30px 30px}
}
`;
  document.head.appendChild(style);
  const timer=setInterval(install,250);
  install();
  setTimeout(()=>clearInterval(timer),15000);
})();