"""
Jobs & Applications Router
Handles job postings, applications, and resume screening
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import os
import shutil
import json
import csv
from io import StringIO
from datetime import datetime
from zipfile import ZipFile

from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobStats, JobRules
from app.schemas.application import ApplicationResponse, ApplicationListResponse
from app.dependencies import get_current_user, get_current_employer, get_current_candidate
from app.utils.resume_parser import evaluate_resume
from app.utils.report_generator import AIScreeningReportGenerator, create_download_package
from app.utils.email_utils import send_application_confirmation, send_application_result, send_new_application_notification
from app.config import settings

router = APIRouter()


# ========================================
# JOB ENDPOINTS
# ========================================

# ... [Rest of your code stays exactly the same] ...


# ========================================
# JOB ENDPOINTS
# ========================================

@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get all active job listings (public endpoint)
    
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **is_active**: Filter by active status (default: True)
    """
    query = db.query(Job)
    if is_active is not None:
        query = query.filter(Job.is_active == is_active)
    
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """
    Get single job by ID (public endpoint)
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return job


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Create a new job posting (employer only)
    
    - **title**: Job title
    - **company**: Company name
    - **description**: Job description
    - **location**: Job location
    - **salary_range**: Salary range (e.g., "$80k-$100k")
    - **employment_type**: Type of employment (full-time, part-time, etc.)
    - **rules**: AI screening rules (optional)
    """
    
    # Convert rules to dict if provided
    rules_dict = job_data.rules.dict() if job_data.rules else None
    
    new_job = Job(
        title=job_data.title,
        company=job_data.company,
        description=job_data.description,
        location=job_data.location,
        salary_range=job_data.salary_range,
        employment_type=job_data.employment_type,
        rules=rules_dict,
        employer_id=current_user.id
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return new_job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Update a job posting (employer only, own jobs only)
    """
    job = db.query(Job).filter(Job.id == job_id, Job.employer_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    # Update fields
    update_data = job_data.dict(exclude_unset=True)
    if "rules" in update_data and update_data["rules"]:
        update_data["rules"] = update_data["rules"].dict() if hasattr(update_data["rules"], "dict") else update_data["rules"]
    
    for field, value in update_data.items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Delete a job posting (employer only, own jobs only)
    """
    job = db.query(Job).filter(Job.id == job_id, Job.employer_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    db.delete(job)
    db.commit()
    
    return None


@router.get("/my/posted", response_model=List[JobResponse])
async def get_my_jobs(
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Get all jobs posted by current employer
    """
    jobs = db.query(Job).filter(Job.employer_id == current_user.id).order_by(Job.created_at.desc()).all()
    return jobs


# ========================================
# APPLICATION ENDPOINTS
# ========================================

@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: int,
    name: str = Form(...),
    phone: str = Form(...),
    current_company: Optional[str] = Form(None),
    current_position: Optional[str] = Form(None),
    current_salary: Optional[float] = Form(None),
    resume: UploadFile = File(...),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """
    Apply to a job with resume upload (candidate only)
    
    - **name**: Applicant name
    - **phone**: Phone number
    - **current_company**: Current company (optional)
    - **current_position**: Current position (optional)
    - **current_salary**: Current salary (optional)
    - **resume**: Resume file (PDF, DOCX, or TXT)
    """
    
    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or inactive"
        )
    
    # Check if already applied
    existing_application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == current_user.id
    ).first()
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )
    
    # Validate file extension
    file_extension = os.path.splitext(resume.filename)[1].lower().replace(".", "")
    if file_extension not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Create storage directory for this job
    job_storage_dir = os.path.join(settings.UPLOAD_DIR, "jobs", str(job_id), "uploads")
    os.makedirs(job_storage_dir, exist_ok=True)
    
    # Save resume file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{current_user.id}_{timestamp}_{resume.filename}"
    resume_path = os.path.join(job_storage_dir, safe_filename)
    
    with open(resume_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)
    
    # Evaluate resume using AI
    try:
        job_rules = job.rules if job.rules else {}
        evaluation = evaluate_resume(
            resume_path=resume_path,
            rules=job_rules,
            job_description=job.description or ""
        )
        
        application_status = ApplicationStatus.SELECTED if evaluation.get("decision") == "selected" else ApplicationStatus.REJECTED
        score = evaluation.get("score")
        explanation = evaluation
        
    except Exception as e:
        # If evaluation fails, mark as pending
        application_status = ApplicationStatus.PENDING
        score = None
        explanation = {"error": str(e), "note": "Manual review required"}
    
    # Create application record
    new_application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        name=name,
        phone=phone,
        current_company=current_company,
        current_position=current_position,
        current_salary=current_salary,
        resume_path=resume_path,
        status=application_status,
        score=score,
        explanation=explanation
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    # Send email notifications (async, non-blocking)
    try:
        # Send confirmation to candidate
        await send_application_confirmation(
            candidate_email=current_user.email,
            candidate_name=current_user.name,
            job_title=job.title,
            company=job.company
        )
        
        # Send result to candidate
        await send_application_result(
            candidate_email=current_user.email,
            candidate_name=current_user.name,
            job_title=job.title,
            company=job.company,
            status=application_status.value,
            score=score
        )
        
        # Notify employer
        employer = db.query(User).filter(User.id == job.employer_id).first()
        if employer:
            await send_new_application_notification(
                employer_email=employer.email,
                employer_name=employer.name,
                job_title=job.title,
                candidate_name=name,
                status=application_status.value
            )
    except Exception as email_error:
        print(f"Email notification failed: {email_error}")
    
    return new_application


@router.get("/{job_id}/applications", response_model=List[ApplicationResponse])
async def get_job_applications(
    job_id: int,
    status: Optional[ApplicationStatus] = None,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Get all applications for a job (employer only, own jobs only)
    
    - **job_id**: Job ID
    - **status**: Filter by status (selected, rejected, pending)
    """
    
    # Verify job belongs to employer
    job = db.query(Job).filter(Job.id == job_id, Job.employer_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    query = db.query(Application).filter(Application.job_id == job_id)
    if status:
        query = query.filter(Application.status == status)
    
    applications = query.order_by(Application.score.desc().nullslast()).all()
    return applications


@router.get("/applications/my", response_model=List[ApplicationListResponse])
async def get_my_applications(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """
    Get all applications submitted by current candidate
    """
    applications = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    
    # Transform to include job details
    result = []
    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        result.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown",
            "company": job.company if job else "Unknown",
            "status": app.status,
            "score": app.score,
            "created_at": app.created_at
        })
    
    return result


@router.get("/{job_id}/stats", response_model=JobStats)
async def get_job_stats(
    job_id: int,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Get statistics for a job (employer only, own jobs only)
    """
    
    # Verify job belongs to employer
    job = db.query(Job).filter(Job.id == job_id, Job.employer_id == current_user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    applications = db.query(Application).filter(Application.job_id == job_id).all()
    
    total = len(applications)
    selected = len([a for a in applications if a.status == ApplicationStatus.SELECTED])
    rejected = len([a for a in applications if a.status == ApplicationStatus.REJECTED])
    pending = len([a for a in applications if a.status == ApplicationStatus.PENDING])
    
    scores = [a.score for a in applications if a.score is not None]
    avg_score = sum(scores) / len(scores) if scores else None
    
    return {
        "job_id": job_id,
        "total_applications": total,
        "selected_count": selected,
        "rejected_count": rejected,
        "pending_count": pending,
        "avg_score": avg_score,
        "top_skills": []
    }

@router.get("/{job_id}/applications/{application_id}/download")
async def download_application_files(
    job_id: int,
    application_id: int,
    file_type: str = Query("package", regex="^(resume|report|json|package)$"),
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Download application files (employer only)
    
    Args:
        job_id: Job ID
        application_id: Application ID
        file_type: Type of file to download
            - resume: Original resume only
            - report: AI screening report (PDF)
            - json: Explanation JSON only
            - package: Complete ZIP package (resume + report + json)
    
    Returns:
        File download
    """
    
    # Verify job belongs to employer
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.employer_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    # Get application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.job_id == job_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Get resume path
    resume_path = application.resume_path
    if not os.path.exists(resume_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume file not found"
        )
    
    # Prepare application data
    application_data = {
        "id": application.id,
        "name": application.name,
        "phone": application.phone,
        "current_company": application.current_company,
        "current_position": application.current_position,
        "current_salary": application.current_salary,
        "status": application.status,
        "score": application.score,
        "explanation": application.explanation,
        "created_at": application.created_at.isoformat() if application.created_at else None
    }
    
    job_data = {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "description": job.description
    }
    
    # Handle different file types
    if file_type == "resume":
        # Return original resume
        resume_filename = os.path.basename(resume_path)
        return FileResponse(
            path=resume_path,
            filename=f"{application.name.replace(' ', '_')}_resume{Path(resume_path).suffix}",
            media_type="application/octet-stream"
        )
    
    elif file_type == "report":
        # Generate and return PDF report
        try:
            download_dir = os.path.join(settings.UPLOAD_DIR, "downloads")
            os.makedirs(download_dir, exist_ok=True)
            
            report_generator = AIScreeningReportGenerator()
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_filename = f"{application.name.replace(' ', '_')}_AI_Report_{timestamp}.pdf"
            report_path = os.path.join(download_dir, report_filename)
            
            report_generator.generate_report(application_data, job_data, report_path)
            
            return FileResponse(
                path=report_path,
                filename=report_filename,
                media_type="application/pdf"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate report: {str(e)}"
            )
    
    elif file_type == "json":
        # Return explanation JSON
        import json
        
        json_data = {
            "candidate": {
                "name": application.name,
                "phone": application.phone,
                "current_company": application.current_company,
                "current_position": application.current_position,
            },
            "job": {
                "title": job.title,
                "company": job.company,
            },
            "screening_result": {
                "decision": application.status,
                "score": application.score,
                "explanation": application.explanation
            },
            "metadata": {
                "applied_at": application.created_at.isoformat() if application.created_at else None,
                "exported_at": datetime.now().isoformat()
            }
        }
        
        json_str = json.dumps(json_data, indent=2)
        
        return StreamingResponse(
            iter([json_str]),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename={application.name.replace(' ', '_')}_explanation.json"
            }
        )
    
    elif file_type == "package":
        # Create and return complete ZIP package
        try:
            download_dir = os.path.join(settings.UPLOAD_DIR, "downloads")
            os.makedirs(download_dir, exist_ok=True)
            
            zip_path = create_download_package(
                application_data,
                job_data,
                resume_path,
                download_dir
            )
            
            zip_filename = os.path.basename(zip_path)
            
            return FileResponse(
                path=zip_path,
                filename=zip_filename,
                media_type="application/zip"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create package: {str(e)}"
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file_type parameter"
        )


@router.get("/{job_id}/applications/bulk-download")
async def bulk_download_applications(
    job_id: int,
    application_ids: List[int] = Query(...),
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Download multiple applications as a single ZIP (employer only)
    
    Args:
        job_id: Job ID
        application_ids: List of application IDs to download
    
    Returns:
        ZIP file with all application packages
    """
    
    # Verify job belongs to employer
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.employer_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    if not application_ids or len(application_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No application IDs provided"
        )
    
    if len(application_ids) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot download more than 50 applications at once"
        )
    
    # Get applications
    applications = db.query(Application).filter(
        Application.id.in_(application_ids),
        Application.job_id == job_id
    ).all()
    
    if len(applications) != len(application_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some application IDs not found"
        )
    
    try:
        from zipfile import ZipFile
        import tempfile
        
        download_dir = os.path.join(settings.UPLOAD_DIR, "downloads")
        os.makedirs(download_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        bulk_zip_path = os.path.join(
            download_dir,
            f"{job.title.replace(' ', '_')}_Applications_{timestamp}.zip"
        )
        
        with ZipFile(bulk_zip_path, 'w') as bulk_zip:
            for application in applications:
                # Prepare data
                application_data = {
                    "id": application.id,
                    "name": application.name,
                    "phone": application.phone,
                    "current_company": application.current_company,
                    "current_position": application.current_position,
                    "current_salary": application.current_salary,
                    "status": application.status,
                    "score": application.score,
                    "explanation": application.explanation,
                    "created_at": application.created_at.isoformat() if application.created_at else None
                }
                
                job_data = {
                    "id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "description": job.description
                }
                
                # Create individual package
                individual_zip = create_download_package(
                    application_data,
                    job_data,
                    application.resume_path,
                    download_dir
                )
                
                # Add to bulk zip with folder structure
                folder_name = f"{application.name.replace(' ', '_')}_ID{application.id}"
                bulk_zip.write(
                    individual_zip,
                    f"{folder_name}/{os.path.basename(individual_zip)}"
                )
                
                # Clean up individual zip
                if os.path.exists(individual_zip):
                    os.remove(individual_zip)
        
        return FileResponse(
            path=bulk_zip_path,
            filename=os.path.basename(bulk_zip_path),
            media_type="application/zip"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bulk download: {str(e)}"
        )


@router.get("/{job_id}/applications/export-csv")
async def export_applications_csv(
    job_id: int,
    current_user: User = Depends(get_current_employer),
    db: Session = Depends(get_db)
):
    """
    Export applications as CSV for comparison (employer only)
    
    Args:
        job_id: Job ID
    
    Returns:
        CSV file with all application data
    """
    
    # Verify job belongs to employer
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.employer_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you don't have permission"
        )
    
    # Get all applications
    applications = db.query(Application).filter(
        Application.job_id == job_id
    ).order_by(Application.score.desc().nullslast()).all()
    
    if not applications:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No applications found"
        )
    
    try:
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID',
            'Name',
            'Phone',
            'Current Company',
            'Current Position',
            'Score',
            'Status',
            'Skills Matched',
            'Experience (Years)',
            'Highest Education',
            'Education Grade',
            'Applied Date'
        ])
        
        # Write data rows
        for app in applications:
            explanation = app.explanation or {}
            skills = explanation.get('skills', {})
            experience = explanation.get('experience', {})
            education = explanation.get('education', {})
            
            matched_skills = len(skills.get('matched_required_all', [])) + len(skills.get('matched_required_any', []))
            exp_years = experience.get('estimated_years', 0)
            highest_edu = education.get('candidate_highest', 'N/A')
            
            # Get grade info
            all_quals = education.get('all_qualifications', [])
            grade_display = 'N/A'
            if all_quals:
                for qual in all_quals:
                    if qual.get('grade'):
                        grade = qual['grade']
                        grade_display = f"{grade.get('normalized_percentage', 0)}%"
                        break
            
            writer.writerow([
                app.id,
                app.name,
                app.phone,
                app.current_company or 'N/A',
                app.current_position or 'N/A',
                f"{app.score:.1f}" if app.score else 'N/A',
                app.status,
                matched_skills,
                exp_years,
                highest_edu,
                grade_display,
                app.created_at.strftime('%Y-%m-%d') if app.created_at else 'N/A'
            ])
        
        output.seek(0)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{job.title.replace(' ', '_')}_Applications_{timestamp}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export CSV: {str(e)}"
        )
