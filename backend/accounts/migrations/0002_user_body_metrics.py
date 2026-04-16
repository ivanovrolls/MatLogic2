from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=10),
        ),
        migrations.AddField(
            model_name='user',
            name='height_cm',
            field=models.FloatField(blank=True, help_text='Height in cm', null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='weight_kg',
            field=models.FloatField(blank=True, help_text='Weight in kg', null=True),
        ),
    ]
