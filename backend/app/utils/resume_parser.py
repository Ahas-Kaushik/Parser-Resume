"""
AI-Powered Resume Parser - ENHANCED VERSION
Evaluates resumes against job requirements using ML with smart grade conversion
"""

import os
import re
from typing import Dict, List, Tuple, Any, Optional
from pypdf import PdfReader
from docx import Document
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime


# ========================================
# GRADE CONVERSION CONSTANTS
# ========================================

GRADE_CONVERSION = {
    "cgpa_10": lambda x: x * 10,           # 8.5 CGPA → 85%
    "cgpa_10_strict": lambda x: (x - 0.5) * 10,  # Some institutions use this
    "gpa_4": lambda x: (x / 4) * 100,      # 3.5 GPA → 87.5%
    "percentage": lambda x: x,              # Already percentage
}

LETTER_GRADE_MAP = {
    "a+": 95, "a": 90, "a-": 85,
    "b+": 80, "b": 75, "b-": 70,
    "c+": 65, "c": 60, "c-": 55,
    "d+": 52, "d": 50, "d-": 45,
    "f": 0, "fail": 0
}

CLASS_SYSTEM_MAP = {
    "first class with distinction": 75,
    "first class": 60,
    "second class": 50,
    "third class": 40,
    "pass class": 35
}

# Education field synonyms for fuzzy matching
FIELD_SYNONYMS = {
    "computer science": ["cs", "cse", "computer science and engineering", "computer applications", "computing"],
    "information technology": ["it", "information tech", "info tech"],
    "software engineering": ["se", "software development"],
    "electronics": ["ece", "electronics and communication", "electronics & communication"],
    "mechanical": ["me", "mechanical engineering"],
    "civil": ["ce", "civil engineering"],
    "electrical": ["ee", "electrical engineering", "eee"],
}


# ========================================
# GRADE PARSING PATTERNS
# ========================================

GRADE_PATTERNS = {
    "cgpa_10": [
        r"(\d+\.?\d*)\s*(?:cgpa|CGPA)",
        r"CGPA\s*[:\-]?\s*(\d+\.?\d*)",
        r"(?:cgpa|CGPA)\s*(?:of)?\s*(\d+\.?\d*)\s*/\s*10",
        r"(\d+\.?\d*)\s*/\s*10\s*(?:cgpa|CGPA)",
    ],
    "gpa_4": [
        r"(\d+\.?\d*)\s*(?:gpa|GPA)",
        r"GPA\s*[:\-]?\s*(\d+\.?\d*)\s*/\s*4",
        r"(\d+\.?\d*)\s*/\s*4\s*(?:gpa|GPA)",
    ],
    "percentage": [
        r"(\d+\.?\d*)\s*%",
        r"(\d+\.?\d*)\s*percent",
        r"percentage\s*[:\-]?\s*(\d+\.?\d*)",
        r"marks\s*[:\-]?\s*(\d+\.?\d*)%?",
    ],
}

DEGREE_PATTERNS = {
    "phd": r"\bph\.?d\.?\b|\bdoctor(?:ate)?\b|\bdoctoral\b",
    "master": r"\bmaster'?s?\b|\bms\b|\bm\.sc\.?\b|\bmsc\b|\bmba\b|\bm\.tech\b|\bmtech\b|\bma\b|\bmca\b",
    "bachelor": r"\bbachelor'?s?\b|\bbs\b|\bb\.sc\.?\b|\bbsc\b|\bb\.tech\b|\bbtech\b|\bb\.e\.?\b|\bbe\b|\bba\b|\bbca\b|\bundergraduate\b",
    "12th": r"\b12th\b|\bhigher\s+secondary\b|\bintermediate\b|\bclass\s+12\b|\bxii\b|\b\+2\b",
    "diploma": r"\bdiploma\b|\bpolytechnic\b",
    "10th": r"\b10th\b|\bsecondary\b|\bclass\s+10\b|\bx\b|\bmatric\b",
}

DEGREE_ORDER = {"none": 0, "10th": 1, "12th": 2, "diploma": 2, "bachelor": 3, "master": 4, "phd": 5}


# ========================================
# HELPER FUNCTIONS
# ========================================

def normalize_text(text: str) -> str:
    """Normalize text: lowercase and remove extra spaces"""
    return " ".join(text.lower().split())


def _normalize_phrase(phrase: str) -> str:
    """Normalize a phrase for matching"""
    return re.sub(r"\s+", " ", phrase.strip().lower())


def read_text_from_file(file_path: str) -> str:
    """Extract text from PDF, DOCX, or TXT file"""
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
# GRADE EXTRACTION & CONVERSION
# ========================================

def extract_grade_from_text(text: str, context: str = "") -> Optional[Dict[str, Any]]:
    """
    Extract grade information from text with smart detection
    
    Returns:
        {
            "raw_value": "8.5",
            "type": "cgpa_10",
            "normalized_percentage": 85.0,
            "confidence": 0.95,
            "context": "Bachelor of Technology (8.5 CGPA)"
        }
    """
    text_normalized = normalize_text(text)
    
    # Try to extract grade with context
    for grade_type, patterns in GRADE_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, text_normalized)
            if match:
                try:
                    value = float(match.group(1))
                    
                    # Validate ranges
                    if grade_type == "cgpa_10" and (value < 0 or value > 10):
                        continue
                    if grade_type == "gpa_4" and (value < 0 or value > 4):
                        continue
                    if grade_type == "percentage" and (value < 0 or value > 100):
                        continue
                    
                    # Convert to percentage
                    converter = GRADE_CONVERSION.get(grade_type, lambda x: x)
                    normalized = converter(value)
                    
                    return {
                        "raw_value": str(value),
                        "type": grade_type,
                        "normalized_percentage": round(normalized, 2),
                        "confidence": 0.9,
                        "context": context[:100] if context else text[:100]
                    }
                except (ValueError, IndexError):
                    continue
    
    return None


def extract_education_with_grades(text: str) -> List[Dict[str, Any]]:
    """
    Enhanced education extraction with grades
    
    Returns list of education entries with grades:
    [
        {
            "level": "bachelor",
            "field": "Computer Science",
            "institution": "ABC University",
            "year": 2020,
            "grade": {...},
            "detected_text": "..."
        }
    ]
    """
    qualifications = []
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line_normalized = normalize_text(line)
        
        # Check for degree keywords
        for degree_level, pattern in DEGREE_PATTERNS.items():
            if re.search(pattern, line_normalized):
                # Try to extract grade from this line or next 2 lines
                context_text = " ".join(lines[i:min(i+3, len(lines))])
                grade_info = extract_grade_from_text(context_text, line)
                
                # Try to extract field
                field = extract_field_from_line(line)
                
                # Try to extract year
                year = extract_year_from_line(line)
                
                qualification = {
                    "level": degree_level,
                    "field": field,
                    "year": year,
                    "grade": grade_info,
                    "detected_text": line[:200]
                }
                
                qualifications.append(qualification)
                break
    
    return qualifications


def extract_field_from_line(line: str) -> Optional[str]:
    """Extract field of study from education line"""
    line_lower = line.lower()
    
    # Common field patterns
    field_patterns = [
        r"(?:in|of)\s+([\w\s&]+?)(?:\(|from|with|$)",
        r"(?:bachelor|master|b\.tech|m\.tech|bsc|msc)\s+(?:of|in)?\s+([\w\s&]+?)(?:\(|from|with|,|$)",
    ]
    
    for pattern in field_patterns:
        match = re.search(pattern, line_lower)
        if match:
            field = match.group(1).strip()
            # Clean up
            field = re.sub(r'\s+', ' ', field)
            if len(field) > 5 and len(field) < 50:
                return field.title()
    
    return None


def extract_year_from_line(line: str) -> Optional[int]:
    """Extract graduation year from education line"""
    year_pattern = r'\b(19\d{2}|20\d{2})\b'
    matches = re.findall(year_pattern, line)
    if matches:
        years = [int(y) for y in matches]
        return max(years)  # Return most recent year
    return None


def get_highest_qualification(qualifications: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Get highest qualification from list"""
    if not qualifications:
        return {
            "level": "none",
            "field": None,
            "grade": None
        }
    
    highest = max(qualifications, key=lambda q: DEGREE_ORDER.get(q["level"], 0))
    return highest


def normalize_field_name(field: str) -> str:
    """Normalize field name for comparison"""
    if not field:
        return ""
    
    field_lower = field.lower().strip()
    
    # Check synonyms
    for canonical, synonyms in FIELD_SYNONYMS.items():
        if field_lower == canonical or field_lower in synonyms:
            return canonical
        for syn in synonyms:
            if syn in field_lower or field_lower in syn:
                return canonical
    
    return field_lower


def check_field_match(candidate_field: str, required_fields: List[str], accept_related: bool = False) -> Tuple[bool, str]:
    """
    Check if candidate's field matches required fields
    
    Returns: (matches: bool, matched_field: str)
    """
    if not candidate_field or not required_fields:
        return False, ""
    
    candidate_normalized = normalize_field_name(candidate_field)
    
    for req_field in required_fields:
        req_normalized = normalize_field_name(req_field)
        
        # Exact match
        if candidate_normalized == req_normalized:
            return True, req_field
        
        # Fuzzy match if accept_related is True
        if accept_related:
            # Check if one contains the other
            if req_normalized in candidate_normalized or candidate_normalized in req_normalized:
                return True, req_field
            
            # Check synonym groups
            for canonical, synonyms in FIELD_SYNONYMS.items():
                if (candidate_normalized == canonical or candidate_normalized in synonyms) and \
                   (req_normalized == canonical or req_normalized in synonyms):
                    return True, req_field
    
    return False, ""


# ========================================
# SKILL EXTRACTION (Keep existing code)
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


def extract_skills_lexicon(text: str) -> Tuple[List[str], Dict[str, List[str]]]:
    """Extract skills using lexicon matching"""
    text_normalized = normalize_text(text)
    details: Dict[str, List[str]] = {}
    
    for canonical, synonyms in SKILL_SYNONYMS.items():
        all_forms = [canonical] + synonyms
        for form in all_forms:
            form_normalized = _normalize_phrase(form)
            if not form_normalized:
                continue
            
            if form_normalized in text_normalized or re.search(rf"\b{re.escape(form_normalized)}\b", text_normalized):
                canonical_skill = CANON_MAP.get(form_normalized, form_normalized)
                details.setdefault(canonical_skill, []).append(form_normalized)
    
    return sorted(details.keys()), details


def fallback_tfidf_keyphrases(text: str, top_k: int = 20) -> List[str]:
    """Extract key phrases using TF-IDF as fallback"""
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
    """ENHANCED: Estimate years from both explicit mentions AND date ranges"""
    matches = YEARS_PATTERN.findall(text)
    max_years_explicit = 0
    for match in matches:
        years = int(match[0])
        max_years_explicit = max(max_years_explicit, years)
    
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
    
    total_years = max(max_years_explicit, max_years_dates)
    
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
# SIMILARITY CALCULATION - ENHANCED
# ========================================

def compute_similarity(candidate_skills: List[str], required_skills: List[str]) -> float:
    """ENHANCED: Compute similarity with better handling"""
    if not candidate_skills or not required_skills:
        return 0.0
    
    try:
        exact_matches = len(set(candidate_skills) & set(required_skills))
        exact_ratio = exact_matches / len(required_skills) if required_skills else 0.0
        
        candidate_doc = " ".join(candidate_skills)
        required_doc = " ".join(required_skills)
        
        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform([candidate_doc, required_doc])
        
        cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        
        combined_similarity = (exact_ratio * 0.6) + (cosine_sim * 0.4)
        
        return float(combined_similarity)
    except Exception as e:
        print(f"Similarity calculation failed: {e}")
        return 0.0


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
# MAIN EVALUATION FUNCTION - ENHANCED
# ========================================

def evaluate_resume(
    resume_path: str,
    rules: Dict[str, Any],
    job_description: str = ""
) -> Dict[str, Any]:
    """
    ENHANCED: Evaluate a resume with FLEXIBLE scoring and education validation
    """
    
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
    
    # Extract skills
    lexicon_skills, skill_details = extract_skills_lexicon(normalized_text)
    if lexicon_skills:
        candidate_skills = lexicon_skills
    else:
        candidate_skills = fallback_tfidf_keyphrases(normalized_text, top_k=20)
    
    candidate_skills = canonicalize_skills(candidate_skills)
    print(f"🔧 Candidate Skills Found: {candidate_skills[:10]}")
    
    # Extract experience
    years_experience = estimate_years_of_experience(normalized_text)
    print(f"💼 Years of Experience: {years_experience}")
    
    # Extract education WITH GRADES
    education_entries = extract_education_with_grades(raw_text)
    highest_qualification = get_highest_qualification(education_entries)
    print(f"🎓 Highest Qualification: {highest_qualification['level']}")
    if highest_qualification['grade']:
        print(f"   Grade: {highest_qualification['grade']['raw_value']} ({highest_qualification['grade']['type']}) = {highest_qualification['grade']['normalized_percentage']}%")
    
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
    similarity_threshold = rules.get("similarity_threshold", 0.3)
    
    # NEW: Education requirements
    education_req = rules.get("education_requirements", {})
    education_enabled = education_req.get("enabled", False)
    
    scoring_config = rules.get("scoring", {})
    scoring_enabled = scoring_config.get("enabled", True)
    score_threshold = scoring_config.get("threshold", 50.0)
    weights = scoring_config.get("weights", {})
    
    print(f"📋 Required Skills (ALL): {required_all}")
    print(f"📋 Required Skills (ANY): {required_any} (min: {any_min})")
    print(f"🎓 Education Required: {education_enabled}")
    
    # ========================================
    # RULE CHECKS - FLEXIBLE MODE
    # ========================================
    
    reasons_pass = []
    reasons_fail = []
    
    # 1. Forbidden keywords (STRICT)
    forbidden_found = [kw for kw in forbidden_keywords if kw in normalized_text]
    check_forbidden = len(forbidden_found) == 0
    
    if check_forbidden:
        reasons_pass.append("No forbidden keywords found")
    else:
        reasons_fail.append(f"Contains forbidden keywords: {', '.join(forbidden_found)}")
    
    # 2. Required ALL skills (FLEXIBLE)
    matched_all = [s for s in required_all if s in candidate_skills]
    missing_all = [s for s in required_all if s not in candidate_skills]
    
    if required_all:
        all_match_ratio = len(matched_all) / len(required_all)
        check_all = all_match_ratio >= 0.5
        
        if check_all:
            reasons_pass.append(f"Has {len(matched_all)}/{len(required_all)} required skills ({all_match_ratio*100:.0f}%)")
        else:
            reasons_fail.append(f"Only has {len(matched_all)}/{len(required_all)} required skills")
    else:
        check_all = True
        reasons_pass.append("No required skills specified")
    
    # 3. Required ANY skills
    matched_any = [s for s in required_any if s in candidate_skills]
    missing_any = [s for s in required_any if s not in candidate_skills]
    check_any = True
    
    if required_any:
        check_any = len(matched_any) >= max(1, any_min // 2)
        if check_any:
            reasons_pass.append(f"Has {len(matched_any)} of preferred skills")
        else:
            reasons_fail.append(f"Only has {len(matched_any)} preferred skills")
    
    # 4. Experience (FLEXIBLE - 80% is acceptable)
    if min_years > 0:
        check_experience = years_experience >= (min_years * 0.8)
        if check_experience:
            reasons_pass.append(f"Experience OK ({years_experience}y >= {min_years * 0.8:.1f}y)")
        else:
            reasons_fail.append(f"Insufficient experience ({years_experience}y < {min_years * 0.8:.1f}y)")
    else:
        check_experience = True
        reasons_pass.append("No experience requirement")
    
    # 5. NEW: Education validation
    check_education = True
    education_details = {}
    
    if education_enabled:
        min_qual_config = education_req.get("minimum_qualification", {})
        degree_req_config = education_req.get("degree_requirement", {})
        
        # Check minimum qualification
        min_level_required = min_qual_config.get("level", "12th_diploma")
        candidate_level_order = DEGREE_ORDER.get(highest_qualification["level"], 0)
        
        # Handle 12th_diploma special case (either is acceptable)
        if min_level_required == "12th_diploma":
            required_level_order = 2  # Both 12th and diploma have order 2
            check_min_level = candidate_level_order >= required_level_order
        else:
            required_level_order = DEGREE_ORDER.get(min_level_required, 0)
            check_min_level = candidate_level_order >= required_level_order
        
        # Check minimum qualification grade if specified
        min_grade_config = min_qual_config.get("grade", {})
        check_min_grade = True
        
        if min_grade_config.get("required") and highest_qualification.get("grade"):
            required_percentage = min_grade_config.get("normalized", 0)
            candidate_percentage = highest_qualification["grade"]["normalized_percentage"]
            check_min_grade = candidate_percentage >= required_percentage
            
            if not check_min_grade:
                reasons_fail.append(f"Minimum qualification grade too low ({candidate_percentage}% < {required_percentage}%)")
        
        # Check degree requirement if enabled
        check_degree_req = True
        field_match = False
        matched_field = ""
        
        if degree_req_config.get("enabled"):
            required_degree_level = degree_req_config.get("level", "bachelor")
            required_degree_order = DEGREE_ORDER.get(required_degree_level, 0)
            check_degree_level = candidate_level_order >= required_degree_order
            
            # Check field
            required_fields = degree_req_config.get("fields", [])
            accept_related = degree_req_config.get("accept_related_fields", False)
            
            if highest_qualification.get("field") and required_fields:
                field_match, matched_field = check_field_match(
                    highest_qualification["field"],
                    required_fields,
                    accept_related
                )
            
            # Check degree grade
            degree_grade_config = degree_req_config.get("grade", {})
            check_degree_grade = True
            
            if degree_grade_config and highest_qualification.get("grade"):
                required_degree_percentage = degree_grade_config.get("normalized", 0)
                candidate_degree_percentage = highest_qualification["grade"]["normalized_percentage"]
                check_degree_grade = candidate_degree_percentage >= required_degree_percentage
                
                if not check_degree_grade:
                    reasons_fail.append(f"Degree grade too low ({candidate_degree_percentage}% < {required_degree_percentage}%)")
            
            check_degree_req = check_degree_level and field_match and check_degree_grade
            
            if check_degree_req:
                reasons_pass.append(f"Has required {required_degree_level} in {matched_field} with adequate grade")
            else:
                if not check_degree_level:
                    reasons_fail.append(f"Degree level too low (has {highest_qualification['level']}, need {required_degree_level})")
                if not field_match:
                    reasons_fail.append(f"Field mismatch (has {highest_qualification.get('field', 'unknown')}, need one of {required_fields})")
        
        # Check alternative paths (experience substitute)
        alt_paths = education_req.get("alternative_paths", {})
        exp_substitute = alt_paths.get("experience_substitute", {})
        
        if exp_substitute.get("enabled") and not check_degree_req:
            required_exp_years = exp_substitute.get("years_required", 5)
            if years_experience >= required_exp_years:
                check_degree_req = True
                reasons_pass.append(f"Experience ({years_experience}y) substitutes for degree requirement")
        
        check_education = check_min_level and check_min_grade and check_degree_req
        
        education_details = {
            "minimum_qualification_met": check_min_level and check_min_grade,
            "degree_requirement_met": check_degree_req if degree_req_config.get("enabled") else None,
            "candidate_highest": highest_qualification["level"],
            "candidate_field": highest_qualification.get("field"),
            "candidate_grade": highest_qualification.get("grade"),
            "all_qualifications": education_entries
        }
    else:
        reasons_pass.append("No education requirement")
        education_details = {
            "enabled": False,
            "candidate_highest": highest_qualification["level"],
            "all_qualifications": education_entries
        }
    
    # 6. Work authorization
    check_work_auth = True
    require_work_auth = rules.get("require_work_auth", False)
    if require_work_auth:
        check_work_auth = has_auth
        if check_work_auth:
            reasons_pass.append("Work authorization confirmed")
        else:
            reasons_fail.append("Work authorization not found (required)")
    else:
        reasons_pass.append("Work authorization not required")
    
    # 7. Similarity
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
        w_all = weights.get("skills_all", 25.0)
        w_any = weights.get("skills_any", 15.0)
        w_exp = weights.get("experience", 15.0)
        w_sim = weights.get("similarity", 20.0)
        w_edu = weights.get("education", 25.0)  # NEW: Education weight
        
        score = 0.0
        
        # Required all skills (PARTIAL CREDIT)
        if required_all:
            all_ratio = len(matched_all) / len(required_all)
            score += w_all * all_ratio
        else:
            score += w_all
        
        # Required any skills (PARTIAL CREDIT)
        if required_any and any_min > 0:
            any_ratio = min(1.0, len(matched_any) / any_min)
            score += w_any * any_ratio
        else:
            score += w_any
        
        # Experience (SCALED - partial credit)
        if min_years > 0:
            exp_ratio = min(1.0, years_experience / min_years)
            score += w_exp * exp_ratio
        else:
            score += w_exp
        
        # Similarity (0-1 scaled)
        score += w_sim * max(0.0, min(1.0, similarity / max(similarity_threshold, 0.01)))
        
        # Education (NEW: Partial credit based on level + grade)
        if education_enabled:
            edu_score = 0.0
            
            # Level component (50% of education weight)
            if min_level_required:
                required_level_order = DEGREE_ORDER.get(min_level_required if min_level_required != "12th_diploma" else "12th", 0)
                level_ratio = min(1.0, candidate_level_order / max(required_level_order, 1))
                edu_score += (w_edu * 0.5) * level_ratio
            
            # Grade component (50% of education weight)
            if highest_qualification.get("grade"):
                candidate_grade_pct = highest_qualification["grade"]["normalized_percentage"]
                # Normalize to 0-1 scale (assuming 100% is max)
                grade_ratio = min(1.0, candidate_grade_pct / 100)
                edu_score += (w_edu * 0.5) * grade_ratio
            else:
                edu_score += (w_edu * 0.5)  # Give half credit if no grade detected
            
            score += edu_score
        else:
            score += w_edu  # Full points if education not required
        
        # FIXED: Cap score at 100
        score = min(100.0, round(score, 2))
        print(f"📊 Final Score: {score}/100")
    
    # ========================================
    # FINAL DECISION - SCORE-BASED (NOT GATE-BASED)
    # ========================================
    
    critical_gates = [check_forbidden]
    optional_gates = [check_all, check_any, check_experience, check_education, check_work_auth, check_similarity]
    
    passed_critical = all(critical_gates)
    passed_optional = sum(optional_gates)
    
    if scoring_enabled and score is not None:
        passed = passed_critical and (score >= score_threshold or passed_optional >= 4)
        
        if not passed_critical:
            reasons_fail.append("Failed critical checks (forbidden keywords)")
        elif score < score_threshold and passed_optional < 4:
            reasons_fail.append(f"Score too low ({score} < {score_threshold}) and only {passed_optional}/6 checks passed")
        else:
            reasons_pass.append(f"Score: {score} or {passed_optional}/6 checks passed")
    else:
        passed = passed_critical and (passed_optional >= 4)
    
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
        "rule_version": "v2-enhanced-education",
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
        "education": education_details,
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