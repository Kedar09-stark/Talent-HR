from django.urls import path
from .views import ChatbotAPI, ChatHistoryAPI, HRCandidatesAPI, CandidateHRsAPI, SendStatusUpdateMessageAPI

urlpatterns = [
    path('chatbot/', ChatbotAPI.as_view(), name='chatbot'),
    path('api/history/', ChatHistoryAPI.as_view(), name='chat-history'),
    path('api/hr-candidates/', HRCandidatesAPI.as_view(), name='hr-candidates'),
    path('api/candidate-hrs/', CandidateHRsAPI.as_view(), name='candidate-hrs'),
    path('api/send-status-message/', SendStatusUpdateMessageAPI.as_view(), name='send-status-message'),
]
