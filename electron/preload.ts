import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './types';

const electronAPI: ElectronAPI = {
  scanDirectory: (rootPath: string) =>
    ipcRenderer.invoke('scan-directory', rootPath),

  getProjectDetails: (projectPath: string) =>
    ipcRenderer.invoke('project-details', projectPath),

  runCommand: (projectPath: string, command: string) =>
    ipcRenderer.invoke('project-run', projectPath, command),

  nukeNodeModules: (projectPath: string) =>
    ipcRenderer.invoke('project-nuke', projectPath),

  refreshSize: (projectPath: string) =>
    ipcRenderer.invoke('project-refresh-size', projectPath),

  gitSync: (projectPath: string) =>
    ipcRenderer.invoke('project-git-sync', projectPath),

  openInIde: (projectPath: string, ideCommand: string) =>
    ipcRenderer.invoke('project-open-ide', projectPath, ideCommand),

  selectDirectory: () =>
    ipcRenderer.invoke('select-directory'),

  getDiskStats: (rootPath: string) =>
    ipcRenderer.invoke('get-disk-stats', rootPath),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
