from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CoachRelationship, CoachDrillingPlan

User = get_user_model()


class StudentSummarySerializer(serializers.ModelSerializer):
    total_sessions = serializers.SerializerMethodField()
    total_techniques = serializers.SerializerMethodField()
    last_session = serializers.SerializerMethodField()
    pending_techniques = serializers.SerializerMethodField()
    display_belt = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'belt', 'stripes', 'avatar', 'gym', 'display_belt',
            'total_sessions', 'total_techniques', 'last_session', 'pending_techniques',
        ]

    def get_total_sessions(self, obj):
        return obj.training_sessions.count()

    def get_total_techniques(self, obj):
        return obj.techniques.filter(coach_assignment_pending=False).count()

    def get_last_session(self, obj):
        session = obj.training_sessions.order_by('-date').first()
        return session.date.isoformat() if session else None

    def get_pending_techniques(self, obj):
        return obj.techniques.filter(coach_assignment_pending=True).count()


class CoachRelationshipSerializer(serializers.ModelSerializer):
    coach_username = serializers.CharField(source='coach.username', read_only=True)
    coach_avatar = serializers.SerializerMethodField()
    coach_belt = serializers.CharField(source='coach.belt', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_avatar = serializers.SerializerMethodField()
    student_belt = serializers.CharField(source='student.belt', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)

    class Meta:
        model = CoachRelationship
        fields = [
            'id', 'status', 'created_at',
            'coach_username', 'coach_avatar', 'coach_belt',
            'student_username', 'student_avatar', 'student_belt', 'student_id',
        ]

    def get_coach_avatar(self, obj):
        if obj.coach.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.coach.avatar.url)
            return obj.coach.avatar.url
        return None

    def get_student_avatar(self, obj):
        if obj.student.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.student.avatar.url)
            return obj.student.avatar.url
        return None


class CoachDrillingPlanSerializer(serializers.ModelSerializer):
    coach_username = serializers.CharField(source='coach.username', read_only=True)

    class Meta:
        model = CoachDrillingPlan
        fields = [
            'id', 'coach_username', 'week_start', 'title', 'notes',
            'drills', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'coach_username', 'created_at', 'updated_at']
