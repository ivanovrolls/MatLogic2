from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_matpost'),
    ]

    operations = [
        migrations.CreateModel(
            name='Gym',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True)),
                ('aliases', models.CharField(
                    blank=True,
                    help_text='Comma-separated abbreviations, e.g. MNBJJ',
                    max_length=200,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='user',
            name='gym_ref',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='members',
                to='accounts.gym',
            ),
        ),
    ]
