from django.db import models
from django.conf import settings


class CoachRelationship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='coached_students',
        on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='coach_relationships',
        on_delete=models.CASCADE
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['coach', 'student']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.coach.username} coaches {self.student.username} ({self.status})"


class CoachDrillingPlan(models.Model):
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_drilling_plans',
        on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='coach_drilling_plans',
        on_delete=models.CASCADE
    )
    week_start = models.DateField()
    title = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    drills = models.JSONField(default=list)  # [{name, sets, reps}]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-week_start']

    def __str__(self):
        return f"{self.coach.username} → {self.student.username}: {self.title}"
