from django.urls import path
from . import views

urlpatterns = [
    path('subscribe/', views.subscribe),
    path('unsubscribe/', views.unsubscribe),
    path('', views.list_notifications),
    path('unread-count/', views.unread_count),
    path('<int:pk>/read/', views.mark_read),
    path('read-all/', views.mark_all_read),
]
