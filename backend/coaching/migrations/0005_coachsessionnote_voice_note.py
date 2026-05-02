from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coaching', '0004_coachroundfeedback'),
    ]

    operations = [
        migrations.AddField(
            model_name='coachsessionnote',
            name='voice_note',
            field=models.FileField(blank=True, null=True, upload_to='session_voice_notes/'),
        ),
        migrations.AlterField(
            model_name='coachsessionnote',
            name='note',
            field=models.TextField(blank=True),
        ),
    ]
