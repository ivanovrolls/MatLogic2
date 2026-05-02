from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_populate_gym_ref'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserTitle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.CharField(max_length=50)),
                ('is_equipped', models.BooleanField(default=False)),
                ('unlocked_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='titles', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-unlocked_at'],
                'unique_together': {('user', 'slug')},
            },
        ),
        migrations.CreateModel(
            name='ProfileGrid',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('widgets', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile_grid', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
