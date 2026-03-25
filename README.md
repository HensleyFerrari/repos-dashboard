# Local Projects Dashboard 🚀

A sleek, powerful dashboard to manage all your local development projects in one place. Automatically detect stacks, monitor Git status, and perform common management tasks with ease.

## ✨ Features

- 🔍 **Smart Scan:** Point to a root folder and instantly find all your projects.
- 🛠️ **Stack Detection:** Automatically identifies Node.js, PHP, and Python projects.
- 🌿 **Git Integration:** View current branches and "dirty" status (uncommitted changes) at a glance.
- 📦 **Project Management:** 
  - List and run `package.json` scripts directly from the UI.
  - Quick "Nuke" feature to clear `node_modules` and free up space.
- 📊 **Resource Monitoring:** Real-time project size calculation (excluding `.git`).
- 🎨 **Modern UI:** Built with React 19, Tailwind CSS, and Framer Motion for a smooth experience.

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend:** Node.js (Express), `simple-git`, `tsx`.
- **API:** Custom REST API for scanning and project operations.

## 🛠️ Installation & Setup

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

### 2. Environment Configuration

Create a `.env` file in the root directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

*Note: While a `GEMINI_API_KEY` is present in the example, it is currently optional for the core dashboard functionality.*

### 3. Start the Application

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📖 How to Use

1. **Launch the dashboard** and enter the full path to your projects directory (e.g., `C:/Users/name/projects` or `/home/user/workspace`).
2. **Click "Scan"** to find all repositories in that folder.
3. **Filter** projects by stack using the sidebar.
4. **Click on a project card** to view details, run scripts, or manage Git status.
5. **Use the "Nuke" button** on Node.js projects to quickly delete `node_modules` if you need to save space.

## 📜 Available Scripts

- `npm run dev`: Starts the server with `tsx` (enables Vite middleware).
- `npm run build`: Builds the frontend for production.
- `npm run start`: Starts the server in production mode.
- `npm run lint`: Checks for TypeScript errors.

---
Built with ❤️ for developers.
