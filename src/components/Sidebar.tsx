import React, { useState } from 'react';
import { Folder, Search, Settings, Code, Database, TerminalSquare, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  categories: { name: string; count: number; icon: React.ReactNode }[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function Sidebar({ categories, activeCategory, onSelectCategory }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white h-screen flex flex-col relative`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-gray-800 border border-gray-700 rounded-full p-1 text-gray-400 hover:text-white z-50 hover:bg-gray-700 transition-colors shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-4 border-b border-gray-800 flex items-center transition-all ${isCollapsed ? 'justify-center px-2' : 'gap-2'}`}>
        <TerminalSquare className="w-6 h-6 text-blue-400 flex-shrink-0" />
        {!isCollapsed && <h1 className="font-bold text-lg tracking-tight truncate">Project Dash</h1>}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        {!isCollapsed && (
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Categories
          </div>
        )}
        <nav className="space-y-1 px-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              title={isCollapsed ? cat.name : undefined}
              className={`w-full flex items-center transition-all px-3 py-2 text-sm rounded-md ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } ${
                activeCategory === cat.name
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0">{cat.icon}</span>
                {!isCollapsed && <span className="truncate">{cat.name}</span>}
              </div>
              {!isCollapsed && (
                <span className="bg-gray-800 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className={`p-4 border-t border-gray-800 transition-all ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : ''}`} />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
}
