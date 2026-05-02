from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import WeightEntry, MatPost, UserTitle, ProfileGrid
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer,
    WeightEntrySerializer, PublicProfileSerializer, MatPostSerializer,
    UserTitleSerializer, ProfileGridSerializer,
)
from .titles import TITLE_MAP, TITLE_DEFINITIONS, award_default_titles

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        award_default_titles(user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        if not user.titles.exists():
            from .titles import check_and_award_titles
            award_default_titles(user)
            check_and_award_titles(user)
        return super().retrieve(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    from rest_framework_simplejwt.exceptions import TokenError
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'detail': 'Logged out successfully.'})
    except TokenError:
        return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class WeightListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = WeightEntry.objects.filter(user=request.user)
        return Response(WeightEntrySerializer(entries, many=True).data)

    def post(self, request):
        serializer = WeightEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WeightDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            entry = WeightEntry.objects.get(pk=pk, user=request.user)
        except WeightEntry.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not user.is_public:
            return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(PublicProfileSerializer(user, context={'request': request}).data)


class MatPostListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        posts = MatPost.objects.filter(user=request.user)
        return Response(MatPostSerializer(posts, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = MatPostSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MatPostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            post = MatPost.objects.get(pk=pk, user=request.user)
        except MatPost.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserPostsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not user.is_public:
            return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)
        posts = MatPost.objects.filter(user=user)
        return Response(MatPostSerializer(posts, many=True, context={'request': request}).data)


class UserTitlesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        titles = UserTitle.objects.filter(user=request.user)
        return Response(UserTitleSerializer(titles, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def equip_title(request, slug):
    try:
        title = UserTitle.objects.get(user=request.user, slug=slug)
    except UserTitle.DoesNotExist:
        return Response({'detail': 'Title not unlocked.'}, status=status.HTTP_404_NOT_FOUND)
    title.is_equipped = True
    title.save()
    return Response(UserTitleSerializer(title).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unequip_title(request):
    UserTitle.objects.filter(user=request.user, is_equipped=True).update(is_equipped=False)
    return Response({'detail': 'Title unequipped.'})


class ProfileGridView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        grid, _ = ProfileGrid.objects.get_or_create(user=request.user)
        return Response(ProfileGridSerializer(grid).data)

    def put(self, request):
        grid, _ = ProfileGrid.objects.get_or_create(user=request.user)
        widgets = request.data.get('widgets', [])
        grid.widgets = widgets
        grid.save()
        return Response(ProfileGridSerializer(grid).data)


class PublicProfileGridView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not user.is_public:
            return Response({'detail': 'This profile is private.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            grid = user.profile_grid
            widgets = grid.widgets
        except ProfileGrid.DoesNotExist:
            widgets = []
        posts = {str(p.id): {'image': request.build_absolute_uri(p.image.url) if p.image else None, 'caption': p.caption}
                 for p in MatPost.objects.filter(user=user)}
        equipped = user.titles.filter(is_equipped=True).first()
        equipped_title = None
        if equipped:
            td = TITLE_MAP.get(equipped.slug, {})
            equipped_title = {'slug': equipped.slug, 'name': td.get('name', equipped.slug)}
        session_dates = list(user.training_sessions.values_list('date', flat=True).order_by('-date')[:365])
        return Response({
            'widgets': widgets,
            'posts': posts,
            'equipped_title': equipped_title,
            'session_dates': [str(d) for d in session_dates],
        })
