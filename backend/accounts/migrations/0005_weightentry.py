from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_auto_optin_dojo'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeightEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weight_kg', models.FloatField()),
                ('date', models.DateField()),
                ('notes', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='weight_entries',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-date'],
                'unique_together': {('user', 'date')},
            },
        ),
    ]
