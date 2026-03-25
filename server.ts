import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';

// Helper to get folder size recursively
async function getFolderSize(dirPath: string): Promise<number> {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (file.name !== '.git') {
          size += await getFolderSize(filePath);
        }
      } else {
        const stats = await fs.stat(filePath);
        size += stats.size;
      }
    }
  } catch (err) {
    // Ignore errors for unreadable files
  }
  return size;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/scan', async (req, res) => {
    const { rootPath } = req.body;
    if (!rootPath) {
      return res.status(400).json({ error: 'rootPath is required' });
    }

    try {
      const resolvedPath = path.resolve(rootPath);
      const projects: any[] = [];
      const ignoredFolders = ['node_modules', 'vendor', 'dist', 'build', 'venv', '.venv', 'env', '.env'];

      async function scanDirectory(dirPath: string) {
        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });

          if (dirPath !== resolvedPath) {
            let stack = 'Unknown';
            const itemNames = items.map(i => i.name);
            const hasPackageJson = itemNames.includes('package.json');
            const hasComposerJson = itemNames.includes('composer.json');
            const hasRequirementsTxt = itemNames.includes('requirements.txt') || itemNames.includes('manage.py');

            if (hasPackageJson) stack = 'Node.js';
            else if (hasComposerJson) stack = 'PHP';
            else if (hasRequirementsTxt) stack = 'Python';

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
                sizeBytes
              });
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

      res.json({ projects });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/project/details', async (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) return res.status(400).json({ error: 'projectPath is required' });

    try {
      let scripts: Record<string, string> = {};
      let gitStatus = null;
      let branches = [];

      // Read package.json for scripts
      try {
        const pkgJsonPath = path.join(projectPath, 'package.json');
        const pkgData = await fs.readFile(pkgJsonPath, 'utf-8');
        const pkg = JSON.parse(pkgData);
        scripts = pkg.scripts || {};
      } catch (e) {
        // Ignore if no package.json
      }

      // Git details
      try {
        const git = simpleGit(projectPath);
        const isRepo = await git.checkIsRepo();
        if (isRepo) {
          gitStatus = await git.status();
          const branchSummary = await git.branch();
          branches = branchSummary.all;
        }
      } catch (e) {
        // Ignore git errors
      }

      res.json({ scripts, gitStatus, branches });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/project/run', (req, res) => {
    const { projectPath, command } = req.body;
    if (!projectPath || !command) return res.status(400).json({ error: 'projectPath and command are required' });

    exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
      res.json({
        stdout,
        stderr,
        error: error ? error.message : null
      });
    });
  });

  app.post('/api/project/nuke', async (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) return res.status(400).json({ error: 'projectPath is required' });

    try {
      const nodeModulesPath = path.join(projectPath, 'node_modules');
      await fs.rm(nodeModulesPath, { recursive: true, force: true });
      
      // Recalculate size after nuking
      const sizeBytes = await getFolderSize(projectPath);
      const size = formatBytes(sizeBytes);
      
      res.json({ 
        success: true, 
        message: 'node_modules deleted successfully',
        size,
        sizeBytes
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/project/refresh-size', async (req, res) => {
    const { projectPath } = req.body;
    if (!projectPath) return res.status(400).json({ error: 'projectPath is required' });

    try {
      const sizeBytes = await getFolderSize(projectPath);
      const size = formatBytes(sizeBytes);
      res.json({ size, sizeBytes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
