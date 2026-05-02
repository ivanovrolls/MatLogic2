import json
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import WeightEntry, MatPost, Gym, UserTitle, ProfileGrid
from .titles import TITLE_MAP

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
        gym_name = validated_data.get('gym', '').strip()
        user = User.objects.create_user(**validated_data)
        if gym_name:
            gym_obj = (
                Gym.objects.filter(name__iexact=gym_name).first()
                or Gym.objects.create(name=gym_name)
            )
            user.gym_ref = gym_obj
            user.gym = gym_obj.name
            user.save(update_fields=['gym_ref', 'gym'])
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    display_belt = serializers.ReadOnlyField()
    total_sessions = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()
    gym = serializers.SerializerMethodField()
    gym_ref_id = serializers.SerializerMethodField()
    gym_ref = serializers.PrimaryKeyRelatedField(
        queryset=Gym.objects.all(),
        allow_null=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'belt', 'stripes', 'gym', 'gym_ref_id', 'gym_ref', 'start_date', 'bio',
            'is_premium', 'avatar', 'weight_class', 'display_belt',
            'gender', 'height_cm', 'weight_kg', 'is_public',
            'total_sessions', 'total_rounds', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'is_premium', 'date_joined']

    def get_gym(self, obj):
        return obj.gym

    def get_gym_ref_id(self, obj):
        return obj.gym_ref_id

    def get_total_sessions(self, obj):
        return obj.training_sessions.count()

    def get_total_rounds(self, obj):
        return obj.sparring_rounds.count()

    def update(self, instance, validated_data):
        if 'gym_ref' in validated_data:
            gym_obj = validated_data.pop('gym_ref')
            instance.gym_ref = gym_obj
            instance.gym = gym_obj.name if gym_obj else ''
        return super().update(instance, validated_data)


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'belt', 'stripes', 'avatar']


class WeightEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = ['id', 'weight_kg', 'date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserTitleSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = UserTitle
        fields = ['id', 'slug', 'name', 'description', 'is_equipped', 'unlocked_at']

    def get_name(self, obj):
        return TITLE_MAP.get(obj.slug, {}).get('name', obj.slug)

    def get_description(self, obj):
        return TITLE_MAP.get(obj.slug, {}).get('description', '')


class ProfileGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileGrid
        fields = ['widgets', 'updated_at']


class PublicProfileSerializer(serializers.ModelSerializer):
    display_belt = serializers.ReadOnlyField()
    total_sessions = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()
    equipped_title = serializers.SerializerMethodField()
    grid_widgets = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'belt', 'stripes', 'display_belt',
            'gym', 'bio', 'avatar', 'total_sessions', 'total_rounds', 'win_rate',
            'equipped_title', 'grid_widgets',
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

    def get_equipped_title(self, obj):
        title = obj.titles.filter(is_equipped=True).first()
        if not title:
            return None
        td = TITLE_MAP.get(title.slug, {})
        return {'slug': title.slug, 'name': td.get('name', title.slug)}

    def get_grid_widgets(self, obj):
        try:
            return obj.profile_grid.widgets
        except ProfileGrid.DoesNotExist:
            return []


class MatPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatPost
        fields = ['id', 'caption', 'image', 'tags', 'created_at']
        read_only_fields = ['id', 'created_at']
