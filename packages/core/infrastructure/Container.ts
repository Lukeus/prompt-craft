import { PromptUseCases } from '../application/usecases/PromptUseCases';
import { PromptRepository } from '../domain/repositories/PromptRepository';
import * as path from 'path';

export interface ContainerConfig {
  promptsDirectory?: string;
  generateId?: () => string;
  promptRepository?: PromptRepository;
}

export class Container {
  private promptRepository: PromptRepository | null = null;
  private promptUseCases: PromptUseCases | null = null;

  constructor(private readonly config: ContainerConfig = {}) {}

  getPromptRepository(): PromptRepository {
    if (!this.promptRepository) {
      if (this.config.promptRepository) {
        this.promptRepository = this.config.promptRepository;
      } else {
        throw new Error('PromptRepository must be provided in Container config');
      }
    }
    return this.promptRepository;
  }

  getPromptUseCases(): PromptUseCases {
    if (!this.promptUseCases) {
      const generateId = this.config.generateId || (() => {
        // Simple ID generation fallback
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
      });

      this.promptUseCases = new PromptUseCases(
        this.getPromptRepository(),
        generateId
      );
    }
    return this.promptUseCases;
  }

  // Method to override repositories for testing
  setPromptRepository(repository: PromptRepository): void {
    this.promptRepository = repository;
    this.promptUseCases = null; // Reset use cases to pick up new repository
  }
}

// Global container instance
let globalContainer: Container | null = null;

export function getContainer(config?: ContainerConfig): Container {
  if (!globalContainer || config) {
    globalContainer = new Container(config);
  }
  return globalContainer;
}

export function resetContainer(): void {
  globalContainer = null;
}
