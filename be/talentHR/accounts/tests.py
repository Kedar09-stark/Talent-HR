from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AccountsUser


class TestAccountsUser(TestCase):
    def test_create_user(self):
        user = AccountsUser.objects.create(username='testuser', password='pass', role='HR')
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.role, 'HR')

    def test_str_method(self):
        user = AccountsUser.objects.create(username='testuser', password='pass', role='HR')
        self.assertEqual(str(user), 'testuser (HR)')

    def test_unique_username(self):
        AccountsUser.objects.create(username='testuser', password='pass', role='HR')
        with self.assertRaises(Exception):
            AccountsUser.objects.create(username='testuser', password='pass2', role='Candidate')

    def test_role_choices(self):
        user = AccountsUser.objects.create(username='testuser', password='pass', role='Candidate')
        self.assertEqual(user.role, 'Candidate')


class TestLogoutAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='testuser', password='pass', role='HR')

    def test_logout_valid_token(self):
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post('/accounts/logout/', {'refresh': str(refresh)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)

    def test_logout_no_token(self):
        response = self.client.post('/accounts/logout/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_logout_invalid_token(self):
        response = self.client.post('/accounts/logout/', {'refresh': 'invalid'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class TestUserLoginAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='testuser', password='pass', role='HR')

    def test_login_success(self):
        data = {'username': 'testuser', 'password': 'pass', 'role': 'HR'}
        response = self.client.post('/accounts/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')

    def test_login_missing_fields(self):
        data = {'username': 'testuser'}
        response = self.client.post('/accounts/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_invalid_credentials(self):
        data = {'username': 'testuser', 'password': 'wrong', 'role': 'HR'}
        response = self.client.post('/accounts/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_wrong_role(self):
        data = {'username': 'testuser', 'password': 'pass', 'role': 'Candidate'}
        response = self.client.post('/accounts/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
