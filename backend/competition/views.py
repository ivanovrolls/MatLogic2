from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Competition, CompetitionMatch, GamePlan
from .serializers import CompetitionSerializer, CompetitionMatchSerializer, GamePlanSerializer


class CompetitionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CompetitionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['result', 'is_gi']
    ordering = ['-date']

    def get_queryset(self):
        return Competition.objects.filter(user=self.request.user).prefetch_related('matches', 'game_plans')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CompetitionMatchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CompetitionMatchSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['competition', 'result', 'method']

    def get_queryset(self):
        return CompetitionMatch.objects.filter(competition__user=self.request.user)


class GamePlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GamePlanSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['competition']

    def get_queryset(self):
        return GamePlan.objects.filter(user=self.request.user).prefetch_related(
            'primary_techniques', 'backup_techniques'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
