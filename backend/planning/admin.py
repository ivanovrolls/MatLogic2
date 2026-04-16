from django.contrib import admin
from .models import WeeklyPlan, SessionChecklist


@admin.register(WeeklyPlan)
class WeeklyPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'week_start', 'title', 'sessions_planned']


@admin.register(SessionChecklist)
class SessionChecklistAdmin(admin.ModelAdmin):
    list_display = ['plan', 'title', 'date']
