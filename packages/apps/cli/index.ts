#!/usr/bin/env node

import { getContainer } from '../../core/infrastructure/Container';
import { PromptCategory } from '../../core/domain/entities/Prompt';
import { FileSystemPromptRepository } from '../../infrastructure/filesystem/FileSystemPromptRepository';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

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
      // Handle --flag=value syntax
      if (arg.includes('=')) {
        const [flagKey, flagValue] = arg.slice(2).split('=', 2);
        parsed[flagKey] = flagValue || true;
      } else {
        // Handle --flag value syntax, but only if next arg doesn't start with --
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('--') && !nextArg.includes('=')) {
          parsed[key] = nextArg;
          i++; // Skip next arg as it's the value
        } else {
          parsed[key] = true;
        }
      }
    } else if (arg.includes('=')) {
      // Handle key=value pairs
      const [key, value] = arg.split('=', 2);
      parsed[key] = value || true;
    } else if (!parsed.id && (parsed.command === 'render' || parsed.command === 'show')) {
      // For render and show commands, the first non-flag arg is the ID
      parsed.id = arg;
    } else if (!parsed.category && (['work', 'personal', 'shared'].includes(arg) || (parsed.command === 'favorites' && ['add', 'remove'].includes(arg)))) {
      parsed.category = arg;
    } else if (!parsed.query) {
      parsed.query = arg;
    }
  }

  return parsed;
}

function parseTypedValue(value: string, type: string): any {
  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? value : num;
    case 'boolean':
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    case 'array':
      // Support comma-separated arrays
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    default:
      return value;
  }
}

function promptForVariable(rl: readline.Interface, variable: any): Promise<string> {
  return new Promise((resolve) => {
    const required = variable.required ? '*' : '';
    const defaultText = variable.defaultValue ? ` (default: ${variable.defaultValue})` : '';
    const prompt = `${variable.name}${required} (${variable.type})${defaultText}: ${variable.description}\n> `;
    
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || variable.defaultValue || '');
    });
  });
}

function formatOutput(content: string, format: string, prompt: any, variables: Record<string, any>): string {
  switch (format?.toLowerCase()) {
    case 'plain':
      // Strip markdown formatting
      return content
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/^[-*+]\s+/gm, '') // Remove bullet points
        .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
        .trim();
    case 'json':
      return JSON.stringify({
        id: prompt.id,
        name: prompt.name,
        variables,
        content
      }, null, 2);
    case 'markdown':
    default:
      return content;
  }
}

function copyToClipboard(content: string): boolean {
  try {
    // macOS pbcopy
    if (process.platform === 'darwin') {
      execSync('pbcopy', { input: content, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    }
    // Linux xclip or xsel
    if (process.platform === 'linux') {
      try {
        execSync('xclip -selection clipboard', { input: content, stdio: ['pipe', 'ignore', 'ignore'] });
        return true;
      } catch {
        try {
          execSync('xsel --clipboard --input', { input: content, stdio: ['pipe', 'ignore', 'ignore'] });
          return true;
        } catch {
          return false;
        }
      }
    }
    // Windows clip
    if (process.platform === 'win32') {
      execSync('clip', { input: content, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function savePreset(filePath: string, promptId: string, variables: Record<string, any>): void {
  const preset = {
    promptId,
    variables,
    savedAt: new Date().toISOString()
  };
  fs.writeFileSync(filePath, JSON.stringify(preset, null, 2), 'utf8');
}

function loadPreset(filePath: string): { promptId: string; variables: Record<string, any> } | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const preset = JSON.parse(content);
    if (preset.promptId && preset.variables) {
      return { promptId: preset.promptId, variables: preset.variables };
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to load preset from ${filePath}: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

interface LocalState {
  favorites: string[];
  recents: Array<{
    promptId: string;
    usedAt: string;
  }>;
}

function getStatePath(): string {
  const configDir = path.join(os.homedir(), '.config', 'prompt-craft');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return path.join(configDir, 'state.json');
}

function loadState(): LocalState {
  const statePath = getStatePath();
  try {
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Warning: Could not load state from ${statePath}`);
  }
  return { favorites: [], recents: [] };
}

function saveState(state: LocalState): void {
  const statePath = getStatePath();
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error(`Warning: Could not save state to ${statePath}`);
  }
}

function addToFavorites(promptId: string): void {
  const state = loadState();
  if (!state.favorites.includes(promptId)) {
    state.favorites.push(promptId);
    saveState(state);
    console.log(`⭐ Added ${promptId} to favorites`);
  } else {
    console.log(`${promptId} is already in favorites`);
  }
}

function removeFromFavorites(promptId: string): void {
  const state = loadState();
  const index = state.favorites.indexOf(promptId);
  if (index > -1) {
    state.favorites.splice(index, 1);
    saveState(state);
    console.log(`🗑️  Removed ${promptId} from favorites`);
  } else {
    console.log(`${promptId} is not in favorites`);
  }
}

function addToRecents(promptId: string): void {
  const state = loadState();
  // Remove existing entry if present
  state.recents = state.recents.filter(r => r.promptId !== promptId);
  // Add to front
  state.recents.unshift({
    promptId,
    usedAt: new Date().toISOString()
  });
  // Keep only last 20
  state.recents = state.recents.slice(0, 20);
  saveState(state);
}

async function main() {
  try {
const promptsDirectory = path.join(process.cwd(), 'prompts');
    const promptRepository = new FileSystemPromptRepository(
      promptsDirectory,
      () => loadState() // Provide usage stats for sorting
    );
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
        if (!args.query && !args.tags && !args.author) {
          console.error('Please provide a search query, --tags, or --author filter.');
          process.exit(1);
        }

        // Parse tags if provided
        let tags: string[] | undefined;
        if (args.tags) {
          tags = typeof args.tags === 'string' 
            ? args.tags.split(',').map(t => t.trim())
            : [args.tags];
        }

        const results = await promptUseCases.searchPrompts({
          query: args.query,
          category: args.category as PromptCategory,
          tags,
          author: args.author,
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
          if (prompt.tags.length > 0) {
            console.log(`   Tags: ${prompt.tags.join(', ')}`);
          }
          if (prompt.author) {
            console.log(`   Author: ${prompt.author}`);
          }
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
        let promptId = args.id;
        let loadedVariables: Record<string, any> = {};

        // Handle --load preset
        if (args.load) {
          const preset = loadPreset(args.load);
          if (!preset) {
            process.exit(1);
          }
          promptId = promptId || preset.promptId;
          loadedVariables = preset.variables;
          console.log(`📂 Loaded preset from ${args.load} for prompt: ${promptId}`);
        }

        if (!promptId) {
          console.error('Please provide a prompt ID or use --load with a preset file.');
          process.exit(1);
        }

        const prompt = await promptUseCases.getPromptById(promptId);
        if (!prompt) {
          console.error(`Prompt with ID ${promptId} not found.`);
          process.exit(1);
        }

        // Collect variable values from args with type parsing, merging with loaded preset
        const variableValues: Record<string, any> = { ...loadedVariables };
        Object.keys(args).forEach(key => {
          if (!['command', 'id', 'dry-run', 'format', 'copy', 'save', 'load'].includes(key)) {
            const variable = prompt.variables?.find(v => v.name === key);
            const rawValue = args[key];
            variableValues[key] = variable ? parseTypedValue(rawValue, variable.type) : rawValue;
          }
        });

        // Interactive prompting for missing required variables
        if (prompt.variables && prompt.variables.length > 0) {
          const missingRequired = prompt.variables.filter(v => 
            v.required && (variableValues[v.name] === undefined || variableValues[v.name] === '')
          );
          
          if (missingRequired.length > 0) {
            console.log(`\nMissing required variables for '${prompt.name}':`);
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            for (const variable of missingRequired) {
              const answer = await promptForVariable(rl, variable);
              if (answer) {
                variableValues[variable.name] = parseTypedValue(answer, variable.type);
              }
            }

            rl.close();
          }
        }

        // Handle --dry-run flag
        if (args['dry-run']) {
          console.log('🔍 Dry run - validation only:\n');
          
          // Check consistency first
          const consistency = prompt.validateConsistency();
          if (consistency.errors.length > 0) {
            console.error('❌ Content consistency errors:');
            consistency.errors.forEach(error => console.error(`  - ${error}`));
          }
          if (consistency.warnings.length > 0) {
            console.log('⚠️  Content consistency warnings:');
            consistency.warnings.forEach(warning => console.log(`  - ${warning}`));
          }
          
          // Check variable values
          const errors = prompt.validateVariables(variableValues);
          if (errors.length > 0) {
            console.error('❌ Variable validation errors:');
            errors.forEach(error => console.error(`  - ${error}`));
          }
          
          const hasErrors = consistency.errors.length > 0 || errors.length > 0;
          if (hasErrors) {
            process.exit(1);
          } else {
            if (consistency.warnings.length === 0) {
              console.log('✅ All validations passed');
            } else {
              console.log('✅ No errors found (warnings above)');
            }
            if (prompt.variables) {
              console.log('\nVariable summary:');
              prompt.variables.forEach(variable => {
                const value = variableValues[variable.name] ?? variable.defaultValue;
                const usedDefault = variableValues[variable.name] === undefined && variable.defaultValue !== undefined;
                const status = usedDefault ? ' (using default)' : '';
                console.log(`  ${variable.name}: ${JSON.stringify(value)}${status}`);
              });
            }
            process.exit(0);
          }
        }

        const result = await promptUseCases.renderPrompt({
          id: promptId,
          variableValues
        });

        if (result.errors.length > 0) {
          console.error('⚠️  Validation errors:');
          result.errors.forEach(error => console.error(`  - ${error}`));
          console.log('\nRendered with errors:');
        }

        // Format output
        const format = args.format || 'markdown';
        const formattedOutput = formatOutput(result.rendered, format, prompt, variableValues);
        
        // Handle --save preset
        if (args.save) {
          savePreset(args.save, prompt.id, variableValues);
          console.log(`💾 Saved preset to ${args.save}`);
        }

        // Handle --copy flag
        if (args.copy) {
          if (copyToClipboard(formattedOutput)) {
            console.log(`📋 Copied to clipboard (${format} format)`);
            if (format !== 'json') {
              console.log('\n' + '='.repeat(50));
            }
          } else {
            console.error('❌ Failed to copy to clipboard (clipboard utility not available)');
          }
        }
        
        console.log(formattedOutput);
        
        // Track usage in recents
        addToRecents(promptId);
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
      
      case 'favorites': {
        const subcommand = args.category; // reuse category field for subcommand
        const state = loadState();
        
        if (subcommand === 'add') {
          if (!args.query) { // reuse query field for prompt ID
            console.error('Please provide a prompt ID to add to favorites.');
            process.exit(1);
          }
          addToFavorites(args.query);
        } else if (subcommand === 'remove') {
          if (!args.query) {
            console.error('Please provide a prompt ID to remove from favorites.');
            process.exit(1);
          }
          removeFromFavorites(args.query);
        } else {
          // List favorites
          if (state.favorites.length === 0) {
            console.log('No favorites yet.');
            return;
          }
          
          console.log(`⭐ Favorites (${state.favorites.length}):\n`);
          for (const promptId of state.favorites) {
            const prompt = await promptUseCases.getPromptById(promptId);
            if (prompt) {
              console.log(`📝 ${prompt.name} (${prompt.category})`);
              console.log(`   ID: ${prompt.id}`);
              console.log(`   ${prompt.description}`);
              console.log('');
            } else {
              console.log(`⚠️  ${promptId} (prompt not found)`);
              console.log('');
            }
          }
        }
        break;
      }
      
      case 'recent':
      case 'recents': {
        const state = loadState();
        
        if (state.recents.length === 0) {
          console.log('No recent prompts.');
          return;
        }
        
        console.log(`🕒 Recent prompts (${state.recents.length}):\n`);
        for (const recent of state.recents) {
          const prompt = await promptUseCases.getPromptById(recent.promptId);
          const timeAgo = new Date(recent.usedAt).toLocaleDateString();
          if (prompt) {
            console.log(`📝 ${prompt.name} (${prompt.category})`);
            console.log(`   ID: ${prompt.id}`);
            console.log(`   Used: ${timeAgo}`);
            console.log(`   ${prompt.description}`);
            console.log('');
          } else {
            console.log(`⚠️  ${recent.promptId} (prompt not found)`);
            console.log(`   Used: ${timeAgo}`);
            console.log('');
          }
        }
        break;
      }
      
      case 'validate': {
        const promptId = args.id || args.query; // Support both --id flag and positional arg
        
        if (promptId) {
          // Validate specific prompt
          const prompt = await promptUseCases.getPromptById(promptId);
          if (!prompt) {
            console.error(`Prompt with ID ${promptId} not found.`);
            process.exit(1);
          }
          
          console.log(`🔍 Validating prompt: ${prompt.name}\n`);
          const consistency = prompt.validateConsistency();
          
          if (consistency.errors.length === 0 && consistency.warnings.length === 0) {
            console.log('✅ No consistency issues found');
          } else {
            if (consistency.errors.length > 0) {
              console.error('❌ Content consistency errors:');
              consistency.errors.forEach(error => console.error(`  - ${error}`));
            }
            if (consistency.warnings.length > 0) {
              console.log('⚠️  Content consistency warnings:');
              consistency.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            
            if (consistency.errors.length > 0) {
              process.exit(1);
            }
          }
        } else {
          // Validate all prompts
          const prompts = await promptUseCases.getAllPrompts();
          console.log(`🔍 Validating ${prompts.length} prompts...\n`);
          
          let totalErrors = 0;
          let totalWarnings = 0;
          const promptsWithIssues: string[] = [];
          
          for (const prompt of prompts) {
            const consistency = prompt.validateConsistency();
            if (consistency.errors.length > 0 || consistency.warnings.length > 0) {
              promptsWithIssues.push(prompt.id);
              console.log(`📝 ${prompt.name} (${prompt.id})`);
              
              if (consistency.errors.length > 0) {
                console.error('  ❌ Errors:');
                consistency.errors.forEach(error => console.error(`    - ${error}`));
                totalErrors += consistency.errors.length;
              }
              
              if (consistency.warnings.length > 0) {
                console.log('  ⚠️  Warnings:');
                consistency.warnings.forEach(warning => console.log(`    - ${warning}`));
                totalWarnings += consistency.warnings.length;
              }
              console.log('');
            }
          }
          
          if (promptsWithIssues.length === 0) {
            console.log('✅ All prompts are consistent');
          } else {
            console.log(`Summary: ${promptsWithIssues.length}/${prompts.length} prompts have issues`);
            console.log(`Total errors: ${totalErrors}, warnings: ${totalWarnings}`);
            
            if (totalErrors > 0) {
              process.exit(1);
            }
          }
        }
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
        console.log('  favorites [add|remove] <id>  Manage favorite prompts');
        console.log('  recent                    Show recently used prompts');
        console.log('  validate [id]             Check prompt consistency (all prompts if no ID)');
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
