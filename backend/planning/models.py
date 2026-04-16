from django.db import models
from django.conf import settings


class WeeklyPlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_plans'
    )
    week_start = models.DateField(help_text='Monday of the training week')
    title = models.CharField(max_length=200, blank=True)
    goals = models.TextField(blank=True)
    focus_techniques = models.ManyToManyField(
        'techniques.Technique',
        blank=True,
        related_name='weekly_plans'
    )
    notes = models.TextField(blank=True)
    sessions_planned = models.PositiveIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-week_start']
        unique_together = ['user', 'week_start']

    def __str__(self):
        return f"{self.user.username} - Week of {self.week_start}"


class SessionChecklist(models.Model):
    plan = models.ForeignKey(
        WeeklyPlan,
        on_delete=models.CASCADE,
        related_name='checklists'
    )
    title = models.CharField(max_length=200)
    date = models.DateField()
    # items: [{"id": uuid, "technique_id": int|null, "text": str, "completed": bool}]
    items = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.plan} - {self.title}"
