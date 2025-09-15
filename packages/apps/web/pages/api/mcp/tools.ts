import type { APIRoute } from 'astro';
import { getPromptManager } from '../../../lib/promptManager';
import { PromptCategory } from '@core/domain/entities/Prompt';

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const manager = await getPromptManager();
    const prompts = await manager.getAllPrompts();
    
    // Convert prompts to MCP tools format
const tools = prompts.map(prompt => ({
      name: `prompt_${prompt.id}`,
      description: `${prompt.name}: ${prompt.description}` +
        (prompt.category ? ` [category=${prompt.category}]` : '') +
        (prompt.tags && prompt.tags.length ? ` [tags=${prompt.tags.join(', ')}]` : ''),
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

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      result: { tools }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error listing MCP tools:', error);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};

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