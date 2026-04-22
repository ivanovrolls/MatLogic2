from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import WeeklyPlan, SessionChecklist, WeeklyPlanTemplate
from .serializers import WeeklyPlanSerializer, SessionChecklistSerializer, WeeklyPlanTemplateSerializer


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

    @action(detail=False, methods=['post'])
    def auto_generate(self, request):
        from datetime import date, timedelta
        from collections import Counter
        import re

        user = request.user
        today = date.today()
        monday = today - timedelta(days=today.weekday())

        if WeeklyPlan.objects.filter(user=user, week_start=monday).exists():
            return Response(
                {'detail': 'A plan already exists for this week.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        def norm_sub(name):
            return re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9 ]", '', name.lower())).strip()

        since = today - timedelta(days=90)
        rounds = list(user.sparring_rounds.filter(date__gte=since))

        from techniques.models import Technique
        weekly_drills = []
        goals_parts = []
        focus_technique_ids = []

        if rounds:
            all_conceded = []
            for r in rounds:
                all_conceded.extend(norm_sub(s) for s in r.submissions_conceded)

            for sub, count in Counter(all_conceded).most_common(2):
                if not sub:
                    continue
                first_word = sub.split()[0] if sub.split() else sub
                matching = user.techniques.filter(is_active=True).filter(
                    Q(name__icontains=sub) | Q(name__icontains=first_word)
                ).first()
                drill_name = matching.name if matching else f"{sub} defense"
                if matching and matching.id not in focus_technique_ids:
                    focus_technique_ids.append(matching.id)
                weekly_drills.append({
                    'technique_id': matching.id if matching else 0,
                    'technique_name': drill_name,
                    'reps': 20,
                })
                goals_parts.append(f"Shore up {sub} defense")

            all_pos_conceded = []
            for r in rounds:
                all_pos_conceded.extend(r.positions_conceded)

            if all_pos_conceded:
                top_pos, _ = Counter(all_pos_conceded).most_common(1)[0]
                pos_label = top_pos.replace('_', ' ')
                matching_escape = user.techniques.filter(
                    is_active=True, technique_type='escape', position=top_pos
                ).first() or user.techniques.filter(
                    is_active=True, position=top_pos
                ).first()
                drill_name = matching_escape.name if matching_escape else f"{pos_label} escape"
                if matching_escape and matching_escape.id not in focus_technique_ids:
                    focus_technique_ids.append(matching_escape.id)
                weekly_drills.append({
                    'technique_id': matching_escape.id if matching_escape else 0,
                    'technique_name': drill_name,
                    'sets': 3,
                    'reps': 5,
                })
                goals_parts.append(f"Improve {pos_label} escapes")

        if not weekly_drills:
            top_techniques = list(user.techniques.filter(is_active=True).order_by('-times_drilled')[:3])
            for t in top_techniques:
                weekly_drills.append({
                    'technique_id': t.id,
                    'technique_name': t.name,
                    'reps': 20,
                })
                focus_technique_ids.append(t.id)
            goals_parts.append("Continue drilling core techniques")

        if not weekly_drills:
            weekly_drills = [
                {'technique_id': 0, 'technique_name': 'Armbar defense', 'reps': 20},
                {'technique_id': 0, 'technique_name': 'Back escape', 'reps': 20},
                {'technique_id': 0, 'technique_name': 'Mount escape', 'reps': 20},
            ]
            goals_parts.append("Work on fundamental defenses")

        plan = WeeklyPlan.objects.create(
            user=user,
            week_start=monday,
            title=f"Auto Plan — Week of {monday.strftime('%b %d')}",
            goals=". ".join(goals_parts) + ".",
            sessions_planned=3,
            drill_mode='weekly',
            weekly_drills=weekly_drills,
        )

        if focus_technique_ids:
            plan.focus_techniques.set(
                Technique.objects.filter(id__in=focus_technique_ids, user=user)
            )

        return Response(
            WeeklyPlanSerializer(plan, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

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


    @action(detail=True, methods=['post'])
    def save_as_template(self, request, pk=None):
        plan = self.get_object()
        title = request.data.get('title') or f"Template: {plan.title or 'Weekly Plan'}"
        template = WeeklyPlanTemplate.objects.create(
            user=request.user,
            title=title,
            plan_title=plan.title,
            goals=plan.goals,
            sessions_planned=plan.sessions_planned,
            drill_mode=plan.drill_mode,
            weekly_drills=plan.weekly_drills,
        )
        template.focus_techniques.set(plan.focus_techniques.all())
        return Response(
            WeeklyPlanTemplateSerializer(template, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class WeeklyPlanTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WeeklyPlanTemplateSerializer

    def get_queryset(self):
        return WeeklyPlanTemplate.objects.filter(
            user=self.request.user
        ).prefetch_related('focus_techniques')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
