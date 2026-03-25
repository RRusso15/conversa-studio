import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SparklesIcon, ArrowRightIcon } from 'lucide-react';
export function Generate() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const examples = [
  'A customer support bot for an online shoe store with FAQ and order tracking.',
  'A real estate lead capture bot that asks for budget and preferred neighborhoods.',
  'An IT helpdesk bot that helps employees reset passwords or file tickets.'];

  const handleGenerate = () => {
    if (!prompt) return;
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-highlight-50 text-highlight-600 mb-6">
            <SparklesIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Generate Bot from Prompt
          </h1>
          <p className="text-lg text-slate-600">
            Describe what you want your chatbot to do, and our AI will build the
            initial flow for you.
          </p>
        </div>

        {!showPreview ?
        <Card className="p-1">
            <div className="p-4 border-b border-slate-100">
              <textarea
              className="w-full h-40 resize-none outline-none text-lg text-slate-900 placeholder-slate-400 bg-transparent"
              placeholder="Describe your chatbot... Example: Create a customer support bot for an online store with FAQ, order tracking, and refund handling."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)} />
            
            </div>
            <div className="p-4 bg-slate-50 rounded-b-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Try an example
                </p>
                <div className="flex flex-wrap gap-2">
                  {examples.map((ex, i) =>
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors text-left">
                  
                      {ex.substring(0, 40)}...
                    </button>
                )}
                </div>
              </div>
              <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              icon={
              isGenerating ? undefined :
              <SparklesIcon className="w-5 h-5" />

              }>
              
                {isGenerating ? 'Generating...' : 'Generate Bot'}
              </Button>
            </div>
          </Card> :

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="mb-8 overflow-hidden border-highlight-200 shadow-elevated">
              <div className="bg-highlight-50 px-6 py-4 border-b border-highlight-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-highlight-700 font-medium">
                  <SparklesIcon className="w-5 h-5" />
                  Generation Complete
                </div>
                <Badge variant="primary">5 Nodes Created</Badge>
              </div>
              <div className="h-64 bg-dot-pattern bg-slate-50 relative flex items-center justify-center p-8">
                {/* Abstract Preview Diagram */}
                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="w-32 py-2 bg-white border-2 border-primary-500 rounded-lg shadow-sm text-center text-sm font-medium">
                    Start
                  </div>
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                  <div className="w-48 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-center text-sm font-medium">
                    Welcome Message
                  </div>
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                  <div className="flex gap-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-center text-sm font-medium">
                        FAQ AI Node
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-center text-sm font-medium">
                        Order Tracking
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <div className="flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                Start Over
              </Button>
              <Button
              size="lg"
              icon={<ArrowRightIcon className="w-5 h-5" />}
              className="flex-row-reverse"
              onClick={() => navigate('/builder/generated')}>
              
                Open in Builder
              </Button>
            </div>
          </div>
        }
      </div>
    </DashboardLayout>);

}