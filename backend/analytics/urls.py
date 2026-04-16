from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.overview, name='analytics-overview'),
    path('training-trends/', views.training_trends, name='analytics-training-trends'),
    path('sparring-stats/', views.sparring_stats, name='analytics-sparring-stats'),
    path('technique-analysis/', views.technique_analysis, name='analytics-technique-analysis'),
    path('insights/', views.insights, name='analytics-insights'),
]
