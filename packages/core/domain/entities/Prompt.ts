export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
}

export enum PromptCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHARED = 'shared'
}

export class Prompt {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly content: string,
    public readonly category: PromptCategory,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly version: string,
    public readonly author?: string,
    public readonly variables?: PromptVariable[],
    public readonly isFavorite: boolean = false
  ) {}

  public withUpdatedContent(
    name?: string,
    description?: string,
    content?: string,
    tags?: string[],
    author?: string,
    variables?: PromptVariable[]
  ): Prompt {
    return new Prompt(
      this.id,
      name ?? this.name,
      description ?? this.description,
      content ?? this.content,
      this.category,
      tags ?? this.tags,
      this.createdAt,
      new Date(), // Update the updatedAt timestamp
      this.version,
      author ?? this.author,
      variables ?? this.variables,
      this.isFavorite
    );
  }

  public withFavorite(isFavorite: boolean): Prompt {
    return new Prompt(
      this.id,
      this.name,
      this.description,
      this.content,
      this.category,
      this.tags,
      this.createdAt,
      new Date(),
      this.version,
      this.author,
      this.variables,
      isFavorite
    );
  }

  public renderWithVariables(variableValues: Record<string, any>): string {
    let rendered = this.content;
    
    if (this.variables) {
      this.variables.forEach(variable => {
        const value = variableValues[variable.name] ?? variable.defaultValue ?? '';
        const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        rendered = rendered.replace(regex, String(value));
      });
    }
    
    return rendered;
  }

  public validateVariables(variableValues: Record<string, any>): string[] {
    const errors: string[] = [];
    
    if (this.variables) {
      this.variables.forEach(variable => {
        const value = variableValues[variable.name];
        
        if (variable.required && (value === undefined || value === null || value === '')) {
          errors.push(`Variable '${variable.name}' is required but not provided`);
        }
        
        if (value !== undefined && value !== null && value !== '') {
          // Type validation
          switch (variable.type) {
            case 'number':
              if (isNaN(Number(value))) {
                errors.push(`Variable '${variable.name}' must be a number`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                errors.push(`Variable '${variable.name}' must be a boolean`);
              }
              break;
            case 'array':
              if (!Array.isArray(value) && typeof value !== 'string') {
                errors.push(`Variable '${variable.name}' must be an array or string`);
              }
              break;
          }
        }
      });
    }
    
    return errors;
  }

  public validateConsistency(): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract all placeholders from content using regex (more restrictive pattern for valid variable names)
    const placeholderRegex = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;
    const placeholdersInContent = new Set<string>();
    let match;
    
    while ((match = placeholderRegex.exec(this.content)) !== null) {
      placeholdersInContent.add(match[1]);
    }

    // Get declared variable names
    const declaredVariables = new Set<string>(this.variables?.map(v => v.name) || []);

    // Check for placeholders without variable declarations
    placeholdersInContent.forEach(placeholder => {
      if (!declaredVariables.has(placeholder)) {
        errors.push(`Placeholder '{{${placeholder}}}' found in content but no variable '${placeholder}' is declared`);
      }
    });

    // Check for declared variables not used in content
    if (this.variables) {
      this.variables.forEach(variable => {
        if (!placeholdersInContent.has(variable.name)) {
          warnings.push(`Variable '${variable.name}' is declared but not used in content`);
        }
      });
    }

    return { errors, warnings };
  }

  public toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      content: this.content,
      category: this.category,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
      author: this.author,
      variables: this.variables,
      isFavorite: this.isFavorite
    };
  }

  public static fromJSON(data: any): Prompt {
    return new Prompt(
      data.id,
      data.name,
      data.description,
      data.content,
      data.category as PromptCategory,
      data.tags || [],
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.version || '1.0.0',
      data.author,
      data.variables,
      Boolean(data.isFavorite)
    );
  }
}
