import { Prompt, PromptCategory } from '../../../domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../../domain/repositories/PromptRepository';

export class MockPromptRepository implements PromptRepository {
  private prompts: Map<string, Prompt> = new Map();

  // Test helper methods
  clear(): void {
    this.prompts.clear();
  }

  addPrompt(prompt: Prompt): void {
    this.prompts.set(prompt.id, prompt);
  }

  getPrompts(): Prompt[] {
    return Array.from(this.prompts.values());
  }

  // Repository interface implementation
  async findById(id: string): Promise<Prompt | null> {
    return this.prompts.get(id) || null;
  }

  async findAll(): Promise<Prompt[]> {
    return Array.from(this.prompts.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async search(criteria: PromptSearchCriteria): Promise<Prompt[]> {
    let results = Array.from(this.prompts.values());

    if (criteria.category) {
      results = results.filter(prompt => prompt.category === criteria.category);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(prompt => 
        criteria.tags!.some(tag => prompt.tags.includes(tag))
      );
    }

    if (criteria.author) {
      results = results.filter(prompt => 
        prompt.author?.toLowerCase().includes(criteria.author!.toLowerCase())
      );
    }

    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(prompt => 
        prompt.name.toLowerCase().includes(query) ||
        prompt.description.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    if (criteria.limit && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  async save(prompt: Prompt): Promise<void> {
    this.prompts.set(prompt.id, prompt);
  }

  async delete(id: string): Promise<boolean> {
    return this.prompts.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.prompts.has(id);
  }

  async findByCategory(category: PromptCategory): Promise<Prompt[]> {
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.category === category)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findByTags(tags: string[]): Promise<Prompt[]> {
    return Array.from(this.prompts.values())
      .filter(prompt => tags.some(tag => prompt.tags.includes(tag)))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async countByCategory(): Promise<Record<string, number>> {
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
