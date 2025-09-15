import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../core/domain/repositories/PromptRepository';
export declare class FileSystemPromptRepository implements PromptRepository {
    private readonly baseDirectory;
    private prompts;
    private initialized;
    constructor(baseDirectory: string);
    private ensureInitialized;
    private loadAllPrompts;
    private loadPromptsFromCategory;
    private listJsonFiles;
    private ensureDirectory;
    private slugify;
    findById(id: string): Promise<Prompt | null>;
    findAll(): Promise<Prompt[]>;
    search(criteria: PromptSearchCriteria): Promise<Prompt[]>;
    save(prompt: Prompt): Promise<void>;
    delete(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    findByCategory(category: PromptCategory): Promise<Prompt[]>;
    findByTags(tags: string[]): Promise<Prompt[]>;
    countByCategory(): Promise<Record<string, number>>;
}
//# sourceMappingURL=FileSystemPromptRepository.d.ts.map