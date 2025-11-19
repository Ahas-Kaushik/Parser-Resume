"""
AI-Powered Resume Parser
Evaluates resumes against job requirements using ML
"""

import os
import re
from typing import Dict, List, Tuple, Any
from pypdf import PdfReader
from docx import Document
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ========================================
# SKILL LEXICON (Expandable)
# ========================================

SKILL_SYNONYMS: Dict[str, List[str]] = {
    "python": ["py", "python3"],
    "java": ["java8", "java11", "java17"],
    "javascript": ["js", "node", "nodejs", "node.js"],
    "typescript": ["ts"],
    "sql": ["postgresql", "postgres", "mysql", "sqlite", "mariadb", "tsql", "t-sql", "oracle"],
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
    "docker": [],
    "kubernetes": ["k8s"],
    "linux": ["unix", "ubuntu", "centos", "redhat"],
    "git": ["github", "gitlab", "bitbucket"],
    "rest": ["restful", "rest api", "restful api"],
    "graphql": [],
    "microservices": ["micro services"],
    "kafka": ["apache kafka"],
    "redis": [],
    "elasticsearch": ["elastic search"],
    "pandas": [],
    "numpy": [],
    "scikit-learn": ["sklearn", "scikit learn"],
    "tensorflow": ["tensor flow"],
    "pytorch": ["torch"],
    "keras": [],
    "machine learning": ["ml", "artificial intelligence", "ai"],
    "deep learning": ["neural networks"],
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
# SKILL EXTRACTION
# ========================================

def extract_skills_lexicon(text: str) -> Tuple[List[str], Dict[str, List[str]]]:
    """
    Extract skills using lexicon matching
    
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
            
            # Check if skill appears in text
            if form_normalized in text_normalized or re.search(rf"\b{re.escape(form_normalized)}\b", text_normalized):
                canonical_skill = CANON_MAP.get(form_normalized, form_normalized)
                details.setdefault(canonical_skill, []).append(form_normalized)
    
    return sorted(details.keys()), details


def fallback_tfidf_keyphrases(text: str, top_k: int = 15) -> List[str]:
    """
    Extract key phrases using TF-IDF as fallback
    
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
# EXPERIENCE EXTRACTION
# ========================================

YEARS_PATTERN = re.compile(r"(\d{1,2})\s*(\+)?\s*(?:years|yrs)\b", re.IGNORECASE)


def estimate_years_of_experience(text: str) -> float:
    """
    Estimate years of experience from resume text
    
    Args:
        text: Resume text
    
    Returns:
        Estimated years (float)
    """
    matches = YEARS_PATTERN.findall(text)
    if not matches:
        return 0.0
    
    max_years = 0
    for match in matches:
        years = int(match[0])
        max_years = max(max_years, years)
    
    return float(max_years)


# ========================================
# DEGREE & EDUCATION EXTRACTION
# ========================================

DEGREE_PATTERNS = {
    "phd": r"\bph\.?d\.?\b|\bdoctor(?:ate)?\b",
    "master": r"\bmaster'?s?\b|\bms\b|\bm\.sc\.?\b|\bmsc\b|\bmba\b",
    "bachelor": r"\bbachelor'?s?\b|\bbs\b|\bb\.sc\.?\b|\bbsc\b|\bb\.tech\b|\bbtech\b|\bb\.e\b|\bbe\b",
    "associate": r"\bassociate'?s?\b|\bas\b",
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
# SIMILARITY CALCULATION
# ========================================

def compute_similarity(candidate_skills: List[str], required_skills: List[str]) -> float:
    """
    Compute cosine similarity between candidate and required skills
    
    Args:
        candidate_skills: Skills found in resume
        required_skills: Skills required for job
    
    Returns:
        Similarity score (0.0 to 1.0)
    """
    if not candidate_skills or not required_skills:
        return 0.0
    
    try:
        # Create skill documents
        candidate_doc = " ".join(candidate_skills)
        required_doc = " ".join(required_skills)
        
        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform([candidate_doc, required_doc])
        
        similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        return float(similarity)
    
    except Exception as e:
        print(f"Similarity calculation failed: {e}")
        return 0.0


# ========================================
# MAIN EVALUATION FUNCTION
# ========================================

def evaluate_resume(
    resume_path: str,
    rules: Dict[str, Any],
    job_description: str = ""
) -> Dict[str, Any]:
    """
    Evaluate a resume against job requirements
    
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
    
    # ========================================
    # EXTRACT CANDIDATE INFORMATION
    # ========================================
    
    # Extract skills
    lexicon_skills, skill_details = extract_skills_lexicon(normalized_text)
    
    if lexicon_skills:
        candidate_skills = lexicon_skills
    else:
        # Fallback to TF-IDF
        candidate_skills = fallback_tfidf_keyphrases(normalized_text, top_k=15)
    
    candidate_skills = canonicalize_skills(candidate_skills)
    
    # Extract experience
    years_experience = estimate_years_of_experience(normalized_text)
    
    # Extract education
    degrees = extract_degrees(normalized_text)
    highest_degree = get_highest_degree(degrees)
    
    # Check work authorization
    has_auth = has_work_authorization(normalized_text)
    
    # ========================================
    # PARSE JOB RULES
    # ========================================
    
    required_all = canonicalize_skills(rules.get("required_all", []))
    required_any = canonicalize_skills(rules.get("required_any", []))
    any_min = rules.get("any_min", 0)
    min_years = rules.get("min_years", 0)
    forbidden_keywords = [normalize_text(kw) for kw in rules.get("forbidden_keywords", [])]
    similarity_threshold = rules.get("similarity_threshold", 0.6)
    
    allowed_degrees = [d.lower() for d in rules.get("allowed_degrees", [])]
    min_degree_level = rules.get("min_degree_level", "none")
    allowed_locations = [normalize_text(loc) for loc in rules.get("allowed_locations", [])]
    allow_remote = rules.get("allow_remote", True)
    require_work_auth = rules.get("require_work_auth", False)
    
    scoring_config = rules.get("scoring", {})
    scoring_enabled = scoring_config.get("enabled", True)
    score_threshold = scoring_config.get("threshold", 70.0)
    weights = scoring_config.get("weights", {})
    
    # ========================================
    # RULE CHECKS
    # ========================================
    
    reasons_pass = []
    reasons_fail = []
    
    # 1. Forbidden keywords
    forbidden_found = [kw for kw in forbidden_keywords if kw in normalized_text]
    check_forbidden = len(forbidden_found) == 0
    
    if check_forbidden:
        reasons_pass.append("No forbidden keywords found")
    else:
        reasons_fail.append(f"Contains forbidden keywords: {', '.join(forbidden_found)}")
    
    # 2. Required ALL skills
    matched_all = [s for s in required_all if s in candidate_skills]
    missing_all = [s for s in required_all if s not in candidate_skills]
    check_all = len(missing_all) == 0
    
    if check_all:
        reasons_pass.append(f"Has all required skills: {', '.join(required_all)}")
    else:
        reasons_fail.append(f"Missing required skills: {', '.join(missing_all)}")
    
    # 3. Required ANY skills
    matched_any = [s for s in required_any if s in candidate_skills]
    missing_any = [s for s in required_any if s not in candidate_skills]
    check_any = True
    
    if required_any:
        check_any = len(matched_any) >= any_min
        if check_any:
            reasons_pass.append(f"Has {len(matched_any)}/{any_min} of preferred skills")
        else:
            reasons_fail.append(f"Only has {len(matched_any)}/{any_min} preferred skills")
    
    # 4. Experience
    check_experience = years_experience >= min_years
    
    if check_experience:
        reasons_pass.append(f"Experience OK ({years_experience}y >= {min_years}y)")
    else:
        reasons_fail.append(f"Insufficient experience ({years_experience}y < {min_years}y)")
    
    # 5. Degree
    check_degree = True
    if allowed_degrees:
        check_degree = any(d in allowed_degrees for d in degrees) or ("none" in allowed_degrees and not degrees)
        if not check_degree:
            reasons_fail.append(f"Degree not in allowed list")
    
    if min_degree_level and min_degree_level != "none":
        degree_check = DEGREE_ORDER.get(highest_degree, 0) >= DEGREE_ORDER.get(min_degree_level, 0)
        check_degree = check_degree and degree_check
        if not degree_check:
            reasons_fail.append(f"Degree level too low (has {highest_degree}, need {min_degree_level})")
    
    if check_degree and (allowed_degrees or min_degree_level):
        reasons_pass.append(f"Degree requirement met ({highest_degree})")
    
    # 6. Location
    check_location = True
    if allowed_locations:
        check_location = any(loc in normalized_text for loc in allowed_locations)
        if not check_location and allow_remote:
            check_location = "remote" in normalized_text
        
        if check_location:
            reasons_pass.append("Location requirement met")
        else:
            reasons_fail.append("Location not in allowed list")
    
    # 7. Work authorization
    check_work_auth = True
    if require_work_auth:
        check_work_auth = has_auth
        if check_work_auth:
            reasons_pass.append("Work authorization confirmed")
        else:
            reasons_fail.append("Work authorization not found")
    
    # 8. Similarity
    target_skills = canonicalize_skills(required_all + required_any)
    if not target_skills and job_description:
        jd_skills, _ = extract_skills_lexicon(normalize_text(job_description))
        target_skills = canonicalize_skills(jd_skills)
    
    similarity = compute_similarity(candidate_skills, target_skills) if target_skills else 0.0
    check_similarity = similarity >= similarity_threshold
    
    if check_similarity:
        reasons_pass.append(f"Similarity OK ({similarity:.2f} >= {similarity_threshold})")
    else:
        reasons_fail.append(f"Similarity too low ({similarity:.2f} < {similarity_threshold})")
    
    # ========================================
    # SCORING
    # ========================================
    
    score = None
    if scoring_enabled:
        w_all = weights.get("skills_all", 30.0)
        w_any = weights.get("skills_any", 20.0)
        w_exp = weights.get("experience", 20.0)
        w_sim = weights.get("similarity", 25.0)
        w_deg = weights.get("degree", 5.0)
        
        score = 0.0
        
        # Required all skills
        if check_all:
            score += w_all
        
        # Required any skills (scaled)
        if required_any:
            any_ratio = min(1.0, len(matched_any) / max(1, any_min))
            score += w_any * any_ratio
        else:
            score += w_any  # Full points if not required
        
        # Experience (scaled)
        if min_years > 0:
            exp_ratio = min(1.0, years_experience / max(1, min_years))
            score += w_exp * exp_ratio
        else:
            score += w_exp
        
        # Similarity (0-1 scaled)
        score += w_sim * max(0.0, min(1.0, similarity))
        
        # Degree
        if check_degree:
            score += w_deg
        
        score = round(score, 2)
    
    # ========================================
    # FINAL DECISION
    # ========================================
    
    gates = [check_forbidden, check_all, check_any, check_experience, check_degree, check_location, check_work_auth, check_similarity]
    passed_gates = all(gates)
    
    if scoring_enabled and score is not None:
        passed = passed_gates and (score >= score_threshold)
        if not passed_gates:
            reasons_fail.append("Failed one or more gate checks")
        elif score < score_threshold:
            reasons_fail.append(f"Score too low ({score} < {score_threshold})")
    else:
        passed = passed_gates
    
    decision = "selected" if passed else "rejected"
    
    # ========================================
    # BUILD RESPONSE
    # ========================================
    
    return {
        "file": os.path.basename(resume_path),
        "decision": decision,
        "score": score,
        "rule_version": rules.get("version", "v1"),
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