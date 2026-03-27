import React from 'react';
import { Folder, GitBranch, HardDrive, AlertCircle, CheckCircle2, Code2, Globe, Shield, CloudOff, Terminal } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  path: string;
  stack: string;
  branch: string;
  isDirty: boolean;
  size: string;
  protocol?: 'https' | 'ssh' | 'local' | 'none';
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStackColor = (stack: string) => {
    switch (stack) {
      case 'Node.js': return 'bg-green-100 text-green-800 border-green-200';
      case 'PHP': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Python': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleOpenIde = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await window.electronAPI.openInIde(project.path, 'code');
    } catch (err) {
      console.error('Failed to open IDE from card:', err);
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors shrink-0">
            <Folder className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate" title={project.name}>
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 truncate" title={project.path}>
              {project.path}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenIde}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
            title="Quick Open in VS Code"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${getStackColor(project.stack)}`}>
            {project.stack}
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-sm gap-2">
          <div className="flex items-center gap-1.5 text-gray-600 min-w-0 flex-1">
            <GitBranch className="w-4 h-4 shrink-0" />
            <span className="truncate">{project.branch}</span>
          </div>
          {project.isDirty ? (
            <div className="flex items-center gap-1 text-amber-600 text-xs font-medium shrink-0" title="Uncommitted changes">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Dirty</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium shrink-0" title="Clean working tree">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Clean</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5 font-medium">
            {project.protocol === 'https' ? (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                <Globe className="w-3 h-3" />
                <span>HTTPS</span>
              </div>
            ) : project.protocol === 'ssh' ? (
              <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                <Shield className="w-3 h-3" />
                <span>SSH</span>
              </div>
            ) : project.protocol === 'local' ? (
              <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                <Terminal className="w-3 h-3" />
                <span>Local</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                <CloudOff className="w-3 h-3" />
                <span>No Remote</span>
              </div>
            )}
          </div>
          <div className="text-gray-400 font-mono scale-90 origin-right">
            origin
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-1.5 text-gray-500">
            <HardDrive className="w-4 h-4" />
            <span>Size</span>
          </div>
          <span className="font-medium text-gray-700">{project.size}</span>
        </div>
      </div>
    </div>
  );
}
