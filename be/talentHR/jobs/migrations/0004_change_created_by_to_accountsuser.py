from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_make_created_by_nullable'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='created_by',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.accountsuser'),
        ),
    ]
