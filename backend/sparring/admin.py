from django.contrib import admin
from .models import SparringRound


@admin.register(SparringRound)
class SparringRoundAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'partner_name', 'partner_belt', 'outcome', 'duration_minutes']
    list_filter = ['outcome', 'is_gi', 'partner_belt']
    search_fields = ['user__email', 'partner_name']
    date_hierarchy = 'date'
