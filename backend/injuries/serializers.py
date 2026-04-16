from rest_framework import serializers
from .models import InjuryLog


class InjuryLogSerializer(serializers.ModelSerializer):
    body_part_display = serializers.CharField(source='get_body_part_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = InjuryLog
        fields = [
            'id', 'body_part', 'body_part_display', 'custom_body_part',
            'severity', 'severity_display', 'status', 'status_display',
            'date_occurred', 'date_resolved', 'affected_training',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
