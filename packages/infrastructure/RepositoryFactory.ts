import { PromptRepository } from '../core/domain/repositories/PromptRepository';
import { FileSystemPromptRepository } from './filesystem/FileSystemPromptRepository';
import { DrizzlePromptRepository } from './database/DrizzlePromptRepository';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export type RepositoryType = 'filesystem' | 'database';

export interface RepositoryConfig {
  type?: RepositoryType;
  promptsDirectory?: string;
  databaseUrl?: string;
  usageStatsProvider?: () => { favorites: string[]; recents: Array<{ promptId: string; usedAt: string }> };
}

export class RepositoryFactory {
  static create(config: RepositoryConfig = {}): PromptRepository {
    const repositoryType = RepositoryFactory.determineType(config);
    
    switch (repositoryType) {
      case 'database':
        return RepositoryFactory.createDatabaseRepository(config);
      case 'filesystem':
      default:
        return RepositoryFactory.createFileSystemRepository(config);
    }
  }

  private static determineType(config: RepositoryConfig): RepositoryType {
    // Priority: 1. Config override, 2. Environment variable, 3. Default to filesystem
    if (config.type) {
      return config.type;
    }

    const envType = process.env.REPOSITORY_TYPE?.toLowerCase();
    if (envType === 'database') {
      // Check if DATABASE_URL is available
      const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
      if (!databaseUrl) {
        console.warn('⚠️  REPOSITORY_TYPE is set to "database" but DATABASE_URL is not configured');
        console.warn('⚠️  Falling back to filesystem repository');
        return 'filesystem';
      }
      return 'database';
    }

    return 'filesystem';
  }

  private static createDatabaseRepository(config: RepositoryConfig): DrizzlePromptRepository {
    console.log('🗄️  Creating database repository (PostgreSQL + Drizzle)');
    
    // Validate database URL
    const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for database repository');
    }

    return new DrizzlePromptRepository(config.usageStatsProvider);
  }

  private static createFileSystemRepository(config: RepositoryConfig): FileSystemPromptRepository {
    console.log('📁 Creating filesystem repository (JSON files)');
    
    const promptsDirectory = config.promptsDirectory || 
                           process.env.PROMPTS_DIRECTORY || 
                           path.join(process.cwd(), 'prompts');
    
    return new FileSystemPromptRepository(promptsDirectory, config.usageStatsProvider);
  }

  /**
   * Create repository with automatic type detection
   * Useful for CLI and server applications
   */
  static createAuto(usageStatsProvider?: () => { favorites: string[]; recents: Array<{ promptId: string; usedAt: string }> }): PromptRepository {
    return RepositoryFactory.create({ usageStatsProvider });
  }

  /**
   * Create filesystem repository explicitly
   * Useful for testing or when filesystem is specifically needed
   */
  static createFileSystem(promptsDirectory?: string, usageStatsProvider?: () => { favorites: string[]; recents: Array<{ promptId: string; usedAt: string }> }): FileSystemPromptRepository {
    return RepositoryFactory.create({
      type: 'filesystem',
      promptsDirectory,
      usageStatsProvider
    }) as FileSystemPromptRepository;
  }

  /**
   * Create database repository explicitly
   * Useful for production deployments or when database is specifically needed
   */
  static createDatabase(databaseUrl?: string, usageStatsProvider?: () => { favorites: string[]; recents: Array<{ promptId: string; usedAt: string }> }): DrizzlePromptRepository {
    return RepositoryFactory.create({
      type: 'database',
      databaseUrl,
      usageStatsProvider
    }) as DrizzlePromptRepository;
  }
}