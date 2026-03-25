import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { GitBranchIcon, PlusIcon, TrashIcon } from 'lucide-react';
export function PropertiesPanel() {
  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
          <GitBranchIcon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Condition</h2>
          <p className="text-xs text-slate-500">Check Intent</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Input label="Node Name" defaultValue="Check Intent" />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Paths
          </label>

          <div className="space-y-3">
            {/* Path 1 */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 relative group">
              <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-4 h-4" />
              </button>
              <div className="text-xs font-medium text-slate-500 mb-2 uppercase">
                If
              </div>
              <select className="w-full text-sm border border-slate-200 rounded-md p-1.5 mb-2 bg-white">
                <option>Intent</option>
                <option>Variable</option>
              </select>
              <select className="w-full text-sm border border-slate-200 rounded-md p-1.5 mb-2 bg-white">
                <option>Equals</option>
                <option>Contains</option>
              </select>
              <Input defaultValue="FAQ" className="h-8 text-sm" />
            </div>

            {/* Path 2 */}
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 relative group">
              <div className="text-xs font-medium text-slate-500 mb-2 uppercase">
                Else
              </div>
              <p className="text-sm text-slate-600">
                Fallback path if no conditions are met.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="mt-3"
            icon={<PlusIcon className="w-4 h-4" />}>
            
            Add Condition
          </Button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <Button fullWidth>Save Changes</Button>
      </div>
    </div>);

}