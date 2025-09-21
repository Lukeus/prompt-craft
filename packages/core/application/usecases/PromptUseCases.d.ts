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
}
export interface UpdatePromptDTO {
    id: string;
    name?: string;
    description?: string;
    content?: string;
    tags?: string[];
    author?: string;
    variables?: PromptVariable[];
}
export interface RenderPromptDTO {
    id: string;
    variableValues: Record<string, any>;
}
export declare class PromptUseCases {
    private readonly promptRepository;
    private readonly generateId;
    constructor(promptRepository: PromptRepository, generateId?: () => string);
    createPrompt(dto: CreatePromptDTO): Promise<Prompt>;
    updatePrompt(dto: UpdatePromptDTO): Promise<Prompt>;
    deletePrompt(id: string): Promise<boolean>;
    getPromptById(id: string): Promise<Prompt | null>;
    getAllPrompts(): Promise<Prompt[]>;
    searchPrompts(criteria: PromptSearchCriteria): Promise<Prompt[]>;
    getPromptsByCategory(category: PromptCategory): Promise<Prompt[]>;
    getPromptsByTags(tags: string[]): Promise<Prompt[]>;
    getCategoryStatistics(): Promise<Record<string, number>>;
    renderPrompt(dto: RenderPromptDTO): Promise<{
        rendered: string;
        errors: string[];
    }>;
    validatePromptData(dto: CreatePromptDTO | UpdatePromptDTO): Promise<string[]>;
}
//# sourceMappingURL=PromptUseCases.d.ts.map