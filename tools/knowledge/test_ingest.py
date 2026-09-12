import unittest
from ingest import classify,model_names,make_chunks
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
if __name__=='__main__':unittest.main()
