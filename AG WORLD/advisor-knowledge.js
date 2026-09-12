/* Staff-only source libraries for the Product and Technical commanders.
 * Source text is rendered as text. It never becomes instructions, HTML or code.
 */
(()=>{
 'use strict';
 const profiles={product:{title:'PRODUCT COMMANDER',scope:'Specifications · capabilities · applications · product references',prompt:'Search a specification, feature or application',examples:['T100 spraying capacity','T55 battery system','Matrice 4 camera']},technical:{title:'TECHNICAL COMMANDER',scope:'Troubleshooting · maintenance · repairs · service processes',prompt:'Search a fault, part or support process',examples:['T100 motor maintenance','case filing guidelines','battery storage']}};
 let root,active='product',sequence=0,approved=false,lastFocus;
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const q=selector=>root.querySelector(selector);
 const db=()=>window.__AGWORLD_SUPABASE_DB__||window.AGWorldBackend?.getClient?.();
 function status(message){q('[role=status]').textContent=message;}
 function close(){sequence++;root.hidden=true;lastFocus?.focus?.({preventScroll:true});}
 function ensure(){
  if(root)return;
  root=el('aside','ag-knowledge-window');root.id='agCommanderKnowledge';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-labelledby','agKnowledgeTitle');
  root.innerHTML='<header><img alt=""/><div><small>COMMANDER KNOWLEDGE</small><h2 id="agKnowledgeTitle"></h2></div><button type="button" aria-label="Close commander knowledge">×</button></header><p class="agk-scope"></p><div class="agk-counts"></div><form><label>MODEL<select aria-label="Knowledge model"><option value="">All models</option></select></label><label class="agk-query">QUESTION OR KEYWORDS<input maxlength="500" aria-label="Search commander knowledge" autocomplete="off"/></label><button type="submit">SEARCH LIBRARY</button></form><div class="agk-examples"></div><p role="status" aria-live="polite"></p><div class="agk-results"></div><footer>Source extracts with references. Check the document date and exact product variant before applying its information.</footer>';
  root.querySelector('header button').onclick=close;
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
  root.querySelector('form').onsubmit=e=>{e.preventDefault();search();};
  document.body.append(root);
 }
 async function open(id){
  if(!profiles[id])return;ensure();lastFocus=document.activeElement;active=id;approved=false;const token=++sequence,p=profiles[id];
  root.hidden=false;root.dataset.commander=id;
  q('header img').src='assets/advisors/agworld_'+id+'_commander_round(1).png';
  q('h2').textContent=p.title;q('.agk-scope').textContent=p.scope;q('.agk-counts').textContent='';q('.agk-results').replaceChildren();
  q('input').value='';q('input').placeholder=p.prompt;q('select').replaceChildren(new Option('All models',''));
  q('form button').disabled=true;q('.agk-examples').replaceChildren();status('Opening your approved staff library…');
  try{
   const client=db();if(!client?.rpc)throw Error('No authenticated client');
   const {data,error}=await client.rpc('ag_knowledge_catalog',{p_collection:id});if(error)throw error;
   if(token!==sequence)return;
   if(!data?.approved){status('This library is available to approved company staff. Ask your System Administrator for access.');return;}
   approved=true;q('form button').disabled=false;
   q('.agk-counts').textContent=Number(data.documents||0)+' searchable documents · '+Number(data.media||0)+' media references';
   for(const model of data.models||[])q('select').append(new Option(model,model));
   for(const example of p.examples){const b=el('button','',example);b.type='button';b.onclick=()=>{q('input').value=example;search();};q('.agk-examples').append(b);}
   status('Choose a model and search your source library.');
  }catch(_){if(token===sequence)status('The knowledge library could not connect. Close and reopen this commander to retry.');}
 }
 async function search(){
  if(!approved)return;const query=q('input').value.trim();if(query.length<2){status('Enter a model feature, fault or process to search.');return;}
  const token=++sequence,collection=active;status('Searching '+profiles[collection].title.toLowerCase()+' sources…');q('form button').disabled=true;
  try{
   const {data,error}=await db().rpc('ag_knowledge_search',{p_collection:collection,p_query:query,p_model:q('select').value,p_limit:8});if(error)throw error;
   if(token!==sequence)return;q('.agk-results').replaceChildren();
   if(!data?.length){status('No matching passage was found. Try the model number, part name or exact error wording.');return;}
   data.forEach((source,index)=>{
    const card=el('article','agk-source'),heading=el('h3','',source.title),ref=el('p','agk-reference',source.locator+' · '+(source.source_year?'Document year '+source.source_year:'Document date not verified'));
    card.append(el('span','agk-source-number','SOURCE '+(index+1)),heading,ref,el('pre','',source.content),el('small','agk-path',source.source_reference));q('.agk-results').append(card);
   });
   status(data.length+' relevant source passages. These are document extracts, not generated advice.');
  }catch(_){if(token===sequence)status('Search could not complete. Please try again.');}
  finally{if(token===sequence)q('form button').disabled=false;}
 }
 addEventListener('agworld:advisor-selected',e=>{if(profiles[e.detail?.id])open(e.detail.id);else if(root&&!root.hidden)close();});
 addEventListener('agworld:advisor-deselected',()=>{if(root&&!root.hidden)close();});
 addEventListener('agworld:panel-changed',()=>{if(root&&!root.hidden)close();});
 window.AGWorldKnowledge={open,close:()=>{if(root)close();}};
})();
