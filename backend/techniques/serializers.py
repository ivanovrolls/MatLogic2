from rest_framework import serializers
from .models import Technique, TechniqueChain, ChainEntry


class TechniqueSerializer(serializers.ModelSerializer):
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    type_display = serializers.CharField(source='get_technique_type_display', read_only=True)

    class Meta:
        model = Technique
        fields = [
            'id', 'name', 'position', 'position_display', 'technique_type',
            'type_display', 'description', 'notes', 'difficulty', 'video_url',
            'tags', 'is_active', 'times_drilled', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TechniqueMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Technique
        fields = ['id', 'name', 'position', 'technique_type']


class ChainEntrySerializer(serializers.ModelSerializer):
    technique = TechniqueMinimalSerializer(read_only=True)
    technique_id = serializers.PrimaryKeyRelatedField(
        queryset=Technique.objects.all(), source='technique', write_only=True
    )

    class Meta:
        model = ChainEntry
        fields = ['id', 'technique', 'technique_id', 'order', 'notes']


class TechniqueChainSerializer(serializers.ModelSerializer):
    entries = ChainEntrySerializer(many=True, read_only=True)
    technique_count = serializers.SerializerMethodField()

    class Meta:
        model = TechniqueChain
        fields = ['id', 'name', 'description', 'entries', 'technique_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_technique_count(self, obj):
        return obj.entries.count()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
