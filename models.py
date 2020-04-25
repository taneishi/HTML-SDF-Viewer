from django.db import models

# Create your models here.

class Drug(models.Model):
    drugbank = models.CharField('DrugBankID', max_length=7, db_index=True)
    maccs = models.CharField('MACCS', max_length=1024)
    molfile = models.CharField('Structure', max_length=4096)

    def __str__(self):
        return self.drugbank

def import_sdf(sender, **kwargs):
    import pybel
    for mol in pybel.readfile('sdf', 'data/drugbank.sdf'):
        drug, new = Drug.objects.get_or_create(drugbank=mol.data['DATABASE_ID'])
        drug.maccs = mol.calcfp(fptype='MACCS')
        drug.molfile = mol.write('mol')
        drug.save()
