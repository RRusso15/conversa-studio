import React from 'react';
import { cn } from '../../utils/cn';
interface InputProps extends
  React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}
export function Input({
  label,
  error,
  multiline,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const baseStyles =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500';
  const errorStyles = error ?
  'border-red-500 focus:border-red-500 focus:ring-red-500' :
  '';
  return (
    <div className="w-full">
      {label &&
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700 mb-1.5">
        
          {label}
        </label>
      }
      {multiline ?
      <textarea
        id={inputId}
        className={cn(baseStyles, errorStyles, className)}
        {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} /> :


      <input
        id={inputId}
        className={cn(baseStyles, errorStyles, className)}
        {...props as React.InputHTMLAttributes<HTMLInputElement>} />

      }
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>);

}