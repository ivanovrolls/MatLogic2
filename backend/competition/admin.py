from django.contrib import admin
from .models import Competition, CompetitionMatch, GamePlan


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'date', 'result', 'is_gi']
    list_filter = ['result', 'is_gi']


@admin.register(CompetitionMatch)
class CompetitionMatchAdmin(admin.ModelAdmin):
    list_display = ['competition', 'round_number', 'opponent_name', 'result', 'method']


@admin.register(GamePlan)
class GamePlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'competition']
