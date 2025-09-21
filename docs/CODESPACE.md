# 🚀 GitHub Codespace Setup for Prompt Craft

This guide explains how to use the Prompt Craft repository in GitHub Codespaces for a fully configured cloud development environment.

## 📋 Overview

GitHub Codespaces provides a complete, cloud-based development environment with:
- ✅ **Node.js 18** with TypeScript support
- ✅ **PostgreSQL 15** database with sample data
- ✅ **VS Code** with all recommended extensions
- ✅ **Development tools** (Jest, Drizzle Studio, etc.)
- ✅ **Automatic setup** - ready in ~3-5 minutes

## 🚀 Quick Start

### 1. Create a Codespace

**Option A: From GitHub (Recommended)**
1. Go to the [Prompt Craft repository](https://github.com/your-org/prompt-craft)
2. Click the **Code** button
3. Select **Codespaces** tab
4. Click **Create codespace on main**

**Option B: From URL**
```
https://github.com/codespaces/new?template_repository=your-org/prompt-craft
```

### 2. Wait for Automatic Setup

The setup process will automatically:
- 🔧 Build the development container
- 📦 Install all npm dependencies  
- 🗄️ Start PostgreSQL database
- ⚡ Build the TypeScript project
- 🌱 Run database migrations
- 📊 Seed database with sample prompts
- 🎨 Configure VS Code extensions

**⏱️ Expected time: 3-5 minutes**

### 3. Start Developing!

Once setup completes, you can immediately:

```bash
# Start the web development server
npm run dev:web
# or use the alias
pc-dev

# Start the CLI in development mode
npm run dev:cli

# Run tests
npm test
# or use alias
pc-test

# Open database GUI
npm run db:studio
# or use alias  
pc-db-studio
```

## 🎯 Development Workflow

### **Web Development**
```bash
pc-dev                 # Start web dev server (http://localhost:3000)
pc-build               # Build all packages
pc-test                # Run test suite
pc-lint                # Type checking and linting
```

### **CLI Development**
```bash
pc-start               # Start CLI application  
npm run dev:cli        # CLI in development mode with ts-node
```

### **Database Operations**
```bash
pc-db-studio          # Open Drizzle Studio (visual database tool)
npm run db:migrate    # Apply database migrations
npm run db:seed       # Seed with sample data
pc-db-reset           # Reset database (caution!)
```

## 🌐 Ports & Services

The Codespace automatically forwards these ports:

| Port | Service | URL | Description |
|------|---------|-----|-------------|
| **3000** | Web Server | `https://[codespace-url]-3000.app.github.dev` | Astro web interface |
| **5432** | PostgreSQL | Internal | Database (accessible via tools) |
| **8080** | MCP Server | `https://[codespace-url]-8080.app.github.dev` | MCP API endpoints |

## 🛠️ VS Code Extensions

The following extensions are automatically installed:

### **Core Development**
- TypeScript Language Server
- Prettier (code formatting)
- ESLint (linting)
- GitLens (Git integration)
- GitHub Copilot & Copilot Chat

### **Framework Specific**
- Astro Language Server
- Tailwind CSS IntelliSense
- React snippets

### **Database & DevOps**
- PostgreSQL Client
- Docker support
- YAML support

### **Testing & Quality**
- Jest test runner
- Test Explorer
- Path IntelliSense

## 🗂️ File Structure

```
prompt-manager/
├── .devcontainer/          # Codespace configuration
│   ├── devcontainer.json   # Main configuration
│   ├── docker-compose.yml  # Services (app + database)
│   ├── Dockerfile          # Development container
│   ├── setup.sh           # Automatic setup script
│   ├── .env.codespace     # Environment variables
│   └── init-db.sql        # Database initialization
├── packages/
│   ├── apps/
│   │   ├── cli/           # Command-line interface
│   │   ├── web/           # Astro web interface
│   │   ├── mcp-server/    # MCP server (stdio)
│   │   └── electron/      # Desktop app (optional in Codespace)
│   ├── core/              # Domain logic
│   └── infrastructure/    # Data layer
└── docs/
    └── CODESPACE.md       # This file
```

## 🔧 Customization

### **Environment Variables**
Modify `.devcontainer/.env.codespace`:
```bash
NODE_ENV=development
REPOSITORY_TYPE=database
DATABASE_URL=postgresql://postgres:postgres@db:5432/promptcraft
FEATURE_WEB=true
FEATURE_MCP=true
```

### **VS Code Settings**
Edit `.devcontainer/devcontainer.json` > `customizations.vscode.settings`

### **Extensions**
Add/remove extensions in `.devcontainer/devcontainer.json` > `customizations.vscode.extensions`

### **Database Schema**
Modify schema in `packages/infrastructure/database/schema.ts`, then:
```bash
npm run db:generate    # Generate migration
npm run db:migrate     # Apply changes
```

## 🚨 Troubleshooting

### **Setup Issues**

**Database not connecting:**
```bash
# Check database status
pg_isready -h db -p 5432 -U postgres

# Restart database service
docker compose -f .devcontainer/docker-compose.yml restart db
```

**Build failures:**
```bash
# Clean and rebuild
pc-clean
npm install
npm run build
```

**Missing environment variables:**
```bash
# Recreate .env file
cp .env.example .env
# Or copy codespace template
cp .devcontainer/.env.codespace .env
```

### **Development Issues**

**TypeScript errors:**
```bash
# Check types
npm run lint

# Restart TypeScript server in VS Code
Ctrl/Cmd + Shift + P > "TypeScript: Restart TS Server"
```

**Port not forwarding:**
1. Go to **Ports** tab in VS Code terminal panel
2. Right-click port and select **Forward Port**
3. Set visibility to **Public** if external access needed

**Database issues:**
```bash
# Reset database completely
pc-db-reset --force
npm run db:migrate
npm run db:seed
```

## 📚 Additional Resources

### **Documentation Links**
- [Main README](../README.md) - Project overview and local setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [MCP Server Guide](./MCP_WEB_SERVER.md) - MCP integration details
- [WARP.md](../WARP.md) - Complete development commands

### **Package Scripts**
View all available commands:
```bash
npm run                # List all npm scripts
cat package.json | jq .scripts  # View as JSON
```

### **Database GUI Access**
- **Drizzle Studio**: `npm run db:studio` (web-based)
- **VS Code PostgreSQL**: Use the PostgreSQL extension with connection:
  - Host: `db`
  - Port: `5432`
  - User: `postgres`
  - Password: `postgres`
  - Database: `promptcraft`

## ⚡ Performance Tips

### **Faster Development**
- Use `pc-dev` alias instead of full commands
- Keep Drizzle Studio open for database inspection
- Use VS Code's integrated terminal for better performance
- Enable Copilot for faster coding

### **Resource Management**
- Stop unused services: `docker compose down`
- Clean build artifacts: `pc-clean` before major changes
- Use VS Code's workspace trust for better performance

### **Sync & Backup**
- Codespace automatically syncs with your repo
- Database changes are preserved within the Codespace
- Use `npm run db:export` to backup prompt data

## 🎉 Ready to Code!

Your Prompt Craft development environment is now ready! Key points:

- 🌐 **Web interface**: Start with `pc-dev` and open forwarded port 3000
- ⌨️ **CLI tools**: Use `pc-start` or `npm run dev:cli`
- 🗄️ **Database**: Access via `pc-db-studio` or VS Code PostgreSQL extension
- 🧪 **Testing**: Run `pc-test` for full test suite
- 📖 **Documentation**: Check the `docs/` folder for detailed guides

Happy coding! 🚀