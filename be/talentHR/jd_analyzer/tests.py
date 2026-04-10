from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
from .views import extract_text_from_resume
from accounts.models import AccountsUser


class TestExtractTextFromResume(TestCase):
    def test_extract_pdf(self):
        mock_file = MagicMock()
        mock_file.name = 'test.pdf'
        mock_file.read.return_value = b'pdf content'
        with patch('pdfminer.high_level.extract_text', return_value='extracted text'):
            result = extract_text_from_resume(mock_file)
            self.assertEqual(result, 'extracted text')

    def test_extract_txt(self):
        mock_file = MagicMock()
        mock_file.name = 'test.txt'
        mock_file.read.return_value = b'text content'
        result = extract_text_from_resume(mock_file)
        self.assertEqual(result, 'text content')

    def test_extract_docx(self):
        mock_file = MagicMock()
        mock_file.name = 'test.docx'
        mock_file.read.return_value = b'docx content'
        with patch('docx.Document') as mock_doc:
            mock_para = MagicMock()
            mock_para.text = 'docx text'
            mock_doc.return_value.paragraphs = [mock_para]
            result = extract_text_from_resume(mock_file)
            self.assertEqual(result, 'docx text')


class TestAnalyzeJDAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='HR')
        self.client.force_authenticate(user=self.user)

    @patch('jd_analyzer.views.analyze_jd')
    def test_analyze_jd_success(self, mock_analyze):
        mock_analyze.return_value = {'skills': ['python']}
        data = {'jd_text': 'Job description'}
        response = self.client.post('/jd-analyzer/analyze-jd/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'skills': ['python']})

    def test_analyze_jd_no_text(self):
        response = self.client.post('/jd-analyzer/analyze-jd/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestCompareResumeJDAPI(APITestCase):
    def setUp(self):
        self.user = AccountsUser.objects.create(username='test', password='pass', role='HR')
        self.client.force_authenticate(user=self.user)

    @patch('jd_analyzer.views.compare_resume_with_jd')
    def test_compare_success(self, mock_compare):
        mock_compare.return_value = {'match': 80}
        data = {'jd_text': 'JD', 'resume_text': 'Resume'}
        response = self.client.post('/jd-analyzer/compare/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {'match': 80})

    def test_compare_missing_jd(self):
        data = {'resume_text': 'Resume'}
        response = self.client.post('/jd-analyzer/compare/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)