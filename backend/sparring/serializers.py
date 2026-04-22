from rest_framework import serializers
from .models import SparringRound, POSITION_CHOICES

VALID_POSITIONS = {p[0] for p in POSITION_CHOICES}


def _validate_string_list(value, field_name):
    if not isinstance(value, list):
        raise serializers.ValidationError(f'{field_name} must be a list.')
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise serializers.ValidationError(
                f'Each item in {field_name} must be a non-empty string.'
            )
    return value


def _validate_position_list(value, field_name):
    _validate_string_list(value, field_name)
    for item in value:
        if item not in VALID_POSITIONS:
            raise serializers.ValidationError(
                f'"{item}" is not a valid position in {field_name}.'
            )
    return value


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
            'submissions_attempted', 'submissions_hit', 'submissions_conceded',
            'sweeps_completed', 'takedowns_completed',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_dominant_positions(self, value):
        return _validate_position_list(value, 'dominant_positions')

    def validate_positions_conceded(self, value):
        return _validate_position_list(value, 'positions_conceded')

    def validate_submissions_attempted(self, value):
        return _validate_string_list(value, 'submissions_attempted')

    def validate_submissions_hit(self, value):
        return _validate_string_list(value, 'submissions_hit')

    def validate_submissions_conceded(self, value):
        return _validate_string_list(value, 'submissions_conceded')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
