from django.urls import path
from .views import *

urlpatterns = [
    path('api/create/', CreateJobAPI.as_view(), name='create-job'),
    path('api/list/', ListJobsAPI.as_view(), name='list-jobs'),
    path('api/update/<int:job_id>/', UpdateJobAPI.as_view(), name='update-job'),
    path('api/delete/<int:job_id>/', DeleteJobAPI.as_view(), name='delete-job'),
    path('api/apply/', ApplyJobAPI.as_view(), name='apply-job'),
    path('api/applications/<int:job_id>/', ListApplicationsAPI.as_view(), name='list-applications'),
    path('api/applications/', ListAllApplicationsAPI.as_view(), name='list-all-applications'),
    path('api/my-applications/', CandidateApplicationsAPI.as_view(), name='candidate-applications'),
    path('api/applications/<int:app_id>/compatibility/', ApplicationCompatibilityAPI.as_view(), name='application-compatibility'),
    path('api/applications/<int:app_id>/status/', UpdateApplicationStatusAPI.as_view(), name='update-application-status'),
    path('api/conversations/chat/', ChatConversationsAPI.as_view(), name='chat-conversations'),
    path('api/dashboard/', HRDashboardAPI.as_view(), name='hr-dashboard'),
]
