from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    RegisterView, ProfileView, logout_view,
    WeightListCreateView, WeightDetailView, PublicProfileView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', logout_view, name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('weight/', WeightListCreateView.as_view(), name='weight-list'),
    path('weight/<int:pk>/', WeightDetailView.as_view(), name='weight-detail'),
    path('users/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
]
