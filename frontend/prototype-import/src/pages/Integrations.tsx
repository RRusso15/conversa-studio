import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  DatabaseIcon,
  MailIcon,
  CalendarIcon,
  WebhookIcon,
  CloudIcon,
  MessageSquareIcon } from
'lucide-react';
export function Integrations() {
  const integrations = [
  {
    id: 1,
    name: 'Google Sheets',
    desc: 'Sync collected data directly to a spreadsheet.',
    icon: DatabaseIcon,
    color: 'text-green-600 bg-green-100',
    status: 'Connected'
  },
  {
    id: 2,
    name: 'SendGrid',
    desc: 'Send automated emails from your chatbot flows.',
    icon: MailIcon,
    color: 'text-blue-600 bg-blue-100',
    status: 'Available'
  },
  {
    id: 3,
    name: 'Salesforce',
    desc: 'Create leads and update contacts in your CRM.',
    icon: CloudIcon,
    color: 'text-sky-600 bg-sky-100',
    status: 'Available'
  },
  {
    id: 4,
    name: 'Google Calendar',
    desc: 'Allow users to book meetings directly in chat.',
    icon: CalendarIcon,
    color: 'text-indigo-600 bg-indigo-100',
    status: 'Available'
  },
  {
    id: 5,
    name: 'Slack',
    desc: 'Send notifications and handoff chats to human agents.',
    icon: MessageSquareIcon,
    color: 'text-purple-600 bg-purple-100',
    status: 'Connected'
  },
  {
    id: 6,
    name: 'Webhooks',
    desc: 'Connect to any custom API or backend service.',
    icon: WebhookIcon,
    color: 'text-slate-600 bg-slate-100',
    status: 'Available'
  }];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 mt-1">
          Connect FlowForge with your favorite tools.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) =>
        <Card key={integration.id} className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${integration.color}`}>
              
                <integration.icon className="w-6 h-6" />
              </div>
              {integration.status === 'Connected' &&
            <Badge variant="success">Connected</Badge>
            }
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {integration.name}
            </h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">
              {integration.desc}
            </p>
            <Button
            variant={
            integration.status === 'Connected' ? 'outline' : 'primary'
            }
            fullWidth>
            
              {integration.status === 'Connected' ? 'Configure' : 'Connect'}
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>);

}