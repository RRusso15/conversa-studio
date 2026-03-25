import React from 'react';
import { cn } from '../../utils/cn';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}
export function Card({
  children,
  className,
  padding = 'md',
  hoverable = false,
  ...props
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-soft',
        hoverable &&
        'transition-all duration-200 hover:shadow-elevated hover:border-primary-200 cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}>
      
      {children}
    </div>);

}