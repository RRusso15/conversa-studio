import React from 'react';
import { cn } from '../../utils/cn';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
  'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500',
    outline:
    'border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-500 bg-white',
    ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500',
    danger:
    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm'
  };
  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2'
  };
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}>
      
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>);

}