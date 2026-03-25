import React from 'react';
import {
  PlayIcon,
  MessageSquareIcon,
  HelpCircleIcon,
  GitBranchIcon,
  SparklesIcon,
  StopCircleIcon } from
'lucide-react';
export function Canvas() {
  return (
    <div className="flex-1 bg-slate-50 bg-dot-pattern relative overflow-hidden flex items-center justify-center">
      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center p-1">
        <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded">
          -
        </button>
        <span className="text-xs font-medium text-slate-600 px-2">100%</span>
        <button className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded">
          +
        </button>
      </div>

      {/* Static Visual Representation of a Flow */}
      <div className="relative w-full h-full max-w-3xl max-h-[600px] mt-20">
        {/* SVG Lines connecting nodes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            zIndex: 0
          }}>
          
          <path
            d="M 384 80 L 384 140"
            stroke="#cbd5e1"
            strokeWidth="2"
            fill="none" />
          
          <path
            d="M 384 204 L 384 260"
            stroke="#cbd5e1"
            strokeWidth="2"
            fill="none" />
          
          <path
            d="M 384 324 L 384 380"
            stroke="#cbd5e1"
            strokeWidth="2"
            fill="none" />
          

          {/* Branching lines */}
          <path
            d="M 384 444 L 384 470 L 220 470 L 220 500"
            stroke="#cbd5e1"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 4" />
          
          <path
            d="M 384 444 L 384 470 L 548 470 L 548 500"
            stroke="#cbd5e1"
            strokeWidth="2"
            fill="none" />
          
        </svg>

        {/* Nodes */}
        <div className="absolute top-[20px] left-[304px] z-10">
          <NodeCard
            icon={PlayIcon}
            title="Start"
            color="text-green-600 bg-green-100" />
          
        </div>

        <div className="absolute top-[140px] left-[284px] z-10">
          <NodeCard
            icon={MessageSquareIcon}
            title="Welcome Message"
            color="text-blue-600 bg-blue-100" />
          
        </div>

        <div className="absolute top-[260px] left-[284px] z-10">
          <NodeCard
            icon={HelpCircleIcon}
            title="Ask Intent"
            color="text-purple-600 bg-purple-100" />
          
        </div>

        <div className="absolute top-[380px] left-[284px] z-10">
          <NodeCard
            icon={GitBranchIcon}
            title="Check Intent"
            color="text-orange-600 bg-orange-100"
            selected />
          
        </div>

        {/* Branches */}
        <div className="absolute top-[500px] left-[120px] z-10">
          <NodeCard
            icon={SparklesIcon}
            title="FAQ AI Answer"
            color="text-pink-600 bg-pink-100" />
          
        </div>

        <div className="absolute top-[500px] left-[448px] z-10">
          <NodeCard
            icon={StopCircleIcon}
            title="End Chat"
            color="text-red-600 bg-red-100" />
          
        </div>
      </div>
    </div>);

}
function NodeCard({
  icon: Icon,
  title,
  color,
  selected = false





}: {icon: any;title: string;color: string;selected?: boolean;}) {
  return (
    <div
      className={`w-40 bg-white rounded-xl shadow-sm border-2 ${selected ? 'border-primary-500 ring-4 ring-primary-50' : 'border-slate-200'} overflow-hidden relative group cursor-pointer`}>
      
      <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100">
        <div
          className={`w-6 h-6 rounded flex items-center justify-center ${color}`}>
          
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold text-slate-700 truncate">
          {title}
        </span>
      </div>
      <div className="px-3 py-2 bg-slate-50 text-[10px] text-slate-500">
        Configure node...
      </div>

      {/* Connection points */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>);

}