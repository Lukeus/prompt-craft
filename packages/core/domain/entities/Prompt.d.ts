export interface PromptVariable {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    defaultValue?: any;
}
export declare enum PromptCategory {
    WORK = "work",
    PERSONAL = "personal",
    SHARED = "shared"
}
export declare class Prompt {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly content: string;
    readonly category: PromptCategory;
    readonly tags: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly version: string;
    readonly author?: string | undefined;
    readonly variables?: PromptVariable[] | undefined;
    constructor(id: string, name: string, description: string, content: string, category: PromptCategory, tags: string[], createdAt: Date, updatedAt: Date, version: string, author?: string | undefined, variables?: PromptVariable[] | undefined);
    withUpdatedContent(name?: string, description?: string, content?: string, tags?: string[], author?: string, variables?: PromptVariable[]): Prompt;
    renderWithVariables(variableValues: Record<string, any>): string;
    validateVariables(variableValues: Record<string, any>): string[];
    validateConsistency(): {
        errors: string[];
        warnings: string[];
    };
    toJSON(): any;
    static fromJSON(data: any): Prompt;
}
//# sourceMappingURL=Prompt.d.ts.map