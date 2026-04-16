from django.db import models
from django.conf import settings

COMPETITION_RESULT_CHOICES = [
    ('gold', 'Gold Medal'),
    ('silver', 'Silver Medal'),
    ('bronze', 'Bronze Medal'),
    ('participated', 'Participated'),
    ('withdrew', 'Withdrew'),
]

MATCH_RESULT_CHOICES = [
    ('win', 'Win'),
    ('loss', 'Loss'),
]

MATCH_METHOD_CHOICES = [
    ('submission', 'Submission'),
    ('points', 'Points'),
    ('advantages', 'Advantages'),
    ('penalty', 'Penalties'),
    ('referee', "Referee's Decision"),
    ('dq', 'Disqualification'),
    ('walkover', 'Walkover / Bye'),
]


class Competition(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='competitions'
    )
    name = models.CharField(max_length=300)
    date = models.DateField()
    location = models.CharField(max_length=300, blank=True)
    organization = models.CharField(max_length=200, blank=True)
    weight_class = models.CharField(max_length=100, blank=True)
    belt_division = models.CharField(max_length=50, blank=True)
    is_gi = models.BooleanField(default=True)
    result = models.CharField(max_length=20, choices=COMPETITION_RESULT_CHOICES, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.date})"

    @property
    def win_count(self):
        return self.matches.filter(result='win').count()

    @property
    def loss_count(self):
        return self.matches.filter(result='loss').count()


class CompetitionMatch(models.Model):
    competition = models.ForeignKey(
        Competition,
        on_delete=models.CASCADE,
        related_name='matches'
    )
    round_number = models.PositiveIntegerField(default=1)
    round_label = models.CharField(max_length=100, blank=True, help_text='e.g. Semi-Final, Final')
    opponent_name = models.CharField(max_length=200, blank=True)
    opponent_gym = models.CharField(max_length=200, blank=True)
    result = models.CharField(max_length=10, choices=MATCH_RESULT_CHOICES)
    method = models.CharField(max_length=20, choices=MATCH_METHOD_CHOICES, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    submission_type = models.CharField(max_length=100, blank=True)
    my_points = models.IntegerField(default=0)
    opponent_points = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['round_number']

    def __str__(self):
        return f"{self.competition.name} - Round {self.round_number} vs {self.opponent_name}"


class GamePlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='game_plans'
    )
    competition = models.ForeignKey(
        Competition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='game_plans'
    )
    title = models.CharField(max_length=200)
    primary_techniques = models.ManyToManyField(
        'techniques.Technique',
        blank=True,
        related_name='game_plans_primary'
    )
    backup_techniques = models.ManyToManyField(
        'techniques.Technique',
        blank=True,
        related_name='game_plans_backup'
    )
    goals = models.TextField(blank=True)
    strengths_to_use = models.TextField(blank=True)
    weaknesses_to_hide = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
