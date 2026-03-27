import React, { useState, useEffect } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetails } from './components/ProjectDetails';
import { SettingsModal } from './components/SettingsModal';
import { ChartsModal } from './components/ChartsModal';
import { FolderSearch, Loader2, AlertCircle, FolderOpen, Search, TerminalSquare, Settings, PieChart } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  path: string;
  stack: string;
  branch: string;
  isDirty: boolean;
  size: string;
  sizeBytes: number;
  protocol?: 'https' | 'ssh' | 'local' | 'none';
}

export default function App() {
  const [rootPath, setRootPath] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [defaultIde, setDefaultIde] = useState(() => localStorage.getItem('projectDashDefaultIde') || 'code');
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>(() => 
    (localStorage.getItem('projectDashAppearance') as 'light' | 'dark' | 'system') || 'system'
  );
  const version = '0.1.1';

  // Load saved path on mount
  useEffect(() => {
    const savedPath = localStorage.getItem('projectDashRootPath');
    if (savedPath) {
      setRootPath(savedPath);
      scanDirectory(savedPath);
    }
  }, []);

  // Save selected IDE whenever it changes
  useEffect(() => {
    localStorage.setItem('projectDashDefaultIde', defaultIde);
  }, [defaultIde]);

  // Apply dark mode based on appearance and system preference
  useEffect(() => {
    localStorage.setItem('projectDashAppearance', appearance);
    
    const applyTheme = () => {
      const isDark = 
        appearance === 'dark' || 
        (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (appearance === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [appearance]);

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

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between z-10 gap-4 shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 shrink-0 w-full sm:w-auto">
            {/* App Logo */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-900 dark:bg-gray-800 rounded-lg shadow-sm">
                <TerminalSquare className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100 hidden lg:block">Project Dash</h1>
            </div>
            
            <div className="relative w-full sm:w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all shadow-sm"
              />
            </div>
          </div>
          
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
                className="flex-1 sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 truncate"
              />
              <button
                type="submit"
                disabled={loading || !rootPath.trim()}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSearch className="w-4 h-4" />}
                <span className="hidden md:inline">Scan</span>
              </button>
            </form>
            
            {/* Charts Button */}
            <button
              onClick={() => setIsChartsOpen(true)}
              disabled={!rootPath || loading}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Dashboard de Gráficos"
            >
              <PieChart className="w-5 h-5" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Error scanning directory</h3>
                <p className="text-sm mt-1 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {!loading && projects.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4 py-12">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                <FolderSearch className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center px-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No projects found</h3>
                <p className="text-sm mt-1 max-w-md">
                  Click "Select Folder" or enter a directory path above and click Scan to find your projects.
                </p>
              </div>
            </div>
          )}

          {loading && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm font-medium">Scanning directory...</p>
            </div>
          )}

          {projects.length > 0 && filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4 py-12">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center px-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No matching projects</h3>
                <p className="text-sm mt-1 max-w-sm">
                  We couldn't find any projects matching "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                >
                  Clear search
                </button>
              </div>
            </div>
          )}

          {projects.length > 0 && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onClick={() => setSelectedProject(project)} 
                  defaultIde={defaultIde}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 py-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-2 group">
              <div className="p-1 bg-gray-50 dark:bg-gray-800 rounded group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                <TerminalSquare className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </div>
              <span className="text-xs font-medium tracking-tight uppercase">v{version}</span>
            </div>
            <p className="text-[11px] font-medium tracking-wide text-gray-400/80 dark:text-gray-500/80">
              Developed by <span className="text-gray-600 dark:text-gray-400 font-semibold">Hensley</span>
            </p>
          </footer>
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

        <ChartsModal
          isOpen={isChartsOpen}
          onClose={() => setIsChartsOpen(false)}
          projects={projects}
          rootPath={rootPath}
        />

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          defaultIde={defaultIde}
          setDefaultIde={setDefaultIde}
          appearance={appearance}
          setAppearance={setAppearance}
        />
      </main>
    </div>
  );
}
