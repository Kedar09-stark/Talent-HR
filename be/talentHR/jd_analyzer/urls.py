from django.urls import path
from .views import AnalyzeJDAPI, CompareResumeJDAPI

urlpatterns = [
    path("analyze-jd/", AnalyzeJDAPI.as_view()),
    path("compare/", CompareResumeJDAPI.as_view()),
]
