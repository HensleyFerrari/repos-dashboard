# Repos Dashboard 🚀

A sleek and powerful desktop application built with Electron to manage all your local development projects in one place. Automatically detect stacks, monitor Git status, and perform common management tasks with a modern, intuitive UI.

## ✨ Features

- 🔍 **Smart Scan:** Select a root folder using native dialogs to instantly find all your projects.
- 🛠️ **Stack Detection:** Automatically identifies **Node.js**, **PHP**, and **Python** projects.
- 🌿 **Advanced Git Integration:** 
  - View current branches and "dirty" status at a glance.
  - **Git Sync:** Fetch, prune remotes, and automatically delete obsolete "gone" local branches to keep your workspace clean.
- 📖 **Project Insights:**
  - View the project's own `README.md` directly within the dashboard.
  - List and run `package.json` scripts with real-time output.
- 📦 **Project Management:** 
  - **Quick "Nuke":** Clear `node_modules` to free up space and recalculate project size.
  - **IDE Integration:** Open projects directly in your preferred editor (VS Code, Cursor, etc.).
- 📊 **Resource Monitoring:** 
  - Real-time project size calculation.
  - Disk usage statistics for the scanned directory.
- 🎨 **Modern UI:** Built with React 19, Tailwind CSS 4, and Framer Motion for a smooth, hardware-accelerated experience.

## 🚀 Tech Stack

- **Framework:** Electron (Desktop App)
- **Frontend:** React 19, Vite, Tailwind CSS 4, Lucide Icons, Framer Motion.
- **Backend:** Node.js, `simple-git`.
- **Packaging:** `electron-builder`.

## 🛠️ Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/) installed on your machine

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd repos-dashboard

# Install dependencies
npm install
```

### 2. Start in Development Mode

```bash
npm run dev
```

This will start the Vite dev server and launch the Electron application window.

## 📦 Packaging for Production

If you want to "install" the app on your machine without running it in development mode, you can package it into a standalone executable.

### 1. Build and Package

```bash
# Generate the executable for your current OS
npm run dist
```

### 2. Locate the Executable

After the command finishes, look into the `release` folder:
- **Windows:** Look for a `.exe` setup file (NSIS) or a portable version.
- **macOS:** Look for a `.dmg` or `.app` file.
- **Linux:** Look for an `AppImage` file.

You can then run the installer or the standalone app as you would with any other desktop software.

## 📜 Available Scripts

- `npm run dev`: Starts the application in development mode with hot-reloading.
- `npm run build`: Compiles the frontend and Electron main process code.
- `npm run dist`: Builds and packages the app into a production-ready executable using `electron-builder`.
- `npm run lint`: Checks for TypeScript errors across the project.
- `npm run clean`: Removes all build and release artifacts.

---
Built with ❤️ for developers who love clean workspaces.
