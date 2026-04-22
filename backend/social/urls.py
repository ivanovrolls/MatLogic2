from django.urls import path
from . import views

urlpatterns = [
    path('feed/', views.activity_feed, name='social-feed'),
    path('search/', views.search_users, name='social-search'),
    path('users/<str:username>/', views.public_profile, name='public-profile'),
    path('users/<str:username>/follow/', views.follow_user, name='follow-user'),
    path('users/<str:username>/unfollow/', views.unfollow_user, name='unfollow-user'),
    path('users/<str:username>/followers/', views.followers_list, name='followers-list'),
    path('users/<str:username>/following/', views.following_list, name='following-list'),
]
