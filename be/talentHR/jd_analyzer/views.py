from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTStatelessUserAuthentication
import logging

from .utils_ai import analyze_jd, compare_resume_with_jd
from myprofile.models import CandidateProfile
from accounts.models import AccountsUser

logger = logging.getLogger(__name__)


def extract_text_from_resume(resume_file):
    """Extract text from a resume file (PDF, TXT, or DOC)"""
    try:
        filename = resume_file.name.lower()
        logger.debug(f"[extract_text_from_resume] Processing file: {filename}")
        
        if filename.endswith('.pdf'):
            try:
                from pdfminer.high_level import extract_text
                from io import BytesIO
                logger.debug(f"[extract_text_from_resume] Extracting PDF...")
                
                # Read the file content into a BytesIO object that pdfminer can handle
                file_content = resume_file.read()
                file_obj = BytesIO(file_content)
                text = extract_text(file_obj)
                
                logger.debug(f"[extract_text_from_resume] PDF extracted, length: {len(text)}")
                return text if text.strip() else "Unable to extract text from PDF"
            except Exception as e:
                logger.error(f"[extract_text_from_resume] PDF extraction error: {str(e)}")
                return f"Error extracting PDF: {str(e)}"
        
        elif filename.endswith('.txt'):
            logger.debug(f"[extract_text_from_resume] Extracting TXT...")
            text = resume_file.read().decode('utf-8', errors='ignore')
            logger.debug(f"[extract_text_from_resume] TXT extracted, length: {len(text)}")
            return text
        
        elif filename.endswith(('.doc', '.docx')):
            try:
                try:
                    from docx import Document
                    from io import BytesIO
                    logger.debug(f"[extract_text_from_resume] Extracting DOCX...")
                    # Convert Django File to BytesIO for Document class
                    file_content = resume_file.read()
                    doc = Document(BytesIO(file_content))
                    text = '\n'.join([para.text for para in doc.paragraphs])
                    logger.debug(f"[extract_text_from_resume] DOCX extracted, length: {len(text)}")
                    return text
                except ImportError:
                    # If python-docx not available, try basic text extraction
                    logger.warning("[extract_text_from_resume] python-docx not available, fallback to raw decode")
                    text = resume_file.read().decode('utf-8', errors='ignore')
                    return text
            except Exception as e:
                logger.error(f"[extract_text_from_resume] DOCX extraction error: {str(e)}")
                return f"Error extracting DOCX: {str(e)}"
        
        else:
            logger.debug(f"[extract_text_from_resume] Unknown format, attempting raw decode...")
            text = resume_file.read().decode('utf-8', errors='ignore')
            logger.debug(f"[extract_text_from_resume] Raw decode, length: {len(text)}")
            return text
    except Exception as e:
        logger.error(f"[extract_text_from_resume] Unexpected error: {str(e)}")
        return f"Error extracting resume: {str(e)}"


class AnalyzeJDAPI(APIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        jd_text = request.data.get("jd_text")

        if not jd_text:
            return Response({"error": "jd_text is required"}, status=400)

        result = analyze_jd(jd_text)
        return Response(result)

class CompareResumeJDAPI(APIView):
    authentication_classes = [JWTStatelessUserAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        jd_text = request.data.get("jd_text")
        resume_text = request.data.get("resume_text")
        
        logger.debug(f"[CompareResumeJDAPI] POST received. jd_text length: {len(jd_text) if jd_text else 0}, resume_text length: {len(resume_text) if resume_text else 0}")
        
        # If no resume_text provided, try to fetch from candidate profile
        if not resume_text:
            logger.debug("[CompareResumeJDAPI] No resume_text provided, attempting to fetch from profile...")
            try:
                user = request.user
                account = None
                
                # Resolve account
                username = getattr(user, 'username', None)
                if username:
                    account = AccountsUser.objects.filter(username=username).first()
                    logger.debug(f"[CompareResumeJDAPI] Looked up account by username: {username}, found: {account is not None}")
                
                if not account:
                    uid = getattr(user, 'id', None) or getattr(user, 'user_id', None)
                    if uid:
                        account = AccountsUser.objects.filter(pk=uid).first()
                        logger.debug(f"[CompareResumeJDAPI] Looked up account by UID: {uid}, found: {account is not None}")
                
                if account:
                    profile = CandidateProfile.objects.filter(user=account).order_by('-updated_at').first()
                    logger.debug(f"[CompareResumeJDAPI] Profile found: {profile is not None}, has resume: {profile.resume if profile else 'N/A'}")
                    if profile and profile.resume:
                        resume_text = extract_text_from_resume(profile.resume)
                        logger.debug(f"[CompareResumeJDAPI] Resume extracted, length: {len(resume_text)}, starts with: {resume_text[:50]}")
            except Exception as e:
                logger.error(f"[CompareResumeJDAPI] Error fetching profile/resume: {str(e)}", exc_info=True)

        if not jd_text:
            logger.error("[CompareResumeJDAPI] jd_text is required but missing")
            return Response({"error": "jd_text is required"}, status=400)
        
        if not resume_text:
            logger.error("[CompareResumeJDAPI] resume_text is required but missing after extraction attempt")
            return Response({"error": "No resume provided. Please upload a resume to your profile first."}, status=400)
        
        # Check if resume_text contains an error message
        if resume_text.startswith("Error") or resume_text.startswith("Unable"):
            logger.error(f"[CompareResumeJDAPI] Resume extraction failed: {resume_text}")
            return Response({"error": f"Resume processing failed: {resume_text}"}, status=400)

        logger.debug("[CompareResumeJDAPI] Calling compare_resume_with_jd...")
        result = compare_resume_with_jd(jd_text, resume_text)
        logger.debug(f"[CompareResumeJDAPI] Comparison result: {result}")
        return Response(result)
