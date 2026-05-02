from rest_framework import serializers
from .models import TrainingSession, SessionTemplate
from techniques.serializers import TechniqueMinimalSerializer
from techniques.models import Technique


class TrainingSessionSerializer(serializers.ModelSerializer):
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    techniques_worked = TechniqueMinimalSerializer(many=True, read_only=True)
    techniques_worked_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='techniques_worked',
        queryset=__import__('techniques.models', fromlist=['Technique']).Technique.objects.all(),
        required=False
    )
    round_count = serializers.ReadOnlyField()
    youtube_embed_url = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSession
        fields = [
            'id', 'date', 'session_type', 'session_type_display', 'duration',
            'title', 'notes', 'performance_rating', 'energy_level',
            'techniques_worked', 'techniques_worked_ids', 'instructor',
            'gym_location', 'round_count', 'video_url',
            'youtube_embed_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'youtube_embed_url', 'created_at', 'updated_at']

    def get_youtube_embed_url(self, obj):
        import re
        if not obj.video_url:
            return None
        youtube_patterns = [
            r'youtu\.be/([A-Za-z0-9_-]+)',
            r'youtube\.com/watch\?v=([A-Za-z0-9_-]+)',
            r'youtube\.com/embed/([A-Za-z0-9_-]+)',
        ]
        for pattern in youtube_patterns:
            m = re.search(pattern, obj.video_url)
            if m:
                return f'https://www.youtube.com/embed/{m.group(1)}'
        # Instagram reels and posts
        ig_reel = re.search(r'instagram\.com/reel/([A-Za-z0-9_-]+)', obj.video_url)
        if ig_reel:
            return f'https://www.instagram.com/reel/{ig_reel.group(1)}/embed/'
        ig_post = re.search(r'instagram\.com/p/([A-Za-z0-9_-]+)', obj.video_url)
        if ig_post:
            return f'https://www.instagram.com/p/{ig_post.group(1)}/embed/'
        return None

    def create(self, validated_data):
        techniques = validated_data.pop('techniques_worked', [])
        validated_data['user'] = self.context['request'].user
        session = super().create(validated_data)
        session.techniques_worked.set(techniques)
        return session

    def update(self, instance, validated_data):
        techniques = validated_data.pop('techniques_worked', None)
        instance = super().update(instance, validated_data)
        if techniques is not None:
            instance.techniques_worked.set(techniques)
        return instance


class TrainingSessionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    round_count = serializers.ReadOnlyField()
    technique_count = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSession
        fields = [
            'id', 'date', 'session_type', 'session_type_display',
            'duration', 'title', 'performance_rating', 'energy_level',
            'round_count', 'technique_count', 'created_at'
        ]

    def get_technique_count(self, obj):
        return obj.techniques_worked.count()


class SessionTemplateSerializer(serializers.ModelSerializer):
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    techniques = TechniqueMinimalSerializer(many=True, read_only=True)
    technique_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='techniques',
        queryset=Technique.objects.all(),
        required=False
    )

    class Meta:
        model = SessionTemplate
        fields = [
            'id', 'title', 'session_type', 'session_type_display', 'duration',
            'notes', 'instructor', 'gym_location', 'techniques', 'technique_ids',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        techniques = validated_data.pop('techniques', [])
        validated_data['user'] = self.context['request'].user
        template = super().create(validated_data)
        template.techniques.set(techniques)
        return template

    def update(self, instance, validated_data):
        techniques = validated_data.pop('techniques', None)
        instance = super().update(instance, validated_data)
        if techniques is not None:
            instance.techniques.set(techniques)
        return instance
