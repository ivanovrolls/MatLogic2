from django.contrib import admin
from .models import TrainingSession


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'session_type', 'duration', 'performance_rating']
    list_filter = ['session_type', 'performance_rating', 'date']
    search_fields = ['user__email', 'title', 'notes']
    date_hierarchy = 'date'
