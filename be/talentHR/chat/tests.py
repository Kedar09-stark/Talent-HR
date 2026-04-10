from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
from .models import ChatMessage
from accounts.models import AccountsUser
from jobs.models import Job, JobApplication


class TestChatMessage(TestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='HR')
        self.candidate = AccountsUser.objects.create(username='candidate', password='pass', role='Candidate')
        self.job = Job.objects.create(title='Test Job', department='Test', assigned_recruiter='Test', created_by=self.user)
        self.app = JobApplication.objects.create(job=self.job, candidate=self.candidate)

    def test_create_message(self):
        msg = ChatMessage.objects.create(application=self.app, sender=self.user, text='Hello', is_ai=False)
        self.assertEqual(msg.text, 'Hello')
        self.assertFalse(msg.is_ai)

    def test_str_method(self):
        msg = ChatMessage.objects.create(application=self.app, sender=self.user, text='Hello', is_ai=False)
        expected = f"{self.user.username} -> App#{self.app.id}: Hello"
        self.assertEqual(str(msg), expected)

    def test_ordering(self):
        msg1 = ChatMessage.objects.create(application=self.app, sender=self.user, text='First', is_ai=False)
        msg2 = ChatMessage.objects.create(application=self.app, sender=self.user, text='Second', is_ai=False)
        messages = list(ChatMessage.objects.all())
        self.assertEqual(messages[0], msg1)
        self.assertEqual(messages[1], msg2)

    def test_ai_message_creation(self):
        msg = ChatMessage.objects.create(application=self.app, sender=None, text='AI Reply', is_ai=True)
        self.assertTrue(msg.is_ai)
        self.assertIsNone(msg.sender)

    def test_message_timestamp(self):
        msg = ChatMessage.objects.create(application=self.app, sender=self.user, text='Test', is_ai=False)
        self.assertIsNotNone(msg.created_at)
        self.assertIsNotNone(msg.updated_at)


class TestChatbotAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='HR')

    @patch('jd_analyzer.utils_ai.call_gemini')
    def test_chatbot_post_success(self, mock_call):
        mock_call.return_value = {'reply': 'Hello back'}
        data = {'message': 'Hello'}
        response = self.client.post('/chat/chatbot/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('reply', response.data)

    def test_chatbot_post_no_message(self):
        response = self.client.post('/chat/chatbot/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reply'], 'Please provide a message.')

    @patch('jd_analyzer.utils_ai.call_gemini')
    def test_chatbot_with_conversation_id(self, mock_call):
        mock_call.return_value = {'reply': 'Test response'}
        data = {'message': 'Hello', 'conversationId': 'applicant-1'}
        response = self.client.post('/chat/chatbot/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('jd_analyzer.utils_ai.call_gemini')
    def test_chatbot_handles_api_error(self, mock_call):
        mock_call.return_value = {'error': 'API Error'}
        data = {'message': 'Hello'}
        response = self.client.post('/chat/chatbot/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('error', response.data['reply'])


class TestChatHistoryAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='HR')
        self.candidate = AccountsUser.objects.create(username='candidate', password='pass', role='Candidate')
        self.job = Job.objects.create(title='Test Job', department='Test', assigned_recruiter='Test', created_by=self.user)
        self.app = JobApplication.objects.create(job=self.job, candidate=self.candidate)
        self.msg = ChatMessage.objects.create(application=self.app, sender=self.user, text='Hello', is_ai=False)

    def test_get_history_success(self):
        response = self.client.get('/chat/api/history/', {'conversation_id': f'applicant-{self.app.id}'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('messages', response.data)
        self.assertEqual(len(response.data['messages']), 1)
        self.assertEqual(response.data['messages'][0]['text'], 'Hello')

    def test_get_history_no_conversation_id(self):
        response = self.client.get('/chat/api/history/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_history_with_ai_conversation(self):
        ai_msg = ChatMessage.objects.create(ai_chat_user=self.user, sender=None, text='AI Response', is_ai=True)
        response = self.client.get('/chat/api/history/', {'conversation_id': f'ai-bot-{self.user.id}'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 1)

    def test_get_history_empty(self):
        response = self.client.get('/chat/api/history/', {'conversation_id': 'applicant-999'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 0)

    def test_get_history_multiple_messages(self):
        msg2 = ChatMessage.objects.create(application=self.app, sender=self.candidate, text='Hi there', is_ai=False)
        msg3 = ChatMessage.objects.create(application=self.app, sender=self.user, text='How are you?', is_ai=False)
        
        response = self.client.get('/chat/api/history/', {'conversation_id': f'applicant-{self.app.id}'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 3)


class TestHRCandidatesAPI(APITestCase):
    def setUp(self):
        self.hr_user = AccountsUser.objects.create(username='hr', password='pass', role='HR')
        self.candidate1 = AccountsUser.objects.create(username='candidate1', password='pass', role='Candidate')
        self.candidate2 = AccountsUser.objects.create(username='candidate2', password='pass', role='Candidate')
        
        self.job1 = Job.objects.create(
            title='Python Developer', 
            department='Engineering', 
            assigned_recruiter='John',
            created_by=self.hr_user
        )
        self.job2 = Job.objects.create(
            title='Frontend Developer', 
            department='Engineering', 
            assigned_recruiter='Jane',
            created_by=self.hr_user
        )
        
        self.app1 = JobApplication.objects.create(job=self.job1, candidate=self.candidate1, status='applied')
        self.app2 = JobApplication.objects.create(job=self.job2, candidate=self.candidate2, status='shortlisted')

    @patch('rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication.authenticate')
    def test_get_hr_candidates_success(self, mock_auth):
        from rest_framework_simplejwt.models import TokenUser
        mock_user = TokenUser(self.hr_user.id)
        mock_auth.return_value = (mock_user, None)
        
        response = self.client.get('/chat/api/hr-candidates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('candidates', response.data)
        self.assertEqual(response.data['total'], 2)

    @patch('rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication.authenticate')
    def test_get_hr_candidates_includes_latest_message(self, mock_auth):
        from rest_framework_simplejwt.models import TokenUser
        ChatMessage.objects.create(application=self.app1, sender=self.candidate1, text='Hi', is_ai=False)
        
        mock_user = TokenUser(self.hr_user.id)
        mock_auth.return_value = (mock_user, None)
        
        response = self.client.get('/chat/api/hr-candidates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        candidates = response.data['candidates']
        self.assertTrue(any(c['id'] == self.candidate1.id for c in candidates))

    @patch('rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication.authenticate')
    def test_get_hr_candidates_filters_by_hr(self, mock_auth):
        other_hr = AccountsUser.objects.create(username='other_hr', password='pass', role='HR')
        other_job = Job.objects.create(
            title='Data Analyst',
            department='Analytics',
            assigned_recruiter='Bob',
            created_by=other_hr
        )
        other_candidate = AccountsUser.objects.create(username='other_candidate', password='pass', role='Candidate')
        JobApplication.objects.create(job=other_job, candidate=other_candidate)
        
        from rest_framework_simplejwt.models import TokenUser
        mock_user = TokenUser(self.hr_user.id)
        mock_auth.return_value = (mock_user, None)
        
        response = self.client.get('/chat/api/hr-candidates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)

    @patch('rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication.authenticate')
    def test_get_hr_candidates_no_applications(self, mock_auth):
        from rest_framework_simplejwt.models import TokenUser
        new_hr = AccountsUser.objects.create(username='new_hr', password='pass', role='HR')
        new_job = Job.objects.create(
            title='QA Engineer',
            department='QA',
            assigned_recruiter='Alice',
            created_by=new_hr
        )
        
        mock_user = TokenUser(new_hr.id)
        mock_auth.return_value = (mock_user, None)
        
        response = self.client.get('/chat/api/hr-candidates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 0)

    @patch('rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication.authenticate')
    def test_get_hr_candidates_includes_candidate_details(self, mock_auth):
        from rest_framework_simplejwt.models import TokenUser
        mock_user = TokenUser(self.hr_user.id)
        mock_auth.return_value = (mock_user, None)
        
        response = self.client.get('/chat/api/hr-candidates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        candidate_data = response.data['candidates'][0]
        self.assertIn('id', candidate_data)
        self.assertIn('username', candidate_data)
        self.assertIn('role', candidate_data)
        self.assertIn('application_id', candidate_data)
        self.assertIn('job_title', candidate_data)
        self.assertIn('application_status', candidate_data)
        self.assertIn('applied_at', candidate_data)
