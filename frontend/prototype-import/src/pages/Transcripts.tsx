import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SearchIcon, FilterIcon, DownloadIcon } from 'lucide-react';
export function Transcripts() {
  const transcripts = [
  {
    id: 'TR-1042',
    date: 'Oct 24, 10:30 AM',
    user: 'Anonymous',
    channel: 'Web',
    duration: '2m 14s',
    status: 'Completed'
  },
  {
    id: 'TR-1041',
    date: 'Oct 24, 09:15 AM',
    user: 'john@example.com',
    channel: 'Web',
    duration: '5m 42s',
    status: 'Handoff'
  },
  {
    id: 'TR-1040',
    date: 'Oct 23, 04:20 PM',
    user: 'Anonymous',
    channel: 'WhatsApp',
    duration: '1m 05s',
    status: 'Dropped'
  },
  {
    id: 'TR-1039',
    date: 'Oct 23, 02:10 PM',
    user: 'sarah.j@acme.co',
    channel: 'Web',
    duration: '8m 30s',
    status: 'Completed'
  },
  {
    id: 'TR-1038',
    date: 'Oct 23, 11:45 AM',
    user: 'Anonymous',
    channel: 'Telegram',
    duration: '0m 45s',
    status: 'Dropped'
  },
  {
    id: 'TR-1037',
    date: 'Oct 22, 03:30 PM',
    user: 'mike@startup.io',
    channel: 'Web',
    duration: '3m 20s',
    status: 'Completed'
  },
  {
    id: 'TR-1036',
    date: 'Oct 22, 01:15 PM',
    user: 'Anonymous',
    channel: 'Web',
    duration: '4m 10s',
    status: 'Handoff'
  }];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'Handoff':
        return <Badge variant="warning">Handoff</Badge>;
      case 'Dropped':
        return <Badge variant="error">Dropped</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transcripts</h1>
          <p className="text-slate-500 mt-1">
            Review past conversations and user interactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white">
            <FilterIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white">
            <DownloadIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="w-72 relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcripts..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
            
          </div>
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Channel</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transcripts.map((t) =>
              <tr
                key={t.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors">
                
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {t.id}
                  </td>
                  <td className="px-6 py-4">{t.date}</td>
                  <td className="px-6 py-4">{t.user}</td>
                  <td className="px-6 py-4">{t.channel}</td>
                  <td className="px-6 py-4">{t.duration}</td>
                  <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <span>Showing 1 to 7 of 42 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">
              Prev
            </button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 bg-slate-50">
              1
            </button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">
              2
            </button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">
              3
            </button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </Card>
    </DashboardLayout>);

}