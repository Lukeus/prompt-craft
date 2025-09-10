#!/usr/bin/env node

import * as path from 'path';
import { PromptManager } from './managers/PromptManager';
import { PromptCategory } from './types';

export { PromptManager, PromptCategory };
export * from './types';
export * from './utils';
export { PromptMcpServer } from './mcp/server';

// CLI functionality
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const promptManager = new PromptManager();
  await promptManager.initialize();

  switch (command) {
    case 'list':
      await listPrompts(promptManager, args.slice(1));
      break;
    case 'search':
      await searchPrompts(promptManager, args.slice(1));
      break;
    case 'render':
      await renderPrompt(promptManager, args.slice(1));
      break;
    case 'categories':
      await listCategories(promptManager);
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

async function listPrompts(promptManager: PromptManager, args: string[]): Promise<void> {
  const category = args[0] as PromptCategory;
  const prompts = category 
    ? promptManager.getPromptsByCategory(category)
    : promptManager.getAllPrompts();

  if (prompts.length === 0) {
    console.log('No prompts found.');
    return;
  }

  console.log(`\n📝 Found ${prompts.length} prompt(s):\n`);
  
  prompts.forEach((prompt, index) => {
    console.log(`${index + 1}. ${prompt.name}`);
    console.log(`   ID: ${prompt.id}`);
    console.log(`   Category: ${prompt.category}`);
    console.log(`   Description: ${prompt.description}`);
    console.log(`   Tags: ${prompt.tags.join(', ')}`);
    if (prompt.variables && prompt.variables.length > 0) {
      console.log(`   Variables: ${prompt.variables.map(v => v.name).join(', ')}`);
    }
    console.log('');
  });
}

async function searchPrompts(promptManager: PromptManager, args: string[]): Promise<void> {
  const query = args[0];
  if (!query) {
    console.error('❌ Please provide a search query');
    process.exit(1);
  }

  const results = promptManager.searchPrompts({ query, limit: 10 });
  
  if (results.length === 0) {
    console.log(`No prompts found matching "${query}".`);
    return;
  }

  console.log(`\n🔍 Found ${results.length} prompt(s) matching "${query}":\n`);
  
  results.forEach((prompt, index) => {
    console.log(`${index + 1}. ${prompt.name}`);
    console.log(`   ID: ${prompt.id}`);
    console.log(`   Category: ${prompt.category}`);
    console.log(`   Description: ${prompt.description}`);
    console.log('');
  });
}

async function renderPrompt(promptManager: PromptManager, args: string[]): Promise<void> {
  const promptId = args[0];
  if (!promptId) {
    console.error('❌ Please provide a prompt ID');
    process.exit(1);
  }

  try {
    // Parse variables from remaining arguments (format: key=value)
    const variables: Record<string, any> = {};
    for (let i = 1; i < args.length; i++) {
      const [key, value] = args[i].split('=');
      if (key && value !== undefined) {
        // Try to parse as number or boolean, otherwise keep as string
        if (value === 'true') variables[key] = true;
        else if (value === 'false') variables[key] = false;
        else if (!isNaN(Number(value))) variables[key] = Number(value);
        else variables[key] = value;
      }
    }

    const renderedPrompt = await promptManager.renderPrompt(promptId, variables);
    console.log('\n📄 Rendered Prompt:\n');
    console.log(renderedPrompt);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to render prompt:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function listCategories(promptManager: PromptManager): Promise<void> {
  const categories = Object.values(PromptCategory);
  
  console.log('\n📂 Available Categories:\n');
  
  categories.forEach(category => {
    const count = promptManager.getPromptsByCategory(category).length;
    console.log(`• ${category}: ${count} prompt(s)`);
  });
  
  console.log('');
}

function printHelp(): void {
  console.log(`
📝 PromptCraft CLI

Usage: prompt-craft <command> [options]

Commands:
  list [category]           List all prompts or prompts in a specific category
  search <query>           Search for prompts by name, description, or content
  render <id> [vars...]    Render a prompt with variables (format: key=value)
  categories               List all categories with prompt counts
  help                     Show this help message

Examples:
  prompt-craft list work
  prompt-craft search "code review"
  prompt-craft render abc123 language=TypeScript complexity=high
  prompt-craft categories

Categories: ${Object.values(PromptCategory).join(', ')}
`);
}

// Run CLI if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
