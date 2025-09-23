# 🎯 Prompt Craft

[![CI/CD](https://github.com/Lukeus/prompt-craft/actions/workflows/ci.yml/badge.svg)](https://github.com/Lukeus/prompt-craft/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-Ready-47848F?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen)](https://modelcontextprotocol.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Codespace Ready](https://img.shields.io/badge/Codespace-Ready-green?logo=github)](https://github.com/codespaces)

A **production-ready, enterprise-grade** TypeScript prompt management system with multi-platform deployment support. Features **Desktop App (Electron)**, **CLI**, **Web Interface**, **MCP Protocol**, and **REST APIs** for organizing and rendering AI prompts across any infrastructure.

## ✨ Features

### 🏢 **Enterprise Ready**
- 🚀 **Multi-platform deployment** (Docker, Kubernetes, Azure, AWS, GCP, Vercel)
- 🔒 **Authentication & Security** (Azure AD, OAuth2, LDAP)
- 📊 **Health checks & monitoring** (Prometheus, Grafana, Azure Insights)
- 🗄️ **Database flexibility** (PostgreSQL, Azure SQL, MySQL, SQLite)
- 🔧 **Environment-aware configuration** with validation

### 🎨 **Core Features**
- 🖥️ **Native Desktop App** (Electron) with modern React UI and system integration
- 📚 **Organize prompts** by categories (work, personal, shared)
- 💻 **CLI interface** with interactive variable entry and validation
- 🌐 **Modern web interface** with client-side filtering
- 📡 **MCP Protocol** support (stdio + HTTP/WebSocket)
- 💾 **Variable presets** and favorites tracking
- 🔄 **Type-aware parsing** for numbers, booleans, arrays
- 📋 **Copy to clipboard** with multiple output formats
- 🔍 **Advanced search** with full-text search and filtering
- 🎯 **Step-by-step prompt creation wizard** with validation

## 📦 Installation

### Prerequisites
- **Node.js** 20+ (LTS recommended)
- **npm** or **yarn**
- **Git**

### Clone & Install
```bash
git clone https://github.com/Lukeus/prompt-craft.git
cd prompt-craft
npm install
```

## 🚀 Quick Start

### ☁️ **Cloud Development (GitHub Codespaces) - Recommended**

Get started instantly with a fully configured cloud development environment:

1. **Create a Codespace**:
   - Click **Code** → **Codespaces** → **Create codespace on main**
   - Or visit: `https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=your-repo-id`

2. **Automatic Setup** (3-5 minutes):
   - ✅ Node.js 20+ + TypeScript + all dependencies
   - ✅ PostgreSQL database with sample data
   - ✅ VS Code extensions + development tools
   - ✅ Project built and ready to use

3. **Start Developing**:
   ```bash
   # Start web development server
   pc-dev                    # Alias for npm run dev:web
   
   # Or use full commands
   npm run dev:web          # Web interface (port 3000)
   npm run dev:cli          # CLI in development mode
   npm test                 # Run test suite
   pc-db-studio            # Open database GUI
   ```

**📖 Complete Codespace Guide**: [docs/CODESPACE.md](docs/CODESPACE.md)

### 📦 **Local Development**
```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start CLI
npm start -- help

# Start web interface
npm run mcp-web:dev

# Start desktop app (Electron)
npm run electron:dev
```

### 🌍 **Deployment (Production)**

Choose your deployment method:

```bash
# 🐳 Docker (local/testing)
./scripts/deploy.sh docker

# ☸️ Kubernetes (production)
./scripts/deploy.sh kubernetes --environment production

# 🔵 Azure Container Apps
./scripts/deploy.sh azure --environment production

# ⚡ Vercel (serverless)
./scripts/deploy.sh vercel
```

> **Need help choosing?** See our [complete deployment guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🖥️ Desktop Application (Electron)

**Status**: ✅ **Production Ready** - Professional VS Code-like desktop experience

The **native desktop app** delivers a complete, production-ready experience with:
- 🎨 **VS Code-inspired Interface** with Activity Bar, Sidebar, Command Bar, and Status Bar
- 🔒 **Secure IPC Communication** between main and renderer processes with typed channels
- 💾 **SQLite Database Integration** with full CRUD operations and MCP server support
- ⚡ **Professional Development Workflow** with hot reload and comprehensive build process
- 🖥️ **Native System Integration** (menus, tray, window management, keyboard shortcuts)
- ⚙️ **Complete Settings System** with theme selection and app behavior customization

### Quick Start
```bash
# Development mode (with hot reload)
npm run electron:dev

# Build for production
npm run electron:build

# Start built application
npm run electron:start:prod

# Package for distribution
npm run electron:pack
```

### ✅ Production Features (All Working)
- ✅ **VS Code-like Layout**: Complete professional desktop interface with Activity Bar, Sidebar, Command Bar, Status Bar
- ✅ **Dashboard**: Live statistics, quick actions, and recent prompts with real-time diagnostics
- ✅ **Prompt Management**: Create, edit, delete, and organize prompts with full validation
- ✅ **Advanced Search**: Real-time search with category filters, author filtering, and tag-based search
- ✅ **Settings Page**: Complete configuration interface with themes, app behavior, and system info
- ✅ **MCP Integration**: Built-in MCP server control with start/stop functionality and live logs
- ✅ **Navigation**: Smooth page transitions, keyboard shortcuts (⌘K, ⌘⇧P), and responsive design
- ✅ **Data Management**: SQLite integration with automatic seeding and migration support
- ✅ **Command Palette**: VS Code-style quick actions and navigation (⌘⇧P / Ctrl⇧P)
- ✅ **Diagnostics Panel**: Collapsible bottom panel with live logs and activity monitoring

### 🎯 Professional Interface Components
- **Activity Bar**: Left navigation with primary sections (Dashboard, Prompts, Search, MCP, Settings)
- **Sidebar**: Collapsible navigation with prompt categories, shortcuts, and quick actions
- **Command Bar**: Top header with global search, page title, and command palette access
- **Status Bar**: Bottom status with system info, diagnostics toggle, and sync status
- **Bottom Panel**: Collapsible diagnostics with live logs and activity monitoring
- **Mobile Layout**: Responsive overlay navigation for touch devices

### 🔧 Production-Ready Features
- **Native Module Compatibility**: SQLite and all dependencies working across platforms
- **Error Handling**: Comprehensive error states with user-friendly feedback
- **Performance Optimized**: Code splitting, lazy loading, and optimized webpack builds
- **Security Hardened**: Context isolation, secure preload scripts, and proper IPC communication
- **Cross-Platform Ready**: Build system supports Windows, macOS, and Linux packaging

### 💻 System Requirements
- **Node.js**: 20+ with TypeScript 5.x
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 200MB available disk space
- **OS**: macOS 10.15+, Windows 10+, or Ubuntu 18.04+

## 🎮 CLI Usage

### Core Commands
| Command | Description | Example |
|---------|-------------|----------|
| `list [category]` | List prompts by category | `npm start -- list work` |
| `search <query>` | Search prompts with filters | `npm start -- search "code review" --category work` |
| `show <id>` | Show detailed prompt info | `npm start -- show work_code_review_01` |
| `render <id>` | Render prompt with variables | `npm start -- render work_code_review_01 language=TypeScript` |
| `categories` | Show category statistics | `npm start -- categories` |
| `favorites add <id>` | Add prompt to favorites | `npm start -- favorites add work_api_design_01` |
| `recent` | Show recently used prompts | `npm start -- recent` |

### Advanced Features
```bash
# Interactive variable prompting
npm start -- render work_code_review_01

# Dry-run validation
npm start -- render work_api_design_01 --dry-run

# Output formats
npm start -- render work_code_review_01 language=TS code="..." --format=json
npm start -- render work_code_review_01 language=TS code="..." --format=plain --copy

# Save/load variable presets
npm start -- render work_api_design_01 --save=api-preset.json service_name=MyAPI
npm start -- render --load=api-preset.json
```

## 🌐 MCP (Model Context Protocol)

### HTTP/WebSocket Server
Exposes prompts as tools via web endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mcp/tools` | GET | List all available tools |
| `/api/mcp/call` | POST | Call a tool (JSON-RPC 2.0) |
| `/api/mcp/render` | POST | Render prompt via REST |
| `/api/mcp/ws` | WS | WebSocket endpoint |
| `/api/mcp` | GET | Server info and capabilities |

**Example Usage:**
```bash
# List all tools
curl -s http://localhost:4321/api/mcp/tools | jq

# Call a prompt tool
curl -s -X POST http://localhost:4321/api/mcp/call \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "prompt_work_code_review_01",
      "arguments": {
        "language": "TypeScript",
        "code": "const x = 1;"
      }
    }
  }' | jq
```

### stdio MCP Server
```bash
# Start stdio MCP server
npm run mcp-server
```
Exposes each prompt as a tool named `prompt_<id>` for AI assistant integration.

## 🔌 REST APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/prompts` | GET | List prompts (with optional category filter) |
| `/api/prompts/:id` | GET | Get specific prompt by ID |
| `/api/prompts` | POST | Create new prompt |
| `/api/prompts/:id` | PUT | Update existing prompt |
| `/api/prompts/:id` | DELETE | Delete prompt |
| `/api/search` | GET | Search prompts (q, category, tags, author, limit) |

## 📊 **Architecture & Repository Structure**

### 🏠 **Clean Architecture**
- **Domain Layer**: Core business logic and entities
- **Application Layer**: Use cases and application services  
- **Infrastructure Layer**: Database, file system, external services
- **Interface Layer**: CLI, Web UI, MCP servers, REST APIs

### 📋 **Directory Structure**
```
prompt-manager/
├── 📦 packages/                    # Main application code
│   ├── 🧠 core/                    # Domain & application layers
│   ├── 🔧 infrastructure/          # Repository implementations
│   └── 🚀 apps/                    # User interfaces
│       ├── 💻 cli/                 # Command-line interface
│       ├── 🖥️  electron/            # Desktop application (Electron)
│       │   ├── main/               # Main process (Node.js backend)
│       │   ├── renderer/           # Renderer process (React frontend)
│       │   └── shared/             # Shared utilities & preload
│       ├── 📡 mcp-server/          # MCP stdio server
│       └── 🌐 web/                 # Web interface & APIs
├── ☁️ .devcontainer/              # GitHub Codespace configuration
│   ├── devcontainer.json          # Main Codespace settings
│   ├── docker-compose.yml         # Development services
│   ├── Dockerfile                 # Development container
│   └── setup.sh                   # Automatic initialization
├── 🐳 docker-compose.yml           # Multi-service Docker setup
├── 📜 Dockerfile                  # Production container image
├── ☸️  k8s/                         # Kubernetes manifests
├── 📋 docs/                       # Comprehensive documentation
├── 📝 prompts/                     # Default prompt storage
│   ├── 💼 work/                    # Work-related prompts
│   ├── 👤 personal/                # Personal prompts
│   └── 🤝 shared/                  # Shared prompts
├── ⚙️  config/                     # Environment configurations
├── 🧹 CLEANUP_SUMMARY.md          # Project maintenance guidelines
└── 🛠️  scripts/                     # Deployment & utility scripts
```

## 📚 **Documentation**

Comprehensive guides for different aspects of the system:

| Document | Description |
|----------|-------------|
| **[GitHub Codespace Guide](docs/CODESPACE.md)** | ☁️ Complete cloud development setup (3-minute start) |
| **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** | 🚀 Multi-platform deployment instructions |
| **[MCP Web Server](docs/MCP_WEB_SERVER.md)** | 📡 HTTP/WebSocket MCP server documentation |
| **[Client-Side Filtering](docs/CLIENT_SIDE_FILTERING.md)** | ⚡ Performance improvements and filtering |
|| **[WARP.md](WARP.md)** | 🛠️ Complete development reference |
|| **[Cleanup Summary](CLEANUP_SUMMARY.md)** | 🧹 Project maintenance and cleanup guidelines |

## 🔧 **Development**

### **Core Commands**
```bash
# Development workflow
npm run build              # Build CLI and core packages  
npm run build:all          # Build all packages (CLI + Web)
npm run lint               # TypeScript type checking (CLI/Core only)
npm run test               # Run test suite
npm run test:coverage      # Tests with coverage report
npm run clean              # Remove all build artifacts

# Electron Desktop App
npm run electron:build     # Build all Electron components
npm run electron:dev       # Start development mode with hot reload
npm run electron:pack      # Package for current platform
npm run electron:dist      # Build and package for distribution

# Web Interface
npm run web:build          # Build Astro web application
npm run web:dev            # Start web development server
npm run mcp-web:dev        # Start MCP-enabled web interface

# Database operations (if using database mode)
npm run db:migrate         # Apply database migrations
npm run db:seed           # Import prompts to database
npm run db:studio         # Open database GUI
```

### **Environment Setup**
```bash
# File-based storage (default)
REPOSITORY_TYPE=filesystem

# Database storage (PostgreSQL/Neon)
REPOSITORY_TYPE=database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Platform configuration
PLATFORM_TYPE=docker     # or kubernetes, azure, vercel
```

### **Architecture Principles**
- 🏠 **Clean Architecture** with clear separation of concerns
- 🎯 **Domain-Driven Design** with rich domain entities
- 📚 **Repository Pattern** for pluggable data storage
- 🔒 **TypeScript** throughout with strict type checking
- 🚀 **Enterprise patterns** (Factory, Strategy, Manager)
- 📡 **MCP Protocol** integration for AI assistants

## 👥 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run the test suite**: `npm test`
5. **Submit a pull request**

See [WARP.md](WARP.md) for detailed development guidance.

## 💬 **Support & Community**

- **Issues**: [GitHub Issues](https://github.com/Lukeus/prompt-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Lukeus/prompt-craft/discussions) 
- **Documentation**: [Complete Docs](docs/)

## 📚 **Related Projects**

- **[Model Context Protocol](https://modelcontextprotocol.io/)** - The protocol this system implements
- **[Astro](https://astro.build/)** - Powers the web interface
- **[Drizzle ORM](https://orm.drizzle.team/)** - Database layer

## 📌 **Roadmap**

### ✅ **Completed**
- ✅ **Production-Ready Desktop Application** - Complete VS Code-like Electron interface
- ✅ **Settings System** - Full app configuration with themes and behavior controls
- ✅ **MCP Server Integration** - Built-in server management with live diagnostics
- ✅ **Advanced Search & Filtering** - Real-time search with category and tag filtering
- ✅ **GitHub Codespace Support** - Full cloud development environment with 3-minute setup
- ✅ **Multi-platform deployment** support (Docker, Kubernetes, Azure, Vercel)
- ✅ **Enterprise authentication** (Azure AD, LDAP integration)
- ✅ **Health checks and monitoring** (Prometheus, Grafana, Azure Insights)
- ✅ **Comprehensive project maintenance** (cleanup procedures, dependency management)
- ✅ **Step-by-step prompt creation wizard** with validation
- ✅ **Dual storage backends** (File system + PostgreSQL with Drizzle ORM)

### 🚧 **In Progress**

#### Next Phase Features
- 🚧 **Real-time Settings Persistence** - File-based settings storage (currently in-memory)
- 🚧 **Enhanced Export/Import** - Complete data backup and restore functionality
- 🚧 **Auto-updater Integration** - Seamless application updates
- 🚧 **Real-time collaboration** features for team prompt management  
- 🚧 **Plugin system** for custom prompt types and integrations
- 🚧 **Advanced analytics** and usage insights dashboard
- 🚧 **AI-powered prompt suggestions** and optimization recommendations

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the Prompt Craft team**

**Powered by TypeScript, Node.js, and the Model Context Protocol**

[🚀 Deploy Now](docs/DEPLOYMENT_GUIDE.md) • [📚 Read Docs](docs/) • [🐛 Report Bug](https://github.com/Lukeus/prompt-craft/issues)

</div>
