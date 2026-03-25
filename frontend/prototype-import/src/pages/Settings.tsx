import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const tabs = [
  {
    id: 'profile',
    label: 'Profile'
  },
  {
    id: 'team',
    label: 'Team'
  },
  {
    id: 'api',
    label: 'API Keys'
  },
  {
    id: 'notifications',
    label: 'Notifications'
  }];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences.</p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'profile' &&
          <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Personal Information
              </h3>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                  JD
                </div>
                <div>
                  <Button variant="outline" size="sm" className="mb-2">
                    Upload new picture
                  </Button>
                  <p className="text-xs text-slate-500">
                    JPG, GIF or PNG. Max size of 800K
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <Input label="First Name" defaultValue="Jane" />
                  <Input label="Last Name" defaultValue="Doe" />
                </div>
                <Input
                label="Email Address"
                type="email"
                defaultValue="jane@example.com" />
              
                <Input label="Company" defaultValue="Acme Corp" />

                <div className="pt-4">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </div>
          }

          {activeTab !== 'profile' &&
          <div className="py-12 text-center text-slate-500">
              This section is under construction for the prototype.
            </div>
          }
        </div>
      </Card>
    </DashboardLayout>);

}