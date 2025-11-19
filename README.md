# 🚀 AI-Powered Job Portal - Resume Screening System

A modern, full-stack job portal application with AI-powered resume screening, featuring a beautiful glassmorphism UI design.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

## 🌟 Features

### For Job Seekers (Candidates)
- ✅ **Browse Jobs** - Search and filter job listings
- ✅ **Easy Apply** - Upload resume and apply in seconds
- ✅ **AI Screening** - Instant feedback on application status
- ✅ **Track Applications** - Monitor all your applications
- ✅ **Real-time Chat** - Connect with employers and other candidates
- ✅ **Profile Management** - Update your profile and preferences

### For Employers
- ✅ **Post Jobs** - Create job listings with custom requirements
- ✅ **AI Resume Screening** - Automatic candidate evaluation
- ✅ **Smart Scoring** - Weighted scoring system for candidates
- ✅ **Application Management** - View selected/rejected candidates
- ✅ **Analytics Dashboard** - Detailed statistics and insights
- ✅ **Email Notifications** - Automated candidate communications

### AI-Powered Resume Screening
- 🤖 **Skill Extraction** - Automatically identifies technical skills
- 📊 **Experience Parsing** - Detects years of experience
- 🎓 **Education Verification** - Checks degree requirements
- 📍 **Location Matching** - Filters by location preferences
- 🔢 **Weighted Scoring** - Customizable scoring algorithm
- 📝 **Explainability** - Detailed explanations for every decision

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI 0.104+
- **Database:** SQLAlchemy with SQLite (dev) / PostgreSQL (prod)
- **Authentication:** JWT tokens with python-jose
- **ML/AI:** scikit-learn for TF-IDF similarity
- **Document Parsing:** PyPDF2, python-docx
- **Email:** aiosmtplib for async email sending

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS with custom glassmorphism theme
- **State Management:** Zustand
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React

## 📦 Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Edit .env file with your configuration
# Generate a secure JWT_SECRET: python -c "import secrets; print(secrets.token_urlsafe(32))"

# Run the backend
uvicorn app.main:app --reload --port 8000