from rest_framework.routers import DefaultRouter
from .views import InjuryLogViewSet

router = DefaultRouter()
router.register(r'', InjuryLogViewSet, basename='injury')

urlpatterns = router.urls
