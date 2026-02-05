import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      helperText,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn(fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Icon size={20} className="text-gray-400" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'placeholder:text-gray-500',
              'min-w-0', // VIKTIGT: Tillåter fältet att krympa under sin naturliga storlek
              'box-border', // Säkerställer att padding inte ökar totalbredden
              'appearance-none', // Tar bort webbläsarspecifik styling som kan spöka
              Icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />
        </div>

        {(error || helperText) && (
          <p
            className={cn(
              'mt-2 text-sm',
              error ? 'text-red-400' : 'text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;