from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Follow
from .serializers import PublicUserSerializer, FeedSessionSerializer, FollowUserSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([AllowAny])
def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not user.is_public and (not request.user.is_authenticated or request.user.id != user.id):
        return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)
    return Response(PublicUserSerializer(user, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([])
    users = User.objects.filter(
        Q(username__icontains=q) | Q(gym__icontains=q),
        is_public=True,
    ).exclude(id=request.user.id)[:20]
    return Response(PublicUserSerializer(users, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, username):
    try:
        target = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    if target == request.user:
        return Response({'detail': 'Cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)
    if not target.is_public:
        return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)
    Follow.objects.get_or_create(follower=request.user, following=target)
    return Response({'following': True}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, username):
    try:
        target = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    Follow.objects.filter(follower=request.user, following=target).delete()
    return Response({'following': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def followers_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    followers = User.objects.filter(following__following=user)
    return Response(FollowUserSerializer(followers, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def following_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    following = User.objects.filter(followers__follower=user)
    return Response(FollowUserSerializer(following, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_feed(request):
    following_ids = Follow.objects.filter(
        follower=request.user
    ).values_list('following_id', flat=True)
    from training.models import TrainingSession
    sessions = (
        TrainingSession.objects
        .filter(user_id__in=following_ids)
        .select_related('user')
        .order_by('-date', '-created_at')[:30]
    )
    return Response(FeedSessionSerializer(sessions, many=True, context={'request': request}).data)
