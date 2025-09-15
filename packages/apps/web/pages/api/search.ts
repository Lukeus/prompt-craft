import type { APIRoute } from 'astro';
import { getPromptManager } from '../../lib/promptManager';
import { PromptCategory } from '@core/domain/entities/Prompt';

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const manager = await getPromptManager();
    const searchParams = new URL(request.url).searchParams;
    
    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') as PromptCategory | undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()) : undefined;
    const author = searchParams.get('author') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    const searchOptions = {
      query,
      category,
      tags,
      author,
      limit
    };
    
    // Remove undefined properties
    Object.keys(searchOptions).forEach(key => {
      if (searchOptions[key as keyof typeof searchOptions] === undefined) {
        delete searchOptions[key as keyof typeof searchOptions];
      }
    });
    
    const results = await manager.searchPrompts(searchOptions);
    
    // Convert dates to ISO strings for JSON serialization
    const serializedResults = results.map(prompt => ({
      ...prompt,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString()
    }));
    
    return new Response(JSON.stringify({
      results: serializedResults,
      count: serializedResults.length,
      query: searchOptions
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error searching prompts:', error);
    return new Response(JSON.stringify({ error: 'Failed to search prompts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
