import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { PromptManager } from '../managers/PromptManager.js';
import { PromptCategory } from '../types/index.js';

export class PromptMcpServer {
  private server: Server;
  private promptManager: PromptManager;

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

    this.promptManager = new PromptManager();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const prompts = this.promptManager.getAllPrompts();
      
      return {
        tools: prompts.map(prompt => ({
          name: `prompt_${prompt.id}`,
          description: `${prompt.name}: ${prompt.description}`,
          inputSchema: {
            type: 'object',
            properties: this.generateInputSchemaProperties(prompt),
            required: this.getRequiredVariables(prompt),
          },
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!name.startsWith('prompt_')) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      const promptId = name.replace('prompt_', '');
      
      try {
        const renderedPrompt = await this.promptManager.renderPrompt(promptId, args as Record<string, any>);
        
        return {
          content: [
            {
              type: 'text',
              text: renderedPrompt,
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to render prompt: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Additional handlers for prompt management
    this.server.setRequestHandler('prompt_search' as any, async (request: any) => {
      const { query, category, tags, limit } = request.params;
      
      try {
        const results = this.promptManager.searchPrompts({
          query,
          category: category as PromptCategory,
          tags,
          limit,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results.map(prompt => ({
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
    });

    this.server.setRequestHandler('prompt_list_categories' as any, async () => {
      try {
        const categories = Object.values(PromptCategory);
        const categoryCounts = categories.map(category => ({
          category,
          count: this.promptManager.getPromptsByCategory(category).length,
        }));

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
    });
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
    await this.promptManager.initialize();
    
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
