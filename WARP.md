# WARP.md

This file provides comprehensive guidance to WARP (warp.dev) when working with the **Prompt Craft** codebase - a production-ready, enterprise-grade TypeScript prompt management system.

## 🚀 **Development Commands**

### **Core Build and Development**
- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm run build:all` - Build both CLI and web components
- `npm run clean` - Remove all build artifacts and start fresh (dist/, dist-web/, coverage/)
- `npm start` - Start the compiled CLI application
- `npm run lint` - Type check without emitting files (strict TypeScript checking)
- `npm run dev:cli` - Run CLI in development mode using ts-node

### **Database Management (PostgreSQL + Drizzle ORM)**
- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply database migrations
- `npm run db:seed` - Import existing JSON prompts to database
- `npm run db:export` - Export database prompts to JSON files
- `npm run db:reset` - Reset database (delete all prompts)
- `npm run db:studio` - Open Drizzle Studio for database inspection

### **Electron Desktop Application**
- `npm run electron:build` - Build all Electron components (main, preload, renderer)
- `npm run electron:build:main` - Build Electron main process only
- `npm run electron:build:preload` - Build Electron preload script only  
- `npm run electron:build:renderer` - Build Electron renderer (React frontend) only
- `npm run electron:dev` - Start Electron in development mode with hot reload
- `npm run electron:start` - Start the built Electron application
- `npm run electron:pack` - Package Electron app for current platform
- `npm run electron:dist` - Build and package Electron app for distribution

### **Web Interface & MCP Server**
- `npm run web:dev` - Start the Astro web interface in development mode
- `npm run web:build` - Build the Astro web interface for production
- `npm run web:preview` - Preview the production build
- `npm run mcp-web:dev` - Start MCP-enabled web interface in development mode
- `npm run mcp-web:build` - Build the MCP-enabled web interface for production
- `npm run mcp-web:preview` - Preview the MCP-enabled production build
- `npm run mcp-server` - Start the CLI-based MCP server (stdio transport)
- `npm run dev:web` - Start both build process and web development server
- `npm run dev:mcp-web` - Start both build process and MCP web development server

### **Testing & Quality**
- `npm test` - Run Jest test suite with coverage
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:coverage` - Generate detailed coverage report
- `npm run test:watch` - Run tests in watch mode

### **Deployment & Platform Management**
- `./scripts/deploy.sh docker` - Deploy with Docker Compose
- `./scripts/deploy.sh kubernetes` - Deploy to Kubernetes cluster
- `./scripts/deploy.sh azure` - Deploy to Azure Container Apps
- `./scripts/deploy.sh vercel` - Deploy to Vercel
- `./scripts/deploy.sh --help` - View all deployment options

### CLI Usage
After building, the CLI can be used with:
```bash
# List prompts by category
node dist/packages/apps/cli/index.js list work
node dist/packages/apps/cli/index.js list personal

# Or via npm start (equivalent to node dist/cli/index.js)
npm start -- list work

# Search prompts
node dist/packages/apps/cli/index.js search "code review"

# Render prompts with variables
node dist/packages/apps/cli/index.js render <prompt_id> language=TypeScript code="example"

# Show categories and help
node dist/packages/apps/cli/index.js categories
node dist/packages/apps/cli/index.js help
```

## Architecture Overview

### Core Structure
This is a TypeScript-based prompt management system that organizes AI prompts into categories and provides both CLI and MCP server interfaces.

**Primary Components:**
- **Core Domain & Application** (`packages/core/`) - Entities, repositories, and use cases (Prompt, PromptUseCases)
- **Infrastructure** (`packages/infrastructure/`) - FileSystemPromptRepository, DrizzlePromptRepository, and adapters
- **CLI Interface** (`packages/apps/cli/`) - Command-line interface for prompt management
- **MCP Server (stdio)** (`packages/apps/mcp-server/`) - Model Context Protocol server exposing prompts as tools
- **Web Interface** (`packages/apps/web/`) - Astro-based web interface with HTTP/WS MCP endpoints and REST APIs
- **Electron Desktop App** (`packages/apps/electron/`) - Cross-platform desktop application with React frontend

### Data Flow Architecture
1. **Configuration**: System loads from `config/prompts.json` with fallback to defaults
2. **Prompt Storage**: 
   - **File System**: JSON files organized in category directories (`prompts/work/`, `prompts/personal/`, `prompts/shared/`)
   - **Database**: PostgreSQL with Drizzle ORM for scalable, concurrent access
3. **Variable Interpolation**: Templates use `{{variable}}` syntax with type validation
4. **Search & Retrieval**: Multi-field search with PostgreSQL full-text search (database mode) or in-memory filtering (file mode)

### Key Design Patterns
- **Manager Pattern**: PromptManager centralizes all prompt operations
- **Strategy Pattern**: Different prompt categories (work, personal, shared) with specialized types
- **Template Pattern**: Variable interpolation with validation and default values
- **Repository Pattern**: Pluggable storage backends:
  - `FileSystemPromptRepository`: File-based storage with in-memory caching
  - `DrizzlePromptRepository`: PostgreSQL with Drizzle ORM

## Prompt System Details

### Prompt Categories
- **Work**: Software engineering prompts (code review, debugging, architecture, testing)
- **Personal**: Creative prompts (music, visual art, branding, photography)
- **Shared**: General-purpose prompts (brainstorming, writing)

### Prompt Structure
Each prompt is a JSON file with:
- Metadata (id, name, description, category, tags, timestamps, author)
- Content with `{{variable}}` placeholders
- Variable definitions with types, requirements, and defaults

### Variable System
Supports typed variables:
- `string`, `number`, `boolean`, `array`
- Required/optional with validation
- Default values for optional parameters
- Runtime type checking during rendering

## MCP Integration

The system provides two MCP server implementations:

### CLI MCP Server (stdio)
- Traditional MCP server using stdio transport
- Located in `packages/apps/mcp-server/`
- Perfect for local AI assistant integration
- Uses `@modelcontextprotocol/sdk` stdio transport

### Web MCP Server (HTTP/WebSocket)
- Web-accessible MCP server with multiple access methods
- HTTP endpoints with JSON-RPC 2.0 protocol
- WebSocket support for real-time communication
- REST API wrapper for easier integration
- Located in `packages/apps/web/pages/api/mcp/`
- Can be deployed to any web hosting platform

### MCP Server Features (Both Implementations)
- Each prompt exposed as a callable tool
- Dynamic JSON schemas generated from prompt variables
- Automatic input validation based on variable definitions
- Error handling for missing or invalid parameters
- Standardized response format for AI assistants
- Custom handlers for prompt search and category listing
- Comprehensive error handling with appropriate MCP error codes

## Desktop Application (Electron)

### Architecture
The Electron app provides a native desktop experience with:
- **Main Process** (`packages/apps/electron/main/`) - Node.js backend handling file system, database, and window management
- **Preload Script** (`packages/apps/electron/shared/preload.ts`) - Secure bridge exposing APIs to renderer
- **Renderer Process** (`packages/apps/electron/renderer/`) - React-based frontend with modern UI

### Key Features
- Native desktop integration with system notifications
- Secure IPC communication between main and renderer processes
- React-based UI with TypeScript support
- Hot reload during development
- Cross-platform packaging (Windows, macOS, Linux)

### Development Workflow
1. **Start Development**: `npm run electron:dev` (builds and starts with hot reload)
2. **Build for Testing**: `npm run electron:build && npm run electron:start`
3. **Package for Distribution**: `npm run electron:pack` or `npm run electron:dist`

### Troubleshooting
- **Preload Issues**: Ensure preload script is built and copied to correct path (`dist/electron/packages/apps/electron/shared/preload.js`)
- **API Not Available**: Check that `window.electronAPI` is properly exposed in renderer
- **IPC Communication**: Verify main process event handlers match renderer calls

## Development Guidance

### Repository Configuration

The system supports two storage backends that can be switched via environment configuration:

#### Environment Variables
```bash
# Repository type selection
REPOSITORY_TYPE=filesystem  # Use JSON files (default)
REPOSITORY_TYPE=database    # Use PostgreSQL

# Database configuration (required for database mode)
DATABASE_URL=postgresql://username:password@host:5432/database

# Optional: Custom prompts directory (filesystem mode)
PROMPTS_DIRECTORY=./my-prompts
```

#### Repository Selection Logic
1. **Environment Variable**: `REPOSITORY_TYPE=database` switches to PostgreSQL
2. **Automatic Fallback**: Falls back to filesystem if `DATABASE_URL` is not configured
3. **Default**: Filesystem repository with JSON files

### Database Setup (PostgreSQL + Neon)

1. **Get Neon Database URL**:
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Configure Environment**:
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your database URL
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   REPOSITORY_TYPE=database
   ```

3. **Setup Database**:
   ```bash
   # Generate and apply migrations
   npm run db:generate
   npm run db:migrate
   
   # Import existing prompts (optional)
   npm run db:seed
   
   # Or import from custom directory
   npm run db:seed -- --source-dir ./backup-prompts
   ```

### File Organization
- `packages/core/` - Domain entities, use cases, and interfaces
- `packages/infrastructure/` - Repository implementations and external integrations
  - `filesystem/` - FileSystemPromptRepository for JSON file storage
  - `database/` - DrizzlePromptRepository and PostgreSQL schema
- `packages/apps/` - Application interfaces
  - `cli/` - Command-line interface
  - `mcp-server/` - MCP server (stdio transport)
  - `web/` - Astro web interface with MCP endpoints
  - `electron/` - Desktop application (main, preload, renderer)
- `prompts/` - Default prompt storage directory (filesystem mode)
- `scripts/` - Database management and migration scripts
- `drizzle/` - Generated database migration files
- `dist/` - Compiled TypeScript output
- `dist-web/` - Built Astro web application
- `dist-electron/` - Packaged Electron application

### Adding New Prompts
1. Create JSON file in appropriate category directory (`prompts/work/`, `prompts/personal/`, `prompts/shared/`)
2. Follow the Prompt interface structure with all required fields
3. Include variable definitions for dynamic content
4. Add relevant tags for searchability
5. Rebuild the project to include new prompts in the system

### TypeScript Development Notes
- All code uses strict TypeScript with comprehensive type definitions
- Async/await pattern throughout for file operations
- Error handling with typed exceptions
- Proper separation of concerns between managers, utils, and types
- Uses CommonJS module system for Node.js compatibility

### Testing Considerations
- Jest is configured but no tests currently exist
- Test structure should mirror src/ directory
- Focus on testing PromptManager operations, validation, and MCP server functionality
- Mock file system operations for reliable testing

### Configuration Management
- System auto-generates default config if none exists
- Config stored in `config/prompts.json`
- Supports runtime config updates through PromptManager API
- MCP server configuration includes name, version, and optional port
- Repository type can be switched via `REPOSITORY_TYPE` environment variable
- Automatic fallback from database to filesystem if DATABASE_URL is not configured

### Database Migration Workflow

1. **Development**:
   ```bash
   # Make schema changes in packages/infrastructure/database/schema.ts
   npm run db:generate    # Generate migration files
   npm run db:migrate     # Apply to your database
   ```

2. **Data Migration**:
   ```bash
   # Preview what will be migrated
   npm run db:seed -- --dry-run
   
   # Import existing JSON prompts
   npm run db:seed
   
   # Reset and re-import (caution: deletes all data)
   npm run db:reset -- --force
   npm run db:seed
   ```

3. **Production Deployment**:
   - Set `REPOSITORY_TYPE=database` and `DATABASE_URL` environment variables
   - Run `npm run db:migrate` to apply schema
   - Optionally run `npm run db:seed` to import initial data

### **Multi-Platform Deployment**

The system supports deployment across multiple platforms with automatic configuration:

#### **Local Development**
```bash
# Docker Compose (with PostgreSQL, Redis, monitoring)
docker-compose up -d

# Access services:
# - Web Interface: http://localhost:3000
# - Database: localhost:5432
# - Grafana: http://localhost:3001
# - Prometheus: http://localhost:9090
```

#### **Production Kubernetes**
```bash
# Deploy to Kubernetes with health checks, scaling, monitoring
kubectl apply -f k8s/

# Or use deployment script
./scripts/deploy.sh kubernetes --environment production
```

#### **Enterprise Azure**
```bash
# Deploy to Azure Container Apps with Azure AD, Azure SQL
./scripts/deploy.sh azure --environment production

# Automatically configures:
# - Azure AD authentication
# - Azure SQL Database
# - Application Insights monitoring
# - Container scaling
```

#### **Configuration Management**

The system uses environment-aware configuration with automatic platform detection:

```bash
# Environment Variables (automatically loaded)
NODE_ENV=production                    # Environment
PLATFORM_TYPE=kubernetes               # Platform detection
REPOSITORY_TYPE=database               # Storage backend
DATABASE_URL=postgresql://...          # Database connection

# Feature Flags
FEATURE_WEB=true                       # Enable web interface
FEATURE_MCP=true                       # Enable MCP server
FEATURE_AUTH=true                      # Enable authentication
FEATURE_MONITORING=true                # Enable health checks
```

### **Performance Considerations**

#### **File System Repository**
- **Pros**: Simple, no external dependencies, works offline
- **Cons**: No concurrent access, limited search capabilities
- **Best for**: Development, single-user scenarios, small prompt collections

#### **Database Repository (PostgreSQL)**
- **Pros**: Concurrent access, full-text search, ACID transactions, scalable
- **Cons**: Requires external database, network dependency
- **Best for**: Production, multi-user access, large prompt collections

### **Enterprise Features**
- **Authentication**: Azure AD, OAuth2, LDAP integration
- **Monitoring**: Prometheus metrics, health check endpoints
- **Security**: Helmet.js security headers, CORS configuration
- **Scaling**: Kubernetes horizontal pod autoscaling
- **Caching**: Redis integration for improved performance

## Project Maintenance & Cleanup

### **Build Artifacts & Cleanup**
The project generates several types of build artifacts that should be managed:

#### **Safe to Delete (Regenerable)**
- `dist/` - Compiled TypeScript output (regenerated by `npm run build`)
- `dist-web/` - Built Astro web application (regenerated by `npm run web:build`)
- `dist-electron/` - Packaged Electron application (regenerated by `npm run electron:pack`)
- `coverage/` - Jest test coverage reports (regenerated by `npm run test:coverage`)
- `.astro/` - Astro build cache (regenerated automatically)
- `.vercel/` - Vercel deployment cache and build outputs
- `node_modules/` - Dependencies (reinstalled by `npm install`)

#### **Development Generated (Platform Specific)**
- `packages/**/dist/` - Individual package build outputs
- `drizzle/` - Database migration files (generated by `npm run db:generate` but should be committed)

#### **Cleanup Commands**
```bash
# Remove all build artifacts
npm run clean

# Deep clean (includes node_modules)
npm run clean && rm -rf node_modules && npm install

# Clean specific build types
rm -rf dist/           # CLI builds
rm -rf dist-web/       # Web builds  
rm -rf dist-electron/  # Electron packages
rm -rf coverage/       # Test coverage
rm -rf .vercel/        # Vercel cache
```

### **Dependency Management**
- **Audit Dependencies**: Use `npm audit` to check for security vulnerabilities
- **Update Dependencies**: Use `npm update` for minor updates, manual review for major updates
- **Remove Unused**: Regularly review and remove unused dependencies from `package.json`
- **Duplicate Detection**: Use tools like `npm ls --depth=0` to identify version conflicts

### **Git Hygiene**
Ensure `.gitignore` excludes:
```gitignore
# Build outputs
dist/
dist-web/
dist-electron/
coverage/

# Platform caches
.astro/
.vercel/
node_modules/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Environment
.env.local
.env.production
```
