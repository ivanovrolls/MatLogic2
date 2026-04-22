from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    total_sessions = serializers.SerializerMethodField()
    total_rounds = serializers.SerializerMethodField()
    win_rate = serializers.SerializerMethodField()
    display_belt = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'belt', 'stripes', 'display_belt',
            'gym', 'bio', 'avatar',
            'total_sessions', 'total_rounds', 'win_rate',
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
        return round(wins / total * 100)
