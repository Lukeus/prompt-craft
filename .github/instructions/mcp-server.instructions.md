---
applyTo: "packages/apps/mcp-server/**/*.ts,packages/apps/web/pages/api/mcp/**/*.ts"
---

# MCP Server Implementation Instructions

## MCP Protocol Standards

- Follow Model Context Protocol (MCP) specifications exactly
- Use `@modelcontextprotocol/sdk` for stdio transport
- Implement proper JSON-RPC 2.0 error handling
- Provide meaningful error messages with appropriate error codes
- Support both stdio and HTTP/WebSocket transports

## Tool Definition Standards

- Each prompt becomes a callable MCP tool
- Generate dynamic JSON schemas from prompt variable definitions
- Use descriptive tool names and descriptions
- Implement proper input validation based on variable types
- Handle missing or invalid parameters gracefully

## Server Architecture

### CLI MCP Server (stdio)
- Use stdio transport for local AI assistant integration
- Implement proper process lifecycle management
- Handle termination signals gracefully
- Provide structured logging

### Web MCP Server (HTTP/WebSocket)
- Support both HTTP POST and WebSocket connections
- Implement proper CORS handling for web access
- Provide REST API wrapper for easier integration
- Handle concurrent requests efficiently

## Tool Implementation Patterns

- **List Tools**: Enumerate available prompts as tools
- **Call Tool**: Execute prompt rendering with variables
- **Search Tools**: Find prompts by query or category
- **Validation**: Type checking and constraint validation
- **Error Handling**: Proper MCP error codes and messages

## Integration Guidelines

- Use PromptManager for all prompt operations
- Support both filesystem and database repository modes
- Implement proper connection pooling for database mode
- Cache prompt schemas for performance
- Handle repository switching gracefully

## Testing MCP Servers

- Test with actual MCP clients when possible
- Validate JSON-RPC 2.0 compliance
- Test error scenarios and edge cases
- Verify schema generation accuracy
- Test concurrent request handling