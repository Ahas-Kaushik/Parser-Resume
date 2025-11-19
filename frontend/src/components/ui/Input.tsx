import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-white/90 font-medium mb-2 text-sm">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <div className="text-white/60">{icon}</div>
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full py-3 px-4 bg-white/10 border border-white/30 rounded-xl',
              'text-white placeholder-white/50',
              'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent',
              'backdrop-blur-sm transition-all',
              icon && 'pl-12',
              error && 'border-red-400/50 focus:ring-red-400/50',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';