import { Prompt, PromptCategory } from '../entities/Prompt';
export interface PromptSearchCriteria {
    query?: string;
    category?: PromptCategory;
    tags?: string[];
    author?: string;
    limit?: number;
}
export interface PromptRepository {
    /**
     * Find a prompt by its unique identifier
     */
    findById(id: string): Promise<Prompt | null>;
    /**
     * Find all prompts
     */
    findAll(): Promise<Prompt[]>;
    /**
     * Search prompts based on criteria
     */
    search(criteria: PromptSearchCriteria): Promise<Prompt[]>;
    /**
     * Save a prompt (create or update)
     */
    save(prompt: Prompt): Promise<void>;
    /**
     * Delete a prompt by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Check if a prompt exists with the given ID
     */
    exists(id: string): Promise<boolean>;
    /**
     * Find prompts by category
     */
    findByCategory(category: PromptCategory): Promise<Prompt[]>;
    /**
     * Find prompts by tags
     */
    findByTags(tags: string[]): Promise<Prompt[]>;
    /**
     * Get count of prompts by category
     */
    countByCategory(): Promise<Record<string, number>>;
}
//# sourceMappingURL=PromptRepository.d.ts.map