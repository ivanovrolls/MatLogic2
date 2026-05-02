from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenRefreshView


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('health/', health, name='health'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/sessions/', include('training.urls')),
    path('api/techniques/', include('techniques.urls')),
    path('api/planning/', include('planning.urls')),
    path('api/sparring/', include('sparring.urls')),
    path('api/competition/', include('competition.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/injuries/', include('injuries.urls')),
    path('api/social/', include('social.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/coaching/', include('coaching.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
