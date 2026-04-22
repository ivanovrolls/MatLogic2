from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('social', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Challenge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('challenge_type', models.CharField(
                    choices=[('sessions', 'Training Sessions'), ('hours', 'Mat Hours'), ('win_rate', 'Win Rate')],
                    max_length=20,
                )),
                ('duration_days', models.PositiveIntegerField(default=7)),
                ('message', models.CharField(blank=True, max_length=200)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('active', 'Active'), ('completed', 'Completed'), ('declined', 'Declined')],
                    default='pending',
                    max_length=20,
                )),
                ('starts_at', models.DateTimeField(blank=True, null=True)),
                ('ends_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('challenged', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='challenges_received',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('challenger', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='challenges_sent',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('winner', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='challenges_won',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
