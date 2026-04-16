from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SparringRoundViewSet

router = DefaultRouter()
router.register(r'', SparringRoundViewSet, basename='sparring-round')

urlpatterns = [
    path('', include(router.urls)),
]
