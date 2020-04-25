from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import numpy as np
import pybel

from .models import Drug

# Create your views here.

fps = [drug.calcfp() for drug in pybel.readfile('sdf', 'data/drugbank.sdf')]

def index(request): 
    return render(request, 'index.html',{
        'Drug': Drug,
        })

def data(request):
    start = int(request.GET.get('start', 1))
    limit = int(request.GET.get('limit', 40))
    drugs = Drug.objects.all()[start:start+limit]

    return JsonResponse({
        'total': Drug.objects.count(),
        'items': [{
            'pk': drug.pk,
            'name': drug.drugbank,
            'maccs': drug.maccs, 
            'molfile': drug.molfile
            } for drug in drugs],
        }, safe=False)

def fingerprint(request):
    pk = int(request.GET['pk'])
    
    scores = [fps[pk-1] | fp for fp in fps][:30]
    pks = [pk for pk in reversed(np.argsort(scores))]
    scores = [scores[pk] for pk in pks]

    drugs = [Drug.objects.get(pk=(pk+1)) for pk in pks]

    return JsonResponse({
        'total': len(drugs),
        'items': [{
            'pk': drug.pk,
            'name': drug.drugbank,
            'score': score,
            'molfile': drug.molfile
            } for drug, score in zip(drugs, scores)],
        })
