from django.contrib import admin
from .models import Technique, TechniqueChain, ChainEntry


@admin.register(Technique)
class TechniqueAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'position', 'technique_type', 'difficulty', 'times_drilled']
    list_filter = ['position', 'technique_type', 'difficulty']
    search_fields = ['name', 'user__email']


@admin.register(TechniqueChain)
class TechniqueChainAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
