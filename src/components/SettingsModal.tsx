import React from 'react';
import { X, Moon, Monitor, Code2, FolderGit2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto space-y-6 max-h-[70vh]">
          {/* Theme Setting */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Moon className="w-4 h-4" /> Appearance
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] z-10">
                <span className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">Coming Soon</span>
              </div>
              <label className="flex items-center justify-between opacity-60">
                <span className="text-sm font-medium text-gray-800">Dark Mode</span>
                <input type="checkbox" disabled className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
              </label>
              <p className="text-xs text-gray-500 mt-2 opacity-80">Toggle between light and dark interface themes for comfortable viewing.</p>
            </div>
          </div>

          {/* IDE Setting */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Default IDE
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] z-10">
                <span className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">Coming Soon</span>
              </div>
              <select disabled className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg opacity-60 bg-white shadow-sm border">
                <option>VS Code</option>
                <option>Cursor</option>
                <option>Antigravity</option>
              </select>
              <p className="text-xs text-gray-500 mt-2 opacity-80">Choose which IDE to use for the quick action button on the dashboard.</p>
            </div>
          </div>

           {/* Ignored Folders Setting */}
           <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <FolderGit2 className="w-4 h-4" /> Search Configuration
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] z-10">
                <span className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">Coming Soon</span>
              </div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Ignored Directories</label>
              <input type="text" disabled placeholder="node_modules, .git, .next, dist" className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm opacity-60" />
              <p className="text-xs text-gray-500 mt-2 opacity-80">Comma-separated list of folder names to exclude during directory scanning.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-colors shadow-sm"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
