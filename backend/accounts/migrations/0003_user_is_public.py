from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_body_metrics'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_public',
            field=models.BooleanField(
                default=False,
                help_text='Allow others to view your profile',
            ),
        ),
    ]
