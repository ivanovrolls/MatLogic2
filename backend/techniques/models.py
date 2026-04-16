from django.db import models
from django.conf import settings

POSITION_CHOICES = [
    ('closed_guard', 'Closed Guard'),
    ('half_guard', 'Half Guard'),
    ('open_guard', 'Open Guard'),
    ('de_la_riva', 'De La Riva'),
    ('spider_guard', 'Spider Guard'),
    ('lasso_guard', 'Lasso Guard'),
    ('x_guard', 'X Guard'),
    ('butterfly', 'Butterfly Guard'),
    ('mount', 'Mount'),
    ('back', 'Back Control'),
    ('side_control', 'Side Control'),
    ('turtle', 'Turtle'),
    ('standing', 'Standing'),
    ('north_south', 'North-South'),
    ('knee_on_belly', 'Knee on Belly'),
    ('leg_entanglement', 'Leg Entanglement'),
    ('other', 'Other'),
]

TYPE_CHOICES = [
    ('submission', 'Submission'),
    ('sweep', 'Sweep'),
    ('pass', 'Pass'),
    ('takedown', 'Takedown'),
    ('escape', 'Escape'),
    ('guard_retention', 'Guard Retention'),
    ('transition', 'Transition'),
    ('control', 'Control'),
    ('setup', 'Setup / Grip'),
    ('counter', 'Counter'),
]

DIFFICULTY_CHOICES = [(i, str(i)) for i in range(1, 6)]


class Technique(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='techniques'
    )
    name = models.CharField(max_length=200)
    position = models.CharField(max_length=50, choices=POSITION_CHOICES)
    technique_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES, default=3)
    video_url = models.URLField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    times_drilled = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_position_display()})"


class TechniqueChain(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='technique_chains'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    techniques = models.ManyToManyField(
        Technique,
        through='ChainEntry',
        related_name='chains'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ChainEntry(models.Model):
    chain = models.ForeignKey(TechniqueChain, on_delete=models.CASCADE, related_name='entries')
    technique = models.ForeignKey(Technique, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ['chain', 'order']

    def __str__(self):
        return f"{self.chain.name} - Step {self.order}: {self.technique.name}"
