from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('notifications', '0002_inappnotification'),
    ]

    operations = [
        migrations.CreateModel(
            name='NativePushToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.TextField(unique=True)),
                ('platform', models.CharField(choices=[('ios', 'iOS'), ('android', 'Android')], max_length=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='native_push_tokens',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
