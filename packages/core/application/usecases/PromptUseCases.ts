import { Prompt, PromptCategory, PromptVariable } from '../../domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../domain/repositories/PromptRepository';

export interface CreatePromptDTO {
  name: string;
  description: string;
  content: string;
  category: PromptCategory;
  tags?: string[];
  author?: string;
  version?: string;
  variables?: PromptVariable[];
  isFavorite?: boolean;
}

export interface UpdatePromptDTO {
  id: string;
  name?: string;
  description?: string;
  content?: string;
  tags?: string[];
  author?: string;
  variables?: PromptVariable[];
  isFavorite?: boolean;
}

export interface RenderPromptDTO {
  id: string;
  variableValues: Record<string, any>;
}

export class PromptUseCases {
  constructor(
    private readonly promptRepository: PromptRepository,
    private readonly generateId: () => string = () => crypto.randomUUID()
  ) {}

  async createPrompt(dto: CreatePromptDTO): Promise<Prompt> {
    const now = new Date();
    const prompt = new Prompt(
      this.generateId(),
      dto.name,
      dto.description,
      dto.content,
      dto.category,
      dto.tags || [],
      now,
      now,
      dto.version || '1.0.0',
      dto.author,
      dto.variables,
      dto.isFavorite ?? false
    );

    await this.promptRepository.save(prompt);
    return prompt;
  }

  async updatePrompt(dto: UpdatePromptDTO): Promise<Prompt> {
    const existingPrompt = await this.promptRepository.findById(dto.id);
    if (!existingPrompt) {
      throw new Error(`Prompt with ID ${dto.id} not found`);
    }

    let updatedPrompt = existingPrompt.withUpdatedContent(
      dto.name,
      dto.description,
      dto.content,
      dto.tags,
      dto.author,
      dto.variables
    );

    if (dto.isFavorite !== undefined) {
      updatedPrompt = updatedPrompt.withFavorite(dto.isFavorite);
    }

    await this.promptRepository.save(updatedPrompt);
    return updatedPrompt;
  }

  async deletePrompt(id: string): Promise<boolean> {
    const exists = await this.promptRepository.exists(id);
    if (!exists) {
      return false;
    }

    return await this.promptRepository.delete(id);
  }

  async getPromptById(id: string): Promise<Prompt | null> {
    return await this.promptRepository.findById(id);
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return await this.promptRepository.findAll();
  }

  async searchPrompts(criteria: PromptSearchCriteria): Promise<Prompt[]> {
    return await this.promptRepository.search(criteria);
  }

  async getPromptsByCategory(category: PromptCategory): Promise<Prompt[]> {
    return await this.promptRepository.findByCategory(category);
  }

  async getPromptsByTags(tags: string[]): Promise<Prompt[]> {
    return await this.promptRepository.findByTags(tags);
  }

  async getCategoryStatistics(): Promise<Record<string, number>> {
    const counts = await this.promptRepository.countByCategory();
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return {
      total,
      ...counts
    };
  }

  async renderPrompt(dto: RenderPromptDTO): Promise<{ rendered: string; errors: string[] }> {
    const prompt = await this.promptRepository.findById(dto.id);
    if (!prompt) {
      throw new Error(`Prompt with ID ${dto.id} not found`);
    }

    const errors = prompt.validateVariables(dto.variableValues);
    const rendered = prompt.renderWithVariables(dto.variableValues);

    return {
      rendered,
      errors
    };
  }

  async validatePromptData(dto: CreatePromptDTO | UpdatePromptDTO): Promise<string[]> {
    const errors: string[] = [];

    // Basic validation
    if ('name' in dto && (!dto.name || dto.name.trim().length === 0)) {
      errors.push('Prompt name is required');
    }

    if ('description' in dto && (!dto.description || dto.description.trim().length === 0)) {
      errors.push('Prompt description is required');
    }

    if ('content' in dto && (!dto.content || dto.content.trim().length === 0)) {
      errors.push('Prompt content is required');
    }

    // Validate variables
    if ('variables' in dto && dto.variables) {
      dto.variables.forEach((variable, index) => {
        if (!variable.name || variable.name.trim().length === 0) {
          errors.push(`Variable ${index + 1}: name is required`);
        }

        if (!variable.description || variable.description.trim().length === 0) {
          errors.push(`Variable ${index + 1}: description is required`);
        }

        if (!['string', 'number', 'boolean', 'array'].includes(variable.type)) {
          errors.push(`Variable ${index + 1}: invalid type`);
        }
      });
    }

    return errors;
  }

  async setFavorite(dto: { id: string; isFavorite: boolean }): Promise<Prompt> {
    const existingPrompt = await this.promptRepository.findById(dto.id);
    if (!existingPrompt) {
      throw new Error(`Prompt with ID ${dto.id} not found`);
    }

    const updatedPrompt = existingPrompt.withFavorite(dto.isFavorite);
    await this.promptRepository.save(updatedPrompt);
    return updatedPrompt;
  }
}
