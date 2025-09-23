import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getContainer } from '../../../core/infrastructure/Container';
import { PromptUseCases } from '../../../core/application/usecases/PromptUseCases';
import { RepositoryFactory } from '../../../infrastructure/RepositoryFactory';
import { PromptCategory } from '../../../core/domain/entities/Prompt';
import * as path from 'path';

export class PromptMcpServer {
  private server: Server;
  private promptManager: PromptUseCases | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'prompt-craft',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async initializePromptManager(): Promise<PromptUseCases> {
    if (!this.promptManager) {
      // Create repository with automatic type detection
      const promptRepository = RepositoryFactory.createAuto();
      const container = getContainer({ promptRepository });
      this.promptManager = container.getPromptUseCases();
    }
    return this.promptManager;
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const manager = await this.initializePromptManager();
      const prompts = await manager.getAllPrompts();
      
      // Individual prompt tools
      const promptTools = prompts.map((prompt: any) => ({
        name: `prompt_${prompt.id}`,
        description: `${prompt.name}: ${prompt.description}` +
          (prompt.category ? ` [category=${prompt.category}]` : '') +
          (prompt.tags && prompt.tags.length ? ` [tags=${prompt.tags.join(', ')}]` : ''),
        inputSchema: {
          type: 'object',
          properties: this.generateInputSchemaProperties(prompt),
          required: this.getRequiredVariables(prompt),
        },
      }));
      
      // Utility tools
      const utilityTools = [
        {
          name: 'search_prompts',
          description: 'Search prompts by query, category, or tags',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to match in prompt names, descriptions, or content'
              },
              category: {
                type: 'string',
                description: 'Filter by category (work, personal, shared)',
                enum: ['work', 'personal', 'shared']
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 10
              }
            },
            required: []
          }
        },
        {
          name: 'list_categories',
          description: 'List all available prompt categories with counts',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ];
      
      return {
        tools: [...promptTools, ...utilityTools]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const manager = await this.initializePromptManager();

      // Handle utility tools
      if (name === 'search_prompts') {
        try {
          const { query, category, tags, limit } = args as any;
          const results = await manager.searchPrompts({
            query,
            category: category as PromptCategory,
            tags,
            limit,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results.map((prompt: any) => ({
                  id: prompt.id,
                  name: prompt.name,
                  description: prompt.description,
                  category: prompt.category,
                  tags: prompt.tags,
                })), null, 2),
              },
            ],
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to search prompts: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      if (name === 'list_categories') {
        try {
          const categories = Object.values(PromptCategory);
          const categoryCounts = await Promise.all(
            categories.map(async category => ({
              category,
              count: (await manager.getPromptsByCategory(category)).length,
            }))
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(categoryCounts, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to list categories: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Handle individual prompt tools
      if (!name.startsWith('prompt_')) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      const promptId = name.replace('prompt_', '');
      
      try {
        const renderResult = await manager.renderPrompt({ id: promptId, variableValues: args as Record<string, any> });
        const renderedPrompt = renderResult.rendered;
        
        // Compute which defaults were used based on provided args vs prompt variable defaults
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
        
        return {
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
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to render prompt: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Note: Custom handlers removed to fix MCP server startup issue
    // The standard ListTools and CallTool handlers above provide core functionality
    // Additional features can be implemented as individual tools instead
  }

  private generateInputSchemaProperties(prompt: any): Record<string, any> {
    const properties: Record<string, any> = {};

    if (prompt.variables) {
      for (const variable of prompt.variables) {
        properties[variable.name] = {
          type: this.mapVariableTypeToJsonSchema(variable.type),
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

  private mapVariableTypeToJsonSchema(type: string): string {
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

  private getRequiredVariables(prompt: any): string[] {
    if (!prompt.variables) return [];
    
    return prompt.variables
      .filter((variable: any) => variable.required)
      .map((variable: any) => variable.name);
  }

  async start(): Promise<void> {
    // Initialize the prompt manager (will be done lazily on first use)
    await this.initializePromptManager();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Prompt Manager MCP Server running on stdio');
  }
}

// CLI entry point
if (require.main === module) {
  const server = new PromptMcpServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
