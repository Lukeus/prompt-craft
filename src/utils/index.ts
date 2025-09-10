import * as fs from 'fs/promises';
import * as path from 'path';
import { Prompt, PromptVariable } from '../types';

export class FileUtils {
  static async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error}`);
    }
  }

  static async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write JSON file ${filePath}: ${error}`);
    }
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      if (extension) {
        return files.filter(file => file.endsWith(extension));
      }
      return files;
    } catch (error) {
      throw new Error(`Failed to list files in ${dirPath}: ${error}`);
    }
  }
}

export class StringUtils {
  static generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static interpolateVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  static extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/[\{\}]/g, ''));
  }
}

export class ValidationUtils {
  static validatePrompt(prompt: Partial<Prompt>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt.name || prompt.name.trim().length === 0) {
      errors.push('Prompt name is required');
    }

    if (!prompt.description || prompt.description.trim().length === 0) {
      errors.push('Prompt description is required');
    }

    if (!prompt.content || prompt.content.trim().length === 0) {
      errors.push('Prompt content is required');
    }

    if (!prompt.category) {
      errors.push('Prompt category is required');
    }

    if (prompt.variables) {
      prompt.variables.forEach((variable, index) => {
        if (!variable.name || variable.name.trim().length === 0) {
          errors.push(`Variable at index ${index} must have a name`);
        }
        if (!variable.description || variable.description.trim().length === 0) {
          errors.push(`Variable '${variable.name}' must have a description`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateVariableValue(variable: PromptVariable, value: any): { isValid: boolean; error?: string } {
    if (variable.required && (value === undefined || value === null || value === '')) {
      return { isValid: false, error: `Variable '${variable.name}' is required` };
    }

    if (value === undefined || value === null) {
      return { isValid: true };
    }

    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: `Variable '${variable.name}' must be a string` };
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: `Variable '${variable.name}' must be a number` };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: `Variable '${variable.name}' must be a boolean` };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return { isValid: false, error: `Variable '${variable.name}' must be an array` };
        }
        break;
    }

    return { isValid: true };
  }
}
