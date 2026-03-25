import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetails } from './components/ProjectDetails';
import { FolderSearch, Loader2, AlertCircle, FolderOpen } from 'lucide-react';

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

export default function App() {
  const [rootPath, setRootPath] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Load saved path on mount
  useEffect(() => {
    const savedPath = localStorage.getItem('projectDashRootPath');
    if (savedPath) {
      setRootPath(savedPath);
      scanDirectory(savedPath);
    }
  }, []);

  const scanDirectory = async (path: string) => {
    if (!path.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await window.electronAPI.scanDirectory(path);
      
      if (data.error) {
        setError(data.error);
      } else {
        setProjects(data.projects || []);
        localStorage.setItem('projectDashRootPath', path);
      }
    } catch (err: any) {
      setError('Failed to scan directory: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdate = (updatedProject: Partial<Project> & { id: string }) => {
    setProjects(prev => prev.map(p => 
      p.id === updatedProject.id ? { ...p, ...updatedProject } : p
    ));
    
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(prev => prev ? { ...prev, ...updatedProject } : null);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    scanDirectory(rootPath);
  };

  const handleSelectDirectory = async () => {
    const selected = await window.electronAPI.selectDirectory();
    if (selected) {
      setRootPath(selected);
      scanDirectory(selected);
    }
  };

  const categories = [
    { name: 'All', count: projects.length, icon: <FolderSearch className="w-4 h-4" /> },
    { name: 'Node.js', count: projects.filter(p => p.stack === 'Node.js').length, icon: <div className="w-3 h-3 rounded-full bg-green-500" /> },
    { name: 'PHP', count: projects.filter(p => p.stack === 'PHP').length, icon: <div className="w-3 h-3 rounded-full bg-indigo-500" /> },
    { name: 'Python', count: projects.filter(p => p.stack === 'Python').length, icon: <div className="w-3 h-3 rounded-full bg-blue-500" /> },
    { name: 'Other', count: projects.filter(p => p.stack === 'Other').length, icon: <div className="w-3 h-3 rounded-full bg-gray-400" /> },
  ];

  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(p => p.stack === activeCategory);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar 
        categories={categories} 
        activeCategory={activeCategory} 
        onSelectCategory={setActiveCategory} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between z-10 gap-4">
          <h2 className="text-xl font-semibold text-gray-800 shrink-0">Dashboard</h2>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
            <button
              onClick={handleSelectDirectory}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              title="Select root directory"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden lg:inline">Select Folder</span>
              <span className="lg:hidden">Folder</span>
            </button>
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <input
                type="text"
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                placeholder="Root directory path..."
                className="flex-1 sm:w-64 lg:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 truncate"
              />
              <button
                type="submit"
                disabled={loading || !rootPath.trim()}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSearch className="w-4 h-4" />}
                <span className="hidden md:inline">Scan</span>
              </button>
            </form>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Error scanning directory</h3>
                <p className="text-sm mt-1 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {!loading && projects.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 py-12">
              <div className="p-4 bg-white rounded-full shadow-sm border border-gray-100">
                <FolderSearch className="w-12 h-12 text-gray-400" />
              </div>
              <div className="text-center px-4">
                <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
                <p className="text-sm mt-1 max-w-md">
                  Click "Select Folder" or enter a directory path above and click Scan to find your projects.
                </p>
              </div>
            </div>
          )}

          {loading && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm font-medium">Scanning directory...</p>
            </div>
          )}

          {projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={() => setSelectedProject(project)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Details Drawer */}
        {selectedProject && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-40 transition-opacity"
              onClick={() => setSelectedProject(null)}
            />
            <ProjectDetails 
              project={selectedProject} 
              onClose={() => setSelectedProject(null)} 
              onProjectUpdate={handleProjectUpdate}
            />
          </>
        )}
      </main>
    </div>
  );
}
