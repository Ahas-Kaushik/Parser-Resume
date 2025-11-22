"""
AI Screening Report Generator
Generates formatted PDF reports and ZIP packages for application downloads
"""

import os
import io
import json
from datetime import datetime
from typing import Dict, Any, Optional
from zipfile import ZipFile
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image as RLImage, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas


class AIScreeningReportGenerator:
    """Generate formatted PDF reports for AI screening results"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#3730a3'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        # Success style (green)
        self.styles.add(ParagraphStyle(
            name='Success',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#065f46'),
            leftIndent=20,
            spaceAfter=6
        ))
        
        # Error style (red)
        self.styles.add(ParagraphStyle(
            name='Error',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#991b1b'),
            leftIndent=20,
            spaceAfter=6
        ))
        
        # Info style
        self.styles.add(ParagraphStyle(
            name='Info',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=6
        ))
    
    def generate_report(
        self,
        application_data: Dict[str, Any],
        job_data: Dict[str, Any],
        output_path: str
    ) -> str:
        """
        Generate a comprehensive PDF report
        
        Args:
            application_data: Application with explanation JSON
            job_data: Job posting data
            output_path: Path to save the PDF
        
        Returns:
            Path to generated PDF
        """
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        
        # Header
        story.extend(self._create_header(application_data, job_data))
        
        # Summary Section
        story.extend(self._create_summary_section(application_data))
        
        # Score Breakdown
        if application_data.get('score') is not None:
            story.extend(self._create_score_section(application_data))
        
        # Passed/Failed Checks
        story.extend(self._create_checks_section(application_data))
        
        # Skills Analysis
        story.extend(self._create_skills_section(application_data))
        
        # Experience Analysis
        story.extend(self._create_experience_section(application_data))
        
        # Education Analysis
        story.extend(self._create_education_section(application_data))
        
        # Footer
        story.extend(self._create_footer())
        
        # Build PDF
        doc.build(story)
        
        return output_path
    
    def _create_header(self, application_data: Dict[str, Any], job_data: Dict[str, Any]) -> list:
        """Create report header"""
        elements = []
        
        # Title
        title = Paragraph(
            "AI SCREENING REPORT",
            self.styles['CustomTitle']
        )
        elements.append(title)
        elements.append(Spacer(1, 0.2*inch))
        
        # Candidate and Job Info Table
        info_data = [
            ['Candidate:', application_data.get('name', 'N/A')],
            ['Job Position:', job_data.get('title', 'N/A')],
            ['Company:', job_data.get('company', 'N/A')],
            ['Applied On:', self._format_date(application_data.get('created_at', ''))],
            ['Report Generated:', datetime.now().strftime('%B %d, %Y at %I:%M %p')]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4.5*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Divider line
        elements.append(self._create_line())
        
        return elements
    
    def _create_summary_section(self, application_data: Dict[str, Any]) -> list:
        """Create summary section with decision and score"""
        elements = []
        
        elements.append(Paragraph("Summary", self.styles['SectionHeader']))
        
        explanation = application_data.get('explanation', {})
        decision = application_data.get('status', 'pending').upper()
        score = application_data.get('score')
        
        # Decision and Score Table
        summary_data = []
        
        # Decision row
        decision_color = '#10b981' if decision == 'SELECTED' else '#ef4444' if decision == 'REJECTED' else '#f59e0b'
        summary_data.append([
            Paragraph('<b>Decision:</b>', self.styles['Info']),
            Paragraph(f'<font color="{decision_color}"><b>{decision}</b></font>', self.styles['Info'])
        ])
        
        # Score row
        if score is not None:
            score_color = '#10b981' if score >= 70 else '#f59e0b' if score >= 50 else '#ef4444'
            summary_data.append([
                Paragraph('<b>AI Score:</b>', self.styles['Info']),
                Paragraph(f'<font color="{score_color}"><b>{score:.1f}/100</b></font>', self.styles['Info'])
            ])
        
        # Applied date
        summary_data.append([
            Paragraph('<b>Application Date:</b>', self.styles['Info']),
            Paragraph(self._format_date(application_data.get('created_at', '')), self.styles['Info'])
        ])
        
        summary_table = Table(summary_data, colWidths=[2*inch, 4.5*inch])
        summary_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_score_section(self, application_data: Dict[str, Any]) -> list:
        """Create score breakdown section"""
        elements = []
        
        explanation = application_data.get('explanation', {})
        scoring = explanation.get('scoring', {})
        
        if not scoring.get('enabled'):
            return elements
        
        elements.append(Paragraph("Score Breakdown", self.styles['SectionHeader']))
        
        weights = scoring.get('weights', {})
        threshold = scoring.get('threshold', 50)
        score = application_data.get('score', 0)
        
        # Score breakdown table
        score_data = [
            ['<b>Component</b>', '<b>Weight</b>', '<b>Description</b>']
        ]
        
        component_descriptions = {
            'skills_all': 'Required Skills Match',
            'skills_any': 'Preferred Skills Match',
            'experience': 'Years of Experience',
            'similarity': 'Overall Skill Similarity',
            'education': 'Education Qualifications',
            'degree': 'Degree Requirements'
        }
        
        for key, weight in weights.items():
            description = component_descriptions.get(key, key.replace('_', ' ').title())
            score_data.append([
                description,
                f'{weight}%',
                '✓' if score >= threshold else '○'
            ])
        
        score_table = Table(score_data, colWidths=[3*inch, 1.5*inch, 2*inch])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#3730a3')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(score_table)
        elements.append(Spacer(1, 0.15*inch))
        
        # Threshold info
        threshold_text = f"<b>Passing Threshold:</b> {threshold}/100 | <b>Candidate Score:</b> {score}/100"
        elements.append(Paragraph(threshold_text, self.styles['Info']))
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_checks_section(self, application_data: Dict[str, Any]) -> list:
        """Create passed/failed checks section"""
        elements = []
        
        explanation = application_data.get('explanation', {})
        summary = explanation.get('summary', {})
        
        reasons_pass = summary.get('reasons_pass', [])
        reasons_fail = summary.get('reasons_fail', [])
        
        # Passed Checks
        if reasons_pass:
            elements.append(Paragraph("✓ Passed Checks", self.styles['SectionHeader']))
            
            for reason in reasons_pass:
                elements.append(Paragraph(f"• {reason}", self.styles['Success']))
            
            elements.append(Spacer(1, 0.15*inch))
        
        # Failed Checks
        if reasons_fail:
            elements.append(Paragraph("✗ Failed Checks", self.styles['SectionHeader']))
            
            for reason in reasons_fail:
                elements.append(Paragraph(f"• {reason}", self.styles['Error']))
            
            elements.append(Spacer(1, 0.15*inch))
        
        return elements
    
    def _create_skills_section(self, application_data: Dict[str, Any]) -> list:
        """Create skills analysis section"""
        elements = []
        
        explanation = application_data.get('explanation', {})
        skills = explanation.get('skills', {})
        
        if not skills:
            return elements
        
        elements.append(Paragraph("Skills Analysis", self.styles['SectionHeader']))
        
        candidate_skills = skills.get('candidate_skills', [])
        matched_all = skills.get('matched_required_all', [])
        missing_all = skills.get('missing_required_all', [])
        matched_any = skills.get('matched_required_any', [])
        similarity = skills.get('similarity', 0)
        
        # Skills summary table
        skills_data = [
            ['<b>Category</b>', '<b>Details</b>']
        ]
        
        skills_data.append([
            'Candidate Skills',
            f'{len(candidate_skills)} skills detected'
        ])
        
        if matched_all:
            skills_data.append([
                '✓ Matched Required',
                ', '.join(matched_all[:10]) + ('...' if len(matched_all) > 10 else '')
            ])
        
        if missing_all:
            skills_data.append([
                '✗ Missing Required',
                ', '.join(missing_all[:10]) + ('...' if len(missing_all) > 10 else '')
            ])
        
        if matched_any:
            skills_data.append([
                '◆ Matched Preferred',
                ', '.join(matched_any[:10]) + ('...' if len(matched_any) > 10 else '')
            ])
        
        skills_data.append([
            'Overall Similarity',
            f'{similarity * 100:.1f}%'
        ])
        
        skills_table = Table(skills_data, colWidths=[2*inch, 4.5*inch])
        skills_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#3730a3')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(skills_table)
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_experience_section(self, application_data: Dict[str, Any]) -> list:
        """Create experience analysis section"""
        elements = []
        
        explanation = application_data.get('explanation', {})
        experience = explanation.get('experience', {})
        
        if not experience:
            return elements
        
        elements.append(Paragraph("Experience Analysis", self.styles['SectionHeader']))
        
        estimated = experience.get('estimated_years', 0)
        required = experience.get('min_required_years', 0)
        meets = experience.get('meets_requirement', False)
        
        exp_data = [
            ['<b>Metric</b>', '<b>Value</b>'],
            ['Estimated Years', f'{estimated} years'],
            ['Required Years', f'{required} years'],
            ['Status', '✓ Meets Requirement' if meets else '✗ Below Requirement']
        ]
        
        exp_table = Table(exp_data, colWidths=[3*inch, 3.5*inch])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#3730a3')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(exp_table)
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_education_section(self, application_data: Dict[str, Any]) -> list:
        """Create education analysis section"""
        elements = []
        
        explanation = application_data.get('explanation', {})
        education = explanation.get('education', {})
        
        if not education or not education.get('enabled', True):
            return elements
        
        elements.append(Paragraph("Education Analysis", self.styles['SectionHeader']))
        
        all_quals = education.get('all_qualifications', [])
        candidate_highest = education.get('candidate_highest', 'none')
        
        if all_quals:
            # Create table for each qualification
            for qual in all_quals:
                qual_data = []
                
                level = qual.get('level', 'Unknown').title()
                field = qual.get('field', 'Not specified')
                year = qual.get('year')
                grade = qual.get('grade')
                
                qual_data.append(['<b>Level:</b>', level])
                
                if field:
                    qual_data.append(['<b>Field:</b>', field])
                
                if year:
                    qual_data.append(['<b>Year:</b>', str(year)])
                
                if grade:
                    grade_display = f"{grade['raw_value']} ({grade['type'].replace('_', ' ').upper()}) = {grade['normalized_percentage']}%"
                    qual_data.append(['<b>Grade:</b>', grade_display])
                
                qual_table = Table(qual_data, colWidths=[1.5*inch, 5*inch])
                qual_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ]))
                
                elements.append(qual_table)
                elements.append(Spacer(1, 0.1*inch))
        else:
            elements.append(Paragraph(
                f"Highest Qualification Detected: {candidate_highest.title()}",
                self.styles['Info']
            ))
        
        # Requirement status
        min_qual_met = education.get('minimum_qualification_met')
        degree_req_met = education.get('degree_requirement_met')
        
        if min_qual_met is not None:
            status_text = "✓ Minimum qualification requirement met" if min_qual_met else "✗ Minimum qualification requirement not met"
            style = self.styles['Success'] if min_qual_met else self.styles['Error']
            elements.append(Paragraph(status_text, style))
        
        if degree_req_met is not None:
            status_text = "✓ Degree requirement met" if degree_req_met else "✗ Degree requirement not met"
            style = self.styles['Success'] if degree_req_met else self.styles['Error']
            elements.append(Paragraph(status_text, style))
        
        elements.append(Spacer(1, 0.2*inch))
        
        return elements
    
    def _create_footer(self) -> list:
        """Create report footer"""
        elements = []
        
        elements.append(Spacer(1, 0.3*inch))
        elements.append(self._create_line())
        
        footer_text = """
        <i>This report was generated automatically by the AI-powered resume screening system.
        The analysis is based on the job requirements configured by the employer and the
        information extracted from the candidate's resume. For any questions or concerns,
        please contact your HR department.</i>
        """
        
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        
        return elements
    
    def _create_line(self):
        """Create a horizontal line"""
        from reportlab.platypus import Flowable
        
        class HorizontalLine(Flowable):
            def __init__(self, width, color=colors.HexColor('#d1d5db')):
                Flowable.__init__(self)
                self.width = width
                self.color = color
            
            def draw(self):
                self.canv.setStrokeColor(self.color)
                self.canv.setLineWidth(1)
                self.canv.line(0, 0, self.width, 0)
        
        return HorizontalLine(6.5*inch)
    
    def _format_date(self, date_str: str) -> str:
        """Format datetime string to readable format"""
        try:
            if not date_str:
                return "N/A"
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime('%B %d, %Y')
        except:
            return date_str


def create_download_package(
    application_data: Dict[str, Any],
    job_data: Dict[str, Any],
    resume_path: str,
    output_dir: str
) -> str:
    """
    Create a complete download package with resume, report, and JSON
    
    Args:
        application_data: Application with explanation
        job_data: Job posting data
        resume_path: Path to candidate's resume
        output_dir: Directory to save package
    
    Returns:
        Path to ZIP file
    """
    os.makedirs(output_dir, exist_ok=True)
    
    candidate_name = application_data.get('name', 'candidate').replace(' ', '_')
    job_title = job_data.get('title', 'position').replace(' ', '_')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    package_name = f"{candidate_name}_{job_title}_{timestamp}"
    zip_path = os.path.join(output_dir, f"{package_name}.zip")
    
    # Generate PDF report
    report_generator = AIScreeningReportGenerator()
    pdf_path = os.path.join(output_dir, f"{package_name}_report.pdf")
    report_generator.generate_report(application_data, job_data, pdf_path)
    
    # Create ZIP package
    with ZipFile(zip_path, 'w') as zipf:
        # Add resume
        if os.path.exists(resume_path):
            resume_ext = os.path.splitext(resume_path)[1]
            zipf.write(resume_path, f"resume{resume_ext}")
        
        # Add PDF report
        if os.path.exists(pdf_path):
            zipf.write(pdf_path, "ai_screening_report.pdf")
        
        # Add explanation JSON
        json_data = {
            "candidate": {
                "name": application_data.get('name'),
                "phone": application_data.get('phone'),
                "current_company": application_data.get('current_company'),
                "current_position": application_data.get('current_position'),
            },
            "job": {
                "title": job_data.get('title'),
                "company": job_data.get('company'),
            },
            "screening_result": {
                "decision": application_data.get('status'),
                "score": application_data.get('score'),
                "explanation": application_data.get('explanation')
            },
            "metadata": {
                "applied_at": application_data.get('created_at'),
                "report_generated_at": datetime.now().isoformat()
            }
        }
        
        json_str = json.dumps(json_data, indent=2)
        zipf.writestr("explanation.json", json_str)
        
        # Add README
        readme = f"""
AI SCREENING PACKAGE
====================

Candidate: {application_data.get('name')}
Position: {job_data.get('title')}
Company: {job_data.get('company')}

Package Contents:
-----------------
1. resume.* - Original resume submitted by candidate
2. ai_screening_report.pdf - Formatted PDF report with detailed analysis
3. explanation.json - Raw JSON data with all screening details
4. README.txt - This file

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

For questions, contact your HR department.
        """
        zipf.writestr("README.txt", readme)
    
    # Clean up temporary PDF
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    
    return zip_path