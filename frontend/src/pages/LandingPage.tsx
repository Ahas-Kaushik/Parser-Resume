import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, Zap, Target, ArrowRight, Briefcase, TrendingUp } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import Navbar from '../components/layout/Navbar';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Resume Screening',
      description: 'Advanced machine learning algorithms evaluate resumes with 95% accuracy',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Smart Matching',
      description: 'Connect candidates with perfect job opportunities using intelligent matching',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Instant Results',
      description: 'Get screening results in seconds, not days. Fast-track your hiring process',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Precision Scoring',
      description: 'Detailed scoring system with skill matching, experience analysis, and more',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Jobs Posted' },
    { number: '50K+', label: 'Candidates' },
    { number: '95%', label: 'Match Accuracy' },
    { number: '<5s', label: 'Screening Time' },
  ];

  return (
    <GlassLayout>
      <Navbar />

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8 animate-fadeIn border border-white/30">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-semibold">AI-Powered Recruitment Platform</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold text-white drop-shadow-2xl tracking-tight mb-6 animate-fadeIn">
            Welcome to Fetch Ya Job
          </h1>

          <p className="text-xl md:text-2xl text-white/90 font-medium drop-shadow-lg mb-12 animate-fadeIn">
            Your AI-Powered Recruitment Platform
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fadeIn">
            <GlassButton
              variant="indigo"
              size="lg"
              showArrow
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </GlassButton>

            <GlassButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/jobs')}
            >
              Browse Jobs
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <GlassCard key={index} animate className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-white/70">{stat.label}</div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-white/80">
            Everything you need for modern recruitment
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <GlassCard key={index} animate hover>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-white/80">
            Simple, fast, and intelligent
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <GlassCard animate className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Post or Apply</h3>
            <p className="text-white/70">
              Employers post jobs with custom screening rules. 
              Candidates browse and apply with their resume.
            </p>
          </GlassCard>

          <GlassCard animate className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">2</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Screening</h3>
            <p className="text-white/70">
              Our AI analyzes resumes instantly, matching skills, 
              experience, and qualifications against job requirements.
            </p>
          </GlassCard>

          <GlassCard animate className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Get Results</h3>
            <p className="text-white/70">
              Receive detailed feedback with scores and explanations. 
              Both parties get instant notifications.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <GlassCard className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of companies and candidates using AI-powered recruitment
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <GlassButton
              variant="indigo"
              size="lg"
              showArrow
              onClick={() => navigate('/register')}
            >
              Start Hiring Today
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
            >
              Sign In
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-6 py-12 border-t border-white/20">
        <div className="text-center text-white/70">
          <p className="mb-2">© 2025 Fetch Ya Job. Built by Ahas Kaushik</p>
        </div>
      </div>
    </GlassLayout>
  );
}