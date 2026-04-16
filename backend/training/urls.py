from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrainingSessionViewSet

router = DefaultRouter()
router.register(r'', TrainingSessionViewSet, basename='training-session')

urlpatterns = [
    path('', include(router.urls)),
]
