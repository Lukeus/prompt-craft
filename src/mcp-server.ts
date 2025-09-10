#!/usr/bin/env node

import { PromptMcpServer } from './mcp/server';

// Start the MCP server
const server = new PromptMcpServer();
server.start().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
