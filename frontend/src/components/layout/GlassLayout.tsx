import { ReactNode } from 'react';

interface GlassLayoutProps {
  children: ReactNode;
  className?: string;
}

export const GlassLayout = ({ children, className = '' }: GlassLayoutProps) => {
  return (
    <div className={`min-h-screen relative overflow-hidden ${className}`}>
      {/* Animated Gradient Background - Softer Teal/Blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 animate-gradient bg-gradient-main"></div>
      
      {/* Floating Orbs - Updated Colors */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};