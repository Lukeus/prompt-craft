# 🎯 Prompt Craft

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen)](https://modelcontextprotocol.io/)

A powerful TypeScript-based prompt management system with **CLI**, **MCP** (stdio and web/HTTP+WS), and **REST APIs** for organizing and rendering AI prompts.

## ✨ Features

- 🎨 **Organize prompts** by categories (work, personal, shared)
- 🚀 **CLI interface** with interactive variable entry and validation
- 🌐 **Web APIs** with REST and MCP endpoints
- 📡 **MCP Protocol** support (stdio + HTTP/WebSocket)
- 💾 **Variable presets** and favorites tracking
- 🔄 **Type-aware parsing** for numbers, booleans, arrays
- 📋 **Copy to clipboard** with multiple output formats
- 🔍 **Search and filtering** with tags and categories

## 🚀 Quick Start

### Installation & Setup
```bash
# Install dependencies
npm install

# Build all packages
npm run clean && npm run build

# Start CLI
npm start -- help
# or directly:
node dist/packages/apps/cli/index.js help
```

### Web Preview
```bash
npm run web:build && npm run web:preview
```

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

## 📁 Repository Structure

```
prompt-manager/
├── 📦 packages/
│   ├── 🧠 core/                    # Domain and application layers
│   ├── 🔧 infrastructure/          # File-system repository and adapters  
│   └── 🚀 apps/
│       ├── 💻 cli/                 # Command-line interface
│       ├── 📡 mcp-server/          # MCP stdio server
│       └── 🌐 web/                 # Astro-based web APIs
├── 📝 prompts/                     # Prompt JSON files by category
│   ├── 💼 work/                    # Work-related prompts
│   ├── 👤 personal/                # Personal prompts  
│   └── 🤝 shared/                  # Shared prompts
└── ⚙️  config/                     # Configuration files
```

## 🛠️ Development

### Commands
```bash
# Type checking
npm run lint

# Testing
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # With coverage report

# Building
npm run build              # Build all packages
npm run build:cli          # Build CLI only
npm run clean              # Clean build artifacts
```

### Architecture
- **Clean Architecture** with clear separation of concerns
- **Domain-Driven Design** with entities and use cases
- **Repository Pattern** for data persistence
- **TypeScript** throughout with strict type checking
- **MCP Protocol** for AI assistant integration

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using TypeScript, Node.js, and the Model Context Protocol**
