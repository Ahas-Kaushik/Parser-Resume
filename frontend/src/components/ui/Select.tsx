import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-white/90 font-medium mb-2 text-sm">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full py-3 px-4 bg-white/10 border border-white/30 rounded-xl',
              'text-white',
              'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent',
              'backdrop-blur-sm transition-all',
              'appearance-none cursor-pointer',
              error && 'border-red-400/50 focus:ring-red-400/50',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-gray-800 text-white"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <ChevronDown className="w-5 h-5 text-white/60" />
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-300">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';