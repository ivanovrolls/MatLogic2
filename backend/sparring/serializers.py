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
    video_file_url = serializers.SerializerMethodField()
    youtube_embed_url = serializers.SerializerMethodField()

    class Meta:
        model = SparringRound
        fields = [
            'id', 'session', 'session_date', 'date', 'partner_name', 'partner_username',
            'partner_belt', 'partner_belt_display', 'duration_minutes',
            'outcome', 'outcome_display', 'is_gi',
            'dominant_positions', 'positions_conceded',
            'submissions_attempted', 'submissions_hit', 'submissions_conceded',
            'sweeps_completed', 'takedowns_completed',
            'notes', 'video_file', 'video_url', 'video_file_url', 'youtube_embed_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_video_file_url(self, obj):
        if not obj.video_file:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.video_file.url)
        return obj.video_file.url

    def get_youtube_embed_url(self, obj):
        import re
        if not obj.video_url:
            return None
        patterns = [
            r'youtu\.be/([A-Za-z0-9_-]+)',
            r'youtube\.com/watch\?v=([A-Za-z0-9_-]+)',
            r'youtube\.com/embed/([A-Za-z0-9_-]+)',
        ]
        for pattern in patterns:
            m = re.search(pattern, obj.video_url)
            if m:
                return f'https://www.youtube.com/embed/{m.group(1)}'
        return None

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
