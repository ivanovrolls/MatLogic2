from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeeklyPlanViewSet, SessionChecklistViewSet

router = DefaultRouter()
router.register(r'checklists', SessionChecklistViewSet, basename='checklist')
router.register(r'', WeeklyPlanViewSet, basename='weekly-plan')

urlpatterns = [
    path('', include(router.urls)),
]
