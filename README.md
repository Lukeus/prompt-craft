# Prompt Craft

A TypeScript-based prompt management system with CLI, MCP (stdio and web/HTTP+WS), and REST APIs for organizing and rendering prompts.

## Quick Start

- Install dependencies:
  - npm install
- Build core + infrastructure + CLI:
  - npm run clean && npm run build
- Run CLI:
  - npm start -- help
- or: node dist/packages/apps/cli/index.js help
- Web preview (APIs only):
  - npm run web:build && npm run web:preview

## CLI Usage

Commands:
- list [category]           List prompts (optionally by category: work, personal, shared)
- search <query> [flags]    Search prompts (flags: --category, --limit)
- show <id>                 Show detailed prompt information and variables
- render <id> [vars...]     Render prompt with variables
- categories                Show category statistics
- help                      Show help

Examples:
- node dist/packages/apps/cli/index.js list work
- node dist/packages/apps/cli/index.js search "code review"
- node dist/packages/apps/cli/index.js render work_code_review_01 language=TypeScript code="const x=1"

## MCP (Web HTTP)

Endpoints (Astro):
- GET /api/mcp/tools          List tools (prompts + system tools)
- POST /api/mcp/call          Call a tool
- POST /api/mcp/render        Render a prompt via REST wrapper
- GET /api/mcp                Server info
- GET /api/mcp/ws             WebSocket endpoint (JSON-RPC 2.0)

Examples:
- curl -s http://localhost:4321/api/mcp/tools | jq
- curl -s -X POST http://localhost:4321/api/mcp/call \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"prompt_work_code_review_01","arguments":{"language":"TypeScript","code":"const x=1"}}}' | jq

## MCP (stdio)

- Start: npm run mcp-server
- This exposes each prompt as a tool named prompt_<id>

## REST APIs

- GET /api/prompts                  List prompts (optionally filter by category)
- GET /api/prompts/:id              Get a prompt by id
- POST /api/prompts                 Create a prompt
- PUT /api/prompts/:id              Update a prompt
- DELETE /api/prompts/:id           Delete a prompt
- GET /api/search                   Search prompts (q, category, tags, author, limit)

## Repository Structure

- packages/core                    Domain and application layers (Prompt, PromptUseCases)
- packages/infrastructure          File-system repository and adapters
- packages/apps/cli                CLI app
- packages/apps/mcp-server         MCP stdio server
- packages/apps/web                Astro-based web APIs (HTTP + WebSocket)
- prompts                          Prompt JSON files organized by category
- config                           Configuration files

## Development

- Type check: npm run lint
- Unit tests: npm run test:unit
- Integration tests: npm run test:integration
- All tests: npm test

## Notes

- CLI binary: after build, node dist/cli/index.js; bin mapping allows global usage as prompt-craft when installed or linked.
- MCP web endpoints now include category/tags in tool descriptions and meta fields (errors, usedDefaults) in render results.