from django.contrib.auth.models import AbstractUser
from django.db import models

BELT_CHOICES = [
    ('white', 'White'),
    ('blue', 'Blue'),
    ('purple', 'Purple'),
    ('brown', 'Brown'),
    ('black', 'Black'),
]

GENDER_CHOICES = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
]


class User(AbstractUser):
    email = models.EmailField(unique=True)
    belt = models.CharField(max_length=20, choices=BELT_CHOICES, default='white')
    stripes = models.IntegerField(default=0)
    gym = models.CharField(max_length=200, blank=True)
    start_date = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True)
    is_premium = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    weight_class = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    height_cm = models.FloatField(null=True, blank=True, help_text='Height in cm')
    weight_kg = models.FloatField(null=True, blank=True, help_text='Weight in kg')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    @property
    def display_belt(self):
        return f"{self.get_belt_display()} Belt ({self.stripes} stripe{'s' if self.stripes != 1 else ''})"
