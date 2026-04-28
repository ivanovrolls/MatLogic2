from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TechniqueViewSet, TechniqueChainViewSet, SequenceViewSet

router = DefaultRouter()
router.register(r'chains', TechniqueChainViewSet, basename='technique-chain')
router.register(r'sequences', SequenceViewSet, basename='sequence')
router.register(r'', TechniqueViewSet, basename='technique')

urlpatterns = [
    path('', include(router.urls)),
]
