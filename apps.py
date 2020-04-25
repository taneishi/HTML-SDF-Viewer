from django.apps import AppConfig
from django.db.models.signals import post_migrate


class MolfileConfig(AppConfig):
    name = 'molfile'
    
    def ready(self):
        from .models import import_sdf
        post_migrate.connect(import_sdf, sender=self)
