# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Build and Development
- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm run dev` - Run the main application in development mode using ts-node
- `npm start` - Start the compiled CLI application
- `npm run lint` - Type check without emitting files (uses TypeScript compiler)

### MCP Server
- `npm run mcp-server` - Start the Model Context Protocol server for AI assistant integration

### Testing
- `npm test` - Run Jest tests (though no test files currently exist in the codebase)

### CLI Usage
After building, the CLI can be used with:
```bash
# List prompts by category
./dist/cli.js list work
./dist/cli.js list personal

# Search prompts
./dist/cli.js search "code review"

# Render prompts with variables
./dist/cli.js render prompt_id language=TypeScript code="example"

# Show categories and help
./dist/cli.js categories
./dist/cli.js help
```

## Architecture Overview

### Core Structure
This is a TypeScript-based prompt management system that organizes AI prompts into categories and provides both CLI and MCP server interfaces.

**Primary Components:**
- **PromptManager** (`src/managers/PromptManager.ts`) - Core business logic for prompt storage, retrieval, search, and rendering
- **MCP Server** (`src/mcp/server.ts`) - Model Context Protocol server that exposes prompts as callable tools for AI assistants
- **CLI Interface** (`src/index.ts`) - Command-line interface for prompt management
- **Type Definitions** (`src/types/index.ts`) - Comprehensive TypeScript interfaces and enums

### Data Flow Architecture
1. **Configuration**: System loads from `config/prompts.json` with fallback to defaults
2. **Prompt Storage**: JSON files organized in category directories (`prompts/work/`, `prompts/personal/`, `prompts/shared/`)
3. **Variable Interpolation**: Templates use `{{variable}}` syntax with type validation
4. **Search & Retrieval**: Multi-field search across name, description, content, and tags

### Key Design Patterns
- **Manager Pattern**: PromptManager centralizes all prompt operations
- **Strategy Pattern**: Different prompt categories (work, personal, shared) with specialized types
- **Template Pattern**: Variable interpolation with validation and default values
- **Repository Pattern**: File-based storage with in-memory caching via Map

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

The MCP server exposes each prompt as a callable tool with:
- Dynamic JSON schemas generated from prompt variables
- Automatic input validation based on variable definitions
- Error handling for missing or invalid parameters
- Standardized response format for AI assistants

### MCP Server Features
- Standard MCP tool listing and execution
- Custom handlers for prompt search and category listing
- Stdio transport for AI assistant integration
- Comprehensive error handling with appropriate MCP error codes

## Development Guidance

### File Organization
- `src/managers/` - Business logic and data management
- `src/mcp/` - Model Context Protocol server implementation
- `src/types/` - TypeScript type definitions and interfaces
- `src/utils/` - Utility classes (FileUtils, StringUtils, ValidationUtils)
- `prompts/` - Organized prompt storage by category
- `config/` - System configuration files

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
