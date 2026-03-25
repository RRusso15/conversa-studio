import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
export function Analytics() {
  const lineData = [
  {
    name: 'Mon',
    count: 120
  },
  {
    name: 'Tue',
    count: 180
  },
  {
    name: 'Wed',
    count: 250
  },
  {
    name: 'Thu',
    count: 210
  },
  {
    name: 'Fri',
    count: 290
  },
  {
    name: 'Sat',
    count: 150
  },
  {
    name: 'Sun',
    count: 130
  }];

  const barData = [
  {
    name: 'Welcome',
    drop: 5
  },
  {
    name: 'Ask Email',
    drop: 15
  },
  {
    name: 'Pricing FAQ',
    drop: 45
  },
  {
    name: 'Book Demo',
    drop: 25
  },
  {
    name: 'Handoff',
    drop: 10
  }];

  const pieData = [
  {
    name: 'Support',
    value: 400
  },
  {
    name: 'Pricing',
    value: 300
  },
  {
    name: 'Sales',
    value: 200
  },
  {
    name: 'Other',
    value: 100
  }];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#64748B'];
  const kpis = [
  {
    label: 'Total Conversations',
    value: '1,234',
    trend: '+12%',
    positive: true
  },
  {
    label: 'Completion Rate',
    value: '78%',
    trend: '+5%',
    positive: true
  },
  {
    label: 'Fallback Rate',
    value: '12%',
    trend: '-2%',
    positive: true
  },
  {
    label: 'Avg Duration',
    value: '3m 24s',
    trend: '+15s',
    positive: false
  }];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">
            Monitor your chatbot's performance.
          </p>
        </div>
        <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This Month</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) =>
        <Card key={i}>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {kpi.label}
            </p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-bold text-slate-900">{kpi.value}</h3>
              <span
              className={`text-sm font-medium ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
              
                {kpi.trend}
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Conversations over time
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0" />
                
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12
                  }}
                  dy={10} />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12
                  }}
                  dx={-10} />
                
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
                  }} />
                
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#4F46E5',
                    strokeWidth: 2,
                    stroke: '#fff'
                  }}
                  activeDot={{
                    r: 6
                  }} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Drop-off by Node
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{
                  left: 20
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0" />
                
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12
                  }} />
                
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12
                  }}
                  width={80} />
                
                <Tooltip
                  cursor={{
                    fill: '#f1f5f9'
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
                  }} />
                
                <Bar
                  dataKey="drop"
                  fill="#F59E0B"
                  radius={[0, 4, 4, 0]}
                  barSize={24} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Intents</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value">
                  
                  {pieData.map((entry, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]} />

                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
                  }} />
                
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-3">
              {pieData.map((entry, index) =>
              <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[index]
                  }}>
                </div>
                  <span className="text-slate-600 flex-1">{entry.name}</span>
                  <span className="font-medium text-slate-900">
                    {entry.value}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>);

}