from django.conf import settings
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


class Gym(models.Model):
    name = models.CharField(max_length=200, unique=True)
    aliases = models.CharField(
        max_length=200,
        blank=True,
        help_text='Comma-separated abbreviations, e.g. MNBJJ',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    email = models.EmailField(unique=True)
    belt = models.CharField(max_length=20, choices=BELT_CHOICES, default='white')
    stripes = models.IntegerField(default=0)
    gym = models.CharField(max_length=200, blank=True)
    gym_ref = models.ForeignKey(
        Gym,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='members',
    )
    start_date = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True)
    is_premium = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    weight_class = models.CharField(max_length=50, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    height_cm = models.FloatField(null=True, blank=True, help_text='Height in cm')
    weight_kg = models.FloatField(null=True, blank=True, help_text='Weight in kg')
    is_public = models.BooleanField(default=True, help_text='Show in Dojo leaderboard and allow other athletes to view your profile')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    @property
    def display_belt(self):
        return f"{self.get_belt_display()} Belt ({self.stripes} stripe{'s' if self.stripes != 1 else ''})"


class WeightEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weight_entries')
    weight_kg = models.FloatField()
    date = models.DateField()
    notes = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user} — {self.weight_kg}kg on {self.date}"


class MatPost(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mat_posts')
    caption = models.TextField(max_length=500)
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} — {self.caption[:40]}"


class UserTitle(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='titles')
    slug = models.CharField(max_length=50)
    is_equipped = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'slug']
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.user} — {self.slug}"

    def save(self, *args, **kwargs):
        if self.is_equipped:
            UserTitle.objects.filter(user=self.user, is_equipped=True).exclude(pk=self.pk).update(is_equipped=False)
        super().save(*args, **kwargs)


class ProfileGrid(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile_grid')
    widgets = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} grid"
