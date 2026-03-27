import fs from 'node:fs/promises';
import path from 'node:path';

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
