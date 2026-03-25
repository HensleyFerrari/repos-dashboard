export interface Project {
  id: string;
  name: string;
  path: string;
  stack: string;
  branch: string;
  isDirty: boolean;
  size: string;
  sizeBytes: number;
}

export interface ScanResult {
  projects: Project[];
  error?: string;
}

export interface ProjectDetailsResult {
  scripts: Record<string, string>;
  gitStatus: any;
  localBranches: string[];
  remoteBranches: string[];
  readmeContent: string | null;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  error: string | null;
}

export interface NukeResult {
  success: boolean;
  message: string;
  size: string;
  sizeBytes: number;
}

export interface SizeResult {
  size: string;
  sizeBytes: number;
}

export interface GitSyncResult {
  success: boolean;
  logs: string;
  deletedCount: number;
}

export interface OpenIdeResult {
  success: boolean;
  error: string | null;
}

export interface ElectronAPI {
  scanDirectory: (rootPath: string) => Promise<ScanResult>;
  getProjectDetails: (projectPath: string) => Promise<ProjectDetailsResult>;
  runCommand: (projectPath: string, command: string) => Promise<RunResult>;
  nukeNodeModules: (projectPath: string) => Promise<NukeResult>;
  refreshSize: (projectPath: string) => Promise<SizeResult>;
  gitSync: (projectPath: string) => Promise<GitSyncResult>;
  openInIde: (projectPath: string, ideCommand: string) => Promise<OpenIdeResult>;
  selectDirectory: () => Promise<string | null>;
}
