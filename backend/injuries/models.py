from django.db import models
from django.conf import settings

BODY_PART_CHOICES = [
    ('neck', 'Neck'),
    ('shoulder', 'Shoulder'),
    ('elbow', 'Elbow'),
    ('wrist', 'Wrist / Hand'),
    ('back', 'Back'),
    ('hip', 'Hip'),
    ('knee', 'Knee'),
    ('ankle', 'Ankle / Foot'),
    ('rib', 'Rib'),
    ('finger', 'Finger / Toe'),
    ('head', 'Head / Jaw'),
    ('other', 'Other'),
]

SEVERITY_CHOICES = [
    ('mild', 'Mild'),
    ('moderate', 'Moderate'),
    ('severe', 'Severe'),
]

STATUS_CHOICES = [
    ('active', 'Active'),
    ('recovering', 'Recovering'),
    ('resolved', 'Resolved'),
]


class InjuryLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='injury_logs'
    )
    body_part = models.CharField(max_length=50, choices=BODY_PART_CHOICES)
    custom_body_part = models.CharField(max_length=100, blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    date_occurred = models.DateField()
    date_resolved = models.DateField(null=True, blank=True)
    affected_training = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_occurred']

    def __str__(self):
        return f"{self.user.username} — {self.get_body_part_display()} ({self.status})"
