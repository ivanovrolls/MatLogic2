from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

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
