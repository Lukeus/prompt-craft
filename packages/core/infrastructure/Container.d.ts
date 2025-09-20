import { PromptUseCases } from '../application/usecases/PromptUseCases';
import { PromptRepository } from '../domain/repositories/PromptRepository';
export interface ContainerConfig {
    promptsDirectory?: string;
    generateId?: () => string;
    promptRepository?: PromptRepository;
}
export declare class Container {
    private readonly config;
    private promptRepository;
    private promptUseCases;
    constructor(config?: ContainerConfig);
    getPromptRepository(): PromptRepository;
    getPromptUseCases(): PromptUseCases;
    setPromptRepository(repository: PromptRepository): void;
}
export declare function getContainer(config?: ContainerConfig): Container;
export declare function resetContainer(): void;
//# sourceMappingURL=Container.d.ts.map