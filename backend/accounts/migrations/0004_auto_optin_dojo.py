from django.db import migrations, models


def opt_in_all(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(is_public=False).update(is_public=True)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_is_public'),
    ]

    operations = [
        migrations.RunPython(opt_in_all, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='is_public',
            field=models.BooleanField(
                default=True,
                help_text='Show in Dojo leaderboard and allow other athletes to view your profile',
            ),
        ),
    ]
