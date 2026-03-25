import React from 'react';
import { Sidebar } from './Sidebar';
export function DashboardLayout({ children }: {children: React.ReactNode;}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </div>
    </div>);

}