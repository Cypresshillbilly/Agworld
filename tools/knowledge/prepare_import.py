"""Prepare private SQL batches for an administrator to import into Supabase.
No credentials, source documents or SQL data batches belong in Git.
"""
import argparse,json,pathlib,re
def main():
 p=argparse.ArgumentParser();p.add_argument('--library',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 root=pathlib.Path(a.library);out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
 catalog=json.loads((root/'catalog.json').read_text(encoding='utf8'));documents=[];chunks=[];models={}
 for item in catalog:
  if item['collection']=='restricted-records':continue
  canonical=item.get('duplicate_of',item['id']);models.setdefault(canonical,set()).update(item['models'])
 for item in catalog:
  if item['collection']=='restricted-records':continue
  title=pathlib.PureWindowsPath(item['relative']).name;years=re.findall(r'(?<!\d)(20[12]\d)(?=\D|\d{4}(?:\D|$)|$)',title)
  doc={'id':item['id'],'collection':item['collection'],'models':sorted(models.get(item['id'],set(item['models']))),'title':title,'source_reference':item['relative'],'source_year':int(years[-1]) if years else None,'format':item['extension'].lstrip('.'),'status':'duplicate' if item.get('duplicate_of') else item['status'],'text_sha256':item.get('text_sha256'),'section_count':0}
  if item['status']=='indexed' and not item.get('duplicate_of'):
   data=json.loads((root/'extracts'/(item['id']+'.json')).read_text(encoding='utf8'));doc['section_count']=len(data.get('sections',[]))
   for i,chunk in enumerate(data['chunks']):
    chunks.append({'id':item['id']+'-'+str(i),'document_id':item['id'],'collection':item['collection'],'locator':chunk['locator'],'content':chunk['text']})
  documents.append(doc)
 batches=[]
 def emit(kind,rows):
  payload=json.dumps(rows,ensure_ascii=False,separators=(',',':'));assert '$knowledge$' not in payload
  if kind=='documents':
   sql="insert into public.ag_knowledge_documents select id,collection,models,title,source_reference,source_year,format,status,text_sha256,section_count,now() from jsonb_to_recordset($knowledge$"+payload+"$knowledge$::jsonb) as x(id text,collection text,models text[],title text,source_reference text,source_year integer,format text,status text,text_sha256 text,section_count integer) on conflict(id) do update set collection=excluded.collection,models=excluded.models,title=excluded.title,source_reference=excluded.source_reference,source_year=excluded.source_year,status=excluded.status,text_sha256=excluded.text_sha256,section_count=excluded.section_count,imported_at=now();"
  else:
   sql="insert into public.ag_knowledge_chunks(id,document_id,collection,locator,content,search_text) select x.id,x.document_id,x.collection,x.locator,x.content,d.title||' '||array_to_string(d.models,' ')||' '||x.content from jsonb_to_recordset($knowledge$"+payload+"$knowledge$::jsonb) as x(id text,document_id text,collection text,locator text,content text) join public.ag_knowledge_documents d on d.id=x.document_id on conflict(id) do update set locator=excluded.locator,content=excluded.content,search_text=excluded.search_text,collection=excluded.collection;"
  filename=f'{len(batches):04d}-{kind}.sql';(out/filename).write_text(sql,encoding='utf8');batches.append(filename)
 for kind,records in [('documents',documents),('chunks',chunks)]:
  rows=[];size=0
  for row in records:
   length=len(json.dumps(row,ensure_ascii=False).encode('utf8'))
   if rows and size+length>125000:emit(kind,rows);rows=[];size=0
   rows.append(row);size+=length
  if rows:emit(kind,rows)
 (out/'manifest.json').write_text(json.dumps({'batches':batches,'documents':len(documents),'chunks':len(chunks)},indent=2),encoding='utf8')
 print(json.dumps({'batches':len(batches),'documents':len(documents),'chunks':len(chunks)}))
if __name__=='__main__':main()
