from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Job, JobApplication
from accounts.models import AccountsUser


class TestJob(TestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='hr', password='pass', role='HR')

    def test_create_job(self):
        job = Job.objects.create(
            title='Software Engineer',
            department='Engineering',
            assigned_recruiter='John',
            required_skills=['python', 'django'],
            created_by=self.user
        )
        self.assertEqual(job.title, 'Software Engineer')
        self.assertIn('python', job.required_skills)

    def test_str_method(self):
        job = Job.objects.create(
            title='Software Engineer',
            department='Engineering',
            assigned_recruiter='John',
        )
        self.assertEqual(str(job), 'Software Engineer')


class TestJobApplication(TestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='candidate', password='pass', role='Candidate')
        self.job = Job.objects.create(
            title='Software Engineer',
            department='Engineering',
            assigned_recruiter='John',
        )

    def test_create_application(self):
        app = JobApplication.objects.create(
            job=self.job,
            candidate=self.user,
            status='applied'
        )
        self.assertEqual(app.status, 'applied')

    def test_str_method(self):
        app = JobApplication.objects.create(
            job=self.job,
            candidate=self.user,
            status='applied'
        )
        self.assertEqual(str(app), f"{self.user.username} - {self.job.title}")

    def test_unique_application(self):
        JobApplication.objects.create(
            job=self.job,
            candidate=self.user,
            status='applied'
        )
        with self.assertRaises(Exception):
            JobApplication.objects.create(
                job=self.job,
                candidate=self.user,
                status='reviewing'
            )


class TestCreateJobAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='hr', password='pass', role='HR')
        self.client.force_authenticate(user=self.user)

    def test_create_job(self):
        data = {
            'title': 'Software Engineer',
            'department': 'Engineering',
            'assigned_recruiter': 'John',
            'required_skills': '["python", "django"]'
        }
        response = self.client.post('/jobs/create/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)