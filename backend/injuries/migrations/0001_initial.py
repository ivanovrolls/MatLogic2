from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InjuryLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('body_part', models.CharField(choices=[('neck', 'Neck'), ('shoulder', 'Shoulder'), ('elbow', 'Elbow'), ('wrist', 'Wrist / Hand'), ('back', 'Back'), ('hip', 'Hip'), ('knee', 'Knee'), ('ankle', 'Ankle / Foot'), ('rib', 'Rib'), ('finger', 'Finger / Toe'), ('head', 'Head / Jaw'), ('other', 'Other')], max_length=50)),
                ('custom_body_part', models.CharField(blank=True, max_length=100)),
                ('severity', models.CharField(choices=[('mild', 'Mild'), ('moderate', 'Moderate'), ('severe', 'Severe')], max_length=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('recovering', 'Recovering'), ('resolved', 'Resolved')], default='active', max_length=20)),
                ('date_occurred', models.DateField()),
                ('date_resolved', models.DateField(blank=True, null=True)),
                ('affected_training', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='injury_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date_occurred'],
            },
        ),
    ]
