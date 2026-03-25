import React from 'react';
import { Folder, GitBranch, HardDrive, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  path: string;
  stack: string;
  branch: string;
  isDirty: boolean;
  size: string;
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

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
            <Folder className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 truncate max-w-[180px]" title={project.name}>
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-[180px]" title={project.path}>
              {project.path}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStackColor(project.stack)}`}>
          {project.stack}
        </span>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <GitBranch className="w-4 h-4" />
            <span className="truncate max-w-[120px]">{project.branch}</span>
          </div>
          {project.isDirty ? (
            <div className="flex items-center gap-1 text-amber-600 text-xs font-medium" title="Uncommitted changes">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Dirty</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium" title="Clean working tree">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clean</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
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
