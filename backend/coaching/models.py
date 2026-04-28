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
    drill_completions = models.JSONField(default=dict)  # {"0": true, "1": false}
    student_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-week_start']

    def __str__(self):
        return f"{self.coach.username} → {self.student.username}: {self.title}"


class CoachSessionNote(models.Model):
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='coach_session_notes',
        on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='received_session_notes',
        on_delete=models.CASCADE
    )
    session = models.ForeignKey(
        'training.TrainingSession',
        related_name='coach_notes',
        on_delete=models.CASCADE
    )
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['coach', 'session']
        ordering = ['-created_at']


class CoachSessionEdit(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='session_edits_made',
        on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='session_edits_received',
        on_delete=models.CASCADE
    )
    session = models.ForeignKey(
        'training.TrainingSession',
        related_name='coach_edits',
        on_delete=models.CASCADE
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    proposed_changes = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['coach', 'session']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.coach.username} → {self.student.username}: edit on session {self.session_id}"


class CoachRoundFeedback(models.Model):
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='round_feedback_given',
        on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='round_feedback_received',
        on_delete=models.CASCADE
    )
    round = models.ForeignKey(
        'sparring.SparringRound',
        related_name='coach_feedback',
        on_delete=models.CASCADE
    )
    text_feedback = models.TextField(blank=True)
    voice_note = models.FileField(upload_to='voice_notes/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['coach', 'round']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.coach.username} feedback on round {self.round_id}"
