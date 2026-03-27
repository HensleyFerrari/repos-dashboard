import React, { useState, useEffect } from 'react';
import { X, PieChart as PieChartIcon, Loader2, HardDrive, Folder } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Project {
  name: string;
  sizeBytes: number;
}

interface ChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  rootPath: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b'];

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-500">{formatBytes(data.value)}</p>
      </div>
    );
  }
  return null;
};

export function ChartsModal({ isOpen, onClose, projects, rootPath }: ChartsModalProps) {
  const [loading, setLoading] = useState(false);
  const [diskStats, setDiskStats] = useState<{
    folderSizeBytes: number;
    diskTotalBytes: number;
    diskFreeBytes: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && rootPath) {
      const fetchStats = async () => {
        setLoading(true);
        try {
          const stats = await window.electronAPI.getDiskStats(rootPath);
          setDiskStats(stats);
        } catch (error) {
          console.error("Failed to fetch disk stats:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [isOpen, rootPath]);

  if (!isOpen) return null;

  // Prepare Chart 1 Data (Projects vs Folder)
  const getProjectsChartData = () => {
    if (!diskStats) return [];
    
    // Sum known project sizes
    let totalProjectsSize = 0;
    const sortedProjects = [...projects].sort((a, b) => b.sizeBytes - a.sizeBytes);
    
    const chartData = [];
    
    let otherProjSize = 0;

    for (let i = 0; i < sortedProjects.length; i++) {
      const p = sortedProjects[i];
      totalProjectsSize += p.sizeBytes;

      if (i < 7) {
        chartData.push({ name: p.name, value: p.sizeBytes });
      } else {
        otherProjSize += p.sizeBytes;
      }
    }

    if (otherProjSize > 0) {
      chartData.push({ name: 'Outros Projetos', value: otherProjSize });
    }

    // Remaining folder space (files that are not identified as projects)
    const unaccountedFolderSize = Math.max(0, diskStats.folderSizeBytes - totalProjectsSize);
    if (unaccountedFolderSize > 0) {
      chartData.push({ name: 'Outros Arquivos da Pasta', value: unaccountedFolderSize });
    }

    return chartData;
  };

  // Prepare Chart 2 Data (Folder vs Disk)
  const getDiskChartData = () => {
    if (!diskStats) return [];

    const { folderSizeBytes, diskTotalBytes, diskFreeBytes } = diskStats;
    const usedDiskSpace = Math.max(0, diskTotalBytes - diskFreeBytes - folderSizeBytes);

    return [
      { name: 'Esta Pasta', value: folderSizeBytes },
      { name: 'Outros Arquivos no Disco', value: usedDiskSpace },
      { name: 'Espaço Livre', value: diskFreeBytes },
    ];
  };

  const projectsData = getProjectsChartData();
  const diskData = getDiskChartData();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Análise de Espaço</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">{rootPath}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Calculando estatísticas do disco...</p>
              <p className="text-sm text-gray-400 mt-1">Isso pode levar alguns segundos dependendo do tamanho da pasta.</p>
            </div>
          ) : !diskStats ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p>Falha ao carregar as estatísticas do disco.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Folder className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Uso da Pasta Selecionada</h3>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {projectsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <span className="text-sm text-gray-500">Total da Pasta: </span>
                  <span className="text-sm font-semibold text-gray-900">{formatBytes(diskStats.folderSizeBytes)}</span>
                </div>
              </div>

              {/* Chart 2 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <HardDrive className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Uso do Disco</h3>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {diskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#cbd5e1', '#22c55e'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <span className="text-sm text-gray-500">Total do Disco: </span>
                  <span className="text-sm font-semibold text-gray-900">{formatBytes(diskStats.diskTotalBytes)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
