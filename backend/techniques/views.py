from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Technique, TechniqueChain, ChainEntry
from .serializers import TechniqueSerializer, TechniqueChainSerializer, ChainEntrySerializer
from notifications.models import InAppNotification


class TechniqueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TechniqueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['position', 'technique_type', 'difficulty', 'is_active']
    search_fields = ['name', 'description', 'notes']
    ordering_fields = ['name', 'position', 'difficulty', 'times_drilled', 'created_at']
    ordering = ['position', 'name']

    def get_queryset(self):
        return Technique.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_position(self, request):
        position = request.query_params.get('position')
        qs = self.get_queryset()
        if position:
            qs = qs.filter(position=position)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def increment_drills(self, request, pk=None):
        technique = self.get_object()
        technique.times_drilled += 1
        technique.save()
        return Response({'times_drilled': technique.times_drilled})

    @action(detail=True, methods=['post'], url_path='respond-coach')
    def respond_coach_assignment(self, request, pk=None):
        technique = self.get_object()
        if not technique.coach_assignment_pending:
            return Response({'detail': 'Not a pending coach assignment.'}, status=400)
        action_val = request.data.get('action')
        if action_val == 'accept':
            coach = technique.coach_assigned_by
            technique_name = technique.name
            technique.coach_assignment_pending = False
            technique.coach_assigned_by = None
            technique.save()
            if coach:
                InAppNotification.objects.create(
                    user=coach,
                    type='coach',
                    title=f'{request.user.username} accepted "{technique_name}"',
                    message='They added this technique to their arsenal.',
                    link='/coaching',
                )
            return Response({'status': 'accepted'})
        elif action_val == 'decline':
            coach = technique.coach_assigned_by
            technique_name = technique.name
            technique.delete()
            if coach:
                InAppNotification.objects.create(
                    user=coach,
                    type='coach',
                    title=f'{request.user.username} declined "{technique_name}"',
                    message='Consider discussing why or assigning a different technique.',
                    link='/coaching',
                )
            return Response({'status': 'declined'})
        return Response({'detail': 'action must be "accept" or "decline".'}, status=400)


class TechniqueChainViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TechniqueChainSerializer

    def get_queryset(self):
        return TechniqueChain.objects.filter(user=self.request.user).prefetch_related('entries__technique')

    @action(detail=True, methods=['post'])
    def add_technique(self, request, pk=None):
        chain = self.get_object()
        technique_id = request.data.get('technique_id')
        notes = request.data.get('notes', '')
        try:
            technique = Technique.objects.get(id=technique_id, user=request.user)
        except Technique.DoesNotExist:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({'detail': 'Technique not found.'}, status=status.HTTP_404_NOT_FOUND)
        next_order = chain.entries.count() + 1
        entry = ChainEntry.objects.create(chain=chain, technique=technique, order=next_order, notes=notes)
        return Response(ChainEntrySerializer(entry).data)

    @action(detail=True, methods=['delete'])
    def remove_technique(self, request, pk=None):
        chain = self.get_object()
        entry_id = request.data.get('entry_id')
        chain.entries.filter(id=entry_id).delete()
        # Re-order remaining entries
        for i, entry in enumerate(chain.entries.all(), start=1):
            entry.order = i
            entry.save()
        return Response({'detail': 'Removed.'})
