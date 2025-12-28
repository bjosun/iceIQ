import React from 'react';
import { cn } from '../../utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

export default function Card({
  children,
  className,
  elevated = false,
  interactive = false,
  padding = 'md',
  border = true,
  ...props
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={cn(
        'rounded-2xl',
        border && 'border border-gray-700',
        elevated ? 'bg-gray-800' : 'bg-gray-800/50',
        paddingStyles[padding],
        interactive && 'hover:bg-gray-750 transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}