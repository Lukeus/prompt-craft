import { getContainer } from '@core/infrastructure/Container';
import { PromptUseCases } from '@core/application/usecases/PromptUseCases';
import { FileSystemPromptRepository } from '@infrastructure/filesystem/FileSystemPromptRepository';
import * as path from 'path';

let promptManager: PromptUseCases | null = null;

export async function getPromptManager(): Promise<PromptUseCases> {
  if (!promptManager) {
    // Configure the container with FileSystemPromptRepository
    const promptsDirectory = path.join(process.cwd(), 'prompts');
    const promptRepository = new FileSystemPromptRepository(promptsDirectory);
    const container = getContainer({ promptRepository });
    promptManager = container.getPromptUseCases();
  }
  return promptManager;
}

export function resetPromptManager(): void {
  promptManager = null;
}
