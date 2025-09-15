import type { APIRoute } from 'astro';
import { WebSocketServer } from 'ws';
import { getPromptManager } from '../../../lib/promptManager';
import { PromptCategory } from '@core/domain/entities/Prompt';

// In-memory storage for WebSocket server
let wss: WebSocketServer | null = null;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  const connection = request.headers.get('connection');
  
  if (upgrade?.toLowerCase() === 'websocket' && connection?.toLowerCase().includes('upgrade')) {
    // Initialize WebSocket server if not already created
    if (!wss) {
      wss = new WebSocketServer({ noServer: true });
      
      wss.on('connection', async (ws) => {
        console.log('MCP WebSocket client connected');
        const manager = await getPromptManager();
        
        ws.on('message', async (data) => {
          let message: any;
          try {
            message = JSON.parse(data.toString());
            const response = await handleMcpMessage(message, manager);
            ws.send(JSON.stringify(response));
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              id: message?.id || null,
              error: {
                code: -32603,
                message: 'Internal error',
                data: error instanceof Error ? error.message : String(error)
              }
            }));
          }
        });
        
        ws.on('close', () => {
          console.log('MCP WebSocket client disconnected');
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
        
        // Send initial connection acknowledgment
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialized',
          params: {
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'prompt-craft-web',
              version: '1.0.0'
            }
          }
        }));
      });
    }
    
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': generateWebSocketAccept(request.headers.get('sec-websocket-key') || ''),
      }
    });
  }
  
  // If not a WebSocket request, return information about the endpoint
  return new Response(JSON.stringify({
    message: 'WebSocket MCP Server Endpoint',
    usage: 'Connect with WebSocket client using ws:// or wss:// protocol',
    capabilities: ['tools/list', 'tools/call'],
    version: '1.0.0'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

async function handleMcpMessage(message: any, manager: any) {
  const { id, method, params } = message;
  
  try {
    switch (method) {
      case 'tools/list':
        return await handleToolsList(id, manager);
        
      case 'tools/call':
        return await handleToolsCall(id, params, manager);
        
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'prompt-craft-web',
              version: '1.0.0'
            }
          }
        };
        
      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found',
            data: `Unsupported method: ${method}`
          }
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

async function handleToolsList(id: any, manager: any) {
  const prompts = await manager.getAllPrompts();
  
  // Convert prompts to MCP tools format
  const tools = prompts.map((prompt: any) => ({
    name: `prompt_${prompt.id}`,
    description: `${prompt.name}: ${prompt.description}`,
    inputSchema: {
      type: 'object',
      properties: generateInputSchemaProperties(prompt),
      required: getRequiredVariables(prompt),
    },
  }));

  // Add custom MCP tools
  tools.push({
    name: 'prompt_search',
    description: 'Search prompts by query, category, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        category: { 
          type: 'string', 
          enum: Object.values(PromptCategory),
          description: 'Filter by category' 
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Filter by tags' 
        },
        limit: { type: 'number', description: 'Maximum number of results', default: 10 }
      },
      required: [],
    },
  });

  tools.push({
    name: 'prompt_list_categories',
    description: 'List all available prompt categories with counts',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  });

  return {
    jsonrpc: '2.0',
    id,
    result: { tools }
  };
}

async function handleToolsCall(id: any, params: any, manager: any) {
  const { name, arguments: args } = params;
  
  let result;

  if (name.startsWith('prompt_') && name !== 'prompt_search' && name !== 'prompt_list_categories') {
    // Handle individual prompt rendering
    const promptId = name.replace('prompt_', '');
    const renderResult = await manager.renderPrompt({ id: promptId, variableValues: args || {} });
    const renderedPrompt = renderResult.rendered;
    
    result = {
      content: [
        {
          type: 'text',
          text: renderedPrompt,
        },
      ],
    };
  } else if (name === 'prompt_search') {
    // Handle prompt search
    const { query, category, tags, limit } = args || {};
    
    const searchResults = await manager.searchPrompts({
      query,
      category: category as PromptCategory,
      tags,
      limit,
    });

    result = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(searchResults.map((prompt: any) => ({
            id: prompt.id,
            name: prompt.name,
            description: prompt.description,
            category: prompt.category,
            tags: prompt.tags,
          })), null, 2),
        },
      ],
    };
  } else if (name === 'prompt_list_categories') {
    // Handle category listing
    const categories = Object.values(PromptCategory);
    const categoryCounts = await Promise.all(
      categories.map(async category => ({
        category,
        count: (await manager.getPromptsByCategory(category)).length,
      }))
    );

    result = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(categoryCounts, null, 2),
        },
      ],
    };
  } else {
    throw new Error(`Unknown tool: ${name}`);
  }

  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

function generateInputSchemaProperties(prompt: any): Record<string, any> {
  const properties: Record<string, any> = {};

  if (prompt.variables) {
    for (const variable of prompt.variables) {
      properties[variable.name] = {
        type: mapVariableTypeToJsonSchema(variable.type),
        description: variable.description,
      };

      if (variable.defaultValue !== undefined) {
        properties[variable.name].default = variable.defaultValue;
      }

      if (variable.type === 'array') {
        properties[variable.name].items = { type: 'string' };
      }
    }
  }

  return properties;
}

function mapVariableTypeToJsonSchema(type: string): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    default:
      return 'string';
  }
}

function getRequiredVariables(prompt: any): string[] {
  if (!prompt.variables) return [];
  
  return prompt.variables
    .filter((variable: any) => variable.required)
    .map((variable: any) => variable.name);
}

function generateWebSocketAccept(key: string): string {
  const crypto = require('crypto');
  const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  return crypto
    .createHash('sha1')
    .update(key + WEBSOCKET_MAGIC_STRING)
    .digest('base64');
}