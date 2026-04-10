from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0002_rename_assignedrecruiter_job_assigned_recruiter_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='created_by',
            field=models.ForeignKey(null=True, blank=True, on_delete=models.deletion.CASCADE, to='auth.user'),
        ),
    ]
