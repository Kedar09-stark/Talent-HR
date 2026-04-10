# accounts/urls.py
from django.urls import path
from .views import UserLoginAPI, LogoutAPI

urlpatterns = [
    path('api/login/', UserLoginAPI.as_view(), name='user-login-api'),
    path('api/logout/', LogoutAPI.as_view(), name='user-logout-api'),
]
