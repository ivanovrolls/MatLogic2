from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PushSubscription


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe(request):
    endpoint = request.data.get('endpoint', '').strip()
    p256dh = request.data.get('p256dh', '').strip()
    auth = request.data.get('auth', '').strip()
    if not (endpoint and p256dh and auth):
        return Response({'detail': 'Missing fields.'}, status=400)
    PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={'user': request.user, 'p256dh': p256dh, 'auth': auth},
    )
    return Response({'status': 'subscribed'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    endpoint = request.data.get('endpoint', '').strip()
    if endpoint:
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return Response({'status': 'unsubscribed'})
