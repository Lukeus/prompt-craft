# Prompt Craft - AI Prompt Management System

## Project Overview

Prompt Craft is a production-ready, enterprise-grade TypeScript prompt management system that provides comprehensive tools for organizing, managing, and serving AI prompts through multiple interfaces. The system supports both file-based and PostgreSQL storage with MCP (Model Context Protocol) server integration for seamless AI assistant connectivity.

## Architecture & Technology Stack

- **Language**: TypeScript (strict mode) compiling to JavaScript
- **Runtime**: Node.js (>=20.0.0)
- **Database**: PostgreSQL with Drizzle ORM (optional, falls back to file system)
- **Frontend**: 
  - Web: Astro with Tailwind CSS
  - Desktop: Electron with React and Framer Motion
- **Build Tools**: 
  - TypeScript compiler
  - Webpack 5 (Electron renderer)
  - Astro (web interface)
- **Testing**: Jest with ts-jest
- **Package Manager**: npm

## Repository Structure

```
├── packages/
│   ├── core/                     # Domain entities and use cases
│   ├── infrastructure/           # Repository implementations
│   │   ├── filesystem/          # JSON file-based storage
│   │   └── database/            # PostgreSQL with Drizzle ORM
│   └── apps/
│       ├── cli/                 # Command-line interface
│       ├── mcp-server/          # MCP server (stdio transport)
│       ├── web/                 # Astro web interface + MCP endpoints
│       └── electron/            # Desktop application
│           ├── main/            # Electron main process
│           ├── shared/          # Preload scripts
│           └── renderer/        # React frontend
├── prompts/                     # Default prompt storage (filesystem mode)
├── scripts/                     # Database management scripts
├── drizzle/                     # Database migrations
└── dist/                        # Compiled output
```

## Build Commands (Critical - Always Use These)

### Core Development
- `npm run build` - Build all TypeScript packages
- `npm run clean` - Remove all build artifacts (run before fresh builds)
- `npm run lint` - Type check without emitting files
- `npm test` - Run Jest test suite

### Database Management
- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply database migrations
- `npm run db:seed` - Import existing JSON prompts to database
- `npm run db:studio` - Open Drizzle Studio for database inspection

### Electron Desktop App
- `npm run electron:build` - Build all Electron components
- `npm run electron:dev` - Start in development mode with hot reload
- `npm run electron:start` - Start the built application

### Web Interface
- `npm run web:dev` - Start Astro development server
- `npm run web:build` - Build for production
- `npm run mcp-web:dev` - Start MCP-enabled web interface

## Development Workflow

1. **Always run `npm run build` before starting any application**
2. **Clean build artifacts with `npm run clean` when switching between major changes**
3. **Use `npm run lint` to catch TypeScript errors early**
4. **For database features, ensure `DATABASE_URL` is set in environment**

## Key Design Patterns

- **Repository Pattern**: Pluggable storage (FileSystemPromptRepository, DrizzlePromptRepository)
- **Manager Pattern**: PromptManager centralizes operations
- **Strategy Pattern**: Different prompt categories (work, personal, shared)
- **Template Pattern**: Variable interpolation with `{{variable}}` syntax

## Environment Configuration

```bash
# Repository selection
REPOSITORY_TYPE=filesystem  # Default: JSON files
REPOSITORY_TYPE=database    # Use PostgreSQL

# Database (required for database mode)
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional
PROMPTS_DIRECTORY=./prompts  # Custom prompts directory
```

## Coding Standards

- **Strict TypeScript**: All code must pass `tsc --noEmit`
- **Async/await**: Use throughout for file operations
- **Error handling**: Comprehensive error handling with typed exceptions
- **Module system**: CommonJS for Node.js compatibility
- **No shortcuts**: Quality and correctness over speed

## Prompt System Structure

Prompts are JSON files with:
- Metadata (id, name, description, category, tags, author)
- Content with `{{variable}}` placeholders
- Variable definitions with types and validation
- Support for string, number, boolean, array types

## MCP Integration

The system provides multiple MCP server implementations:
- **CLI MCP Server**: stdio transport for local AI assistants
- **Web MCP Server**: HTTP/WebSocket endpoints for web integration
- Each prompt exposed as callable tool with JSON schemas

## Deployment Targets

- **Docker**: `./scripts/deploy.sh docker`
- **Kubernetes**: `./scripts/deploy.sh kubernetes`
- **Azure**: `./scripts/deploy.sh azure`
- **Vercel**: `./scripts/deploy.sh vercel`

## Critical Notes

- **Never deploy without explicit confirmation** - deployment requires user approval
- **Always run linting before deploying** - no known lint errors allowed in production
- **Repository architecture must not be changed** - follow existing patterns
- **Database migrations must be generated before schema changes**
- **Electron renderer uses webpack code splitting** - maintain performance optimizations

## Testing & Quality

- **Jest configuration** exists but tests need to be written
- **Focus on PromptManager operations, validation, and MCP functionality**
- **Mock file system operations for reliable testing**
- **Test both filesystem and database repository modes**

## Performance Considerations

- **Webpack bundle optimization** implemented for Electron renderer
- **Code splitting** used for route-based loading
- **Database mode** recommended for concurrent access and large prompt collections
- **File system mode** suitable for development and single-user scenarios