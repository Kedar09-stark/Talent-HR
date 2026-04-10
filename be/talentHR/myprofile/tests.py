from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import CandidateProfile
from accounts.models import AccountsUser


class TestCandidateProfile(TestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='Candidate')

    def test_create_profile(self):
        profile = CandidateProfile.objects.create(
            user=self.user,
            full_name='John Doe',
            email='john@example.com',
            phone='1234567890',
            location='NY',
            title='Developer',
            bio='Bio',
            years_of_experience='5',
            skills=['python'],
            experience=[],
            education=[],
        )
        self.assertEqual(profile.full_name, 'John Doe')
        self.assertEqual(profile.email, 'john@example.com')

    def test_str_method(self):
        profile = CandidateProfile.objects.create(
            user=self.user,
            full_name='John Doe',
            email='john@example.com',
            phone='1234567890',
            location='NY',
            title='Developer',
            bio='Bio',
            years_of_experience='5',
            skills=['python'],
            experience=[],
            education=[],
        )
        self.assertEqual(str(profile), 'John Doe (test)')


class TestCandidateProfileAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='Candidate')
        self.client.force_authenticate(user=self.user)

    def test_create_profile(self):
        data = {
            'fullName': 'John Doe',
            'email': 'john@example.com',
            'phone': '1234567890',
            'location': 'NY',
            'title': 'Developer',
            'bio': 'Bio',
            'yearsOfExperience': '5',
            'skills': '["python"]',
            'experience': '[]',
            'education': '[]',
        }
        response = self.client.post('/myprofile/profile/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)