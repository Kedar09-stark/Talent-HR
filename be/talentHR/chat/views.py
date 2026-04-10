# views.py
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
from django.db.models import Q

# Use our Gemini utils for chat
from jd_analyzer import utils_ai
from chat.models import ChatMessage
from accounts.models import AccountsUser
from accounts.auth import CustomJWTAuthentication
from jobs.models import JobApplication, Job

logger = logging.getLogger(__name__)


class ChatbotAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        text = request.data.get("message", "")
        conversation_id = request.data.get('conversationId') or request.data.get('conversation_id')
        if not text:
            return Response({"reply": "Please provide a message."}, status=200)

        system_instruction = "You are a helpful assistant. Return ONLY valid JSON like {\"reply\": \"...\"} and no extra text."

        try:
            if not utils_ai.GEMINI_API_KEY:
                return Response({"error": "AI provider not configured (GEMINI_API_KEY)"}, status=500)

            saved_user_msg = None
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
                            except AccountsUser.DoesNotExist:
                                user = None

                            if user:
                                sender_user = None
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

            response = utils_ai.call_gemini(text, system_instruction)

            if isinstance(response, dict) and 'reply' in response:
                reply_text = response.get('reply')
            elif isinstance(response, dict) and 'error' in response:
                reply_text = f"AI error: {response.get('error')}"
            else:
                reply_text = str(response)

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
            is_ai_conv = 'ai-bot' in str(conversation_id)
            is_hr_conv = str(conversation_id).startswith('hr-')
            is_candidate_conv = str(conversation_id).startswith('candidate-')
            
            if is_ai_conv:
                try:
                    user_id = int(str(conversation_id).split('-')[-1])
                    messages = ChatMessage.objects.filter(ai_chat_user_id=user_id).order_by('created_at')
                except (ValueError, IndexError):
                    messages = []
            elif is_hr_conv:
                try:
                    hr_id = int(str(conversation_id).replace('hr-', ''))
                    messages = ChatMessage.objects.filter(
                        application__job__created_by_id=hr_id
                    ).order_by('created_at')
                except (ValueError, IndexError):
                    messages = []
            elif is_candidate_conv:
                try:
                    candidate_id = int(str(conversation_id).replace('candidate-', ''))
                    messages = ChatMessage.objects.filter(
                        application__candidate_id=candidate_id
                    ).order_by('created_at')
                except (ValueError, IndexError):
                    messages = []
            else:
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
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Only allow HR users
            if getattr(request.user, "role", None) != "HR":
                return Response(
                    {"detail": "You do not have permission to perform this action."},
                    status=status.HTTP_403_FORBIDDEN
                )
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
            hr_jobs = Job.objects.filter(created_by_id=hr_user_id)
            applications = JobApplication.objects.filter(
                job__in=hr_jobs
            ).select_related('candidate', 'job').order_by('candidate_id', '-updated_at')
            
            candidates_dict = {}
            
            for app in applications:
                candidate = app.candidate
                if candidate:
                    candidate_id = candidate.id
                    if candidate_id not in candidates_dict:
                        latest_message = ChatMessage.objects.filter(
                            application__candidate=candidate,
                            application__job__created_by_id=hr_user_id
                        ).order_by('-created_at').first()
                        
                        candidates_dict[candidate_id] = {
                            'id': candidate.id,
                            'username': candidate.username,
                            'role': candidate.role,
                            'candidate_id': candidate.id,
                            'latest_message': {
                                'text': latest_message.text if latest_message else '',
                                'timestamp': latest_message.created_at.isoformat() if latest_message else None,
                                'sender': latest_message.sender.username if (latest_message and latest_message.sender) else 'AI',
                            } if latest_message else None,
                        }
            
            candidates_data = list(candidates_dict.values())
            
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


class CandidateHRsAPI(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Only allow Candidate users
            if getattr(request.user, "role", None) != "Candidate":
                return Response(
                    {"detail": "You do not have permission to perform this action."},
                    status=status.HTTP_403_FORBIDDEN
                )
            candidate_user_id = None
            try:
                candidate_user_id = request.user.id
                if candidate_user_id:
                    candidate_user_id = int(candidate_user_id)
            except (ValueError, AttributeError):
                pass

            if not candidate_user_id:
                return Response(
                    {"error": "Unable to identify candidate"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            candidate_applications = JobApplication.objects.filter(
                candidate_id=candidate_user_id
            ).select_related('job', 'job__created_by').order_by('job__created_by_id', '-updated_at')

            hrs_dict = {}

            for app in candidate_applications:
                hr_user = app.job.created_by
                if hr_user:
                    hr_id = hr_user.id
                    if hr_id not in hrs_dict:
                        latest_message = ChatMessage.objects.filter(
                            application__candidate_id=candidate_user_id,
                            application__job__created_by=hr_user
                        ).order_by('-created_at').first()

                        hrs_dict[hr_id] = {
                            'id': hr_user.id,
                            'username': hr_user.username,
                            'role': hr_user.role,
                            'hr_id': hr_user.id,
                            'job_title': app.job.title,
                            'latest_message': {
                                'text': latest_message.text if latest_message else '',
                                'timestamp': latest_message.created_at.isoformat() if latest_message else None,
                                'sender': latest_message.sender.username if (latest_message and latest_message.sender) else 'AI',
                            } if latest_message else None,
                        }
            
            hrs_data = list(hrs_dict.values())

            return Response({
                "hrs": hrs_data,
                "total": len(hrs_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('Error fetching candidate HRs')
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendStatusUpdateMessageAPI(APIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        HR sends a message to candidate when application status is updated.
        Expected payload:
        {
            "application_id": <int>,
            "message": "<message_text>"
        }
        """
        application_id = request.data.get('application_id')
        message_text = request.data.get('message')

        if not application_id or not message_text:
            return Response(
                {'error': 'application_id and message are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            application = JobApplication.objects.get(pk=application_id)
        except JobApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        hr_user = None
        try:
            token_user_id = request.user.id
            if token_user_id:
                try:
                    hr_user = AccountsUser.objects.get(pk=int(token_user_id))
                except (ValueError, AccountsUser.DoesNotExist):
                    hr_user = None
        except Exception:
            hr_user = None

        if not hr_user:
            username = getattr(request.user, 'username', None)
            if username:
                try:
                    hr_user = AccountsUser.objects.get(username=username)
                except AccountsUser.DoesNotExist:
                    hr_user = None

        if not hr_user:
            return Response(
                {'error': 'HR user not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        chat_message = ChatMessage.objects.create(
            application=application,
            sender=hr_user,
            text=message_text,
            is_ai=False
        )

        logger.info(f'[STATUS_UPDATE] ✓ Message created in DB: id={chat_message.id}, app={application_id}, sender={hr_user.username}')

        try:
            from chat.socketio_server import sio
            import asyncio
            
            room = f'hr-{hr_user.id}'
            payload = {
                'conversationId': room,
                'sender': hr_user.username,
                'text': message_text,
                'is_ai': False,
            }
            
            async def broadcast_message():
                try:
                    await sio.emit('message', payload, room=room)
                    logger.info(f'[STATUS_UPDATE] ✓ Socket event emitted to room {room}')
                except Exception as e:
                    logger.error(f'[STATUS_UPDATE] Emit failed: {e}', exc_info=True)
            
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(broadcast_message())
                else:
                    loop.run_until_complete(broadcast_message())
            except RuntimeError:
                asyncio.run(broadcast_message())
        except Exception as e:
            logger.warning(f'[STATUS_UPDATE] Failed to emit socket event: {e}', exc_info=True)

        return Response({
            'id': chat_message.id,
            'message': chat_message.text,
            'created_at': chat_message.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)
