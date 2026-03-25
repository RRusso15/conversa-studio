import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { SearchIcon } from 'lucide-react';
export function Templates() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const tabs = [
  {
    id: 'all',
    label: 'All Templates'
  },
  {
    id: 'support',
    label: 'Support'
  },
  {
    id: 'sales',
    label: 'Sales & Lead Gen'
  },
  {
    id: 'ecommerce',
    label: 'E-commerce'
  },
  {
    id: 'internal',
    label: 'Internal Tools'
  }];

  const templates = [
  {
    id: '1',
    title: 'Customer Support Bot',
    desc: 'Handle FAQs, order tracking, and handoff to human agents.',
    category: 'support',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: '2',
    title: 'Lead Capture',
    desc: 'Qualify leads, collect emails, and schedule meetings automatically.',
    category: 'sales',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: '3',
    title: 'Product Recommender',
    desc: 'Help customers find the right product based on their preferences.',
    category: 'ecommerce',
    color: 'from-orange-400 to-red-500'
  },
  {
    id: '4',
    title: 'IT Helpdesk',
    desc: 'Automate password resets and common IT troubleshooting.',
    category: 'internal',
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: '5',
    title: 'Appointment Booking',
    desc: 'Connects with Calendar to book appointments directly in chat.',
    category: 'sales',
    color: 'from-cyan-400 to-blue-500'
  },
  {
    id: '6',
    title: 'Order Tracking',
    desc: 'Allow customers to check their order status using their order ID.',
    category: 'ecommerce',
    color: 'from-yellow-400 to-orange-500'
  }];

  const filteredTemplates =
  activeTab === 'all' ?
  templates :
  templates.filter((t) => t.category === activeTab);
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
        <p className="text-slate-500 mt-1">
          Start fast with pre-built conversational flows.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="w-full sm:w-auto overflow-x-auto" />
        
        <div className="w-full sm:w-64">
          <Input placeholder="Search templates..." className="pl-10" />
          <SearchIcon
            className="w-4 h-4 text-slate-400 absolute mt(-28px) ml-3 pointer-events-none"
            style={{
              marginTop: '-28px'
            }} />
          
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) =>
        <Card
          key={template.id}
          padding="none"
          className="overflow-hidden flex flex-col">
          
            <div
            className={`h-32 bg-gradient-to-br ${template.color} p-4 flex items-end relative overflow-hidden`}>
            
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
              <h3 className="text-white font-bold text-lg relative z-10">
                {template.title}
              </h3>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <p className="text-sm text-slate-600 mb-6 flex-1">
                {template.desc}
              </p>
              <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/builder/new')}>
              
                Use Template
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>);

}