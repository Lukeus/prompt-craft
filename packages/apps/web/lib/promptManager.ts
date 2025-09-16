import { getContainer } from '@core/infrastructure/Container';
import { PromptUseCases } from '@core/application/usecases/PromptUseCases';
import { RepositoryFactory } from '@infrastructure/RepositoryFactory';
import * as path from 'path';

let promptManager: PromptUseCases | null = null;

export async function getPromptManager(): Promise<PromptUseCases> {
  if (!promptManager) {
    // Configure the container with automatic repository detection
    const promptRepository = RepositoryFactory.createAuto();
    const container = getContainer({ promptRepository });
    promptManager = container.getPromptUseCases();
  }
  return promptManager;
}

export function resetPromptManager(): void {
  promptManager = null;
}
