import unittest,io,zipfile
from ingest import classify,model_names,make_chunks,extract
class IngestTests(unittest.TestCase):
 def test_private_records(self):
  for path in [r'DJI Information\End User Information\2024.xlsx',r'AGRAS\T40\Serial Number\shipment.xlsx',r'DJI Information\After Sales\Agreement(signed).pdf',r'AGRAS\T30 Battery\Agrones\fault.pdf',r'AGRAS\T40 Unit Cost\prices.xlsx']:
   self.assertEqual(classify(path),'restricted-records',path)
 def test_specialists(self):
  self.assertEqual(classify(r'AGRAS\T30\T30 spares.xlsx'),'technical')
  self.assertEqual(classify(r'AGRAS\T100\T100 brochure.pdf'),'product')
  self.assertEqual(classify(r'DJI Aftersales Information\Case Filing Guidelines.pdf'),'technical')
 def test_model_variants(self):
  self.assertEqual(model_names(r'AGRAS\T55 Data Base\D8000iE Material information.xlsx'),['D8000IE','T55'])
  self.assertEqual(model_names(r'AGRAS\T100 Data Base\T70P&T25P maintenance.pdf'),['T70P','T25P'])
  self.assertEqual(model_names(r'Marketing\Matrice 4\M4T brochure.pdf'),['MATRICE 4T','MATRICE 4'])
 def test_citations(self):
  chunks=make_chunks([{'locator':'Page 1','text':'A '*3000},{'locator':'Page 2','text':'B'}])
  self.assertTrue(all(len(x['text'])<=1900 for x in chunks))
  self.assertEqual(chunks[-1],{'locator':'Page 2','text':'B'})
 def test_sparse_workbook_and_uncalculated_formula(self):
  file=io.BytesIO()
  with zipfile.ZipFile(file,'w') as z:
   z.writestr('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Parts" r:id="rId1"/></sheets></workbook>')
   z.writestr('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
   z.writestr('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:XFD1048576"/><sheetData><row r="2"><c r="A2" t="inlineStr"><is><t>Motor</t></is></c><c r="B2"><v>42</v></c><c r="C2"><f>B2*2</f></c></row><row r="1048576"><c r="XFD1048576" s="1"/></row></sheetData></worksheet>')
  file.seek(0);sections=extract(file,'.xlsx');self.assertEqual(len(sections),1)
  self.assertIn('Motor',sections[0]['text']);self.assertIn('no saved result',sections[0]['text']);self.assertEqual(sections[0]['locator'],'Sheet Parts · row 2')
if __name__=='__main__':unittest.main()
