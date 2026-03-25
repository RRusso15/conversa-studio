import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  UserIcon,
  BuildingIcon,
  PlusIcon,
  LayoutTemplateIcon,
  SparklesIcon } from
'lucide-react';
export function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const handleNext = () => {
    if (step === 1) setStep(2);else
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 p-4">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="mb-12 text-center">
          <p className="text-sm font-medium text-primary-600 mb-2">
            Step {step} of 2
          </p>
          <div className="flex justify-center gap-2">
            <div
              className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-slate-200'}`} />
            
            <div
              className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`} />
            
          </div>
        </div>

        {step === 1 &&
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-4">
              How will you use FlowForge?
            </h1>
            <p className="text-slate-500 text-center mb-10">
              We'll tailor your experience based on your needs.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Card
              hoverable
              className="border-2 border-transparent hover:border-primary-500"
              onClick={() => setStep(2)}>
              
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Personal
                  </h3>
                  <p className="text-slate-500">
                    I'm building for myself, a side project, or learning.
                  </p>
                </div>
              </Card>

              <Card
              hoverable
              className="border-2 border-transparent hover:border-primary-500"
              onClick={() => setStep(2)}>
              
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                    <BuildingIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Business
                  </h3>
                  <p className="text-slate-500">
                    I'm building for my company or clients.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        }

        {step === 2 &&
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-4">
              Let's create your first bot
            </h1>
            <p className="text-slate-500 text-center mb-10">
              Choose how you want to start building.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <Card
              hoverable
              className="flex flex-col h-full"
              onClick={() => navigate('/builder/new')}>
              
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-4">
                  <PlusIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Start from Blank
                </h3>
                <p className="text-sm text-slate-500 flex-1">
                  Build your conversational flow from scratch using our visual
                  canvas.
                </p>
              </Card>

              <Card
              hoverable
              className="flex flex-col h-full"
              onClick={() => navigate('/templates')}>
              
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <LayoutTemplateIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Use a Template
                </h3>
                <p className="text-sm text-slate-500 flex-1">
                  Start fast with pre-built flows for support, lead gen, and
                  more.
                </p>
              </Card>

              <Card
              hoverable
              className="flex flex-col h-full border-primary-200 bg-primary-50/30"
              onClick={() => navigate('/generate')}>
              
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Generate with AI
                </h3>
                <p className="text-sm text-slate-500 flex-1">
                  Describe what you want, and our AI will build the initial
                  flow.
                </p>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Skip for now
              </Button>
            </div>
          </div>
        }
      </div>
    </div>);

}