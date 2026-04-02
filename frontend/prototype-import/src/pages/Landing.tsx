import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  BotIcon,
  SparklesIcon,
  ZapIcon,
  LayoutTemplateIcon,
  BarChartIcon,
  PlugIcon,
  UsersIcon,
  ArrowRightIcon } from
'lucide-react';
export function Landing() {
  const features = [
  {
    icon: ZapIcon,
    title: 'Drag-Drop Builder',
    desc: 'Build complex conversational flows visually without writing a single line of code.'
  },
  {
    icon: SparklesIcon,
    title: 'AI Knowledge Nodes',
    desc: 'Connect your docs and let LLMs handle the heavy lifting for Q&A.'
  },
  {
    icon: BotIcon,
    title: 'Multi-Channel Deploy',
    desc: 'Publish to Web, WhatsApp, Telegram, and Slack with one click.'
  },
  {
    icon: LayoutTemplateIcon,
    title: 'Templates',
    desc: 'Start fast with pre-built templates for support, sales, and internal tools.'
  },
  {
    icon: BotIcon,
    title: 'Prompt-to-Bot',
    desc: 'Describe what you want, and our AI will generate the initial flow for you.'
  },
  {
    icon: BarChartIcon,
    title: 'Analytics',
    desc: 'Track drop-offs, user intents, and conversation success rates in real-time.'
  },
  {
    icon: PlugIcon,
    title: 'Integrations',
    desc: 'Connect to Salesforce, Zendesk, Google Sheets, and custom APIs.'
  },
  {
    icon: UsersIcon,
    title: 'Real-time Collaboration',
    desc: 'Work together with your team on the same canvas simultaneously.'
  }];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600">
            <BotIcon className="w-8 h-8" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Conversa Studio
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900">
              
              Log in
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-highlight-50 text-highlight-700 text-sm font-medium mb-8">
          <SparklesIcon className="w-4 h-4" />
          Introducing Conversa Studio AI 2.0
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
          Build AI Chatbots <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-400">
            Visually & Fast
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          A visual workspace for teams to design, test, and deploy intelligent
          conversational agents across their customer channels.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button
              size="lg"
              icon={<ArrowRightIcon className="w-5 h-5" />}
              className="flex-row-reverse">
              
              Start Building
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>

        {/* Mockup Preview */}
        <div className="mt-16 rounded-xl border border-slate-200 shadow-2xl overflow-hidden bg-slate-50 p-2">
          <div className="rounded-lg border border-slate-200 bg-white aspect-[16/9] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-50"></div>
            {/* Abstract representation of builder */}
            <div className="relative z-10 flex items-center gap-8">
              <div className="w-32 h-16 bg-white border-2 border-primary-500 rounded-lg shadow-md flex items-center justify-center font-medium text-slate-700">
                Start
              </div>
              <div className="h-0.5 w-16 bg-slate-300"></div>
              <div className="w-32 h-16 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center font-medium text-slate-700 gap-2">
                <SparklesIcon className="w-4 h-4 text-primary-500" /> AI Node
              </div>
              <div className="h-0.5 w-16 bg-slate-300"></div>
              <div className="w-32 h-16 bg-white border border-slate-200 rounded-lg shadow-md flex items-center justify-center font-medium text-slate-700">
                End
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need to build better bots
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful features wrapped in a beautiful, intuitive interface.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) =>
            <Card key={i} className="bg-white border-none shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900 mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Launch */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Built for developers shipping real bots
          </h2>
          <p className="text-lg text-slate-600">
            Create an account and get straight into the workspace with the core
            tools needed to build and deploy.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <Card className="border-slate-200 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  What you can do at launch
                </h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  {[
                    'Create an account and enter the developer workspace',
                    'Build conversation flows visually with reusable nodes',
                    'Validate, test, and deploy web chat experiences',
                    'Review transcripts and analytics from one place'
                  ].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Start building immediately
                </h3>
                <p className="text-slate-600 mb-6">
                  Sign up, create your workspace, and build your first bot
                  with the core launch product.
                </p>
                <Link to="/signup">
                  <Button fullWidth>Get Started</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>);

}
