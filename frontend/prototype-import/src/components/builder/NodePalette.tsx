import React from 'react';
import {
  PlayIcon,
  MessageSquareIcon,
  HelpCircleIcon,
  GitBranchIcon,
  DatabaseIcon,
  CloudIcon,
  SparklesIcon,
  CodeIcon,
  AlertCircleIcon,
  UserIcon,
  StopCircleIcon } from
'lucide-react';
export function NodePalette() {
  const nodes = [
  {
    id: 'start',
    label: 'Start',
    icon: PlayIcon,
    color: 'text-green-600 bg-green-100'
  },
  {
    id: 'message',
    label: 'Message',
    icon: MessageSquareIcon,
    color: 'text-blue-600 bg-blue-100'
  },
  {
    id: 'question',
    label: 'Question',
    icon: HelpCircleIcon,
    color: 'text-purple-600 bg-purple-100'
  },
  {
    id: 'condition',
    label: 'Condition',
    icon: GitBranchIcon,
    color: 'text-orange-600 bg-orange-100'
  },
  {
    id: 'variable',
    label: 'Variable',
    icon: DatabaseIcon,
    color: 'text-cyan-600 bg-cyan-100'
  },
  {
    id: 'api',
    label: 'API Call',
    icon: CloudIcon,
    color: 'text-indigo-600 bg-indigo-100'
  },
  {
    id: 'ai',
    label: 'AI Node',
    icon: SparklesIcon,
    color: 'text-pink-600 bg-pink-100'
  },
  {
    id: 'code',
    label: 'Code',
    icon: CodeIcon,
    color: 'text-slate-600 bg-slate-200'
  },
  {
    id: 'fallback',
    label: 'Fallback',
    icon: AlertCircleIcon,
    color: 'text-yellow-600 bg-yellow-100'
  },
  {
    id: 'handoff',
    label: 'Handoff',
    icon: UserIcon,
    color: 'text-teal-600 bg-teal-100'
  },
  {
    id: 'end',
    label: 'End',
    icon: StopCircleIcon,
    color: 'text-red-600 bg-red-100'
  }];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">Nodes</h2>
        <p className="text-xs text-slate-500 mt-1">Drag and drop to canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodes.map((node) =>
        <div
          key={node.id}
          className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm cursor-grab transition-all">
          
            <div
            className={`w-8 h-8 rounded-md flex items-center justify-center ${node.color}`}>
            
              <node.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {node.label}
            </span>
          </div>
        )}
      </div>
    </div>);

}