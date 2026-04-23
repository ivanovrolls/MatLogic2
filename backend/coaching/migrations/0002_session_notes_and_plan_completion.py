from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0001_initial'),
        ('training', '0002_sessiontemplate'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='coachdrillingplan',
            name='drill_completions',
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name='coachdrillingplan',
            name='student_feedback',
            field=models.TextField(blank=True),
        ),
        migrations.CreateModel(
            name='CoachSessionNote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('note', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('coach', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coach_session_notes', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_session_notes', to=settings.AUTH_USER_MODEL)),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coach_notes', to='training.trainingsession')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('coach', 'session')},
            },
        ),
    ]
