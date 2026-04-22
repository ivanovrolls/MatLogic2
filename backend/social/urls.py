from django.urls import path
from . import views

urlpatterns = [
    path('dojo/', views.gym_room, name='gym-room'),
    path('rivals/', views.my_rivals, name='my-rivals'),
    path('search/', views.search_users, name='social-search'),
    path('users/<str:username>/', views.public_profile, name='public-profile'),
    path('users/<str:username>/challenge/', views.send_challenge, name='send-challenge'),
    path('challenges/', views.my_challenges, name='my-challenges'),
    path('challenges/<int:challenge_id>/respond/', views.respond_challenge, name='respond-challenge'),
]
