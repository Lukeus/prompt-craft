import * as fs from 'fs/promises';
import * as path from 'path';
import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../core/domain/repositories/PromptRepository';

export class FileSystemPromptRepository implements PromptRepository {
  private prompts: Map<string, Prompt> = new Map();
  private initialized = false;

  constructor(
    private readonly baseDirectory: string
  ) {}

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadAllPrompts();
      this.initialized = true;
    }
  }

  private async loadAllPrompts(): Promise<void> {
    this.prompts.clear();
    
    for (const category of Object.values(PromptCategory)) {
      await this.loadPromptsFromCategory(category);
    }
  }

  private async loadPromptsFromCategory(category: PromptCategory): Promise<void> {
    const categoryPath = path.join(this.baseDirectory, category);
    
    try {
      const files = await this.listJsonFiles(categoryPath);
      
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const promptData = JSON.parse(fileContent);
          const prompt = Prompt.fromJSON(promptData);
          this.prompts.set(prompt.id, prompt);
        } catch (error) {
          console.warn(`Failed to load prompt from ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Category directory doesn't exist yet, that's ok
      console.info(`Category directory ${category} not found, skipping`);
    }
  }

  private async listJsonFiles(directory: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directory);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findById(id: string): Promise<Prompt | null> {
    await this.ensureInitialized();
    return this.prompts.get(id) || null;
  }

  async findAll(): Promise<Prompt[]> {
    await this.ensureInitialized();
    return Array.from(this.prompts.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async search(criteria: PromptSearchCriteria): Promise<Prompt[]> {
    await this.ensureInitialized();
    let results = Array.from(this.prompts.values());

    // Filter by category
    if (criteria.category) {
      results = results.filter(prompt => prompt.category === criteria.category);
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(prompt => 
        criteria.tags!.some(tag => prompt.tags.includes(tag))
      );
    }

    // Filter by author
    if (criteria.author) {
      results = results.filter(prompt => 
        prompt.author?.toLowerCase().includes(criteria.author!.toLowerCase())
      );
    }

    // Text search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
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
    if (criteria.limit && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  async save(prompt: Prompt): Promise<void> {
    await this.ensureInitialized();
    
    // Update in-memory storage
    this.prompts.set(prompt.id, prompt);

    // Save to file
    const categoryPath = path.join(this.baseDirectory, prompt.category);
    await this.ensureDirectory(categoryPath);
    
    const fileName = `${this.slugify(prompt.name)}.json`;
    const filePath = path.join(categoryPath, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(prompt.toJSON(), null, 2), 'utf-8');
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const prompt = this.prompts.get(id);
    if (!prompt) {
      return false;
    }

    // Remove from memory
    this.prompts.delete(id);

    // Remove file
    try {
      const categoryPath = path.join(this.baseDirectory, prompt.category);
      const fileName = `${this.slugify(prompt.name)}.json`;
      const filePath = path.join(categoryPath, fileName);
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete prompt file:', error);
      }
    } catch (error) {
      console.warn('Failed to delete prompt file:', error);
    }

    return true;
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.prompts.has(id);
  }

  async findByCategory(category: PromptCategory): Promise<Prompt[]> {
    await this.ensureInitialized();
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.category === category)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findByTags(tags: string[]): Promise<Prompt[]> {
    await this.ensureInitialized();
    return Array.from(this.prompts.values())
      .filter(prompt => tags.some(tag => prompt.tags.includes(tag)))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async countByCategory(): Promise<Record<string, number>> {
    await this.ensureInitialized();
    const counts: Record<string, number> = {
      work: 0,
      personal: 0,
      shared: 0
    };

    for (const prompt of this.prompts.values()) {
      counts[prompt.category] = (counts[prompt.category] || 0) + 1;
    }

    return counts;
  }
}
