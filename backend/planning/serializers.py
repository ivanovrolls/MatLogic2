from rest_framework import serializers
from .models import WeeklyPlan, SessionChecklist
from techniques.serializers import TechniqueMinimalSerializer
from techniques.models import Technique


class SessionChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionChecklist
        fields = ['id', 'plan', 'title', 'date', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WeeklyPlanSerializer(serializers.ModelSerializer):
    focus_techniques = TechniqueMinimalSerializer(many=True, read_only=True)
    focus_technique_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='focus_techniques',
        queryset=Technique.objects.all(),
        required=False
    )
    checklists = SessionChecklistSerializer(many=True, read_only=True)
    week_end = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyPlan
        fields = [
            'id', 'week_start', 'week_end', 'title', 'goals',
            'focus_techniques', 'focus_technique_ids', 'notes',
            'sessions_planned', 'drill_mode', 'weekly_drills',
            'checklists', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_week_end(self, obj):
        from datetime import timedelta
        return obj.week_start + timedelta(days=6)

    def create(self, validated_data):
        techniques = validated_data.pop('focus_techniques', [])
        validated_data['user'] = self.context['request'].user
        plan = super().create(validated_data)
        plan.focus_techniques.set(techniques)
        return plan

    def update(self, instance, validated_data):
        techniques = validated_data.pop('focus_techniques', None)
        instance = super().update(instance, validated_data)
        if techniques is not None:
            instance.focus_techniques.set(techniques)
        return instance
