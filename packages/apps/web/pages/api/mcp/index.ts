import type { APIRoute } from 'astro';
import { getPromptManager } from '../../../lib/promptManager';
import { PromptCategory } from '@core/domain/entities/Prompt';

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const manager = await getPromptManager();
    const prompts = await manager.getAllPrompts();
    
    const serverInfo = {
      name: 'prompt-craft-web-mcp',
      version: '1.0.0',
      description: 'Web-accessible Model Context Protocol server for Prompt Craft',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
        logging: false
      },
      endpoints: {
        http: {
          tools_list: '/api/mcp/tools',
          tools_call: '/api/mcp/call',
          render_prompt: '/api/mcp/render'
        },
        websocket: {
          url: '/api/mcp/ws',
          protocol: 'mcp-websocket'
        }
      },
      statistics: {
        total_prompts: prompts.length,
        categories: Object.values(PromptCategory).reduce((acc, category) => {
          acc[category] = prompts.filter(p => p.category === category).length;
          return acc;
        }, {} as Record<string, number>),
        total_tools: prompts.length + 2 // +2 for search and list_categories
      },
      usage: {
        http_mcp: {
          description: 'Use standard MCP protocol over HTTP',
          examples: {
            list_tools: {
              method: 'GET',
              url: '/api/mcp/tools',
              response: 'JSON-RPC 2.0 formatted response with tools array'
            },
            call_tool: {
              method: 'POST',
              url: '/api/mcp/call',
              body: {
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: 'prompt_<prompt_id>',
                  arguments: { /* variables */ }
                }
              }
            }
          }
        },
        websocket_mcp: {
          description: 'Use MCP protocol over WebSocket for real-time communication',
          connection: {
            url: 'ws://your-domain.com/api/mcp/ws',
            protocol: 'JSON-RPC 2.0 over WebSocket'
          }
        },
        rest_api: {
          description: 'Simple REST API for easier integration',
          examples: {
            render_prompt: {
              method: 'POST',
              url: '/api/mcp/render',
              body: {
                promptId: '<prompt_id>',
                variables: { /* key-value pairs */ }
              }
            }
          }
        }
      }
    };
    
    return new Response(JSON.stringify(serverInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error getting MCP server info:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get server information',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};