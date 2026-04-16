from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WeeklyPlan, SessionChecklist
from .serializers import WeeklyPlanSerializer, SessionChecklistSerializer


class WeeklyPlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WeeklyPlanSerializer
    ordering = ['-week_start']

    def get_queryset(self):
        return WeeklyPlan.objects.filter(user=self.request.user).prefetch_related(
            'focus_techniques', 'checklists'
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        from datetime import date, timedelta
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        try:
            plan = WeeklyPlan.objects.get(user=request.user, week_start=monday)
            return Response(WeeklyPlanSerializer(plan).data)
        except WeeklyPlan.DoesNotExist:
            return Response({'detail': 'No plan for this week.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def generate_checklist(self, request, pk=None):
        plan = self.get_object()
        title = request.data.get('title', 'Session Checklist')
        date_val = request.data.get('date')
        if not date_val:
            from datetime import date as date_type
            date_val = date_type.today()

        items = []
        for technique in plan.focus_techniques.all():
            items.append({
                'id': str(technique.id),
                'technique_id': technique.id,
                'text': f"Drill: {technique.name}",
                'completed': False
            })

        checklist = SessionChecklist.objects.create(
            plan=plan,
            title=title,
            date=date_val,
            items=items
        )
        return Response(SessionChecklistSerializer(checklist).data)


class SessionChecklistViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SessionChecklistSerializer

    def get_queryset(self):
        return SessionChecklist.objects.filter(plan__user=self.request.user)

    @action(detail=True, methods=['patch'])
    def toggle_item(self, request, pk=None):
        checklist = self.get_object()
        item_id = request.data.get('item_id')
        items = checklist.items
        for item in items:
            if str(item.get('id')) == str(item_id):
                item['completed'] = not item.get('completed', False)
                break
        checklist.items = items
        checklist.save()
        return Response(SessionChecklistSerializer(checklist).data)
