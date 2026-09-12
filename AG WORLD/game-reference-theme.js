/* One presentation owner, loaded at the existing authenticated boot boundary. */
(()=>{
 'use strict';
 if(document.documentElement.dataset.agGameTheme==='reference')return;
 document.documentElement.dataset.agGameTheme='reference';
 const link=document.createElement('link');link.rel='stylesheet';link.href='game-reference-theme.css?v=development-v2-20260912';link.id='agworld-reference-theme';window.AGWorldReferenceThemeReady=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('The game styling did not finish loading. Please retry.')),12000);
   link.onload=()=>{clearTimeout(timer);Promise.race([document.fonts.load('500 14px AgWorldCondensed'),new Promise(r=>setTimeout(r,1800))]).then(resolve,resolve);};
   link.onerror=()=>{clearTimeout(timer);reject(new Error('The game styling could not be loaded. Please retry.'));};
 });
 // Attach rejection handling immediately; auth awaits the original promise.
 window.AGWorldReferenceThemeReady.catch(()=>{});
 document.head.appendChild(link);
 // Only remove obsolete material overrides. The main layout retains position,
 // dimensions, padding, visibility and transforms on every outer frame.
 const surfaces='#entityCommandCentreHeading,#farmCard,#territoryInfoPanel,#territoryStatsToggle,#entityInformationSection';
 const material=/^(background(?:-.+)?|border(?:-.+)?|box-shadow|color)$/;
 function clean(){
   document.querySelectorAll('.territory-info-control-value').forEach(el=>{
     const pct=Math.max(0,Math.min(100,parseFloat(el.textContent)||0))+'%';
     if(el.style.getPropertyValue('--agr-control')!==pct)el.style.setProperty('--agr-control',pct);
   });
   document.querySelectorAll(surfaces).forEach(root=>{
     [root,...root.querySelectorAll('[style]')].forEach(el=>{
       for(const name of Array.from(el.style)){
         if(material.test(name)&&el.style.getPropertyPriority(name)==='important')el.style.removeProperty(name);
       }
     });
   });
 }
 clean();
 const shell=document.querySelector('.app-shell');
 const fit=()=>document.documentElement.classList.toggle('ag-reference-compact',!!shell&&shell.getBoundingClientRect().height<=780);
 fit();if(shell&&'ResizeObserver'in window)new ResizeObserver(fit).observe(shell);
 let scheduled=false;
 const observer=new MutationObserver(()=>{
   if(scheduled)return;scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;clean();});
 });
 observer.observe(document.querySelector('.app-shell')||document.body,{childList:true,subtree:true});
 addEventListener('agworld:player-ready',clean);
})();
