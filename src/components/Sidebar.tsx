import React from 'react';
import { Folder, Search, Settings, Code, Database, TerminalSquare, Star } from 'lucide-react';

interface SidebarProps {
  categories: { name: string; count: number; icon: React.ReactNode }[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function Sidebar({ categories, activeCategory, onSelectCategory }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <TerminalSquare className="w-6 h-6 text-blue-400" />
        <h1 className="font-bold text-lg tracking-tight">Project Dash</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Categories
        </div>
        <nav className="space-y-1 px-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                activeCategory === cat.name
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {cat.icon}
                <span>{cat.name}</span>
              </div>
              <span className="bg-gray-800 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                {cat.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
