import json
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import WeightEntry, MatPost

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'belt', 'gym']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    display_belt = serializers.ReadOnlyField()
    total_sessions = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'belt', 'stripes', 'gym', 'start_date', 'bio',
            'is_premium', 'avatar', 'weight_class', 'display_belt',
            'gender', 'height_cm', 'weight_kg', 'is_public',
            'total_sessions', 'total_rounds', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'is_premium', 'date_joined']

    def get_total_sessions(self, obj):
        return obj.training_sessions.count()

    def get_total_rounds(self, obj):
        return obj.sparring_rounds.count()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'belt', 'stripes', 'avatar']


class WeightEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = ['id', 'weight_kg', 'date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class PublicProfileSerializer(serializers.ModelSerializer):
    display_belt = serializers.ReadOnlyField()
    total_sessions = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'belt', 'stripes', 'display_belt',
            'gym', 'bio', 'avatar', 'total_sessions', 'total_rounds', 'win_rate',
        ]

    def get_total_sessions(self, obj):
        return obj.training_sessions.count()

    def get_total_rounds(self, obj):
        return obj.sparring_rounds.count()

    def get_win_rate(self, obj):
        rounds = obj.sparring_rounds.all()
        total = rounds.count()
        if total == 0:
            return None
        wins = rounds.filter(outcome='win').count()
        return round(wins / total * 100, 1)


class MatPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatPost
        fields = ['id', 'caption', 'image', 'tags', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_internal_value(self, data):
        # tags may arrive as a JSON string when sent via FormData
        if isinstance(data.get('tags'), str):
            mutable = data.copy() if hasattr(data, 'copy') else dict(data)
            try:
                mutable['tags'] = json.loads(mutable['tags'])
            except (json.JSONDecodeError, ValueError):
                mutable['tags'] = []
            data = mutable
        return super().to_internal_value(data)
