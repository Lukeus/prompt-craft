import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../core/domain/repositories/PromptRepository';
interface UsageStats {
    favorites: string[];
    recents: Array<{
        promptId: string;
        usedAt: string;
    }>;
}
export declare class DrizzlePromptRepository implements PromptRepository {
    private readonly usageStatsProvider?;
    private db;
    private usageStats?;
    constructor(usageStatsProvider?: (() => UsageStats) | undefined);
    private mapDbRowToPrompt;
    private mapPromptToDbRow;
    private getUsageScore;
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
export {};
//# sourceMappingURL=DrizzlePromptRepository.d.ts.map