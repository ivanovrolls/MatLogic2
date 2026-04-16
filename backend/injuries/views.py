from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import InjuryLog
from .serializers import InjuryLogSerializer


class InjuryLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InjuryLogSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'severity', 'body_part']
    ordering_fields = ['date_occurred', 'created_at']
    ordering = ['-date_occurred']

    def get_queryset(self):
        return InjuryLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
