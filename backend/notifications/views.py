from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PushSubscription, NativePushToken, InAppNotification


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
def native_subscribe(request):
    token = request.data.get('token', '').strip()
    platform = request.data.get('platform', '').strip()
    if not token or platform not in ('ios', 'android'):
        return Response({'detail': 'Missing or invalid fields.'}, status=400)
    NativePushToken.objects.update_or_create(
        token=token,
        defaults={'user': request.user, 'platform': platform},
    )
    return Response({'status': 'registered'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    endpoint = request.data.get('endpoint', '').strip()
    if endpoint:
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return Response({'status': 'unsubscribed'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    notifications = InAppNotification.objects.filter(user=request.user)[:30]
    data = [
        {
            'id': n.id,
            'type': n.type,
            'title': n.title,
            'message': n.message,
            'link': n.link,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        }
        for n in notifications
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = InAppNotification.objects.filter(user=request.user, is_read=False).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    try:
        notification = InAppNotification.objects.get(pk=pk, user=request.user)
    except InAppNotification.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    InAppNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'ok'})
