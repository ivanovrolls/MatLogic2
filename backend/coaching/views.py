from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import CoachRelationship, CoachDrillingPlan, CoachSessionNote, CoachSessionEdit
from .serializers import (
    CoachRelationshipSerializer, StudentSummarySerializer,
    CoachDrillingPlanSerializer, CoachSessionNoteSerializer, CoachSessionEditSerializer,
)
from notifications.models import InAppNotification

User = get_user_model()


class CoachRelationshipView(APIView):
    """Student-side: view / request / remove their coach."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rel = CoachRelationship.objects.filter(
            student=request.user
        ).exclude(status='declined').first()
        if not rel:
            return Response(None)
        return Response(CoachRelationshipSerializer(rel, context={'request': request}).data)

    def post(self, request):
        coach_username = request.data.get('coach_username', '').strip()
        try:
            coach = User.objects.get(username__iexact=coach_username)
        except User.DoesNotExist:
            return Response({'detail':'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if coach == request.user:
            return Response({'detail':'You cannot be your own coach.'}, status=status.HTTP_400_BAD_REQUEST)
        if CoachRelationship.objects.filter(student=request.user).exclude(status='declined').exists():
            return Response({'detail':'You already have a pending or active coach relationship.'}, status=status.HTTP_400_BAD_REQUEST)
        rel = CoachRelationship.objects.create(coach=coach, student=request.user)
        InAppNotification.objects.create(
            user=coach,
            type='coach',
            title=f'{request.user.username} wants you as their coach',
            message='Review their request and accept or decline from Profile Settings.',
            link='/profile',
        )
        return Response(CoachRelationshipSerializer(rel, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        CoachRelationship.objects.filter(student=request.user).exclude(status='declined').delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CoachRequestsView(APIView):
    """Coach-side: see all incoming requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rels = CoachRelationship.objects.filter(coach=request.user).order_by('-created_at')
        return Response(CoachRelationshipSerializer(rels, many=True, context={'request': request}).data)


class RespondToRequestView(APIView):
    """Coach-side: accept or decline a specific request."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            rel = CoachRelationship.objects.get(pk=pk, coach=request.user, status='pending')
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in ('accepted', 'declined'):
            return Response({'detail':'status must be "accepted" or "declined".'}, status=status.HTTP_400_BAD_REQUEST)
        rel.status = new_status
        rel.save()
        if new_status == 'accepted':
            InAppNotification.objects.create(
                user=rel.student,
                type='coach',
                title=f'{request.user.username} accepted your coach request',
                message='You now have a coach. Check your drilling plans and assigned techniques.',
                link='/profile',
            )
        else:
            InAppNotification.objects.create(
                user=rel.student,
                type='coach',
                title=f'{request.user.username} declined your coach request',
                message='You can request a different coach from Profile Settings.',
                link='/profile',
            )
        return Response(CoachRelationshipSerializer(rel, context={'request': request}).data)


class StudentsListView(APIView):
    """Coach-side: list all accepted students."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rels = CoachRelationship.objects.filter(
            coach=request.user, status='accepted'
        ).select_related('student')
        students = [rel.student for rel in rels]
        return Response(StudentSummarySerializer(students, many=True, context={'request': request}).data)


class StudentDataView(APIView):
    """Coach-side: read a specific student's non-sensitive data."""
    permission_classes = [IsAuthenticated]

    def _get_student(self, request, student_id):
        try:
            rel = CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
            return rel.student
        except CoachRelationship.DoesNotExist:
            return None

    def get(self, request, student_id):
        student = self._get_student(request, student_id)
        if not student:
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        data_type = request.query_params.get('type', 'overview')

        if data_type == 'sessions':
            from training.models import TrainingSession
            from training.serializers import TrainingSessionListSerializer
            sessions = TrainingSession.objects.filter(user=student).order_by('-date')[:30]
            return Response(TrainingSessionListSerializer(sessions, many=True).data)

        elif data_type == 'techniques':
            from techniques.models import Technique
            from techniques.serializers import TechniqueSerializer
            techs = Technique.objects.filter(user=student)
            return Response(TechniqueSerializer(techs, many=True).data)

        else:
            from training.models import TrainingSession
            from training.serializers import TrainingSessionListSerializer
            recent = TrainingSession.objects.filter(user=student).order_by('-date')[:5]
            return Response({
                'student': StudentSummarySerializer(student, context={'request': request}).data,
                'recent_sessions': TrainingSessionListSerializer(recent, many=True).data,
            })


class AssignTechniqueView(APIView):
    """Coach-side: create a pending technique in a student's arsenal."""
    permission_classes = [IsAuthenticated]

    def post(self, request, student_id):
        try:
            CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        from techniques.models import Technique
        from techniques.serializers import TechniqueSerializer

        try:
            student = User.objects.get(pk=student_id)
        except User.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        technique = Technique.objects.create(
            user=student,
            coach_assigned_by=request.user,
            coach_assignment_pending=True,
            name=request.data.get('name', ''),
            position=request.data.get('position', 'other'),
            technique_type=request.data.get('technique_type', 'submission'),
            description=request.data.get('description', ''),
            notes=request.data.get('notes', ''),
            difficulty=request.data.get('difficulty', 3),
            tags=request.data.get('tags', []),
            video_url=request.data.get('video_url', ''),
        )
        InAppNotification.objects.create(
            user=student,
            type='coach',
            title=f'Coach assigned a new technique: {technique.name}',
            message='Review and accept or decline it from your Arsenal.',
            link='/techniques',
        )
        return Response(TechniqueSerializer(technique).data, status=status.HTTP_201_CREATED)


class DrillingPlanView(APIView):
    """Student-side GET / Coach-side POST for drilling plans."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = CoachDrillingPlan.objects.filter(student=request.user).order_by('-week_start')
        return Response(CoachDrillingPlanSerializer(plans, many=True).data)

    def post(self, request):
        student_id = request.data.get('student_id')
        try:
            CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        plan = CoachDrillingPlan.objects.create(
            coach=request.user,
            student_id=student_id,
            week_start=request.data.get('week_start'),
            title=request.data.get('title', ''),
            notes=request.data.get('notes', ''),
            drills=request.data.get('drills', []),
        )
        InAppNotification.objects.create(
            user=plan.student,
            type='coach',
            title=f'New drilling plan: {plan.title or "Untitled"}',
            message=f'Your coach assigned a drilling plan for the week of {plan.week_start}.',
            link='/profile',
        )
        return Response(CoachDrillingPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class RemoveStudentView(APIView):
    """Coach-side: end an accepted relationship."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, student_id):
        try:
            rel = CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        rel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CoachStudentNotesView(APIView):
    """Coach-side: list all session notes for a student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            CoachRelationship.objects.get(coach=request.user, student_id=student_id, status='accepted')
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        notes = CoachSessionNote.objects.filter(coach=request.user, student_id=student_id)
        return Response(CoachSessionNoteSerializer(notes, many=True).data)


class CoachSessionNoteView(APIView):
    """Coach-side: create/update/delete a note on a specific session."""
    permission_classes = [IsAuthenticated]

    def _check_access(self, request, student_id):
        try:
            CoachRelationship.objects.get(coach=request.user, student_id=student_id, status='accepted')
            return True
        except CoachRelationship.DoesNotExist:
            return False

    def post(self, request, student_id, session_id):
        if not self._check_access(request, student_id):
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        from training.models import TrainingSession
        try:
            session = TrainingSession.objects.get(pk=session_id, user_id=student_id)
        except TrainingSession.DoesNotExist:
            return Response({'detail':'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        note_obj, _ = CoachSessionNote.objects.update_or_create(
            coach=request.user,
            session=session,
            defaults={'student_id': student_id, 'note': request.data.get('note', '')},
        )
        return Response(CoachSessionNoteSerializer(note_obj).data)

    def delete(self, request, student_id, session_id):
        if not self._check_access(request, student_id):
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        CoachSessionNote.objects.filter(coach=request.user, session_id=session_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentSessionNotesView(APIView):
    """Student-side: view coach notes on their own sessions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        qs = CoachSessionNote.objects.filter(student=request.user)
        if session_id:
            qs = qs.filter(session_id=session_id)
        return Response(CoachSessionNoteSerializer(qs, many=True).data)


class CoachSessionDetailView(APIView):
    """Coach-side: view full details of a specific student session."""
    permission_classes = [IsAuthenticated]

    def _get_student(self, request, student_id):
        try:
            rel = CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
            return rel.student
        except CoachRelationship.DoesNotExist:
            return None

    def get(self, request, student_id, session_id):
        student = self._get_student(request, student_id)
        if not student:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        from training.models import TrainingSession
        from training.serializers import TrainingSessionSerializer
        try:
            session_obj = TrainingSession.objects.get(pk=session_id, user=student)
        except TrainingSession.DoesNotExist:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        pending_edit = CoachSessionEdit.objects.filter(
            coach=request.user, session=session_obj, status='pending'
        ).first()
        return Response({
            'session': TrainingSessionSerializer(session_obj, context={'request': request}).data,
            'pending_edit': CoachSessionEditSerializer(pending_edit).data if pending_edit else None,
        })


class CoachSessionEditView(APIView):
    """Coach-side: create or update a session edit proposal for a student."""
    permission_classes = [IsAuthenticated]

    def post(self, request, student_id, session_id):
        try:
            CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        from training.models import TrainingSession
        try:
            student_user = User.objects.get(pk=student_id)
            session_obj = TrainingSession.objects.get(pk=session_id, user=student_user)
        except (User.DoesNotExist, TrainingSession.DoesNotExist):
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        allowed_fields = {
            'title', 'notes', 'session_type', 'duration',
            'performance_rating', 'energy_level', 'instructor', 'gym_location',
        }
        proposed_changes = {k: v for k, v in request.data.items() if k in allowed_fields}
        if not proposed_changes:
            return Response({'detail': 'No valid fields to propose.'}, status=status.HTTP_400_BAD_REQUEST)
        edit, created = CoachSessionEdit.objects.update_or_create(
            coach=request.user,
            session=session_obj,
            defaults={
                'student': student_user,
                'proposed_changes': proposed_changes,
                'status': 'pending',
            },
        )
        InAppNotification.objects.create(
            user=student_user,
            type='coach',
            title=f'{request.user.username} recommended edits to a training session',
            message='Your coach suggested changes to one of your sessions. Review them in Sessions.',
            link='/sessions',
        )
        return Response(
            CoachSessionEditSerializer(edit).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class StudentSessionEditsView(APIView):
    """Student-side: list pending coach edits on their sessions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        qs = CoachSessionEdit.objects.filter(student=request.user, status='pending')
        if session_id:
            qs = qs.filter(session_id=session_id)
        return Response(CoachSessionEditSerializer(qs, many=True).data)


class RespondToSessionEditView(APIView):
    """Student-side: accept or decline a coach session edit."""
    permission_classes = [IsAuthenticated]

    def post(self, request, edit_id):
        try:
            edit = CoachSessionEdit.objects.get(pk=edit_id, student=request.user, status='pending')
        except CoachSessionEdit.DoesNotExist:
            return Response({'detail': 'Edit not found.'}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get('action')
        if action not in ('accept', 'decline'):
            return Response({'detail': 'action must be "accept" or "decline".'}, status=status.HTTP_400_BAD_REQUEST)
        if action == 'accept':
            session_obj = edit.session
            allowed_fields = {
                'title', 'notes', 'session_type', 'duration',
                'performance_rating', 'energy_level', 'instructor', 'gym_location',
            }
            for field, value in edit.proposed_changes.items():
                if field in allowed_fields:
                    setattr(session_obj, field, value)
            session_obj.save()
            edit.status = 'accepted'
            edit.save()
            InAppNotification.objects.create(
                user=edit.coach,
                type='coach',
                title=f'{request.user.username} accepted your session edit',
                message='Your suggested changes have been applied to their session.',
                link='/coaching',
            )
        else:
            edit.status = 'declined'
            edit.save()
            InAppNotification.objects.create(
                user=edit.coach,
                type='coach',
                title=f'{request.user.username} declined your session edit',
                message='They chose to keep their original session data.',
                link='/coaching',
            )
        return Response(CoachSessionEditSerializer(edit).data)


class DrillPlanCheckInView(APIView):
    """Student-side: mark drills complete and/or leave feedback."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, plan_id):
        try:
            plan = CoachDrillingPlan.objects.get(pk=plan_id, student=request.user)
        except CoachDrillingPlan.DoesNotExist:
            return Response({'detail':'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'drill_completions' in request.data:
            plan.drill_completions = request.data['drill_completions']
        has_feedback = 'student_feedback' in request.data
        if has_feedback:
            plan.student_feedback = request.data['student_feedback']
        plan.save()
        if has_feedback and plan.student_feedback:
            InAppNotification.objects.create(
                user=plan.coach,
                type='coach',
                title=f'{request.user.username} submitted drilling feedback',
                message=f'They left feedback on "{plan.title or "Untitled"}". Check their progress.',
                link='/coaching',
            )
        return Response(CoachDrillingPlanSerializer(plan).data)


class StudentDrillingPlansView(APIView):
    """Coach-side: list drilling plans for a specific student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        plans = CoachDrillingPlan.objects.filter(student_id=student_id, coach=request.user)
        return Response(CoachDrillingPlanSerializer(plans, many=True).data)

    def post(self, request, student_id):
        try:
            CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'detail':'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        plan = CoachDrillingPlan.objects.create(
            coach=request.user,
            student_id=student_id,
            week_start=request.data.get('week_start'),
            title=request.data.get('title', ''),
            notes=request.data.get('notes', ''),
            drills=request.data.get('drills', []),
        )
        InAppNotification.objects.create(
            user=plan.student,
            type='coach',
            title=f'New drilling plan: {plan.title or "Untitled"}',
            message=f'Your coach assigned a drilling plan for the week of {plan.week_start}.',
            link='/profile',
        )
        return Response(CoachDrillingPlanSerializer(plan).data, status=status.HTTP_201_CREATED)
