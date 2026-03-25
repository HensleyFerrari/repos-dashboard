import React, { useState, useEffect } from 'react';
import { X, Play, RefreshCw, Trash2, Terminal, GitBranch, GitPullRequest, HardDrive, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  path: string;
  stack: string;
  branch: string;
  isDirty: boolean;
  size: string;
  sizeBytes: number;
}

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onProjectUpdate: (project: Partial<Project> & { id: string }) => void;
}

export function ProjectDetails({ project, onClose, onProjectUpdate }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<'scripts' | 'git' | 'logs'>('scripts');
  const [details, setDetails] = useState<{ scripts: Record<string, string>, gitStatus: any, branches: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [project.path]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/project/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: project.path })
      });
      const data = await res.json();
      setDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async (command: string) => {
    setActiveTab('logs');
    setIsRunning(true);
    setLogs((prev) => prev + `\n$ ${command}\n`);
    
    try {
      const res = await fetch('/api/project/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: project.path, command })
      });
      const data = await res.json();
      
      if (data.error) {
        setLogs((prev) => prev + `Error: ${data.error}\n`);
      } else {
        if (data.stdout) setLogs((prev) => prev + `${data.stdout}\n`);
        if (data.stderr) setLogs((prev) => prev + `${data.stderr}\n`);
      }
    } catch (e: any) {
      setLogs((prev) => prev + `Failed to execute: ${e.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const nukeNodeModules = async () => {
    if (!window.confirm('Are you sure you want to delete node_modules? This action cannot be undone.')) return;
    
    setActiveTab('logs');
    setIsRunning(true);
    setLogs((prev) => prev + `\n$ Nuke node_modules...\n`);
    
    try {
      const res = await fetch('/api/project/nuke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: project.path })
      });
      const data = await res.json();
      
      if (data.error) {
        setLogs((prev) => prev + `Error: ${data.error}\n`);
      } else {
        setLogs((prev) => prev + `${data.message}\n`);
        if (data.size) {
          onProjectUpdate({ id: project.id, size: data.size, sizeBytes: data.sizeBytes });
          setLogs((prev) => prev + `New project size: ${data.size}\n`);
        }
      }
    } catch (e: any) {
      setLogs((prev) => prev + `Failed to execute: ${e.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const refreshSize = async () => {
    setActiveTab('logs');
    setIsRunning(true);
    setLogs((prev) => prev + `\n$ Recalculating project size...\n`);
    
    try {
      const res = await fetch('/api/project/refresh-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: project.path })
      });
      const data = await res.json();
      
      if (data.error) {
        setLogs((prev) => prev + `Error: ${data.error}\n`);
      } else {
        onProjectUpdate({ id: project.id, size: data.size, sizeBytes: data.sizeBytes });
        setLogs((prev) => prev + `Recalculation complete. New size: ${data.size}\n`);
      }
    } catch (e: any) {
      setLogs((prev) => prev + `Failed to execute: ${e.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform duration-300">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 truncate max-w-[250px]">{project.name}</h2>
          <p className="text-sm text-gray-500 truncate max-w-[250px]">{project.path}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        <button
          onClick={() => setActiveTab('scripts')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'scripts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Scripts
        </button>
        <button
          onClick={() => setActiveTab('git')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'git' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Git
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Logs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'scripts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Available Scripts</h3>
                  {details?.scripts && Object.keys(details.scripts).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(details.scripts).map(([name, cmd]) => (
                        <div key={name} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors group">
                          <div className="overflow-hidden mr-3">
                            <div className="font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500 truncate font-mono">{cmd}</div>
                          </div>
                          <button
                            onClick={() => runCommand(`npm run ${name}`)}
                            disabled={isRunning}
                            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 flex-shrink-0"
                            title={`Run ${name}`}
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No scripts found in package.json.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Maintenance</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={refreshSize}
                      disabled={isRunning}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span className="font-medium text-sm">Recalculate Size</span>
                    </button>
                    <button
                      onClick={nukeNodeModules}
                      disabled={isRunning || project.stack !== 'Node.js'}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="font-medium text-sm">Nuke node_modules</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Manage your project's disk footprint.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'git' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Branch</span>
                      <span className="text-sm font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{project.branch}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Working Tree</span>
                      {project.isDirty ? (
                        <span className="text-sm font-medium text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Dirty
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Clean
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => runCommand('git pull')}
                      disabled={isRunning}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <GitPullRequest className="w-4 h-4" />
                      <span className="font-medium">Git Pull</span>
                    </button>
                    <button
                      onClick={() => runCommand('git fetch')}
                      disabled={isRunning}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="font-medium">Git Fetch</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Branches</h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                      {details?.branches?.map((b) => (
                        <div key={b} className={`text-sm px-3 py-1.5 rounded ${b === project.branch ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-200'}`}>
                          {b}
                        </div>
                      ))}
                      {(!details?.branches || details.branches.length === 0) && (
                        <div className="text-sm text-gray-500 p-2 italic">No branches found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Terminal Output</h3>
                  <button 
                    onClick={() => setLogs('')}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 bg-gray-900 rounded-lg p-3 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap">
                  {logs || <span className="text-gray-600 italic">No output yet...</span>}
                  {isRunning && (
                    <div className="mt-2 flex items-center gap-2 text-blue-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Running...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
