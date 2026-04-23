from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sparring', '0002_add_submissions_hit'),
    ]

    operations = [
        migrations.AddField(
            model_name='sparringround',
            name='partner_username',
            field=models.CharField(blank=True, max_length=150),
        ),
    ]
