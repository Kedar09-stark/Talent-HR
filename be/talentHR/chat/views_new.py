# views.py
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from rest_framework import status
from django.db.models import Q

# Use our Gemini utils for chat
from jd_analyzer import utils_ai
from chat.models import ChatMessage
from accounts.models import AccountsUser
from jobs.models import JobApplication, Job

logger = logging.getLogger(__name__)


class ChatbotAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        text = request.data.get("message", "")
        conversation_id = request.data.get('conversationId') or request.data.get('conversation_id')
        if not text:
            return Response({"reply": "Please provide a message."}, status=200)

        # Build a prompt that returns JSON with 'reply' field
        system_instruction = "You are a helpful assistant. Return ONLY valid JSON like {\"reply\": \"...\"} and no extra text."

        try:
            if not utils_ai.GEMINI_API_KEY:
                return Response({"error": "AI provider not configured (GEMINI_API_KEY)"}, status=500)

            # Try to persist the user's message if a conversation_id is provided and we can resolve user/application
            saved_user_msg = None
            try:
                if conversation_id:
                    # Determine if AI conv or application conv
                    is_ai_conv = 'ai-bot' in str(conversation_id)
                    if is_ai_conv:
                        # extract user id
                        user_id = None
                        if '-' in str(conversation_id):
                            try:
                                user_id = int(str(conversation_id).split('-')[-1])
                            except ValueError:
                                user_id = None

                        if user_id:
                            try:
                                user = AccountsUser.objects.get(pk=user_id)
                            except AccountsUser.DoesNotExist:
                                user = None

                            if user:
                                sender_user = None
                                # try to resolve sender from auth if present
                                auth_user = None
                                try:
                                    token_user_id = request.user.id
                                    if token_user_id:
                                        auth_user = AccountsUser.objects.filter(pk=int(token_user_id)).first()
                                except Exception:
                                    auth_user = None

                                if auth_user:
                                    sender_user = auth_user

                                saved_user_msg = ChatMessage.objects.create(ai_chat_user=user, sender=sender_user, text=text, is_ai=False)
                    else:
                        # application conversation
                        try:
                            app_id = int(str(conversation_id).replace('applicant-', '').replace('job-application-', ''))
                            application = JobApplication.objects.get(pk=app_id)
                            sender_user = None
                            try:
                                token_user_id = request.user.id
                                if token_user_id:
                                    sender_user = AccountsUser.objects.filter(pk=int(token_user_id)).first()
                            except Exception:
                                sender_user = None

                            saved_user_msg = ChatMessage.objects.create(application=application, sender=sender_user, text=text, is_ai=False)
                        except Exception:
                            saved_user_msg = None
            except Exception:
                logger.exception('Failed to persist user message before AI call')

            # Call Gemini synchronously (blocking) since server will handle concurrency; keep existing behavior
            response = utils_ai.call_gemini(text, system_instruction)

            if isinstance(response, dict) and 'reply' in response:
                reply_text = response.get('reply')
            elif isinstance(response, dict) and 'error' in response:
                reply_text = f"AI error: {response.get('error')}"
            else:
                reply_text = str(response)

            # Attempt to persist AI reply tied to the same conversation
            saved_ai_msg = None
            try:
                if conversation_id:
                    is_ai_conv = 'ai-bot' in str(conversation_id)
                    if is_ai_conv:
                        user_id = None
                        if '-' in str(conversation_id):
                            try:
                                user_id = int(str(conversation_id).split('-')[-1])
                            except ValueError:
                                user_id = None

                        if user_id:
                            try:
                                user = AccountsUser.objects.get(pk=user_id)
                                saved_ai_msg = ChatMessage.objects.create(ai_chat_user=user, sender=None, text=reply_text, is_ai=True)
                            except AccountsUser.DoesNotExist:
                                pass
                    else:
                        try:
                            app_id = int(str(conversation_id).replace('applicant-', '').replace('job-application-', ''))
                            application = JobApplication.objects.get(pk=app_id)
                            saved_ai_msg = ChatMessage.objects.create(application=application, sender=None, text=reply_text, is_ai=True)
                        except Exception:
                            pass
            except Exception:
                logger.exception('Failed to persist AI message')

            return Response({"reply": reply_text}, status=200)

        except Exception as e:
            logger.exception('Chatbot API error')
            return Response({"error": str(e)}, status=500)


class ChatHistoryAPI(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        conversation_id = request.query_params.get('conversation_id')
        if not conversation_id:
            return Response({"error": "conversation_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Determine if AI or application conversation
            is_ai_conv = 'ai-bot' in str(conversation_id)
            
            if is_ai_conv:
                # Extract user ID from conversation_id (format: ai-bot-<user_id>)
                try:
                    user_id = int(str(conversation_id).split('-')[-1])
                    messages = ChatMessage.objects.filter(ai_chat_user_id=user_id).order_by('created_at')
                except (ValueError, IndexError):
                    messages = []
            else:
                # Extract application ID (format: applicant-<app_id> or job-application-<app_id>)
                try:
                    app_id = int(str(conversation_id).replace('applicant-', '').replace('job-application-', ''))
                    messages = ChatMessage.objects.filter(application_id=app_id).order_by('created_at')
                except ValueError:
                    messages = []
            
            data = [
                {
                    'id': msg.id,
                    'sender': msg.sender.username if msg.sender else 'AI',
                    'text': msg.text,
                    'timestamp': msg.created_at.isoformat(),
                    'is_ai': msg.is_ai,
                }
                for msg in messages
            ]
            
            return Response({"messages": data}, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.exception('Error fetching chat history')
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HRCandidatesAPI(APIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the current HR user
            hr_user_id = None
            try:
                hr_user_id = request.user.id
                if hr_user_id:
                    hr_user_id = int(hr_user_id)
            except (ValueError, AttributeError):
                pass
            
            if not hr_user_id:
                return Response(
                    {"error": "Unable to identify HR user"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Get all jobs created by this HR
            hr_jobs = Job.objects.filter(created_by_id=hr_user_id)
            
            # Get all applications for these jobs with candidate details
            applications = JobApplication.objects.filter(
                job__in=hr_jobs
            ).select_related('candidate', 'job').order_by('candidate_id', '-updated_at')
            
            candidates_data = []
            seen_candidates = set()
            
            for app in applications:
                candidate = app.candidate
                if candidate and candidate.id not in seen_candidates:
                    seen_candidates.add(candidate.id)
                    
                    # Get latest message across all applications for this candidate
                    latest_message = ChatMessage.objects.filter(
                        application__candidate=candidate,
                        application__job__created_by_id=hr_user_id
                    ).order_by('-created_at').first()
                    
                    candidates_data.append({
                        'id': candidate.id,
                        'username': candidate.username,
                        'role': candidate.role,
                        'application_id': app.id,
                        'job_title': app.job.title,
                        'job_id': app.job.id,
                        'application_status': app.status,
                        'applied_at': app.applied_at.isoformat(),
                        'latest_message': {
                            'text': latest_message.text if latest_message else '',
                            'timestamp': latest_message.created_at.isoformat() if latest_message else None,
                            'sender': latest_message.sender.username if (latest_message and latest_message.sender) else 'AI',
                        } if latest_message else None,
                    })
            
            return Response({
                "candidates": candidates_data,
                "total": len(candidates_data)
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.exception('Error fetching HR candidates')
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
