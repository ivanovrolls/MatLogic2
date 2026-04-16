from rest_framework import serializers
from .models import Competition, CompetitionMatch, GamePlan
from techniques.serializers import TechniqueMinimalSerializer
from techniques.models import Technique


class CompetitionMatchSerializer(serializers.ModelSerializer):
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)

    class Meta:
        model = CompetitionMatch
        fields = [
            'id', 'competition', 'round_number', 'round_label',
            'opponent_name', 'opponent_gym', 'result', 'result_display',
            'method', 'method_display', 'duration_seconds', 'submission_type',
            'my_points', 'opponent_points', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GamePlanSerializer(serializers.ModelSerializer):
    primary_techniques = TechniqueMinimalSerializer(many=True, read_only=True)
    backup_techniques = TechniqueMinimalSerializer(many=True, read_only=True)
    primary_technique_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, source='primary_techniques',
        queryset=Technique.objects.all(), required=False
    )
    backup_technique_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, source='backup_techniques',
        queryset=Technique.objects.all(), required=False
    )

    class Meta:
        model = GamePlan
        fields = [
            'id', 'competition', 'title', 'primary_techniques', 'primary_technique_ids',
            'backup_techniques', 'backup_technique_ids', 'goals',
            'strengths_to_use', 'weaknesses_to_hide', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        primary = validated_data.pop('primary_techniques', [])
        backup = validated_data.pop('backup_techniques', [])
        validated_data['user'] = self.context['request'].user
        plan = super().create(validated_data)
        plan.primary_techniques.set(primary)
        plan.backup_techniques.set(backup)
        return plan

    def update(self, instance, validated_data):
        primary = validated_data.pop('primary_techniques', None)
        backup = validated_data.pop('backup_techniques', None)
        instance = super().update(instance, validated_data)
        if primary is not None:
            instance.primary_techniques.set(primary)
        if backup is not None:
            instance.backup_techniques.set(backup)
        return instance


class CompetitionSerializer(serializers.ModelSerializer):
    matches = CompetitionMatchSerializer(many=True, read_only=True)
    game_plans = GamePlanSerializer(many=True, read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    win_count = serializers.ReadOnlyField()
    loss_count = serializers.ReadOnlyField()

    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'date', 'location', 'organization', 'weight_class',
            'belt_division', 'is_gi', 'result', 'result_display', 'notes',
            'matches', 'game_plans', 'win_count', 'loss_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
