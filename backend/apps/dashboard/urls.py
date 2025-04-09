from django.urls import path
from .views import DashboardSummaryView, SalesDataView

app_name = 'dashboard'

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='summary'),
    path('sales/', SalesDataView.as_view(), name='sales'),
]

