import type { APIRoute } from 'astro';
import { getPromptManager } from '../../../lib/promptManager';
import { PromptCategory } from '@core/domain/entities/Prompt';

interface McpCallRequest {
  jsonrpc: '2.0';
  method: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as McpCallRequest;
    const { method, params } = body;

    if (method !== 'tools/call') {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not found',
          data: `Unsupported method: ${method}`
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { name, arguments: args } = params;
    const manager = await getPromptManager();

    try {
      let result;

if (name.startsWith('prompt_') && name !== 'prompt_search' && name !== 'prompt_list_categories') {
        // Handle individual prompt rendering
        const promptId = name.replace('prompt_', '');
        const renderResult = await manager.renderPrompt({ id: promptId, variableValues: args || {} });
        const renderedPrompt = renderResult.rendered;
        
        // Compute used defaults
        const prompt = await manager.getPromptById(promptId);
        const usedDefaults: string[] = [];
        if (prompt && prompt.variables) {
          const a: Record<string, any> = (args || {}) as Record<string, any>;
          for (const v of prompt.variables) {
            if (v.defaultValue !== undefined && (a[v.name] === undefined || a[v.name] === null)) {
              usedDefaults.push(v.name);
            }
          }
        }
        
        result = {
          content: [
            {
              type: 'text',
              text: renderedPrompt,
            },
          ],
          meta: {
            errors: renderResult.errors || [],
            usedDefaults,
          },
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
              text: JSON.stringify(searchResults.map(prompt => ({
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

      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        result
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error executing tool:', error);
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
  } catch (error) {
    console.error('Error parsing request:', error);
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: error instanceof Error ? error.message : String(error)
      }
    }), {
      status: 400,
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};