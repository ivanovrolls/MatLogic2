from django.db import models
from django.conf import settings

BELT_CHOICES = [
    ('white', 'White'),
    ('blue', 'Blue'),
    ('purple', 'Purple'),
    ('brown', 'Brown'),
    ('black', 'Black'),
    ('unknown', 'Unknown'),
]

OUTCOME_CHOICES = [
    ('win', 'Win'),
    ('loss', 'Loss'),
    ('draw', 'Draw / Time'),
]

POSITION_CHOICES = [
    ('mount', 'Mount'),
    ('back', 'Back Control'),
    ('side_control', 'Side Control'),
    ('knee_on_belly', 'Knee on Belly'),
    ('closed_guard', 'Closed Guard'),
    ('half_guard', 'Half Guard'),
    ('open_guard', 'Open Guard'),
    ('turtle', 'Turtle'),
    ('standing', 'Standing'),
    ('north_south', 'North-South'),
    ('leg_entanglement', 'Leg Entanglement'),
]


class SparringRound(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sparring_rounds'
    )
    session = models.ForeignKey(
        'training.TrainingSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sparring_rounds'
    )
    date = models.DateField()
    partner_name = models.CharField(max_length=200)
    partner_belt = models.CharField(max_length=20, choices=BELT_CHOICES, default='unknown')
    duration_minutes = models.PositiveIntegerField(default=5)
    outcome = models.CharField(max_length=10, choices=OUTCOME_CHOICES)
    is_gi = models.BooleanField(default=True)

    # Positional data stored as JSON arrays of strings
    dominant_positions = models.JSONField(default=list, blank=True)
    positions_conceded = models.JSONField(default=list, blank=True)
    submissions_attempted = models.JSONField(default=list, blank=True)
    submissions_conceded = models.JSONField(default=list, blank=True)
    sweeps_completed = models.IntegerField(default=0)
    takedowns_completed = models.IntegerField(default=0)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} vs {self.partner_name} - {self.date} ({self.outcome})"
