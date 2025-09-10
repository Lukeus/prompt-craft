import * as path from 'path';
import { Prompt, PromptCategory, PromptSearchOptions, PromptCollection, PromptConfig } from '../types';
import { FileUtils, StringUtils, ValidationUtils } from '../utils';

export class PromptManager {
  private prompts: Map<string, Prompt> = new Map();
  private collections: Map<string, PromptCollection> = new Map();
  private config: PromptConfig | null = null;
  private promptsDirectory: string;
  private configPath: string;

  constructor(baseDirectory?: string) {
    this.promptsDirectory = baseDirectory || path.join(process.cwd(), 'prompts');
    this.configPath = path.join(process.cwd(), 'config', 'prompts.json');
  }

  async initialize(): Promise<void> {
    await this.loadConfig();
    await this.loadAllPrompts();
  }

  private async loadConfig(): Promise<void> {
    try {
      if (await FileUtils.fileExists(this.configPath)) {
        this.config = await FileUtils.readJsonFile<PromptConfig>(this.configPath);
      } else {
        this.config = this.createDefaultConfig();
        await this.saveConfig();
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);
      this.config = this.createDefaultConfig();
    }
  }

  private createDefaultConfig(): PromptConfig {
    return {
      version: '1.0.0',
      collections: {
        work: [],
        personal: [],
        shared: []
      },
      mcpServer: {
        name: 'prompt-manager-mcp',
        version: '1.0.0'
      }
    };
  }

  private async saveConfig(): Promise<void> {
    if (this.config) {
      await FileUtils.ensureDirectory(path.dirname(this.configPath));
      await FileUtils.writeJsonFile(this.configPath, this.config);
    }
  }

  private async loadAllPrompts(): Promise<void> {
    const categories = Object.values(PromptCategory);
    
    for (const category of categories) {
      await this.loadPromptsFromCategory(category);
    }
  }

  private async loadPromptsFromCategory(category: PromptCategory): Promise<void> {
    const categoryPath = path.join(this.promptsDirectory, category);
    
    try {
      const files = await FileUtils.listFiles(categoryPath, '.json');
      
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          const promptData = await FileUtils.readJsonFile<Prompt>(filePath);
          
          // Ensure dates are properly parsed
          if (typeof promptData.createdAt === 'string') {
            promptData.createdAt = new Date(promptData.createdAt);
          }
          if (typeof promptData.updatedAt === 'string') {
            promptData.updatedAt = new Date(promptData.updatedAt);
          }
          
          const validation = ValidationUtils.validatePrompt(promptData);
          if (validation.isValid) {
            this.prompts.set(promptData.id, promptData);
          } else {
            console.warn(`Invalid prompt in ${filePath}:`, validation.errors);
          }
        } catch (error) {
          console.warn(`Failed to load prompt from ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Category directory doesn't exist yet, that's ok
      console.info(`Category directory ${category} not found, skipping`);
    }
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    const validation = ValidationUtils.validatePrompt(prompt);
    if (!validation.isValid) {
      throw new Error(`Invalid prompt: ${validation.errors.join(', ')}`);
    }

    // Update timestamps
    if (!prompt.createdAt) {
      prompt.createdAt = new Date();
    }
    prompt.updatedAt = new Date();

    // Generate ID if not provided
    if (!prompt.id) {
      prompt.id = StringUtils.generateId();
    }

    // Save to memory
    this.prompts.set(prompt.id, prompt);

    // Save to file
    const categoryPath = path.join(this.promptsDirectory, prompt.category);
    await FileUtils.ensureDirectory(categoryPath);
    
    const fileName = `${StringUtils.slugify(prompt.name)}.json`;
    const filePath = path.join(categoryPath, fileName);
    
    await FileUtils.writeJsonFile(filePath, prompt);
  }

  async deletePrompt(id: string): Promise<boolean> {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      return false;
    }

    // Remove from memory
    this.prompts.delete(id);

    // Remove file
    try {
      const categoryPath = path.join(this.promptsDirectory, prompt.category);
      const fileName = `${StringUtils.slugify(prompt.name)}.json`;
      const filePath = path.join(categoryPath, fileName);
      
      if (await FileUtils.fileExists(filePath)) {
        await require('fs/promises').unlink(filePath);
      }
    } catch (error) {
      console.warn('Failed to delete prompt file:', error);
    }

    return true;
  }

  getPrompt(id: string): Prompt | undefined {
    return this.prompts.get(id);
  }

  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values());
  }

  searchPrompts(options: PromptSearchOptions): Prompt[] {
    let results = Array.from(this.prompts.values());

    // Filter by category
    if (options.category) {
      results = results.filter(prompt => prompt.category === options.category);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(prompt => 
        options.tags!.some(tag => prompt.tags.includes(tag))
      );
    }

    // Filter by author
    if (options.author) {
      results = results.filter(prompt => 
        prompt.author?.toLowerCase().includes(options.author!.toLowerCase())
      );
    }

    // Text search
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(prompt => 
        prompt.name.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by updated date (newest first)
    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  getPromptsByCategory(category: PromptCategory): Prompt[] {
    return this.searchPrompts({ category });
  }

  async renderPrompt(id: string, variables?: Record<string, any>): Promise<string> {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      throw new Error(`Prompt with id '${id}' not found`);
    }

    // Validate variables if prompt has them defined
    if (prompt.variables && variables) {
      for (const variable of prompt.variables) {
        const value = variables[variable.name];
        const validation = ValidationUtils.validateVariableValue(variable, value);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }
    }

    // Apply default values for missing variables
    const finalVariables = { ...variables };
    if (prompt.variables) {
      for (const variable of prompt.variables) {
        if (finalVariables[variable.name] === undefined && variable.defaultValue !== undefined) {
          finalVariables[variable.name] = variable.defaultValue;
        }
      }
    }

    return StringUtils.interpolateVariables(prompt.content, finalVariables || {});
  }

  getConfig(): PromptConfig | null {
    return this.config;
  }

  async updateConfig(config: Partial<PromptConfig>): Promise<void> {
    if (!this.config) {
      this.config = this.createDefaultConfig();
    }

    this.config = { ...this.config, ...config };
    await this.saveConfig();
  }
}
