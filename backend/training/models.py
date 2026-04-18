from django.db import models
from django.conf import settings

SESSION_TYPE_CHOICES = [
    ('gi', 'Gi'),
    ('nogi', 'No-Gi'),
    ('open_mat', 'Open Mat'),
    ('competition', 'Competition'),
    ('drilling', 'Drilling Only'),
    ('wrestling', 'Wrestling / Takedowns'),
    ('fundamentals', 'Fundamentals Class'),
]

RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]


class TrainingSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_sessions'
    )
    date = models.DateField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='gi')
    duration = models.PositiveIntegerField(help_text='Duration in minutes')
    title = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    performance_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    energy_level = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    techniques_worked = models.ManyToManyField(
        'techniques.Technique',
        blank=True,
        related_name='training_sessions'
    )
    instructor = models.CharField(max_length=200, blank=True)
    gym_location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.get_session_type_display()})"

    @property
    def round_count(self):
        return self.sparring_rounds.count()


class SessionTemplate(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='session_templates'
    )
    title = models.CharField(max_length=200)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='gi')
    duration = models.PositiveIntegerField(default=90)
    notes = models.TextField(blank=True)
    instructor = models.CharField(max_length=200, blank=True)
    gym_location = models.CharField(max_length=200, blank=True)
    techniques = models.ManyToManyField(
        'techniques.Technique',
        blank=True,
        related_name='templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
