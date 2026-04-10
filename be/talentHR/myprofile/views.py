import json
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication

from .models import CandidateProfile
from accounts.models import AccountsUser


class CandidateProfileAPI(APIView):

    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Logged-in user
            user = request.user  

            # Extract normal fields
            full_name = request.POST.get("fullName")
            email = request.POST.get("email")
            phone = request.POST.get("phone")
            location = request.POST.get("location")
            title = request.POST.get("title")
            bio = request.POST.get("bio")
            years_of_experience = request.POST.get("yearsOfExperience")

            # JSON fields
            skills = json.loads(request.POST.get("skills", "[]"))
            experience = json.loads(request.POST.get("experience", "[]"))
            education = json.loads(request.POST.get("education", "[]"))

            # Uploaded files
            profile_photo = request.FILES.get("profilePhoto")
            resume = request.FILES.get("resume")

            # Resolve AccountsUser for FK. Try several fallbacks because
            # JWTStatelessUserAuthentication may provide a lightweight user
            # object without a DB relation. Try: user.username, user.id, then
            # decode the raw token payload to find username/user_id.
            account = None
            username = getattr(user, 'username', None)
            if username:
                account = AccountsUser.objects.filter(username=username).first()

            if not account:
                # try numeric id
                uid = getattr(user, 'id', None) or getattr(user, 'user_id', None)
                if uid:
                    account = AccountsUser.objects.filter(pk=uid).first()

            if not account:
                # try to inspect the raw token in request.auth
                auth_token = request.auth
                if auth_token:
                    try:
                        from rest_framework_simplejwt.tokens import UntypedToken
                        payload = None
                        # UntypedToken accepts the token string
                        try:
                            payload = UntypedToken(auth_token)
                        except Exception:
                            # auth_token may already be a dict-like payload
                            payload = auth_token if isinstance(auth_token, dict) else None

                        if payload:
                            p = dict(payload)
                            uname = p.get('username') or p.get('user')
                            uid = p.get('user_id') or p.get('id')
                            if uname:
                                account = AccountsUser.objects.filter(username=uname).first()
                            elif uid:
                                account = AccountsUser.objects.filter(pk=uid).first()
                    except Exception:
                        account = None

            if not account:
                return JsonResponse({"status": "error", "message": "Associated account not found"}, status=400)

            # Save profile (allow multiple profiles but associate to account)
            profile = CandidateProfile.objects.create(
                user=account,
                full_name=full_name,
                email=email,
                phone=phone,
                location=location,
                title=title,
                bio=bio,
                years_of_experience=years_of_experience,
                skills=skills,
                experience=experience,
                education=education,
                profile_photo=profile_photo,
                resume=resume,
            )

            return JsonResponse({
                "status": "success",
                "message": "Profile saved",
                "profile_id": profile.id
            })

        except Exception as e:
            return JsonResponse({
                "status": "error",
                "message": str(e)
            }, status=400)



class GetCandidateProfileAPI(APIView):

    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            # Resolve the account and return the latest profile (by updated_at).
            # Use the same robust resolution as in POST above.
            account = None
            username = getattr(user, 'username', None)
            if username:
                account = AccountsUser.objects.filter(username=username).first()

            if not account:
                uid = getattr(user, 'id', None) or getattr(user, 'user_id', None)
                if uid:
                    account = AccountsUser.objects.filter(pk=uid).first()

            if not account:
                auth_token = request.auth
                if auth_token:
                    try:
                        from rest_framework_simplejwt.tokens import UntypedToken
                        payload = None
                        try:
                            payload = UntypedToken(auth_token)
                        except Exception:
                            payload = auth_token if isinstance(auth_token, dict) else None

                        if payload:
                            p = dict(payload)
                            uname = p.get('username') or p.get('user')
                            uid = p.get('user_id') or p.get('id')
                            if uname:
                                account = AccountsUser.objects.filter(username=uname).first()
                            elif uid:
                                account = AccountsUser.objects.filter(pk=uid).first()
                    except Exception:
                        account = None

            if not account:
                return JsonResponse({"status": "error", "message": "Associated account not found"}, status=400)

            # profile = CandidateProfile.objects.filter(user=account).order_by('-updated_at').first()
            # if not profile:
            #     raise CandidateProfile.DoesNotExist

            profile, created = CandidateProfile.objects.get_or_create(user=account)

            data = {
                "fullName": profile.full_name,
                "email": profile.email,
                "phone": profile.phone,
                "location": profile.location,
                "title": profile.title,
                "bio": profile.bio,
                "yearsOfExperience": profile.years_of_experience,
                "skills": profile.skills,
                "experience": profile.experience,
                "education": profile.education,
                "profilePhoto": profile.profile_photo.url if profile.profile_photo else None,
                "resume": profile.resume.url if profile.resume else None,
            }

            return JsonResponse({"status": "success", "data": data})

        except CandidateProfile.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Profile not found"}, status=404)

    def put(self, request):
        """Update existing profile - only update provided fields"""
        user = request.user

        try:
            # Resolve the account
            account = None
            username = getattr(user, 'username', None)
            if username:
                account = AccountsUser.objects.filter(username=username).first()

            if not account:
                uid = getattr(user, 'id', None) or getattr(user, 'user_id', None)
                if uid:
                    account = AccountsUser.objects.filter(pk=uid).first()

            if not account:
                auth_token = request.auth
                if auth_token:
                    try:
                        from rest_framework_simplejwt.tokens import UntypedToken
                        payload = None
                        try:
                            payload = UntypedToken(auth_token)
                        except Exception:
                            payload = auth_token if isinstance(auth_token, dict) else None

                        if payload:
                            p = dict(payload)
                            uname = p.get('username') or p.get('user')
                            uid = p.get('user_id') or p.get('id')
                            if uname:
                                account = AccountsUser.objects.filter(username=uname).first()
                            elif uid:
                                account = AccountsUser.objects.filter(pk=uid).first()
                    except Exception:
                        account = None

            if not account:
                return JsonResponse({"status": "error", "message": "Associated account not found"}, status=400)

            # Get the latest profile
            profile = CandidateProfile.objects.filter(user=account).order_by('-updated_at').first()
            if not profile:
                return JsonResponse({"status": "error", "message": "Profile not found"}, status=404)

            # Update only provided fields
            if request.POST.get("fullName"):
                profile.full_name = request.POST.get("fullName")
            if request.POST.get("email"):
                profile.email = request.POST.get("email")
            if request.POST.get("phone"):
                profile.phone = request.POST.get("phone")
            if request.POST.get("location"):
                profile.location = request.POST.get("location")
            if request.POST.get("title"):
                profile.title = request.POST.get("title")
            if request.POST.get("bio"):
                profile.bio = request.POST.get("bio")
            if request.POST.get("yearsOfExperience"):
                profile.years_of_experience = request.POST.get("yearsOfExperience")
            
            # Handle JSON fields
            if request.POST.get("skills"):
                profile.skills = json.loads(request.POST.get("skills"))
            if request.POST.get("experience"):
                profile.experience = json.loads(request.POST.get("experience"))
            if request.POST.get("education"):
                profile.education = json.loads(request.POST.get("education"))

            # Handle file uploads - only update if new file is provided
            if request.FILES.get("profilePhoto"):
                profile.profile_photo = request.FILES.get("profilePhoto")
            if request.FILES.get("resume"):
                profile.resume = request.FILES.get("resume")

            profile.save()

            return JsonResponse({
                "status": "success",
                "message": "Profile updated",
                "profile_id": profile.id
            })

        except Exception as e:
            return JsonResponse({
                "status": "error",
                "message": str(e)
            }, status=400)
