import { ReactNode, ButtonHTMLAttributes } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'purple' | 'blue' | 'indigo' | 'success' | 'danger';
  fullWidth?: boolean;
  showArrow?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GlassButton = ({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  showArrow = false,
  loading = false,
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  ...props
}: GlassButtonProps) => {
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
    secondary: 'bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/40 hover:border-white/60',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  };

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-4 px-6',
    lg: 'py-5 px-8 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        variants[variant],
        sizes[size],
        'text-white font-bold rounded-xl',
        'transition-all duration-300 shadow-lg hover:shadow-2xl',
        'transform hover:-translate-y-1 active:scale-95',
        'flex items-center justify-center group',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {children}
          {showArrow && (
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          )}
        </>
      )}
    </button>
  );
};