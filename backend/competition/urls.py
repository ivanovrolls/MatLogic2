from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompetitionViewSet, CompetitionMatchViewSet, GamePlanViewSet

router = DefaultRouter()
router.register(r'matches', CompetitionMatchViewSet, basename='competition-match')
router.register(r'game-plans', GamePlanViewSet, basename='game-plan')
router.register(r'', CompetitionViewSet, basename='competition')

urlpatterns = [
    path('', include(router.urls)),
]
