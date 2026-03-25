import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  PlusIcon,
  MoreHorizontalIcon,
  MessageSquareIcon,
  GlobeIcon,
  SmartphoneIcon } from
'lucide-react';
export function Dashboard() {
  const navigate = useNavigate();
  const projects = [
  {
    id: '1',
    name: 'Customer Support Bot',
    status: 'Active',
    channels: ['web', 'whatsapp'],
    edited: '2 hours ago',
    conversations: 1243
  },
  {
    id: '2',
    name: 'Lead Qualification',
    status: 'Draft',
    channels: ['web'],
    edited: '1 day ago',
    conversations: 0
  },
  {
    id: '3',
    name: 'Internal IT Helpdesk',
    status: 'Active',
    channels: ['slack'],
    edited: '3 days ago',
    conversations: 452
  }];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
          <p className="text-slate-500 mt-1">
            Manage and monitor your AI chatbots.
          </p>
        </div>
        <Button
          icon={<PlusIcon className="w-4 h-4" />}
          onClick={() => navigate('/builder/new')}>
          
          New Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) =>
        <Card
          key={project.id}
          hoverable
          className="flex flex-col"
          onClick={() => navigate(`/builder/${project.id}`)}>
          
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900">
                <MessageSquareIcon className="w-5 h-5" />
              </div>
              <button
              className="text-slate-400 hover:text-slate-600 p-1"
              onClick={(e) => e.stopPropagation()}>
              
                <MoreHorizontalIcon className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mb-6">
              <Badge
              variant={project.status === 'Active' ? 'success' : 'default'}
              size="sm">
              
                {project.status}
              </Badge>
              <span className="text-xs text-slate-500">
                Edited {project.edited}
              </span>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500">
                {project.channels.includes('web') &&
              <GlobeIcon className="w-4 h-4" />
              }
                {project.channels.includes('whatsapp') &&
              <SmartphoneIcon className="w-4 h-4" />
              }
                {project.channels.includes('slack') &&
              <MessageSquareIcon className="w-4 h-4" />
              }
              </div>
              <div className="text-sm font-medium text-slate-700">
                {project.conversations.toLocaleString()}{' '}
                <span className="text-slate-400 font-normal">chats</span>
              </div>
            </div>
          </Card>
        )}

        {/* Create New Card */}
        <Card
          hoverable
          className="flex flex-col items-center justify-center text-center border-dashed border-2 bg-slate-50/50 min-h-[220px]"
          onClick={() => navigate('/builder/new')}>
          
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-4">
            <PlusIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-medium text-slate-900">
            Create new project
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Start from scratch or use a template
          </p>
        </Card>
      </div>
    </DashboardLayout>);

}