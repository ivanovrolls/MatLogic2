from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import SparringRound
from .serializers import SparringRoundSerializer


class SparringRoundViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SparringRoundSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['outcome', 'is_gi', 'partner_belt', 'date', 'session']
    search_fields = ['partner_name', 'notes']
    ordering_fields = ['date', 'duration_minutes', 'created_at']
    ordering = ['-date']

    def get_queryset(self):
        return SparringRound.objects.filter(user=self.request.user).select_related('session')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Count, Avg
        from datetime import date, timedelta

        qs = self.get_queryset()
        total = qs.count()
        wins = qs.filter(outcome='win').count()
        losses = qs.filter(outcome='loss').count()
        draws = qs.filter(outcome='draw').count()

        # Most common submissions conceded
        all_conceded = []
        for r in qs:
            all_conceded.extend(r.submissions_conceded)

        from collections import Counter
        conceded_counter = Counter(all_conceded)

        # Most common dominant positions
        all_dominant = []
        for r in qs:
            all_dominant.extend(r.dominant_positions)
        dominant_counter = Counter(all_dominant)

        return Response({
            'total_rounds': total,
            'wins': wins,
            'losses': losses,
            'draws': draws,
            'win_rate': round((wins / total * 100), 1) if total > 0 else 0,
            'most_common_losses': conceded_counter.most_common(5),
            'top_dominant_positions': dominant_counter.most_common(5),
            'avg_round_duration': qs.aggregate(a=Avg('duration_minutes'))['a'],
        })
