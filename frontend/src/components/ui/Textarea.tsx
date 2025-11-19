import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-white/90 font-medium mb-2 text-sm">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full py-3 px-4 bg-white/10 border border-white/30 rounded-xl',
            'text-white placeholder-white/50',
            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent',
            'backdrop-blur-sm transition-all',
            'resize-vertical min-h-[100px]',
            error && 'border-red-400/50 focus:ring-red-400/50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';