from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import WeightEntry
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer,
    WeightEntrySerializer, PublicProfileSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'detail': 'Logged out successfully.'})
    except Exception:
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
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
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
