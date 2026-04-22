from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('planning', '0002_weeklyplan_drill_mode_weeklyplan_weekly_drills'),
        ('techniques', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WeeklyPlanTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Template name', max_length=200)),
                ('plan_title', models.CharField(blank=True, max_length=200)),
                ('goals', models.TextField(blank=True)),
                ('sessions_planned', models.PositiveIntegerField(default=3)),
                ('drill_mode', models.CharField(choices=[('weekly', 'Weekly'), ('daily', 'Daily')], default='weekly', max_length=10)),
                ('weekly_drills', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('focus_techniques', models.ManyToManyField(blank=True, to='techniques.technique')),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='plan_templates',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
