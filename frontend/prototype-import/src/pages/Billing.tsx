import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckIcon, CreditCardIcon } from 'lucide-react';
export function Billing() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Usage</h1>
        <p className="text-slate-500 mt-1">
          Manage your subscription and monitor usage.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan */}
          <Card className="border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-slate-900">Pro Plan</h2>
                  <Badge variant="primary">Active</Badge>
                </div>
                <p className="text-slate-500">
                  $49/month, next billing date: Nov 24, 2023
                </p>
              </div>
              <Button variant="outline">Cancel Plan</Button>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">
                    AI Messages
                  </span>
                  <span className="text-slate-500">3,420 / 5,000</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-primary-500 h-2.5 rounded-full"
                    style={{
                      width: '68%'
                    }}>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">Storage</span>
                  <span className="text-slate-500">1.2 GB / 5 GB</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{
                      width: '24%'
                    }}>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Payment Method
            </h3>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Visa ending in 4242
                  </p>
                  <p className="text-xs text-slate-500">Expires 12/2025</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          </Card>
        </div>

        {/* Upgrade */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900 text-white border-none">
            <h3 className="text-xl font-bold mb-2">Need more power?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Upgrade to Business to unlock unlimited AI messages and custom
              integrations.
            </p>

            <div className="text-3xl font-bold mb-6">
              $199
              <span className="text-lg text-slate-500 font-normal">/mo</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
              'Unlimited AI Messages',
              'Custom Integrations',
              'Remove Branding',
              'Priority Support'].
              map((item, i) =>
              <li
                key={i}
                className="flex items-center gap-3 text-sm text-slate-300">
                
                  <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />{' '}
                  {item}
                </li>
              )}
            </ul>

            <Button
              fullWidth
              className="bg-white text-slate-900 hover:bg-slate-100">
              
              Upgrade to Business
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>);

}