from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    RegisterView, ProfileView, logout_view,
    WeightListCreateView, WeightDetailView,
    PublicProfileView, MatPostListCreateView, MatPostDetailView, UserPostsView,
    UserTitlesView, equip_title, unequip_title, ProfileGridView, PublicProfileGridView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', logout_view, name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('weight/', WeightListCreateView.as_view(), name='weight-list'),
    path('weight/<int:pk>/', WeightDetailView.as_view(), name='weight-detail'),
    path('posts/', MatPostListCreateView.as_view(), name='mat-posts'),
    path('posts/<int:pk>/', MatPostDetailView.as_view(), name='mat-post-detail'),
    path('titles/', UserTitlesView.as_view(), name='user-titles'),
    path('titles/<str:slug>/equip/', equip_title, name='equip-title'),
    path('titles/unequip/', unequip_title, name='unequip-title'),
    path('profile-grid/', ProfileGridView.as_view(), name='profile-grid'),
    path('users/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
    path('users/<str:username>/posts/', UserPostsView.as_view(), name='user-posts'),
    path('users/<str:username>/grid/', PublicProfileGridView.as_view(), name='public-profile-grid'),
]
