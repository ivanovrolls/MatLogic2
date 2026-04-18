from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrainingSessionViewSet, SessionTemplateViewSet

router = DefaultRouter()
router.register(r'templates', SessionTemplateViewSet, basename='session-template')
router.register(r'', TrainingSessionViewSet, basename='training-session')

urlpatterns = [
    path('', include(router.urls)),
]
