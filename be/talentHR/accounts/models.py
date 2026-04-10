from django.db import models

class AccountsUser(models.Model):
    @property
    def is_authenticated(self):
        return True
    ROLE_CHOICES = [
        ('HR', 'HR'),
        ('Candidate', 'Candidate'),
    ]

    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)    
    

    def __str__(self):
        return f"{self.username} ({self.role})"
