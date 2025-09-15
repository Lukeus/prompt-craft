#!/usr/bin/env node

import { getContainer } from '../../core/infrastructure/Container';
import { PromptCategory } from '../../core/domain/entities/Prompt';
import { FileSystemPromptRepository } from '../../infrastructure/filesystem/FileSystemPromptRepository';
import * as path from 'path';

interface CLIArgs {
  command: string;
  category?: string;
  query?: string;
  id?: string;
  [key: string]: any;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = { command: args[0] || 'help' };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      parsed[key] = args[i + 1] || true;
      i++; // Skip next arg as it's the value
    } else if (!parsed.category && ['work', 'personal', 'shared'].includes(arg)) {
      parsed.category = arg;
    } else if (!parsed.query) {
      parsed.query = arg;
    }
  }

  return parsed;
}

async function main() {
  try {
const promptsDirectory = path.join(process.cwd(), 'prompts');
    const promptRepository = new FileSystemPromptRepository(promptsDirectory);
    const container = getContainer({
      promptRepository,
      generateId: () => crypto.randomUUID()
    });
    
    const promptUseCases = container.getPromptUseCases();
    const args = parseArgs();

    switch (args.command) {
      case 'list':
      case 'ls': {
        const category = args.category as PromptCategory;
        const prompts = category 
          ? await promptUseCases.getPromptsByCategory(category)
          : await promptUseCases.getAllPrompts();

        if (prompts.length === 0) {
          console.log('No prompts found.');
          return;
        }

        console.log(`Found ${prompts.length} prompt(s):\\n`);
        prompts.forEach(prompt => {
          console.log(`📝 ${prompt.name} (${prompt.category})`);
          console.log(`   ${prompt.description}`);
          console.log(`   ID: ${prompt.id}`);
          if (prompt.tags.length > 0) {
            console.log(`   Tags: ${prompt.tags.join(', ')}`);
          }
          console.log('');
        });
        break;
      }

      case 'search': {
        if (!args.query) {
          console.error('Please provide a search query.');
          process.exit(1);
        }

        const results = await promptUseCases.searchPrompts({
          query: args.query,
          category: args.category as PromptCategory,
          limit: args.limit ? parseInt(args.limit) : undefined
        });

        if (results.length === 0) {
          console.log('No prompts found matching your search.');
          return;
        }

        console.log(`Found ${results.length} matching prompt(s):\\n`);
        results.forEach(prompt => {
          console.log(`📝 ${prompt.name} (${prompt.category})`);
          console.log(`   ${prompt.description}`);
          console.log(`   ID: ${prompt.id}`);
          console.log('');
        });
        break;
      }

      case 'show': {
        if (!args.id) {
          console.error('Please provide a prompt ID.');
          process.exit(1);
        }

        const prompt = await promptUseCases.getPromptById(args.id);
        if (!prompt) {
          console.error(`Prompt with ID ${args.id} not found.`);
          process.exit(1);
        }

        console.log(`📝 ${prompt.name}`);
        console.log(`Category: ${prompt.category}`);
        console.log(`Description: ${prompt.description}`);
        console.log(`Version: ${prompt.version}`);
        if (prompt.author) {
          console.log(`Author: ${prompt.author}`);
        }
        if (prompt.tags.length > 0) {
          console.log(`Tags: ${prompt.tags.join(', ')}`);
        }
        console.log(`Created: ${prompt.createdAt.toLocaleDateString()}`);
        console.log(`Updated: ${prompt.updatedAt.toLocaleDateString()}`);
        console.log('\\nContent:');
        console.log(prompt.content);

        if (prompt.variables && prompt.variables.length > 0) {
          console.log('\\nVariables:');
          prompt.variables.forEach(variable => {
            const required = variable.required ? '*' : '';
            console.log(`  ${variable.name}${required} (${variable.type}): ${variable.description}`);
            if (variable.defaultValue) {
              console.log(`    Default: ${variable.defaultValue}`);
            }
          });
        }
        break;
      }

      case 'render': {
        if (!args.id) {
          console.error('Please provide a prompt ID.');
          process.exit(1);
        }

        // Collect variable values from args
        const variableValues: Record<string, any> = {};
        Object.keys(args).forEach(key => {
          if (!['command', 'id'].includes(key)) {
            variableValues[key] = args[key];
          }
        });

        const result = await promptUseCases.renderPrompt({
          id: args.id,
          variableValues
        });

        if (result.errors.length > 0) {
          console.error('Validation errors:');
          result.errors.forEach(error => console.error(`  - ${error}`));
          console.log('\\nRendered with errors:');
        }

        console.log(result.rendered);
        break;
      }

      case 'categories': {
        const stats = await promptUseCases.getCategoryStatistics();
        console.log('Categories:');
        console.log(`  📊 Total: ${stats.total}`);
        console.log(`  💼 Work: ${stats.work || 0}`);
        console.log(`  👤 Personal: ${stats.personal || 0}`);
        console.log(`  🤝 Shared: ${stats.shared || 0}`);
        break;
      }

      case 'help':
      default: {
        console.log('Prompt Craft CLI - AI Prompt Management System\\n');
        console.log('Usage: prompt-craft <command> [options]\\n');
        console.log('Commands:');
        console.log('  list [category]           List prompts (optionally by category)');
        console.log('  search <query>            Search prompts');
        console.log('  show <id>                 Show detailed prompt information');
        console.log('  render <id> [vars...]     Render prompt with variables');
        console.log('  categories                Show category statistics');
        console.log('  help                      Show this help message\\n');
        console.log('Categories: work, personal, shared\\n');
        console.log('Examples:');
        console.log('  prompt-craft list work');
        console.log('  prompt-craft search "code review"');
        console.log('  prompt-craft render abc123 language=TypeScript code="const x = 1"');
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}
