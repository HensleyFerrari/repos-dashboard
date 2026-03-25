import React, { useState, useEffect } from 'react';
import { X, Play, RefreshCw, Trash2, Terminal, GitBranch, GitPullRequest, HardDrive, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [activeTab, setActiveTab] = useState<'scripts' | 'git' | 'logs' | 'readme'>('scripts');
  const [details, setDetails] = useState<{ 
    scripts: Record<string, string>, 
    gitStatus: any, 
    localBranches: string[],
    remoteBranches: string[],
    readmeContent: string | null
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [width, setWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [project.path]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

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

      // Refresh if it was a git command
      if (command.startsWith('git ')) {
        await fetchDetails();
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

  const gitSync = async () => {
    setActiveTab('logs');
    setIsRunning(true);
    setLogs((prev) => prev + `\n$ Syncing with remote and pruning...\n`);
    
    try {
      const res = await fetch('/api/project/git-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: project.path })
      });
      const data = await res.json();
      
      if (data.error) {
        setLogs((prev) => prev + `Error: ${data.error}\n`);
      } else {
        setLogs((prev) => prev + `${data.logs}\n`);
        setLogs((prev) => prev + `Successfully deleted ${data.deletedCount} obsolete branches.\n`);
        await fetchDetails(); // Refresh branches
      }
    } catch (e: any) {
      setLogs((prev) => prev + `Failed to execute: ${e.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform duration-300"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-1 px-1 cursor-col-resize hover:bg-blue-400/50 transition-colors z-[60] flex items-center justify-center group ${isResizing ? 'bg-blue-500' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-blue-300 rounded-full transition-colors" />
      </div>
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 truncate" title={project.name}>{project.name}</h2>
          <p className="text-sm text-gray-500 truncate font-mono" title={project.path}>{project.path}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 flex-shrink-0"
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
        <button
          onClick={() => setActiveTab('readme')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'readme' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Readme
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => runCommand('git pull')}
                      disabled={isRunning}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <GitPullRequest className="w-4 h-4" />
                      <span className="font-medium text-sm">Pull</span>
                    </button>
                    <button
                      onClick={gitSync}
                      disabled={isRunning}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                      title="Fetch --prune and delete local branches that no longer exist on remote"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="font-medium text-sm">Sync & Prune</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <GitBranch className="w-3 h-3" /> Local Branches
                    </h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                      <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                        {details?.localBranches?.map((b) => (
                          <div key={b} className={`text-sm px-3 py-1.5 rounded flex items-center justify-between ${b === project.branch ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <span className="truncate">{b}</span>
                            {b === project.branch && <span className="text-[10px] bg-blue-200 text-blue-800 px-1 rounded uppercase">current</span>}
                          </div>
                        ))}
                        {(!details?.localBranches || details.localBranches.length === 0) && (
                          <div className="text-sm text-gray-500 p-2 italic">No local branches found.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <GitBranch className="w-3 h-3 text-gray-400" /> Remote Branches
                    </h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                      <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                        {details?.remoteBranches?.map((b) => (
                          <div key={b} className="text-sm px-3 py-1.5 rounded text-gray-500 hover:bg-gray-200 truncate">
                            {b}
                          </div>
                        ))}
                        {(!details?.remoteBranches || details.remoteBranches.length === 0) && (
                          <div className="text-sm text-gray-500 p-2 italic">No remote branches found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'readme' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Readme.md</h3>
                </div>
                {details?.readmeContent ? (
                  <div className="prose prose-sm max-w-none text-gray-800 prose-headings:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-code:bg-gray-100 prose-code:text-blue-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:prose-code:bg-transparent prose-pre:prose-code:text-gray-100 prose-pre:prose-code:px-0 prose-pre:prose-code:py-0 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {details.readmeContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <FileText className="w-10 h-10 text-gray-400" />
                    <p className="text-sm">No README.md found in this repository.</p>
                  </div>
                )}
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
