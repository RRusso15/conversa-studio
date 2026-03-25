import React from 'react';
import { cn } from '../../utils/cn';
interface TabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}
export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex space-x-1 border-b border-slate-200', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              isActive ?
              'border-primary-600 text-primary-600' :
              'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}>
            
            {tab.icon &&
            <span
              className={cn(
                'w-4 h-4',
                isActive ? 'text-primary-600' : 'text-slate-400'
              )}>
              
                {tab.icon}
              </span>
            }
            {tab.label}
          </button>);

      })}
    </div>);

}