import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

export const GlassCard = ({
  children,
  className = '',
  hover = true,
  animate = false,
  onClick,
}: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white/10 backdrop-blur-xl rounded-3xl p-8',
        'shadow-2xl border border-white/20',
        'transition-all duration-500',
        hover && 'hover:scale-105 hover:bg-white/20 hover:shadow-3xl',
        animate && 'animate-fadeIn',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};