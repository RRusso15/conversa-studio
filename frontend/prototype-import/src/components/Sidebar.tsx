import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BotIcon,
  LayoutDashboardIcon,
  FolderIcon,
  LayoutTemplateIcon,
  RocketIcon,
  MessageSquareIcon,
  BarChartIcon,
  PlugIcon,
  CreditCardIcon,
  SettingsIcon } from
'lucide-react';
import { cn } from '../utils/cn';
const navItems = [
{
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboardIcon,
  path: '/dashboard'
},
{
  id: 'projects',
  label: 'Projects',
  icon: FolderIcon,
  path: '/dashboard'
},
{
  id: 'templates',
  label: 'Templates',
  icon: LayoutTemplateIcon,
  path: '/templates'
},
{
  id: 'deployments',
  label: 'Deployments',
  icon: RocketIcon,
  path: '/deployments'
},
{
  id: 'transcripts',
  label: 'Transcripts',
  icon: MessageSquareIcon,
  path: '/transcripts'
},
{
  id: 'analytics',
  label: 'Analytics',
  icon: BarChartIcon,
  path: '/analytics'
},
{
  id: 'integrations',
  label: 'Integrations',
  icon: PlugIcon,
  path: '/integrations'
},
{
  id: 'billing',
  label: 'Billing',
  icon: CreditCardIcon,
  path: '/billing'
},
{
  id: 'settings',
  label: 'Settings',
  icon: SettingsIcon,
  path: '/settings'
}];

export function Sidebar() {
  const location = useLocation();
  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2 text-primary-600">
          <BotIcon className="w-6 h-6" />
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Conversa Studio
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ?
                'bg-primary-50 text-primary-700' :
                'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}>
              
              <item.icon
                className={cn(
                  'w-5 h-5',
                  isActive ? 'text-primary-600' : 'text-slate-400'
                )} />
              
              {item.label}
            </Link>);

        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              Jane Doe
            </p>
            <p className="text-xs text-slate-500 truncate">jane@example.com</p>
          </div>
        </div>
      </div>
    </div>);

}