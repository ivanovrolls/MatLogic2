from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import TrainingSession, SessionTemplate
from .serializers import TrainingSessionSerializer, TrainingSessionListSerializer, SessionTemplateSerializer


class TrainingSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['session_type', 'date', 'performance_rating']
    search_fields = ['title', 'notes', 'instructor']
    ordering_fields = ['date', 'duration', 'performance_rating', 'created_at']
    ordering = ['-date']

    def get_queryset(self):
        return TrainingSession.objects.filter(user=self.request.user).prefetch_related(
            'techniques_worked', 'sparring_rounds'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return TrainingSessionListSerializer
        return TrainingSessionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        sessions = self.get_queryset()[:5]
        serializer = TrainingSessionListSerializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Avg, Sum, Count
        from datetime import date, timedelta

        qs = self.get_queryset()
        last_30 = qs.filter(date__gte=date.today() - timedelta(days=30))

        return Response({
            'total_sessions': qs.count(),
            'total_minutes': qs.aggregate(t=Sum('duration'))['t'] or 0,
            'sessions_last_30_days': last_30.count(),
            'avg_performance': qs.aggregate(a=Avg('performance_rating'))['a'],
            'avg_session_duration': qs.aggregate(a=Avg('duration'))['a'],
        })


class SessionTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SessionTemplateSerializer

    def get_queryset(self):
        return SessionTemplate.objects.filter(user=self.request.user).prefetch_related('techniques')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
