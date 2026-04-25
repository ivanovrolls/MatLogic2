from django.db import migrations


def populate_gym_ref(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Gym = apps.get_model('accounts', 'Gym')

    for user in User.objects.exclude(gym=''):
        gym_name = (user.gym or '').strip()
        if not gym_name:
            continue
        gym_obj = Gym.objects.filter(name__iexact=gym_name).first()
        if not gym_obj:
            gym_obj = Gym.objects.create(name=gym_name)
        else:
            # Normalise the CharField to the canonical casing
            user.gym = gym_obj.name
        user.gym_ref = gym_obj
        user.save(update_fields=['gym', 'gym_ref'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_gym_gymref'),
    ]

    operations = [
        migrations.RunPython(populate_gym_ref, migrations.RunPython.noop),
    ]
