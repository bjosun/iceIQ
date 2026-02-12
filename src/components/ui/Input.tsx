import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;       // Vänster ikon
  rightIcon?: LucideIcon;  // NY: Höger ikon
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      rightIcon: RightIcon, // Döper om för att använda som komponent
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
          {/* Vänster Ikon */}
          {Icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
              'min-w-0', 
              'box-border', 
              'appearance-none', 
              Icon && 'pl-10',       // Padding för vänster ikon
              RightIcon && 'pr-10',  // Padding för höger ikon
              error && 'border-red-500 focus:ring-red-500',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />

          {/* Höger Ikon (NY) */}
          {RightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <RightIcon size={20} className="text-gray-400" />
            </div>
          )}
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