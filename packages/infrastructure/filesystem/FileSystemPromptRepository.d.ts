import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../core/domain/repositories/PromptRepository';
interface UsageStats {
    favorites: string[];
    recents: Array<{
        promptId: string;
        usedAt: string;
    }>;
}
export declare class FileSystemPromptRepository implements PromptRepository {
    private readonly baseDirectory;
    private readonly usageStatsProvider?;
    private prompts;
    private initialized;
    private usageStats?;
    constructor(baseDirectory: string, usageStatsProvider?: (() => UsageStats) | undefined);
    private ensureInitialized;
    private loadAllPrompts;
    private loadPromptsFromCategory;
    private listJsonFiles;
    private ensureDirectory;
    private slugify;
    findById(id: string): Promise<Prompt | null>;
    findAll(): Promise<Prompt[]>;
    private getUsageScore;
    private calculateFuzzyScore;
    search(criteria: PromptSearchCriteria): Promise<Prompt[]>;
    save(prompt: Prompt): Promise<void>;
    delete(id: string): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    findByCategory(category: PromptCategory): Promise<Prompt[]>;
    findByTags(tags: string[]): Promise<Prompt[]>;
    countByCategory(): Promise<Record<string, number>>;
}
export {};
//# sourceMappingURL=FileSystemPromptRepository.d.ts.map