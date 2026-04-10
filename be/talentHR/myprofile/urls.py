from django.urls import path
from .views import CandidateProfileAPI, GetCandidateProfileAPI

urlpatterns = [
    path('candidate/profile/', CandidateProfileAPI.as_view()),
    path('candidate/profile/get/', GetCandidateProfileAPI.as_view()),
]
