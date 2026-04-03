import fs from 'node:fs/promises';
import path from 'node:path';
import * as childProcess from 'node:child_process';

// Helper to get folder size recursively
export async function getFolderSize(dirPath: string): Promise<number> {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const promises = files.map(async (file) => {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (file.name !== '.git' && file.name !== 'node_modules') {
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
export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Normalize path for Windows and Unix
export function normalizePath(p: string): string {
  if (!p) return p;
  let normalized = path.normalize(p);
  // Remove leading slash on Windows if present (e.g. /C:/...)
  if (process.platform === 'win32' && normalized.startsWith('\\') && normalized.length > 2 && normalized[2] === ':') {
    normalized = normalized.substring(1);
  }
  return normalized;
}

const ALLOWED_IDE_COMMANDS = ['code', 'cursor', 'antigravity'];

/**
 * Open project in IDE using child_process.spawn to avoid command injection
 */
export async function openProjectInIde(projectPath: string, ideCommand: string): Promise<{ success: boolean; error: string | null }> {
  if (!ALLOWED_IDE_COMMANDS.includes(ideCommand)) {
    return {
      success: false,
      error: `IDE command '${ideCommand}' is not allowed.`,
    };
  }

  const normalizedPath = normalizePath(projectPath);

  return new Promise((resolve) => {
    // Use spawn instead of exec to prevent command injection
    const child = childProcess.spawn(ideCommand, [normalizedPath], {
      shell: false,
      windowsHide: true,
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    // We don't necessarily need to wait for it to finish for success,
    // but the error event will trigger if it fails to start.
    // Give it a short time to catch early startup errors.
    const timeout = setTimeout(() => {
      resolve({
        success: true,
        error: null,
      });
    }, 200);

    child.on('spawn', () => {
      // If it successfully spawned, we consider it a success
      clearTimeout(timeout);
      resolve({
        success: true,
        error: null,
      });
    });
  });
}
