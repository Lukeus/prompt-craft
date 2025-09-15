import { PromptCategory } from '@core/domain/entities/Prompt';

export interface McpRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: McpError;
}

export interface McpError {
  code: number;
  message: string;
  data?: any;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface McpToolResult {
  content: Array<{
    type: 'text' | 'resource' | 'image';
    text?: string;
    data?: any;
    mimeType?: string;
  }>;
}

// MCP Error Codes (as defined in the MCP specification)
export const McpErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // MCP-specific errors
  RESOURCE_NOT_FOUND: -32001,
  RESOURCE_ACCESS_DENIED: -32002,
  TOOL_EXECUTION_FAILED: -32003,
} as const;

export class McpUtils {
  /**
   * Create a standardized MCP response
   */
  static createResponse(id: string | number | null, result?: any, error?: McpError): McpResponse {
    const response: McpResponse = {
      jsonrpc: '2.0',
      id,
    };

    if (error) {
      response.error = error;
    } else {
      response.result = result;
    }

    return response;
  }

  /**
   * Create a standardized MCP error
   */
  static createError(code: number, message: string, data?: any): McpError {
    return {
      code,
      message,
      data,
    };
  }

  /**
   * Validate MCP request format
   */
  static validateRequest(data: any): McpRequest | null {
    if (
      !data ||
      typeof data !== 'object' ||
      data.jsonrpc !== '2.0' ||
      typeof data.method !== 'string'
    ) {
      return null;
    }

    return data as McpRequest;
  }

  /**
   * Convert prompt to MCP tool format
   */
  static promptToTool(prompt: any): McpTool {
    return {
      name: `prompt_${prompt.id}`,
      description: `${prompt.name}: ${prompt.description}`,
      inputSchema: {
        type: 'object',
        properties: this.generateInputSchemaProperties(prompt),
        required: this.getRequiredVariables(prompt),
      },
    };
  }

  /**
   * Generate JSON schema properties from prompt variables
   */
  static generateInputSchemaProperties(prompt: any): Record<string, any> {
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

  /**
   * Map variable type to JSON schema type
   */
  static mapVariableTypeToJsonSchema(type: string): string {
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

  /**
   * Get required variables from prompt
   */
  static getRequiredVariables(prompt: any): string[] {
    if (!prompt.variables) return [];
    
    return prompt.variables
      .filter((variable: any) => variable.required)
      .map((variable: any) => variable.name);
  }

  /**
   * Create standard MCP tools for search and categories
   */
  static getStandardTools(): McpTool[] {
    return [
      {
        name: 'prompt_search',
        description: 'Search prompts by query, category, or tags',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query string' },
            category: { 
              type: 'string', 
              enum: Object.values(PromptCategory),
              description: 'Filter by category' 
            },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Filter by tags' 
            },
            limit: { 
              type: 'number', 
              description: 'Maximum number of results', 
              default: 10 
            }
          },
        },
      },
      {
        name: 'prompt_list_categories',
        description: 'List all available prompt categories with counts',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Create MCP tool result from rendered prompt
   */
  static createToolResult(content: string): McpToolResult {
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  /**
   * Create MCP tool result from JSON data
   */
  static createJsonToolResult(data: any): McpToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  /**
   * Validate tool arguments against schema
   */
  static validateToolArguments(args: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!args || typeof args !== 'object') {
      if (schema.required && schema.required.length > 0) {
        errors.push('Arguments object is required');
        return { valid: false, errors };
      }
      return { valid: true, errors };
    }

    // Check required properties
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in args)) {
          errors.push(`Missing required argument: ${required}`);
        }
      }
    }

    // Basic type checking
    if (schema.properties) {
      for (const [key, value] of Object.entries(args)) {
        const propSchema = (schema.properties as any)[key];
        if (propSchema) {
          const type = typeof value;
          const expectedType = propSchema.type;
          
          if (expectedType === 'array' && !Array.isArray(value)) {
            errors.push(`Argument '${key}' should be an array`);
          } else if (expectedType !== 'array' && type !== expectedType && value !== null && value !== undefined) {
            errors.push(`Argument '${key}' should be of type ${expectedType}, got ${type}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create CORS headers for responses
   */
  static getCorsHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }

  /**
   * Determine if a tool name is a system tool (not a prompt)
   */
  static isSystemTool(toolName: string): boolean {
    return toolName === 'prompt_search' || toolName === 'prompt_list_categories';
  }

  /**
   * Extract prompt ID from tool name
   */
  static extractPromptId(toolName: string): string | null {
    if (toolName.startsWith('prompt_') && !this.isSystemTool(toolName)) {
      return toolName.replace('prompt_', '');
    }
    return null;
  }
}