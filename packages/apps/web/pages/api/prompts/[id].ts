import type { APIRoute } from 'astro';
import { getPromptManager } from '../../../lib/promptManager';

interface UpdatePromptRequest {
  name?: string;
  description?: string;
  content?: string;
  tags?: string[];
  author?: string;
  variables?: any[];
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const manager = await getPromptManager();
    const prompt = await manager.getPromptById(params.id!);
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Convert dates to ISO strings for JSON serialization
    const serializedPrompt = {
      ...prompt,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString()
    };
    
    return new Response(JSON.stringify(serializedPrompt), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch prompt' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const manager = await getPromptManager();
    const promptData = await request.json() as UpdatePromptRequest;
    
    // Use the updatePrompt method with the correct DTO structure
    await manager.updatePrompt({
      id: params.id!,
      name: promptData.name,
      description: promptData.description,
      content: promptData.content,
      tags: promptData.tags,
      author: promptData.author,
      variables: promptData.variables
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update prompt' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const manager = await getPromptManager();
    const deleted = await manager.deletePrompt(params.id!);
    
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Prompt not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete prompt' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
