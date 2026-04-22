from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Follow

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()
    display_belt = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'belt', 'stripes', 'display_belt',
            'gym', 'bio', 'avatar',
            'follower_count', 'following_count', 'is_following',
            'total_sessions', 'total_rounds', 'win_rate',
        ]

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()

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
        return round(wins / total * 100)


class FeedSessionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.DateField()
    session_type_display = serializers.CharField()
    duration = serializers.IntegerField()
    title = serializers.CharField()
    performance_rating = serializers.IntegerField(allow_null=True)
    round_count = serializers.IntegerField()
    user = serializers.SerializerMethodField()

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'belt': obj.user.belt,
            'avatar': obj.user.avatar.url if obj.user.avatar else None,
        }


class FollowUserSerializer(serializers.ModelSerializer):
    display_belt = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'username', 'belt', 'stripes', 'gym', 'avatar', 'display_belt']
        read_only_fields = ['id', 'username', 'belt', 'stripes', 'gym', 'avatar']
