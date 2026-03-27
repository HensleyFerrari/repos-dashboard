import React from 'react';
import { X, Moon, Monitor, Code2, FolderGit2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIde: string;
  setDefaultIde: (ide: string) => void;
  appearance: 'light' | 'dark' | 'system';
  setAppearance: (appearance: 'light' | 'dark' | 'system') => void;
}

export function SettingsModal({ isOpen, onClose, defaultIde, setDefaultIde, appearance, setAppearance }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all border border-transparent dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/80">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto space-y-6 max-h-[70vh]">
          {/* Theme Setting */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Moon className="w-4 h-4" /> Appearance
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group">
              <select 
                value={appearance} 
                onChange={(e) => setAppearance(e.target.value as 'light' | 'dark' | 'system')}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Setup</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-80">Choose your preferred interface theme.</p>
            </div>
          </div>

          {/* IDE Setting */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Default IDE
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group">
              <select 
                value={defaultIde} 
                onChange={(e) => setDefaultIde(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border"
              >
                <option value="code">VS Code</option>
                <option value="cursor">Cursor</option>
                <option value="antigravity">Antigravity</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-80">Choose which IDE to use for the quick action button on the dashboard.</p>
            </div>
          </div>

           {/* Ignored Folders Setting */}
           <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FolderGit2 className="w-4 h-4" /> Search Configuration
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] z-10">
                <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">Coming Soon</span>
              </div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Ignored Directories</label>
              <input type="text" disabled placeholder="node_modules, .git, .next, dist" className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 opacity-60" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-80">Comma-separated list of folder names to exclude during directory scanning.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm transition-colors shadow-sm"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
