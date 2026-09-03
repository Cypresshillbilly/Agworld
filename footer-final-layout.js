/* AG WORLD — footer layout controller. Live profile footer owns content and badge relocation. */
(()=>{
function loadCss(){
  if(document.getElementById('ag-final-footer-css'))return;
  const l=document.createElement('link');
  l.id='ag-final-footer-css';
  l.rel='stylesheet';
  l.href='footer-final-layout.css?v=20260918';
  document.head.appendChild(l);
}
function fix(){
  const f=document.querySelector('.bottom');
  if(!f||!document.body.classList.contains('ag-profile-mode'))return;
  f.classList.add('ag-profile-footer');
  const progress=f.querySelector('.live-progress');
  const skills=f.querySelector('.live-skills,.final-skill-tree');
  const leader=f.querySelector('.live-leaderboard');
  if(progress)progress.style.gridColumn='1';
  if(skills)skills.style.gridColumn='2';
  if(leader)leader.style.gridColumn='3';
}
function start(){
  loadCss();
  fix();
  const f=document.querySelector('.bottom');
  if(f)new MutationObserver(()=>fix()).observe(f,{childList:true,subtree:true});
  setTimeout(fix,500);
  setTimeout(fix,1200);
  setTimeout(fix,2500);
}
document.addEventListener('DOMContentLoaded',start);
setTimeout(start,1500);
})();
