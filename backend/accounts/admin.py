from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'belt', 'stripes', 'gym', 'is_premium']
    list_filter = ['belt', 'is_premium', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('BJJ Profile', {
            'fields': ('belt', 'stripes', 'gym', 'start_date', 'bio', 'is_premium', 'weight_class', 'avatar')
        }),
    )
    search_fields = ['email', 'username', 'gym']
