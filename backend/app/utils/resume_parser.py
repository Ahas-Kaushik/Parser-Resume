"""
AI-Powered Resume Parser - ENHANCED VERSION
Evaluates resumes against job requirements using ML
"""

import os
import re
from typing import Dict, List, Tuple, Any
from pypdf import PdfReader
from docx import Document
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime


# ========================================
# SKILL LEXICON (Expandable)
# ========================================

SKILL_SYNONYMS: Dict[str, List[str]] = {
    "python": ["py", "python3", "python2"],
    "java": ["java8", "java11", "java17", "java 8", "java 11"],
    "javascript": ["js", "node", "nodejs", "node.js", "ecmascript"],
    "typescript": ["ts"],
    "sql": ["postgresql", "postgres", "mysql", "sqlite", "mariadb", "tsql", "t-sql", "oracle", "sql server"],
    "nosql": ["mongodb", "mongo", "dynamodb", "cassandra", "couchdb"],
    "react": ["reactjs", "react.js"],
    "angular": ["angularjs", "angular.js"],
    "vue": ["vuejs", "vue.js"],
    "django": [],
    "flask": [],
    "fastapi": ["fast api"],
    "springboot": ["spring boot", "spring"],
    "dotnet": [".net", "asp.net", "c#", "csharp"],
    "aws": ["amazon web services", "ec2", "s3", "lambda"],
    "azure": ["microsoft azure"],
    "gcp": ["google cloud", "google cloud platform"],
    "docker": ["containerization"],
    "kubernetes": ["k8s"],
    "linux": ["unix", "ubuntu", "centos", "redhat"],
    "git": ["github", "gitlab", "bitbucket", "version control"],
    "rest": ["restful", "rest api", "restful api"],
    "graphql": ["graph ql"],
    "microservices": ["micro services"],
    "kafka": ["apache kafka"],
    "redis": [],
    "elasticsearch": ["elastic search"],
    "pandas": [],
    "numpy": [],
    "nlp": ["natural language processing", "nlg", "nlu"],
    "computer vision": ["cv", "image processing"],
    "scikit-learn": ["sklearn", "scikit learn"],
    "tensorflow": ["tensor flow"],
    "pytorch": ["torch"],
    "keras": [],
    "machine learning": ["ml", "artificial intelligence", "ai"],
    "deep learning": ["neural networks", "dl"],
    "data analysis": ["data analytics"],
    "ci/cd": ["cicd", "continuous integration", "continuous delivery"],
    "terraform": [],
    "ansible": [],
    "jenkins": [],
}


def normalize_text(text: str) -> str:
    """Normalize text: lowercase and remove extra spaces"""
    return " ".join(text.lower().split())


def _normalize_phrase(phrase: str) -> str:
    """Normalize a phrase for matching"""
    return re.sub(r"\s+", " ", phrase.strip().lower())


def build_canonical_map() -> Dict[str, str]:
    """Build mapping from all skill variations to canonical form"""
    mapping = {}
    for canonical, synonyms in SKILL_SYNONYMS.items():
        canonical_norm = _normalize_phrase(canonical)
        mapping[canonical_norm] = canonical_norm
        for syn in synonyms:
            mapping[_normalize_phrase(syn)] = canonical_norm
    return mapping


CANON_MAP = build_canonical_map()


# ========================================
# DOCUMENT PARSING
# ========================================

def read_text_from_file(file_path: str) -> str:
    """
    Extract text from PDF, DOCX, or TXT file
    
    Args:
        file_path: Path to the resume file
    
    Returns:
        Extracted text as string
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == ".pdf":
            reader = PdfReader(file_path)
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return text
        
        elif ext == ".docx":
            doc = Document(file_path)
            text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
            return text
        
        else:  # .txt or unknown
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return ""


# ========================================
# SKILL EXTRACTION - ENHANCED
# ========================================

def extract_skills_lexicon(text: str) -> Tuple[List[str], Dict[str, List[str]]]:
    """
    Extract skills using FUZZY lexicon matching (case-insensitive, flexible)
    
    Args:
        text: Resume text (normalized)
    
    Returns:
        Tuple of (list of canonical skills, details dict)
    """
    text_normalized = normalize_text(text)
    details: Dict[str, List[str]] = {}
    
    for canonical, synonyms in SKILL_SYNONYMS.items():
        all_forms = [canonical] + synonyms
        for form in all_forms:
            form_normalized = _normalize_phrase(form)
            if not form_normalized:
                continue
            
            # FLEXIBLE MATCHING: both substring and word boundary
            if form_normalized in text_normalized or re.search(rf"\b{re.escape(form_normalized)}\b", text_normalized):
                canonical_skill = CANON_MAP.get(form_normalized, form_normalized)
                details.setdefault(canonical_skill, []).append(form_normalized)
    
    return sorted(details.keys()), details


def fallback_tfidf_keyphrases(text: str, top_k: int = 20) -> List[str]:
    """
    Extract key phrases using TF-IDF as fallback (INCREASED top_k)
    
    Args:
        text: Resume text
        top_k: Number of top phrases to extract
    
    Returns:
        List of key phrases
    """
    if not text.strip():
        return []
    
    try:
        vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 3),
            min_df=1,
            max_df=0.95
        )
        X = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        scores = X.toarray()[0]
        
        # Get top phrases
        top_indices = scores.argsort()[::-1]
        phrases = []
        for idx in top_indices:
            phrase = feature_names[idx]
            if len(phrase) >= 2 and re.search(r"[a-z]", phrase):
                phrases.append(_normalize_phrase(phrase))
            if len(phrases) >= top_k:
                break
        
        return phrases
    
    except Exception as e:
        print(f"TF-IDF extraction failed: {e}")
        return []


def canonicalize_skills(skills: List[str]) -> List[str]:
    """Convert skills to canonical form and deduplicate"""
    canonical = []
    for skill in skills:
        skill_norm = _normalize_phrase(skill)
        canonical.append(CANON_MAP.get(skill_norm, skill_norm))
    return sorted(set(canonical))


# ========================================
# EXPERIENCE EXTRACTION - ENHANCED
# ========================================

YEARS_PATTERN = re.compile(r"(\d{1,2})\s*(\+)?\s*(?:years?|yrs?)\b", re.IGNORECASE)
DATE_RANGE_PATTERN = re.compile(r"(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2}|present|current)", re.IGNORECASE)


def estimate_years_of_experience(text: str) -> float:
    """
    ENHANCED: Estimate years from both explicit mentions AND date ranges
    
    Args:
        text: Resume text
    
    Returns:
        Estimated years (float)
    """
    # Method 1: Explicit "X years" mentions
    matches = YEARS_PATTERN.findall(text)
    max_years_explicit = 0
    for match in matches:
        years = int(match[0])
        max_years_explicit = max(max_years_explicit, years)
    
    # Method 2: Date range calculation
    date_matches = DATE_RANGE_PATTERN.findall(text)
    max_years_dates = 0
    current_year = datetime.now().year
    
    for start, end in date_matches:
        try:
            start_year = int(start)
            if end.lower() in ["present", "current"]:
                end_year = current_year
            else:
                end_year = int(end)
            
            years = end_year - start_year
            max_years_dates = max(max_years_dates, years)
        except:
            continue
    
    # Return the maximum from both methods
    total_years = max(max_years_explicit, max_years_dates)
    
    # If we found date ranges, add them up (total experience across jobs)
    if date_matches:
        total_experience = 0
        for start, end in date_matches:
            try:
                start_year = int(start)
                if end.lower() in ["present", "current"]:
                    end_year = current_year
                else:
                    end_year = int(end)
                total_experience += (end_year - start_year)
            except:
                continue
        total_years = max(total_years, total_experience)
    
    return float(total_years)


# ========================================
# DEGREE & EDUCATION EXTRACTION - ENHANCED
# ========================================

DEGREE_PATTERNS = {
    "phd": r"\bph\.?d\.?\b|\bdoctor(?:ate)?\b|\bdoctoral\b",
    "master": r"\bmaster'?s?\b|\bms\b|\bm\.sc\.?\b|\bmsc\b|\bmba\b|\bm\.tech\b|\bmtech\b|\bma\b",
    "bachelor": r"\bbachelor'?s?\b|\bbs\b|\bb\.sc\.?\b|\bbsc\b|\bb\.tech\b|\bbtech\b|\bb\.e\.?\b|\bbe\b|\bba\b|\bundergraduate\b",
    "associate": r"\bassociate'?s?\b|\bas\b|\bdiploma\b",
}

DEGREE_ORDER = {"none": 0, "associate": 1, "bachelor": 2, "master": 3, "phd": 4}


def extract_degrees(text: str) -> List[str]:
    """Extract degree levels from resume"""
    found = []
    for degree, pattern in DEGREE_PATTERNS.items():
        if re.search(pattern, text, re.IGNORECASE):
            found.append(degree)
    return sorted(set(found))


def get_highest_degree(degrees: List[str]) -> str:
    """Get highest degree from list"""
    if not degrees:
        return "none"
    
    highest = "none"
    for degree in degrees:
        if DEGREE_ORDER.get(degree, 0) > DEGREE_ORDER.get(highest, 0):
            highest = degree
    
    return highest


# ========================================
# WORK AUTHORIZATION CHECK
# ========================================

WORK_AUTH_PHRASES = [
    "authorized to work",
    "eligible to work",
    "no sponsorship required",
    "u.s. citizen",
    "us citizen",
    "green card",
    "permanent resident",
    "work permit",
    "can work in",
    "authorized in",
]


def has_work_authorization(text: str) -> bool:
    """Check if resume mentions work authorization"""
    text_normalized = normalize_text(text)
    return any(phrase in text_normalized for phrase in WORK_AUTH_PHRASES)


# ========================================
# SIMILARITY CALCULATION - ENHANCED
# ========================================

def compute_similarity(candidate_skills: List[str], required_skills: List[str]) -> float:
    """
    ENHANCED: Compute similarity with better handling
    
    Args:
        candidate_skills: Skills found in resume
        required_skills: Skills required for job
    
    Returns:
        Similarity score (0.0 to 1.0)
    """
    if not candidate_skills or not required_skills:
        return 0.0
    
    try:
        # Method 1: Exact match ratio (bonus for direct matches)
        exact_matches = len(set(candidate_skills) & set(required_skills))
        exact_ratio = exact_matches / len(required_skills) if required_skills else 0.0
        
        # Method 2: TF-IDF cosine similarity
        candidate_doc = " ".join(candidate_skills)
        required_doc = " ".join(required_skills)
        
        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform([candidate_doc, required_doc])
        
        cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        
        # Combine both methods (weighted average)
        # Give more weight to exact matches
        combined_similarity = (exact_ratio * 0.6) + (cosine_sim * 0.4)
        
        return float(combined_similarity)
    
    except Exception as e:
        print(f"Similarity calculation failed: {e}")
        return 0.0


# ========================================
# MAIN EVALUATION FUNCTION - ENHANCED
# ========================================

def evaluate_resume(
    resume_path: str,
    rules: Dict[str, Any],
    job_description: str = ""
) -> Dict[str, Any]:
    """
    ENHANCED: Evaluate a resume with FLEXIBLE scoring
    
    Args:
        resume_path: Path to resume file
        rules: Job screening rules dict
        job_description: Job description text (optional)
    
    Returns:
        Evaluation result dictionary with decision, score, and explanation
    """
    
    # Extract text from resume
    raw_text = read_text_from_file(resume_path)
    if not raw_text.strip():
        return {
            "file": os.path.basename(resume_path),
            "decision": "rejected",
            "score": 0.0,
            "error": "Could not extract text from resume"
        }
    
    normalized_text = normalize_text(raw_text)
    
    print(f"\n{'='*60}")
    print(f"📄 Evaluating: {os.path.basename(resume_path)}")
    print(f"{'='*60}")
    
    # ========================================
    # EXTRACT CANDIDATE INFORMATION
    # ========================================
    
    # Extract skills
    lexicon_skills, skill_details = extract_skills_lexicon(normalized_text)
    
    if lexicon_skills:
        candidate_skills = lexicon_skills
    else:
        # Fallback to TF-IDF
        candidate_skills = fallback_tfidf_keyphrases(normalized_text, top_k=20)
    
    candidate_skills = canonicalize_skills(candidate_skills)
    print(f"🔧 Candidate Skills Found: {candidate_skills[:10]}")  # Show first 10
    
    # Extract experience
    years_experience = estimate_years_of_experience(normalized_text)
    print(f"💼 Years of Experience: {years_experience}")
    
    # Extract education
    degrees = extract_degrees(normalized_text)
    highest_degree = get_highest_degree(degrees)
    print(f"🎓 Highest Degree: {highest_degree}")
    
    # Check work authorization
    has_auth = has_work_authorization(normalized_text)
    
    # ========================================
    # PARSE JOB RULES WITH DEFAULTS
    # ========================================
    
    required_all = canonicalize_skills(rules.get("required_all", []))
    required_any = canonicalize_skills(rules.get("required_any", []))
    any_min = rules.get("any_min", 0)
    min_years = rules.get("min_years", 0)
    forbidden_keywords = [normalize_text(kw) for kw in rules.get("forbidden_keywords", [])]
    similarity_threshold = rules.get("similarity_threshold", 0.3)  # LOWERED from 0.6 to 0.3
    
    allowed_degrees = [d.lower() for d in rules.get("allowed_degrees", [])]
    min_degree_level = rules.get("min_degree_level", "none")
    allowed_locations = [normalize_text(loc) for loc in rules.get("allowed_locations", [])]
    allow_remote = rules.get("allow_remote", True)
    require_work_auth = rules.get("require_work_auth", False)
    
    scoring_config = rules.get("scoring", {})
    scoring_enabled = scoring_config.get("enabled", True)
    score_threshold = scoring_config.get("threshold", 50.0)  # LOWERED from 70 to 50
    weights = scoring_config.get("weights", {})
    
    print(f"📋 Required Skills (ALL): {required_all}")
    print(f"📋 Required Skills (ANY): {required_any} (min: {any_min})")
    
    # ========================================
    # RULE CHECKS - FLEXIBLE MODE
    # ========================================
    
    reasons_pass = []
    reasons_fail = []
    
    # 1. Forbidden keywords (STRICT - must pass)
    forbidden_found = [kw for kw in forbidden_keywords if kw in normalized_text]
    check_forbidden = len(forbidden_found) == 0
    
    if check_forbidden:
        reasons_pass.append("No forbidden keywords found")
    else:
        reasons_fail.append(f"Contains forbidden keywords: {', '.join(forbidden_found)}")
    
    # 2. Required ALL skills (FLEXIBLE - give partial credit)
    matched_all = [s for s in required_all if s in candidate_skills]
    missing_all = [s for s in required_all if s not in candidate_skills]
    
    if required_all:
        all_match_ratio = len(matched_all) / len(required_all)
        check_all = all_match_ratio >= 0.5  # FLEXIBLE: need 50% instead of 100%
        
        if check_all:
            reasons_pass.append(f"Has {len(matched_all)}/{len(required_all)} required skills ({all_match_ratio*100:.0f}%)")
        else:
            reasons_fail.append(f"Only has {len(matched_all)}/{len(required_all)} required skills")
    else:
        check_all = True
        reasons_pass.append("No required skills specified")
    
    # 3. Required ANY skills (FLEXIBLE)
    matched_any = [s for s in required_any if s in candidate_skills]
    missing_any = [s for s in required_any if s not in candidate_skills]
    check_any = True
    
    if required_any:
        check_any = len(matched_any) >= max(1, any_min // 2)  # FLEXIBLE: need half the minimum
        if check_any:
            reasons_pass.append(f"Has {len(matched_any)} of preferred skills")
        else:
            reasons_fail.append(f"Only has {len(matched_any)} preferred skills")
    
    # 4. Experience (FLEXIBLE - 80% is acceptable)
    if min_years > 0:
        check_experience = years_experience >= (min_years * 0.8)  # FLEXIBLE: 80% is OK
        if check_experience:
            reasons_pass.append(f"Experience OK ({years_experience}y >= {min_years * 0.8:.1f}y)")
        else:
            reasons_fail.append(f"Insufficient experience ({years_experience}y < {min_years * 0.8:.1f}y)")
    else:
        check_experience = True
        reasons_pass.append("No experience requirement")
    
    # 5. Degree (FLEXIBLE - one level below is acceptable)
    check_degree = True
    if allowed_degrees:
        check_degree = any(d in allowed_degrees for d in degrees) or ("none" in allowed_degrees and not degrees)
    
    if min_degree_level and min_degree_level != "none":
        required_level = DEGREE_ORDER.get(min_degree_level, 0)
        candidate_level = DEGREE_ORDER.get(highest_degree, 0)
        # FLEXIBLE: allow one level below (bachelor OK for master requirement)
        check_degree = check_degree and (candidate_level >= required_level - 1)
        
        if not check_degree:
            reasons_fail.append(f"Degree level too low (has {highest_degree}, need {min_degree_level})")
    
    if check_degree:
        if allowed_degrees or min_degree_level:
            reasons_pass.append(f"Degree requirement met ({highest_degree})")
        else:
            reasons_pass.append("No degree requirement")
    
    # 6. Location (FLEXIBLE - always pass if allow_remote)
    check_location = True
    if allowed_locations:
        check_location = any(loc in normalized_text for loc in allowed_locations)
        if not check_location and allow_remote:
            check_location = True  # Remote work allowed
            reasons_pass.append("Remote work acceptable")
        elif check_location:
            reasons_pass.append("Location requirement met")
        else:
            reasons_fail.append("Location not in allowed list and remote not allowed")
    else:
        reasons_pass.append("No location requirement")
    
    # 7. Work authorization (FLEXIBLE - only fail if explicitly required)
    check_work_auth = True
    if require_work_auth:
        check_work_auth = has_auth
        if check_work_auth:
            reasons_pass.append("Work authorization confirmed")
        else:
            reasons_fail.append("Work authorization not found (required)")
    else:
        reasons_pass.append("Work authorization not required")
    
    # 8. Similarity (FLEXIBLE - lowered threshold)
    target_skills = canonicalize_skills(required_all + required_any)
    if not target_skills and job_description:
        jd_skills, _ = extract_skills_lexicon(normalize_text(job_description))
        target_skills = canonicalize_skills(jd_skills)
    
    similarity = compute_similarity(candidate_skills, target_skills) if target_skills else 1.0
    check_similarity = similarity >= similarity_threshold
    
    if check_similarity:
        reasons_pass.append(f"Similarity OK ({similarity:.2f} >= {similarity_threshold})")
    else:
        reasons_fail.append(f"Similarity below threshold ({similarity:.2f} < {similarity_threshold})")
    
    print(f"✅ Checks Passed: {len(reasons_pass)}")
    print(f"❌ Checks Failed: {len(reasons_fail)}")
    
    # ========================================
    # SCORING - ENHANCED WITH PARTIAL CREDIT
    # ========================================
    
    score = None
    if scoring_enabled:
        w_all = weights.get("skills_all", 30.0)
        w_any = weights.get("skills_any", 20.0)
        w_exp = weights.get("experience", 20.0)
        w_sim = weights.get("similarity", 25.0)
        w_deg = weights.get("degree", 5.0)
        
        score = 0.0
        
        # Required all skills (PARTIAL CREDIT)
        if required_all:
            all_ratio = len(matched_all) / len(required_all)
            score += w_all * all_ratio
        else:
            score += w_all  # Full points if not required
        
        # Required any skills (PARTIAL CREDIT)
        if required_any and any_min > 0:
            any_ratio = min(1.0, len(matched_any) / any_min)
            score += w_any * any_ratio
        else:
            score += w_any  # Full points if not required
        
        # Experience (SCALED - partial credit)
        if min_years > 0:
            exp_ratio = min(1.0, years_experience / min_years)
            score += w_exp * exp_ratio
        else:
            score += w_exp
        
        # Similarity (0-1 scaled)
        score += w_sim * max(0.0, min(1.0, similarity / max(similarity_threshold, 0.01)))
        
        # Degree (PARTIAL CREDIT for close matches)
        if min_degree_level and min_degree_level != "none":
            required_level = DEGREE_ORDER.get(min_degree_level, 0)
            candidate_level = DEGREE_ORDER.get(highest_degree, 0)
            degree_ratio = min(1.0, candidate_level / max(required_level, 1))
            score += w_deg * degree_ratio
        else:
            score += w_deg
        
        score = round(score, 2)
        print(f"📊 Final Score: {score}/{sum([w_all, w_any, w_exp, w_sim, w_deg])}")
    
    # ========================================
    # FINAL DECISION - SCORE-BASED (NOT GATE-BASED)
    # ========================================
    
    # CRITICAL GATES (must pass these)
    critical_gates = [check_forbidden]  # Only forbidden keywords are critical
    
    # OPTIONAL GATES (can fail some of these)
    optional_gates = [check_all, check_any, check_experience, check_degree, check_location, check_work_auth, check_similarity]
    
    passed_critical = all(critical_gates)
    passed_optional = sum(optional_gates)  # Count how many passed
    
    # NEW LOGIC: Must pass critical gates AND either:
    # 1. Pass score threshold, OR
    # 2. Pass at least 4 out of 7 optional gates
    if scoring_enabled and score is not None:
        passed = passed_critical and (score >= score_threshold or passed_optional >= 4)
        
        if not passed_critical:
            reasons_fail.append("Failed critical checks (forbidden keywords)")
        elif score < score_threshold and passed_optional < 4:
            reasons_fail.append(f"Score too low ({score} < {score_threshold}) and only {passed_optional}/7 checks passed")
        else:
            reasons_pass.append(f"Score: {score} or {passed_optional}/7 checks passed")
    else:
        # Fallback to gate-based (at least 5 of 7 optional gates must pass)
        passed = passed_critical and (passed_optional >= 5)
    
    decision = "selected" if passed else "rejected"
    
    print(f"🎯 Decision: {decision.upper()}")
    print(f"{'='*60}\n")
    
    # ========================================
    # BUILD RESPONSE
    # ========================================
    
    return {
        "file": os.path.basename(resume_path),
        "decision": decision,
        "score": score,
        "rule_version": rules.get("version", "v2-enhanced"),
        "role": rules.get("role"),
        "summary": {
            "passed": passed,
            "reasons_pass": reasons_pass,
            "reasons_fail": reasons_fail
        },
        "skills": {
            "candidate_skills": candidate_skills,
            "matched_required_all": matched_all,
            "missing_required_all": missing_all,
            "matched_required_any": matched_any,
            "missing_required_any": missing_any,
            "target_skills": target_skills,
            "similarity": round(similarity, 4),
            "similarity_threshold": similarity_threshold
        },
        "experience": {
            "estimated_years": years_experience,
            "min_required_years": min_years,
            "meets_requirement": check_experience
        },
        "education": {
            "degrees_found": degrees,
            "highest_degree": highest_degree,
            "allowed_degrees": allowed_degrees,
            "min_degree_level": min_degree_level,
            "meets_requirement": check_degree
        },
        "location": {
            "allowed_locations": allowed_locations,
            "allow_remote": allow_remote,
            "meets_requirement": check_location
        },
        "work_authorization": {
            "required": require_work_auth,
            "found": has_auth,
            "meets_requirement": check_work_auth
        },
        "forbidden_keywords": {
            "found": forbidden_found,
            "passed": check_forbidden
        },
        "scoring": {
            "enabled": scoring_enabled,
            "score": score,
            "threshold": score_threshold,
            "weights": weights
        }
    }