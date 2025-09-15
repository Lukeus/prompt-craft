# Web-Accessible MCP Server

This document describes the web-accessible Model Context Protocol (MCP) server implementation for Prompt Craft. Unlike the CLI-based stdio MCP server, this web server can be accessed via HTTP and WebSocket connections, making it suitable for web applications and remote integrations.

## Overview

The web MCP server provides three different ways to access your prompt management functionality:

1. **HTTP MCP Protocol**: Standard MCP over HTTP with JSON-RPC 2.0
2. **WebSocket MCP Protocol**: Real-time MCP over WebSocket connections  
3. **REST API**: Simplified REST endpoints for easier integration

## Server Information

- **Server Name**: `prompt-craft-web-mcp`
- **Version**: `1.0.0`
- **Base URL**: Your deployed Astro site URL + `/api/mcp`

## Endpoints

### 1. Server Information
- **URL**: `/api/mcp`
- **Method**: `GET`
- **Description**: Get server capabilities, statistics, and usage examples

### 2. HTTP MCP Protocol

#### List Tools
- **URL**: `/api/mcp/tools`
- **Method**: `GET`  
- **Description**: Get all available MCP tools (prompts + system tools)
- **Response**: JSON-RPC 2.0 format with tools array

#### Execute Tool
- **URL**: `/api/mcp/call`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "prompt_<prompt_id>",
    "arguments": {
      "variable1": "value1",
      "variable2": "value2"
    }
  }
}
```

### 3. WebSocket MCP Protocol
- **URL**: `/api/mcp/ws`
- **Protocol**: WebSocket with JSON-RPC 2.0 messages
- **Connection**: Upgrade HTTP connection to WebSocket
- **Usage**: Send MCP messages as JSON over the WebSocket connection

### 4. REST API

#### Render Prompt
- **URL**: `/api/mcp/render`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "promptId": "your-prompt-id",
  "variables": {
    "variable1": "value1",
    "variable2": "value2"
  }
}
```

## Available Tools

### Prompt Tools
Each prompt in your system becomes an MCP tool with the format:
- **Name**: `prompt_<prompt_id>`
- **Description**: Combination of prompt name and description
- **Input Schema**: Generated from prompt variables

### System Tools

#### 1. Prompt Search
- **Name**: `prompt_search`
- **Description**: Search prompts by query, category, or tags
- **Parameters**:
  - `query` (string, optional): Search query string
  - `category` (string, optional): Filter by category (WORK, PERSONAL, SHARED)
  - `tags` (array, optional): Filter by tags
  - `limit` (number, optional): Maximum results (default: 10)

#### 2. List Categories
- **Name**: `prompt_list_categories`
- **Description**: List all prompt categories with counts
- **Parameters**: None

## Usage Examples

### HTTP MCP Client (JavaScript)

```javascript
// List all tools
const toolsResponse = await fetch('/api/mcp/tools');
const tools = await toolsResponse.json();

// Execute a prompt tool
const executeResponse = await fetch('/api/mcp/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'prompt_my-prompt-id',
      arguments: {
        language: 'TypeScript',
        framework: 'React'
      }
    }
  })
});
const result = await executeResponse.json();
```

### WebSocket MCP Client (JavaScript)

```javascript
const ws = new WebSocket('ws://your-domain.com/api/mcp/ws');

ws.onopen = () => {
  // Send initialization
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Received:', response);
};

// List tools
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list'
}));

// Execute tool
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'prompt_search',
    arguments: { query: 'code review', limit: 5 }
  }
}));
```

### REST API Client (JavaScript)

```javascript
// Render a prompt (simpler REST approach)
const response = await fetch('/api/mcp/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promptId: 'my-prompt-id',
    variables: {
      language: 'TypeScript',
      framework: 'React'
    }
  })
});

const result = await response.json();
if (result.success) {
  console.log('Rendered prompt:', result.renderedPrompt);
}
```

### Python Client Example

```python
import requests
import json

# HTTP MCP approach
def call_mcp_tool(base_url, tool_name, arguments=None):
    response = requests.post(f"{base_url}/api/mcp/call", 
        headers={"Content-Type": "application/json"},
        json={
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments or {}
            }
        }
    )
    return response.json()

# REST API approach
def render_prompt(base_url, prompt_id, variables=None):
    response = requests.post(f"{base_url}/api/mcp/render",
        headers={"Content-Type": "application/json"},
        json={
            "promptId": prompt_id,
            "variables": variables or {}
        }
    )
    return response.json()

# Usage
base_url = "https://your-domain.com"
result = render_prompt(base_url, "my-prompt-id", {"language": "Python"})
print(result["renderedPrompt"])
```

## Development

### Start Development Server
```bash
npm run dev:mcp-web
```
This starts both the build process and the Astro development server with MCP endpoints.

### Build for Production
```bash
npm run mcp-web:build
```

### Preview Production Build
```bash
npm run mcp-web:preview
```

## Deployment

The web MCP server can be deployed anywhere that supports:
- Node.js runtime
- HTTP and WebSocket connections
- Astro applications

Popular deployment platforms:
- Vercel
- Netlify  
- Railway
- Fly.io
- Traditional VPS/cloud servers

## Error Handling

The server uses standard JSON-RPC 2.0 error codes:
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

Additional MCP-specific error codes:
- `-32001`: Resource not found
- `-32002`: Resource access denied
- `-32003`: Tool execution failed

## Security Considerations

- CORS is enabled for all origins by default (consider restricting in production)
- No authentication is implemented (consider adding auth middleware)
- WebSocket connections are not authenticated (consider adding auth)
- Rate limiting is not implemented (consider adding rate limiting middleware)

## Architecture

The web MCP server is built on:
- **Astro**: Web framework for API routes
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **ws**: WebSocket library
- **TypeScript**: Type safety and development experience

Key components:
- `packages/apps/web/pages/api/mcp/`: API route handlers
- `packages/apps/web/lib/mcpUtils.ts`: Shared MCP utilities
- `packages/apps/web/lib/promptManager.ts`: Prompt management integration

This web MCP server maintains compatibility with your existing prompt management system while providing multiple access methods for different use cases.