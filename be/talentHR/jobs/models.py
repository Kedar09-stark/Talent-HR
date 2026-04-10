# jobs/models.py
from django.db import models
# Prefer referencing the AccountsUser (custom model) directly so created_by
# maps to the accounts app. Use a string reference to avoid import cycles.
from django.conf import settings

class Job(models.Model):
    title = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=50, blank=True)
    salary = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    assigned_recruiter = models.CharField(max_length=255)
    jd_file = models.FileField(upload_to="job_descriptions/", null=True, blank=True)
    # List of required skills for the job
    required_skills = models.JSONField(default=list, blank=True)
    # created_by should be optional because authentication is stateless and
    # tokens may come from a non-Django user model (we use TokenUser when stateless).
    created_by = models.ForeignKey('accounts.AccountsUser', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('reviewing', 'Reviewing'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey('accounts.AccountsUser', on_delete=models.CASCADE, related_name='job_applications')
    cover_letter = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['job', 'candidate']

    def __str__(self):
        return f"{self.candidate.username} - {self.job.title}"
