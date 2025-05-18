from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_check(request):
    """
    Simple health check endpoint to verify API is running
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'API is running'
    })

