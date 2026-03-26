import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import { exec } from 'child_process';
import type { Project } from './types';

// Helper to get folder size recursively
async function getFolderSize(dirPath: string): Promise<number> {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const promises = files.map(async (file) => {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (file.name !== '.git') {
          return await getFolderSize(filePath);
        }
        return 0;
      } else {
        const stats = await fs.stat(filePath);
        return stats.size;
      }
    });
    const sizes = await Promise.all(promises);
    return sizes.reduce((acc, curr) => acc + curr, 0);
  } catch (err) {
    // Ignore errors for unreadable files
    return 0;
  }
}

// Format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Normalize path for Windows and Unix
function normalizePath(p: string): string {
  if (!p) return p;
  let normalized = path.normalize(p);
  // Remove leading slash on Windows if present (e.g. /C:/...)
  if (process.platform === 'win32' && normalized.startsWith('\\') && normalized.length > 2 && normalized[2] === ':') {
    normalized = normalized.substring(1);
  }
  return normalized;
}

export function registerIpcHandlers() {
  // Select directory using native dialog
  ipcMain.handle('select-directory', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select projects root directory',
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Scan directory for projects
  ipcMain.handle('scan-directory', async (_event, rootPath: string) => {
    if (!rootPath) {
      return { projects: [], error: 'rootPath is required' };
    }

    try {
      const resolvedPath = path.resolve(rootPath);
      const projects: Project[] = [];
      const ignoredFolders = ['node_modules', 'vendor', 'dist', 'build', 'venv', '.venv', 'env', '.env'];

      async function scanDirectory(dirPath: string) {
        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });

          if (dirPath !== resolvedPath) {
            let stack = 'Unknown';
            const itemNames = items.map(i => i.name);
            const hasGit = items.some(i => i.name === '.git' && i.isDirectory());
            const hasPackageJson = itemNames.includes('package.json');
            const hasComposerJson = itemNames.includes('composer.json');
            const hasRequirementsTxt = itemNames.includes('requirements.txt') ||
                                      itemNames.includes('manage.py') ||
                                      itemNames.includes('pyproject.toml') ||
                                      itemNames.includes('setup.py');

            if (hasPackageJson) stack = 'Node.js';
            else if (hasComposerJson) stack = 'PHP';
            else if (hasRequirementsTxt) stack = 'Python';
            else if (hasGit) stack = 'Other';

            if (stack !== 'Unknown') {
              let branch = 'N/A';
              let isDirty = false;
              try {
                const git = simpleGit(dirPath);
                const isRepo = await git.checkIsRepo();
                if (isRepo) {
                  const status = await git.status();
                  branch = status.current || 'N/A';
                  isDirty = !status.isClean();
                }
              } catch (e) {
                // Ignore git errors
              }

              const sizeBytes = await getFolderSize(dirPath);
              projects.push({
                id: dirPath,
                name: path.basename(dirPath),
                path: dirPath,
                stack,
                branch,
                isDirty,
                size: formatBytes(sizeBytes),
                sizeBytes,
              });

              // Stop scanning deeper in this directory once it's identified as a project
              return;
            }
          }

          const promises = [];
          for (const item of items) {
            if (item.isDirectory()) {
              const name = item.name;
              if (!name.startsWith('.') && !ignoredFolders.includes(name)) {
                promises.push(scanDirectory(path.join(dirPath, name)));
              }
            }
          }
          await Promise.all(promises);
        } catch (e) {
          // Ignore unreadable directories
        }
      }

      await scanDirectory(resolvedPath);
      return { projects };
    } catch (error: any) {
      return { projects: [], error: error.message };
    }
  });

  // Get project details
  ipcMain.handle('project-details', async (_event, projectPath: string) => {
    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    const normalizedPath = normalizePath(projectPath);
    let scripts: Record<string, string> = {};
    let gitStatus = null;
    let localBranches: string[] = [];
    let remoteBranches: string[] = [];
    let readmeContent: string | null = null;

    // Read README.md
    try {
      const readmeFiles = [
        'README.md', 'readme.md', 'README.MD', 'Readme.md',
        'README.markdown', 'readme.markdown',
        'README.txt', 'readme.txt',
        'README', 'readme'
      ];
      for (const file of readmeFiles) {
        try {
          const readmePath = path.join(normalizedPath, file);
          readmeContent = await fs.readFile(readmePath, 'utf-8');
          break;
        } catch (e) {
          // Not found, try next
        }
      }
    } catch (e) {
      console.error(`Error reading README for ${normalizedPath}:`, e);
    }

    // Read package.json for scripts
    try {
      const pkgJsonPath = path.join(normalizedPath, 'package.json');
      const pkgData = await fs.readFile(pkgJsonPath, 'utf-8');
      const pkg = JSON.parse(pkgData);
      scripts = pkg.scripts || {};
    } catch (e) {
      // Only log if it's not a "file not found" error, as some projects might not have package.json
      if ((e as any).code !== 'ENOENT') {
        console.error(`Error reading package.json for ${normalizedPath}:`, e);
      }
    }

    // Git details
    try {
      const git = simpleGit(normalizedPath);
      const isRepo = await git.checkIsRepo();
      if (isRepo) {
        const rawStatus = await git.status();
        // Ensure it's a plain object for Electron's IPC cloning
        gitStatus = JSON.parse(JSON.stringify(rawStatus));
        
        const branchSummary = await git.branch();
        const allBranches = branchSummary.all;
        localBranches = allBranches.filter(b => !b.startsWith('remotes/'));
        remoteBranches = allBranches.filter(b => b.startsWith('remotes/'));
      }
    } catch (e) {
      console.error(`Error reading Git status for ${normalizedPath}:`, e);
    }

    return { scripts, gitStatus, localBranches, remoteBranches, readmeContent };
  });

  // Run command in project directory
  ipcMain.handle('project-run', async (_event, projectPath: string, command: string) => {
    if (!projectPath || !command) {
      throw new Error('projectPath and command are required');
    }

    const normalizedPath = normalizePath(projectPath);
    return new Promise((resolve) => {
      exec(command, { cwd: normalizedPath }, (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          error: error ? error.message : null,
        });
      });
    });
  });

  // Nuke node_modules
  ipcMain.handle('project-nuke', async (_event, projectPath: string) => {
    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    const normalizedPath = normalizePath(projectPath);
    const nodeModulesPath = path.join(normalizedPath, 'node_modules');
    await fs.rm(nodeModulesPath, { recursive: true, force: true });

    // Recalculate size after nuking
    const sizeBytes = await getFolderSize(normalizedPath);
    const size = formatBytes(sizeBytes);

    return {
      success: true,
      message: 'node_modules deleted successfully',
      size,
      sizeBytes,
    };
  });

  // Refresh project size
  ipcMain.handle('project-refresh-size', async (_event, projectPath: string) => {
    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    const normalizedPath = normalizePath(projectPath);
    const sizeBytes = await getFolderSize(normalizedPath);
    const size = formatBytes(sizeBytes);
    return { size, sizeBytes };
  });

  // Git sync and prune
  ipcMain.handle('project-git-sync', async (_event, projectPath: string) => {
    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    const normalizedPath = normalizePath(projectPath);
    const git = simpleGit(normalizedPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }

    const logs: string[] = [];

    // 1. Fetch and prune
    logs.push('Fetching and pruning remotes...');
    await git.fetch(['--prune']);
    logs.push('Fetch complete.');

    // 2. Identify and delete gone branches
    const branchSummary = await git.branch(['-vv']);
    const currentBranch = branchSummary.current;

    const rawStatus = await git.raw(['branch', '-vv']);
    const goneBranches = rawStatus.split('\n')
      .filter(line => line.includes(': gone]'))
      .map(line => {
        const match = line.match(/^[* ]\s+([^\s]+)\s+/);
        return match ? match[1] : null;
      })
      .filter(name => name && name !== currentBranch) as string[];

    const deletedBranches: string[] = [];
    if (goneBranches.length > 0) {
      logs.push(`Found ${goneBranches.length} obsolete branches: ${goneBranches.join(', ')}`);
      for (const branch of goneBranches) {
        try {
          await git.deleteLocalBranch(branch, true);
          deletedBranches.push(branch);
          logs.push(`Deleted branch: ${branch}`);
        } catch (e: any) {
          logs.push(`Failed to delete branch ${branch}: ${e.message}`);
        }
      }
    } else {
      logs.push('No obsolete local branches found.');
    }

    return {
      success: true,
      logs: logs.join('\n'),
      deletedCount: deletedBranches.length,
    };
  });

  // Open project in IDE
  ipcMain.handle('project-open-ide', async (_event, projectPath: string, ideCommand: string) => {
    if (!projectPath || !ideCommand) {
      throw new Error('projectPath and ideCommand are required');
    }

    const normalizedPath = normalizePath(projectPath);
    return new Promise((resolve) => {
      // Use exec to spawn the IDE command with the path
      exec(`${ideCommand} "${normalizedPath}"`, (error) => {
        resolve({
          success: !error,
          error: error ? error.message : null,
        });
      });
    });
  });

  // Get disk and folder stats
  ipcMain.handle('get-disk-stats', async (_event, rootPath: string) => {
    if (!rootPath) {
      throw new Error('rootPath is required');
    }

    try {
      const normalizedPath = normalizePath(rootPath);
      const folderSizeBytes = await getFolderSize(normalizedPath);
      
      const st = await fs.statfs(normalizedPath);
      const diskTotalBytes = st.bsize * st.blocks;
      const diskFreeBytes = st.bsize * st.bavail;

      return {
        folderSizeBytes,
        diskTotalBytes,
        diskFreeBytes
      };
    } catch (error: any) {
      console.error(`Error getting disk stats for ${rootPath}:`, error);
      throw new Error(error.message || 'Failed to get disk stats');
    }
  });
}
