from django.db import models
from django.conf import settings


class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following',
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']


CHALLENGE_TYPES = [
    ('sessions', 'Training Sessions'),
    ('hours', 'Mat Hours'),
    ('win_rate', 'Win Rate'),
]

CHALLENGE_STATUS = [
    ('pending', 'Pending'),
    ('active', 'Active'),
    ('completed', 'Completed'),
    ('declined', 'Declined'),
]

DURATION_CHOICES = [
    (3, '3 days'),
    (7, '1 week'),
    (14, '2 weeks'),
    (30, '1 month'),
]


class Challenge(models.Model):
    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenges_sent',
    )
    challenged = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenges_received',
    )
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_TYPES)
    duration_days = models.PositiveIntegerField(default=7)
    message = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=CHALLENGE_STATUS, default='pending')
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='challenges_won',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.challenger.username} → {self.challenged.username} ({self.challenge_type})'
