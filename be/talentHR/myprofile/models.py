from django.db import models


class CandidateProfile(models.Model):
    # Link to the AccountsUser model instead of storing plain username
    user = models.ForeignKey('accounts.AccountsUser', on_delete=models.CASCADE, related_name='profiles')

    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    bio = models.TextField()
    years_of_experience = models.CharField(max_length=10)

    skills = models.JSONField(default=list)
    experience = models.JSONField(default=list)
    education = models.JSONField(default=list)

    profile_photo = models.FileField(upload_to="profile_photos/", null=True, blank=True)
    resume = models.FileField(upload_to="resumes/", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"
