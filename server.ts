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
      const items = await fs.readdir(resolvedPath, { withFileTypes: true });
      const projects = [];

      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          const projectPath = path.join(resolvedPath, item.name);
          
          // Detect stack
          let stack = 'Unknown';
          let hasPackageJson = false;
          let hasComposerJson = false;
          let hasRequirementsTxt = false;

          try {
            const files = await fs.readdir(projectPath);
            hasPackageJson = files.includes('package.json');
            hasComposerJson = files.includes('composer.json');
            hasRequirementsTxt = files.includes('requirements.txt') || files.includes('manage.py');

            if (hasPackageJson) stack = 'Node.js';
            else if (hasComposerJson) stack = 'PHP';
            else if (hasRequirementsTxt) stack = 'Python';
          } catch (e) {
            continue; // Skip if we can't read the directory
          }

          if (stack !== 'Unknown') {
            // Get Git branch if available
            let branch = 'N/A';
            let isDirty = false;
            try {
              const git = simpleGit(projectPath);
              const isRepo = await git.checkIsRepo();
              if (isRepo) {
                const status = await git.status();
                branch = status.current || 'N/A';
                isDirty = !status.isClean();
              }
            } catch (e) {
              // Ignore git errors
            }

            // Get size (excluding heavy folders for quick scan)
            const sizeBytes = await getFolderSize(projectPath);

            projects.push({
              id: projectPath,
              name: item.name,
              path: projectPath,
              stack,
              branch,
              isDirty,
              size: formatBytes(sizeBytes),
              sizeBytes
            });
          }
        }
      }

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
      res.json({ success: true, message: 'node_modules deleted successfully' });
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
