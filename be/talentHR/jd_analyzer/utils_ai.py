import requests
import json
import os
import logging
from django.conf import settings
from pathlib import Path

# Setup debug logging
logger = logging.getLogger(__name__)

# API Keys and Config
def _get_gemini_api_keys():
    keys = []
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key:
        keys.append(key)
    for i in range(2, 6):
        key = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if key:
            keys.append(key)
    return keys

GEMINI_API_KEYS = _get_gemini_api_keys()
HF_API_KEY = settings.HF_API_KEY if hasattr(settings, 'HF_API_KEY') else os.getenv("HF_API_KEY")
HF_MODEL = settings.HF_MODEL if hasattr(settings, 'HF_MODEL') else os.getenv("HF_MODEL", "gpt2")

# Track current API key index for rotation
_gemini_key_index = 0

# Debug: Log API key status on module load
logger.debug(f"[utils_ai] Found {len(GEMINI_API_KEYS)} Gemini API keys configured")
if not GEMINI_API_KEYS:
    logger.error("[utils_ai] WARNING: No GEMINI_API_KEY configured!")


def call_gemini(prompt, system_instruction=""):
    """
    Call Google Gemini API and return a parsed JSON dictionary or error dict.
    Uses gemini-2.5-flash with forced JSON output.
    Automatically rotates through multiple API keys on quota errors (429).
    """
    global _gemini_key_index
    
    if not GEMINI_API_KEYS:
        logger.error("[call_gemini] No Gemini API keys configured")
        return {"error": "Gemini API keys not configured"}

    max_retries = len(GEMINI_API_KEYS)
    last_error = None
    
    for attempt in range(max_retries):
        api_key = GEMINI_API_KEYS[_gemini_key_index]
        logger.debug(f"[call_gemini] Attempt {attempt + 1}/{max_retries} using API key index {_gemini_key_index}")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        headers = {
            "Content-Type": "application/json",
        }

        contents = [{
            "role": "user",
            "parts": [{"text": prompt}]
        }]

        body = {
            "contents": contents,
            "systemInstruction": {
                 "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 8192, 
                "responseMimeType": "application/json",
            }
        }

        try:
            r = requests.post(url, headers=headers, json=body, timeout=60)
        except requests.exceptions.RequestException as e:
            logger.error(f"[call_gemini] RequestException on attempt {attempt + 1}: {e}")
            last_error = {"error": "Gemini request failed", "details": str(e)}
            _gemini_key_index = (_gemini_key_index + 1) % max_retries
            continue

        if r.status_code == 429:
            logger.warning(f"[call_gemini] Quota limit (429) hit on key index {_gemini_key_index}. Rotating to next key...")
            _gemini_key_index = (_gemini_key_index + 1) % max_retries
            last_error = {"error": "Quota limit", "details": "Trying next API key..."}
            continue
        
        if r.status_code != 200:
            try:
                err_json = r.json()
                err_msg = err_json.get("error", {}).get("message", r.text[:500])
            except:
                err_msg = r.text[:500]
            logger.error(f"[call_gemini] API error {r.status_code}: {err_msg}")
            last_error = {"error": "Gemini API error", "details": err_msg, "status": r.status_code}
            if r.status_code >= 500:
                _gemini_key_index = (_gemini_key_index + 1) % max_retries
            continue

        try:
            response_json = r.json()
            
            candidates = response_json.get("candidates", [])
            if candidates:
                finish_reason = candidates[0].get("finishReason")
                if finish_reason == "MAX_TOKENS":
                    logger.warning("[call_gemini] Gemini response finished due to MAX_TOKENS.")
                    return {"error": "MAX_TOKENS", "details": "The response was truncated, increase maxOutputTokens."}
                elif finish_reason != "STOP":
                    logger.warning(f"[call_gemini] Gemini response finished due to: {finish_reason}")

            text = response_json["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text) 
        
        except json.JSONDecodeError as e:
            logger.error(f"[call_gemini] JSONDecodeError: {e}. Raw text: {r.text[:500]}")
            return {"error": "Gemini response parse failed", "details": str(e), "raw": r.text[:500]}
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"[call_gemini] Unexpected response format: {e}. Raw response: {response_json}")
            return {"error": "Unexpected Gemini response format", "details": str(e), "raw": response_json}
        except Exception as e:
            logger.error(f"[call_gemini] A general error occurred during parsing: {e}")
            return {"error": "Response parsing failed", "details": str(e), "raw": r.text[:500]}
    
    logger.error(f"[call_gemini] All {max_retries} API keys exhausted")
    return last_error if last_error else {"error": "All API keys failed"}


def analyze_jd(jd_text):
    """
    Analyze a Job Description for HR.
    Returns a dictionary with analysis or an error dictionary.
    """
    logger.debug(f"[analyze_jd] Called with JD text length: {len(jd_text)}")
    
    system_instruction = """You are a helpful AI recruitment assistant. 
Analyze the provided Job Description carefully.
Return ONLY valid JSON, no other text."""

    user_prompt = f"""[Job Description]:
{jd_text}

[Task]: Analyze the Job Description and provide a JSON response with the following structure:

{{
  "required_skills": ["List of all key skills, tools, and qualifications extracted from the JD"],
  "ideal_candidate_profile": "A 2-3 sentence summary of the perfect candidate for this role.",
  "jd_gaps": ["List of any gaps or unclear parts in the JD (e.g., 'Missing salary range', 'Vague responsibilities', 'No required years of experience mentioned')"],
  "job_strengths": ["List of well-defined aspects of this JD"],
  "summary": "A brief overall assessment of this job posting."
}}
"""

    if not GEMINI_API_KEYS:
        logger.error("[analyze_jd] No Gemini API keys configured!")
        return {"error": "No AI provider configured (GEMINI_API_KEY required)"}

    logger.debug("[analyze_jd] GEMINI_API_KEY present, calling Gemini...")
    
    # --- NO MORE PARSING NEEDED ---
    # 'response' will be the parsed dictionary or an error dictionary
    response = call_gemini(user_prompt, system_instruction)
    
    if "error" in response:
        logger.error(f"[analyze_jd] Gemini returned error: {response}")
    else:
        logger.debug("[analyze_jd] Successfully received parsed JSON from Gemini")

    return response


def compare_resume_with_jd(jd_text, resume_text):
    """
    Compare Job Description and Candidate Resume.
    Returns a dictionary with analysis or an error dictionary.
    """
    logger.debug(f"[compare_resume_with_jd] Called with JD text length: {len(jd_text)}, Resume text length: {len(resume_text)}")
    
    system_instruction = """You are a helpful AI recruitment assistant.
Analyze the provided Job Description and Candidate Resume carefully.
Return ONLY valid JSON, no other text."""

    user_prompt = f"""[Job Description]:
{jd_text}

[Candidate Resume]:
{resume_text}

[Task]: Analyze the Job Description and Candidate Resume. Provide a JSON response with this structure:

{{
  "fit_score": "An integer from 0 to 100 based on match percentage",
  "skills_matched": ["List of skills the candidate has that the job requires"],
  "skills_missing": ["List of skills the job requires that the candidate is missing"],
  "candidate_strengths": ["List of candidate's strengths relevant to this role"],
  "candidate_weaknesses": ["List of candidate's gaps or concerns for this role"],
  "candidate_summary": "A 2-3 sentence summary of fit for the candidate.",
  "hr_summary": "A 1-2 sentence recommendation/assessment for HR.",
  "recommendation": "One of: RECOMMENDED, SUITABLE, NEEDS_REVIEW"
}}
"""

    if not GEMINI_API_KEYS:
        logger.error("[compare_resume_with_jd] No Gemini API keys configured!")
        return {"error": "No AI provider configured (GEMINI_API_KEY required)"}

    logger.debug("[compare_resume_with_jd] GEMINI_API_KEY present, calling Gemini...")
    
    # --- NO MORE PARSING NEEDED ---
    response = call_gemini(user_prompt, system_instruction)
    
    if "error" in response:
        logger.error(f"[compare_resume_with_jd] Gemini returned error: {response}")
    else:
        logger.debug("[compare_resume_with_jd] Successfully received parsed JSON from Gemini")
        
    return response


# Note: The complex helper functions `_parse_json_from_text` and
# `_extract_text_from_gemini_response` are no longer needed
# because `call_gemini` now uses forced JSON output and parses
# the response itself, returning a dictionary directly.