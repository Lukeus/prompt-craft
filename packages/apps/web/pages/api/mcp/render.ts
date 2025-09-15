import type { APIRoute } from 'astro';
import { getPromptManager } from '../../../lib/promptManager';

interface RenderRequest {
  promptId: string;
  variables?: Record<string, any>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as RenderRequest;
    const { promptId, variables = {} } = body;

    if (!promptId) {
      return new Response(JSON.stringify({
        error: 'Missing required field: promptId'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const manager = await getPromptManager();
    
    try {
const renderResult = await manager.renderPrompt({ id: promptId, variableValues: variables });
      const renderedPrompt = renderResult.rendered;

      // Compute used defaults
      const prompt = await manager.getPromptById(promptId);
      const usedDefaults: string[] = [];
      if (prompt && prompt.variables) {
        for (const v of prompt.variables) {
          if (v.defaultValue !== undefined && (variables[v.name] === undefined || variables[v.name] === null)) {
            usedDefaults.push(v.name);
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        promptId,
        renderedPrompt,
        variables,
        meta: {
          errors: renderResult.errors || [],
          usedDefaults
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error rendering prompt:', error);
      return new Response(JSON.stringify({
        error: `Failed to render prompt: ${error instanceof Error ? error.message : String(error)}`,
        promptId
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    return new Response(JSON.stringify({
      error: 'Invalid JSON in request body'
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