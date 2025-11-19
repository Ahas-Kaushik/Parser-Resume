"""
Email Notification Utilities
Sends email notifications for applications using SMTP
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.config import settings


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html: bool = True
) -> bool:
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (HTML or plain text)
        html: Whether body is HTML (default: True)
    
    Returns:
        True if sent successfully, False otherwise
    """
    
    if not settings.EMAIL_ENABLED:
        print(f"[EMAIL DISABLED] Would send to {to_email}: {subject}")
        return False
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("[EMAIL ERROR] SMTP credentials not configured")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email
        message["Subject"] = subject
        
        if html:
            message.attach(MIMEText(body, "html"))
        else:
            message.attach(MIMEText(body, "plain"))
        
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        
        print(f"✓ Email sent to {to_email}")
        return True
    
    except Exception as e:
        print(f"✗ Failed to send email to {to_email}: {e}")
        return False


async def send_application_confirmation(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str
) -> bool:
    """
    Send application confirmation email to candidate
    
    Args:
        candidate_email: Candidate's email
        candidate_name: Candidate's name
        job_title: Job title applied for
        company: Company name
    
    Returns:
        True if sent successfully
    """
    
    subject = f"Application Received: {job_title} at {company}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .highlight {{ color: #667eea; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✓ Application Received!</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{candidate_name}</strong>,</p>
                
                <p>Thank you for applying to the position of <span class="highlight">{job_title}</span> at <span class="highlight">{company}</span>.</p>
                
                <p>Your application has been successfully received and is currently being reviewed by our AI-powered screening system.</p>
                
                <p>You will receive a notification once your application has been processed. This usually takes just a few moments.</p>
                
                <p>We appreciate your interest in joining our team!</p>
                
                <br>
                <p>Best regards,<br>
                <strong>{settings.APP_NAME} Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(candidate_email, subject, body, html=True)


async def send_application_result(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str,
    status: str,
    score: Optional[float] = None
) -> bool:
    """
    Send application result email to candidate
    
    Args:
        candidate_email: Candidate's email
        candidate_name: Candidate's name
        job_title: Job title
        company: Company name
        status: Application status (selected/rejected)
        score: AI screening score (optional)
    
    Returns:
        True if sent successfully
    """
    
    subject = f"Application Update: {job_title} at {company}"
    
    if status == "selected":
        status_color = "#10b981"
        status_emoji = "🎉"
        message = f"Congratulations! Your application has been <strong style='color: {status_color};'>SELECTED</strong> for further review."
        if score:
            message += f"<br>Your AI screening score: <strong>{score:.1f}/100</strong>"
        next_steps = "<p>The hiring team will review your application and contact you soon for the next steps.</p>"
    else:
        status_color = "#ef4444"
        status_emoji = "📋"
        message = f"Thank you for your interest. After careful review, your application was <strong style='color: {status_color};'>not selected</strong> for this position at this time."
        next_steps = "<p>We encourage you to apply for other positions that match your skills and experience.</p>"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .job-info {{ background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{status_emoji} Application Update</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{candidate_name}</strong>,</p>
                
                <p>{message}</p>
                
                <div class="job-info">
                    <p style="margin: 5px 0;"><strong>Position:</strong> {job_title}</p>
                    <p style="margin: 5px 0;"><strong>Company:</strong> {company}</p>
                </div>
                
                {next_steps}
                
                <br>
                <p>Best regards,<br>
                <strong>{settings.APP_NAME} Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(candidate_email, subject, body, html=True)


async def send_new_application_notification(
    employer_email: str,
    employer_name: str,
    job_title: str,
    candidate_name: str,
    status: str
) -> bool:
    """
    Notify employer of new application
    
    Args:
        employer_email: Employer's email
        employer_name: Employer's name
        job_title: Job title
        candidate_name: Candidate's name
        status: AI screening result (selected/rejected)
    
    Returns:
        True if sent successfully
    """
    
    subject = f"New Application: {job_title}"
    
    status_badge = f"<span style='background: {'#10b981' if status == 'selected' else '#ef4444'}; color: white; padding: 5px 10px; border-radius: 5px;'>{status.upper()}</span>"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📥 New Application Received</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{employer_name}</strong>,</p>
                
                <p>A new candidate has applied for the position of <strong>{job_title}</strong>.</p>
                
                <p><strong>Candidate:</strong> {candidate_name}</p>
                <p><strong>AI Screening Result:</strong> {status_badge}</p>
                
                <p>You can review the full application details in your employer dashboard.</p>
                
                <a href="http://localhost:5173/employer/dashboard" class="button">View Dashboard</a>
                
                <br><br>
                <p>Best regards,<br>
                <strong>{settings.APP_NAME} Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(employer_email, subject, body, html=True)