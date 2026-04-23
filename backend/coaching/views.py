from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import CoachRelationship, CoachDrillingPlan, CoachSessionNote
from .serializers import (
    CoachRelationshipSerializer, StudentSummarySerializer,
    CoachDrillingPlanSerializer, CoachSessionNoteSerializer,
)

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
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if coach == request.user:
            return Response({'error': 'You cannot be your own coach.'}, status=status.HTTP_400_BAD_REQUEST)
        if CoachRelationship.objects.filter(student=request.user).exclude(status='declined').exists():
            return Response({'error': 'You already have a pending or active coach relationship.'}, status=status.HTTP_400_BAD_REQUEST)
        rel = CoachRelationship.objects.create(coach=coach, student=request.user)
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
            return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in ('accepted', 'declined'):
            return Response({'error': 'status must be "accepted" or "declined".'}, status=status.HTTP_400_BAD_REQUEST)
        rel.status = new_status
        rel.save()
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
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

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
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        from techniques.models import Technique
        from techniques.serializers import TechniqueSerializer

        student = User.objects.get(pk=student_id)
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
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        plan = CoachDrillingPlan.objects.create(
            coach=request.user,
            student_id=student_id,
            week_start=request.data.get('week_start'),
            title=request.data.get('title', ''),
            notes=request.data.get('notes', ''),
            drills=request.data.get('drills', []),
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
            return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
        rel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CoachStudentNotesView(APIView):
    """Coach-side: list all session notes for a student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            CoachRelationship.objects.get(coach=request.user, student_id=student_id, status='accepted')
        except CoachRelationship.DoesNotExist:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
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
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        from training.models import TrainingSession
        try:
            session = TrainingSession.objects.get(pk=session_id, user_id=student_id)
        except TrainingSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        note_obj, _ = CoachSessionNote.objects.update_or_create(
            coach=request.user,
            session=session,
            defaults={'student_id': student_id, 'note': request.data.get('note', '')},
        )
        return Response(CoachSessionNoteSerializer(note_obj).data)

    def delete(self, request, student_id, session_id):
        if not self._check_access(request, student_id):
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
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


class DrillPlanCheckInView(APIView):
    """Student-side: mark drills complete and/or leave feedback."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, plan_id):
        try:
            plan = CoachDrillingPlan.objects.get(pk=plan_id, student=request.user)
        except CoachDrillingPlan.DoesNotExist:
            return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'drill_completions' in request.data:
            plan.drill_completions = request.data['drill_completions']
        if 'student_feedback' in request.data:
            plan.student_feedback = request.data['student_feedback']
        plan.save()
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
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        plans = CoachDrillingPlan.objects.filter(student_id=student_id, coach=request.user)
        return Response(CoachDrillingPlanSerializer(plans, many=True).data)

    def post(self, request, student_id):
        try:
            CoachRelationship.objects.get(
                coach=request.user, student_id=student_id, status='accepted'
            )
        except CoachRelationship.DoesNotExist:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        plan = CoachDrillingPlan.objects.create(
            coach=request.user,
            student_id=student_id,
            week_start=request.data.get('week_start'),
            title=request.data.get('title', ''),
            notes=request.data.get('notes', ''),
            drills=request.data.get('drills', []),
        )
        return Response(CoachDrillingPlanSerializer(plan).data, status=status.HTTP_201_CREATED)
