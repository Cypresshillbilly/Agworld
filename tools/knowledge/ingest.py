"""Build a local, private, traceable knowledge library without moving source files.

Originals remain in their supplied folders. Only extraction code belongs in Git.
Never treat source text, hyperlinks or macros as executable instructions.
"""
import argparse,collections,concurrent.futures,datetime,hashlib,json,logging,pathlib,re,sys,zipfile,threading
from xml.etree import ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
logging.getLogger('pypdf').setLevel(logging.ERROR)
DOC_TYPES={'.pdf','.docx','.pptx','.xlsx','.txt'}
PDF_LOCK=threading.Lock()
TECH=re.compile(r'after.?sales?|repair|troubleshoot|fault|damage|maintenan|maintain|warranty|spares?|\bparts\b|\bbom\b|material.information|explosion|exploded|disassembl|assembly|case.filing|case.*guideline|service.*(flow|policy)|export.*log|calibrat',re.I)
PRIVATE=re.compile(r'End User Information|[\\/]Agrones[\\/]|[\\/]Pricing[\\/]|\bQuotation\b|\bQuote\b|\bagreement\b|\bsigned\b|[\\/]Dji Test[\\/]|[\\/]DJI Inventory[\\/]|rebate.policy|Scoring Sheet.*Clint|\.msg$',re.I)
PRIVATE_EXTRA=re.compile(r'Serial Number|\bSN record\b|\bSN approval\b|Unit Cost|waiting list|Commitment Letter|DC Geomatics PTY Ltd After Sales|Prac Ruan|Products list_CNY|First Batch',re.I)
MODELS=re.compile(r'(?<![A-Z0-9])(?:T(?:100|70P?|55|50|40|30|25P?|20P?|16|10)|MG[- ]?1P?|D(?:14000|12000|9000|8000|6000)i?(?:E[P]?|EP)?|C(?:12000|10000|8000)|DB\d{3,5}|M4[EDT]?|MATRICE\s*4[EDT]?|RC\s*PLUS\s*2?)(?![A-Z0-9])',re.I)
def model_names(path):
    parts=path.replace('\\','/').split('/')
    explicit=MODELS.findall(parts[-1].upper())
    inherited=MODELS.findall('/'.join(parts[:-1]).upper())
    names=explicit or inherited
    # Accessory records also belong to their parent aircraft's model folder.
    if names and not any(re.fullmatch(r'T\d+P?',s) for s in names):names+=inherited
    out=[]
    for s in names:
        s=re.sub(r'\s+',' ',s.strip()).replace('MG1','MG-1')
        if re.fullmatch(r'M4[EDT]?',s):s='MATRICE 4'+s[2:]
        if s not in out:out.append(s)
    return out or ['GENERAL']
def classify(relative):
    if PRIVATE.search(relative) or PRIVATE_EXTRA.search(relative):return 'restricted-records'
    return 'technical' if TECH.search(relative) else 'product'
def clean(text):
    return '\n'.join(line.rstrip() for line in str(text).replace('\x00','').replace('\r','').splitlines()).strip()
def paras(root):
    return [clean(''.join(p.itertext())) for p in root]
def extract(path,ext):
    sections=[]
    if ext=='.pdf':
        import pypdfium2 as pdfium
        # PDFium is fast on image-heavy manuals but is not thread-safe.
        with PDF_LOCK:
            document=pdfium.PdfDocument(str(path))
            try:
                for i in range(len(document)):
                    page=document[i];textpage=page.get_textpage()
                    try:sections.append({'locator':f'Page {i+1}','text':clean(textpage.get_text_bounded())})
                    finally:textpage.close();page.close()
            finally:document.close()
    elif ext in ('.pptx','.docx'):
        with zipfile.ZipFile(path) as z:
            if ext=='.pptx':
                names=sorted((n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)),key=lambda x:int(re.search(r'(\d+)\.xml',x)[1]))
                for n in names:
                    root=ET.fromstring(z.read(n));texts=[]
                    for p in root.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}p'):
                        texts.append(''.join(t.text or '' for t in p.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t')))
                    sections.append({'locator':'Slide '+re.search(r'(\d+)\.xml',n)[1],'text':clean('\n'.join(texts))})
            else:
                root=ET.fromstring(z.read('word/document.xml'));ns='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
                for i,p in enumerate(root.iter(ns+'p'),1):
                    text=''.join(t.text or '' for t in p.iter(ns+'t'))
                    if text.strip():sections.append({'locator':f'Paragraph {i}','text':clean(text)})
    elif ext=='.xlsx':
        # Read stored cells, not every empty formatted row in a manufacturer's workbook.
        ns='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        with zipfile.ZipFile(path) as z:
            strings=[]
            if 'xl/sharedStrings.xml' in z.namelist():
                for _,node in ET.iterparse(z.open('xl/sharedStrings.xml'),events=('end',)):
                    if node.tag==ns+'si':strings.append(''.join(t.text or '' for t in node.iter(ns+'t')));node.clear()
            rels={r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
            workbook=ET.fromstring(z.read('xl/workbook.xml'))
            for sheet in workbook.iter(ns+'sheet'):
                target=rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
                target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
                for _,row in ET.iterparse(z.open(target),events=('end',)):
                    if row.tag!=ns+'row':continue
                    cells=[]
                    for cell in row:
                        value=cell.find(ns+'v');text=value.text if value is not None else None
                        if cell.attrib.get('t')=='s' and text is not None:text=strings[int(text)]
                        elif cell.attrib.get('t')=='inlineStr':text=''.join(t.text or '' for t in cell.iter(ns+'t'))
                        if text is None and cell.find(ns+'f') is not None:text='[Formula has no saved result; consult original workbook]'
                        if text is not None and text.strip():cells.append(cell.attrib.get('r','Cell')+': '+text)
                    if cells:sections.append({'locator':f"Sheet {sheet.attrib['name']} · row {row.attrib.get('r','?')}",'text':clean(' | '.join(cells))})
                    row.clear()
    else:
        data=pathlib.Path(path).read_bytes()
        try:text=data.decode('utf-8-sig')
        except UnicodeDecodeError:text=data.decode('utf-16') if data.startswith((b'\xff\xfe',b'\xfe\xff')) else data.decode('cp1252',errors='replace')
        sections=[{'locator':'Text document','text':clean(text)}]
    return sections
def make_chunks(sections,maximum=1900):
    chunks=[];text='';start='';end=''
    for section in sections:
        body=section['text']
        if not body:continue
        # Preserve page/slide citations; combine short spreadsheet rows and paragraphs.
        combine=section['locator'].startswith(('Sheet ','Paragraph '))
        if text and (len(text)+len(body)>maximum or not combine):
            chunks.append({'locator':start if start==end else start+' to '+end,'text':text});text=''
        while len(body)>maximum:
            cut=body.rfind('\n',0,maximum)
            if cut<maximum//2:cut=body.rfind(' ',0,maximum)
            if cut<maximum//2:cut=maximum
            chunks.append({'locator':section['locator'],'text':body[:cut].strip()});body=body[cut:].strip()
        if not text:start=section['locator']
        text+=(('\n' if text else '')+body);end=section['locator']
    if text:chunks.append({'locator':start if start==end else start+' to '+end,'text':text})
    return chunks
def process(item,out):
    identity=hashlib.sha256(item['relative'].encode()).hexdigest()[:24]
    result={**item,'id':identity,'models':model_names(item['relative']),'collection':classify(item['relative'])}
    target=out/'extracts'/(identity+'.json')
    if target.exists():
        try:old=json.loads(target.read_text(encoding='utf8'))
        except json.JSONDecodeError:old={}
        if old.get('bytes')==item['bytes'] and old.get('modified')==item['modified'] and old.get('status')!='error':
            old.update(collection=result['collection'],models=result['models'])
            if old['collection']=='restricted-records':
                old={k:v for k,v in old.items() if k not in ('sections','chunks','text_sha256','empty_sections')}
                old['status']='excluded-from-advisor-answers'
            target.write_text(json.dumps(old,ensure_ascii=False),encoding='utf8')
            return old
    if result['collection']=='restricted-records':result['status']='excluded-from-advisor-answers'
    elif item['extension'] not in DOC_TYPES:result['status']='catalogued-media' if item['extension'] in ['.png','.jpg','.jpeg','.mp4','.mov','.m4v','.ai','.psd','.indd','.idml'] else 'catalogued-needs-extraction'
    else:
        try:
            sections=extract(item['path'],item['extension']);result['sections']=sections
            result['chunks']=make_chunks(sections);result['empty_sections']=[s['locator'] for s in sections if not s['text']]
            result['text_sha256']=hashlib.sha256('\n'.join(s['text'] for s in sections).encode()).hexdigest()
            result['status']='indexed' if result['chunks'] else 'needs-ocr-or-empty'
        except Exception as e:result['status']='error';result['error']=str(e)[:300]
    target.write_text(json.dumps(result,ensure_ascii=False),encoding='utf8');return result
def main():
    p=argparse.ArgumentParser();p.add_argument('--inventory',required=True);p.add_argument('--output',required=True);p.add_argument('--workers',type=int,default=3);a=p.parse_args()
    out=pathlib.Path(a.output);(out/'extracts').mkdir(parents=True,exist_ok=True)
    items=json.loads(pathlib.Path(a.inventory).read_text(encoding='utf-8-sig'));results=[]
    # Metadata first makes all media discoverable without downloading gigabytes of video.
    items.sort(key=lambda x:(x['extension'] in DOC_TYPES,x['bytes']))
    with concurrent.futures.ThreadPoolExecutor(max_workers=a.workers) as pool:
        futures=[pool.submit(process,item,out) for item in items]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            if len(results)%100==0:print('Catalogued',len(results),'/',len(items),flush=True)
    results.sort(key=lambda x:x['relative']);seen={};catalog=[];groups=collections.defaultdict(list)
    for r in results:
        if r.get('text_sha256') and r['status']=='indexed':
            key=(r['collection'],r['text_sha256'])
            if key in seen:r['duplicate_of']=seen[key]
            else:seen[key]=r['id']
        item={k:v for k,v in r.items() if k not in ('sections','chunks')};item['chunk_count']=len(r.get('chunks',[]));catalog.append(item)
        for model in r['models']:groups[(r['collection'],model)].append(item)
    for (collection,model),members in groups.items():
        d=out/collection/'models'/re.sub(r'[^a-z0-9-]+','-',model.lower());d.mkdir(parents=True,exist_ok=True)
        (d/'catalog.json').write_text(json.dumps(members,ensure_ascii=False,indent=2),encoding='utf8')
    (out/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf8')
    summary={'files':len(catalog),'bytes':sum(x['bytes'] for x in catalog),'status':dict(collections.Counter(x['status'] for x in catalog)),'collections':dict(collections.Counter(x['collection'] for x in catalog)),'duplicates':sum('duplicate_of' in x for x in catalog),'unique_documents':len(seen),'chunks':sum(x['chunk_count'] for x in catalog if 'duplicate_of' not in x),'models':sorted(set(m for x in catalog for m in x['models']))}
    (out/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf8');print(json.dumps(summary),flush=True)
if __name__=='__main__':main()
