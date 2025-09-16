# 🎯 Prompt Craft

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen)](https://modelcontextprotocol.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)

A **production-ready, enterprise-grade** TypeScript prompt management system with multi-platform deployment support. Features **CLI**, **Web Interface**, **MCP Protocol**, and **REST APIs** for organizing and rendering AI prompts across any infrastructure.

## ✨ Features

### 🏢 **Enterprise Ready**
- 🚀 **Multi-platform deployment** (Docker, Kubernetes, Azure, AWS, GCP, Vercel)
- 🔒 **Authentication & Security** (Azure AD, OAuth2, LDAP)
- 📊 **Health checks & monitoring** (Prometheus, Grafana, Azure Insights)
- 🗄️ **Database flexibility** (PostgreSQL, Azure SQL, MySQL, SQLite)
- 🔧 **Environment-aware configuration** with validation

### 🎨 **Core Features**
- 📚 **Organize prompts** by categories (work, personal, shared)
- 💻 **CLI interface** with interactive variable entry and validation
- 🌐 **Modern web interface** with client-side filtering
- 📡 **MCP Protocol** support (stdio + HTTP/WebSocket)
- 💾 **Variable presets** and favorites tracking
- 🔄 **Type-aware parsing** for numbers, booleans, arrays
- 📋 **Copy to clipboard** with multiple output formats
- 🔍 **Advanced search** with full-text search and filtering

## 🚀 Quick Start

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
│       ├── 📡 mcp-server/          # MCP stdio server
│       └── 🌐 web/                 # Web interface & APIs
├── 🐳 docker-compose.yml           # Multi-service Docker setup
├── 📜 Dockerfile                  # Production container image
├── ☸️  k8s/                         # Kubernetes manifests
├── 📋 docs/                       # Comprehensive documentation
├── 📝d prompts/                     # Default prompt storage
│   ├── 💼 work/                    # Work-related prompts
│   ├── 👤 personal/                # Personal prompts
│   └── 🤝 shared/                  # Shared prompts
├── ⚙️  config/                     # Environment configurations
└── 🛠️  scripts/                     # Deployment & utility scripts
```

## 📚 **Documentation**

Comprehensive guides for different aspects of the system:

| Document | Description |
|----------|-------------|
| **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** | 🚀 Complete multi-platform deployment instructions |
| **[MCP Web Server](docs/MCP_WEB_SERVER.md)** | 📡 HTTP/WebSocket MCP server documentation |
| **[Client-Side Filtering](docs/CLIENT_SIDE_FILTERING.md)** | ⚡ Performance improvements and filtering |
| **[WARP.md](WARP.md)** | 🛠️ Complete development reference |

## 🔧 **Development**

### **Core Commands**
```bash
# Development workflow
npm run build              # Build all packages  
npm run lint               # TypeScript type checking
npm run test               # Run test suite
npm run test:coverage      # Tests with coverage report

# Database operations (if using database mode)
npm run db:migrate         # Apply database migrations
npm run db:seed           # Import prompts to database
npm run db:studio         # Open database GUI

# Clean up
npm run clean             # Remove build artifacts
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

- **Issues**: [GitHub Issues](https://github.com/your-org/prompt-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/prompt-craft/discussions) 
- **Documentation**: [Complete Docs](docs/)

## 📚 **Related Projects**

- **[Model Context Protocol](https://modelcontextprotocol.io/)** - The protocol this system implements
- **[Astro](https://astro.build/)** - Powers the web interface
- **[Drizzle ORM](https://orm.drizzle.team/)** - Database layer

## 📌 **Roadmap**

- ✅ Multi-platform deployment support
- ✅ Enterprise authentication (Azure AD, LDAP)
- ✅ Health checks and monitoring
- 🚧 Real-time collaboration features
- 🚧 Plugin system for custom prompt types
- 🚧 Advanced analytics and usage insights

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the Prompt Craft team**

**Powered by TypeScript, Node.js, and the Model Context Protocol**

[🚀 Deploy Now](docs/DEPLOYMENT_GUIDE.md) • [📚 Read Docs](docs/) • [🐛 Report Bug](https://github.com/your-org/prompt-craft/issues)

</div>
