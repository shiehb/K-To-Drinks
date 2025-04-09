from django.contrib import admin
from .models import DashboardStat, RecentActivity


@admin.register(DashboardStat)
class DashboardStatAdmin(admin.ModelAdmin):
    list_display = ('title', 'stat_type', 'period', 'current_value', 'previous_value', 'percentage_change', 'is_active')
    list_filter = ('stat_type', 'period', 'is_active')
    search_fields = ('title',)


@admin.register(RecentActivity)
class RecentActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'title', 'reference_id', 'user', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('title', 'description', 'reference_id')
    readonly_fields = ('created_at',)

