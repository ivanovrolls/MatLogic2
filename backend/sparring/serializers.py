from rest_framework import serializers
from .models import SparringRound


class SparringRoundSerializer(serializers.ModelSerializer):
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)
    partner_belt_display = serializers.CharField(source='get_partner_belt_display', read_only=True)
    session_date = serializers.DateField(source='session.date', read_only=True)

    class Meta:
        model = SparringRound
        fields = [
            'id', 'session', 'session_date', 'date', 'partner_name',
            'partner_belt', 'partner_belt_display', 'duration_minutes',
            'outcome', 'outcome_display', 'is_gi',
            'dominant_positions', 'positions_conceded',
            'submissions_attempted', 'submissions_conceded',
            'sweeps_completed', 'takedowns_completed',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
