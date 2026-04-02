import React, { useState } from 'react';
import { RotateCcwIcon, SendIcon, XIcon, MessageSquareIcon } from 'lucide-react';
export function ChatSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 rounded-full shadow-elevated flex items-center justify-center text-white hover:bg-gray-800 transition-colors z-50">
        
        <MessageSquareIcon className="w-6 h-6" />
      </button>);

  }
  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-elevated border border-slate-200 flex flex-col overflow-hidden z-50 h-[500px]">
      {/* Header */}
      <div className="bg-gray-900 p-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <h3 className="font-bold text-sm">Test Simulator</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-primary-200 hover:text-white transition-colors"
            title="Restart">
            
            <RotateCcwIcon className="w-4 h-4" />
          </button>
          <button
            className="text-primary-200 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}>
            
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-4">
        <div className="text-xs text-center text-slate-400 my-2">
          Chat started
        </div>

        {/* Bot Message */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
            <MessageSquareIcon className="w-3 h-3" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-sm text-slate-700 shadow-sm">
            Hi there! 👋 How can I help you today?
          </div>
        </div>

        {/* User Message */}
        <div className="flex items-end justify-end gap-2">
          <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm p-3 text-sm shadow-sm max-w-[80%]">
            I need help getting this chatbot live.
          </div>
        </div>

        {/* Bot Typing */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
            <MessageSquareIcon className="w-3 h-3" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-sm text-slate-700 shadow-sm flex gap-1">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            <div
              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{
                animationDelay: '0.2s'
              }}>
            </div>
            <div
              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{
                animationDelay: '0.4s'
              }}>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
        
        <button className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 flex-shrink-0">
          <SendIcon className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>);

}
