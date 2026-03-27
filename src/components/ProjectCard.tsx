import React from 'react';
import { Folder, GitBranch, HardDrive, AlertCircle, CheckCircle2, Code2, Globe, Shield, CloudOff, Terminal, TerminalSquare, Sparkles } from 'lucide-react';

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
  defaultIde: string;
}

export function ProjectCard({ project, onClick, defaultIde }: ProjectCardProps) {
  const getStackColor = (stack: string) => {
    switch (stack) {
      case 'Node.js': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'PHP': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
      case 'Python': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const handleOpenIde = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await window.electronAPI.openInIde(project.path, defaultIde);
    } catch (err) {
      console.error('Failed to open IDE from card:', err);
    }
  };

  const getIdeIcon = () => {
    switch (defaultIde) {
      case 'cursor': return <TerminalSquare className="w-4 h-4" />;
      case 'antigravity': return <Sparkles className="w-4 h-4" />;
      default: return <Code2 className="w-4 h-4" />;
    }
  };

  const getIdeName = () => {
    switch (defaultIde) {
      case 'cursor': return 'Cursor';
      case 'antigravity': return 'Antigravity';
      default: return 'VS Code';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors shrink-0">
            <Folder className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={project.name}>
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={project.path}>
              {project.path}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenIde}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all"
            title={`Quick Open in ${getIdeName()}`}
          >
            {getIdeIcon()}
          </button>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${getStackColor(project.stack)}`}>
            {project.stack}
          </span>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-sm gap-2">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 min-w-0 flex-1">
            <GitBranch className="w-4 h-4 shrink-0" />
            <span className="truncate">{project.branch}</span>
          </div>
          {project.isDirty ? (
            <div className="flex items-center gap-1 text-amber-600 border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-1.5 rounded text-xs font-medium shrink-0" title="Uncommitted changes">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Dirty</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-600 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 rounded text-xs font-medium shrink-0" title="Clean working tree">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Clean</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-gray-50 dark:border-gray-800/50">
          <div className="flex items-center gap-1.5 font-medium">
            {project.protocol === 'https' ? (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-transparent dark:border-blue-900">
                <Globe className="w-3 h-3" />
                <span>HTTPS</span>
              </div>
            ) : project.protocol === 'ssh' ? (
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded border border-transparent dark:border-purple-900">
                <Shield className="w-3 h-3" />
                <span>SSH</span>
              </div>
            ) : project.protocol === 'local' ? (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-transparent dark:border-gray-700">
                <Terminal className="w-3 h-3" />
                <span>Local</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded border border-transparent dark:border-gray-800">
                <CloudOff className="w-3 h-3" />
                <span>No Remote</span>
              </div>
            )}
          </div>
          <div className="text-gray-400 dark:text-gray-600 font-mono scale-90 origin-right">
            origin
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <HardDrive className="w-4 h-4" />
            <span>Size</span>
          </div>
          <span className="font-medium text-gray-700 dark:text-gray-300">{project.size}</span>
        </div>
      </div>
    </div>
  );
}
