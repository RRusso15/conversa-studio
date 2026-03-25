import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  GlobeIcon,
  SmartphoneIcon,
  MessageSquareIcon,
  CopyIcon,
  CheckIcon } from
'lucide-react';
export function Deployments() {
  const [copied, setCopied] = useState(false);
  const embedCode = `<script>
  window.flowforge = {
    botId: "bot_abc123xyz",
    theme: { primaryColor: "#4F46E5" }
  };
</script>
<script src="https://cdn.flowforge.ai/widget.js" async></script>`;
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Deployments</h1>
        <p className="text-slate-500 mt-1">
          Connect your chatbot to different channels.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Channels List */}
        <div className="lg:col-span-1 space-y-4">
          <Card
            hoverable
            className="border-primary-500 ring-1 ring-primary-500 bg-primary-50/10">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-900 flex items-center justify-center">
                  <GlobeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Web Widget</h3>
                  <p className="text-xs text-slate-500">Embed on your site</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                  <SmartphoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">WhatsApp</h3>
                  <p className="text-xs text-slate-500">Via Twilio API</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </Card>

          <Card hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <MessageSquareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Telegram</h3>
                  <p className="text-xs text-slate-500">BotFather token</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </Card>
        </div>

        {/* Web Widget Customizer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Embed Code
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Paste this snippet just before the closing{' '}
              <code>&lt;/body&gt;</code> tag of your website.
            </p>
            <div className="relative">
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                {embedCode}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-3 right-3"
                icon={
                copied ?
                <CheckIcon className="w-4 h-4 text-green-600" /> :

                <CopyIcon className="w-4 h-4" />

                }
                onClick={handleCopy}>
                
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Appearance
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600 border border-slate-200"></div>
                    <Input defaultValue="#4F46E5" className="w-32" />
                  </div>
                </div>
                <Input label="Bot Name" defaultValue="Support Assistant" />
                <Input
                  label="Welcome Message"
                  multiline
                  rows={2}
                  defaultValue="Hi there! 👋 How can I help you today?" />
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Position
                  </label>
                  <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option>Bottom Right</option>
                    <option>Bottom Left</option>
                  </select>
                </div>
                <Button>Save Changes</Button>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 relative h-[400px] overflow-hidden flex flex-col items-end justify-end">
                <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>

                {/* Mock Chat Widget */}
                <div className="w-72 bg-white rounded-xl shadow-elevated border border-slate-200 overflow-hidden relative z-10 mb-4 flex flex-col">
                  <div className="bg-primary-600 p-4 text-white">
                    <h4 className="font-bold">Support Assistant</h4>
                    <p className="text-xs text-primary-100">
                      Typically replies instantly
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 h-48 flex flex-col gap-3">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-sm text-slate-700 shadow-sm self-start max-w-[85%]">
                      Hi there! 👋 How can I help you today?
                    </div>
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-white">
                    <div className="bg-slate-100 rounded-full px-4 py-2 text-sm text-slate-400">
                      Type a message...
                    </div>
                  </div>
                </div>

                {/* Launcher */}
                <div className="w-14 h-14 bg-gray-900 rounded-full shadow-lg flex items-center justify-center text-white relative z-10 cursor-pointer">
                  <MessageSquareIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>);

}