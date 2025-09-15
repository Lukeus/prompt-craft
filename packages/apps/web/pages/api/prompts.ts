import type { APIRoute } from 'astro';
import { getPromptManager } from '../../lib/promptManager';
import { PromptCategory } from '@core/domain/entities/Prompt';

interface CreatePromptRequest {
  name: string;
  description: string;
  content: string;
  category: PromptCategory;
  tags?: string[];
  author?: string;
  version?: string;
  variables?: any[];
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const manager = await getPromptManager();
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get('category') as PromptCategory | null;
    
    let prompts;
    if (category && Object.values(PromptCategory).includes(category)) {
      prompts = await manager.getPromptsByCategory(category);
    } else {
      prompts = await manager.getAllPrompts();
    }
    
    // Convert dates to ISO strings for JSON serialization
    const serializedPrompts = prompts.map(prompt => ({
      ...prompt,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString()
    }));
    
    return new Response(JSON.stringify(serializedPrompts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch prompts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const manager = await getPromptManager();
    const promptData = await request.json() as CreatePromptRequest;
    
    // Use the createPrompt method with the correct DTO structure
    const prompt = await manager.createPrompt({
      name: promptData.name,
      description: promptData.description,
      content: promptData.content,
      category: promptData.category,
      tags: promptData.tags || [],
      author: promptData.author,
      version: promptData.version,
      variables: promptData.variables
    });
    
    return new Response(JSON.stringify({ success: true, id: prompt.id }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create prompt' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
