import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NodePalette } from '../components/builder/NodePalette';
import { Canvas } from '../components/builder/Canvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { ChatSimulator } from '../components/builder/ChatSimulator';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeftIcon,
  PlayIcon,
  RocketIcon,
  UsersIcon,
  CheckIcon } from
'lucide-react';
export function Builder() {
  const navigate = useNavigate();
  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 bg-white z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900">Customer Support Bot</h1>
              <Badge variant="success" size="sm">
                Saved
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Last edited just now</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<UsersIcon className="w-4 h-4" />}>
            
            Share
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <Button
            variant="outline"
            size="sm"
            icon={<CheckIcon className="w-4 h-4 text-green-500" />}>
            
            Validate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<PlayIcon className="w-4 h-4" />}>
            
            Test
          </Button>
          <Button size="sm" icon={<RocketIcon className="w-4 h-4" />}>
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <NodePalette />
        <Canvas />
        <PropertiesPanel />
      </div>

      {/* Floating Simulator */}
      <ChatSimulator />
    </div>);

}