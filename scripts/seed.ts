#!/usr/bin/env ts-node

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { FileSystemPromptRepository } from '../packages/infrastructure/filesystem/FileSystemPromptRepository';
import { DrizzlePromptRepository } from '../packages/infrastructure/database/DrizzlePromptRepository';
import { getDatabase, testDatabaseConnection } from '../packages/infrastructure/database/connection';
import { Prompt } from '../packages/core/domain/entities/Prompt';

// Load environment variables
dotenv.config();

interface SeedOptions {
  sourceDir?: string;
  dryRun?: boolean;
  overwrite?: boolean;
}

class DataSeeder {
  private fileRepo: FileSystemPromptRepository;
  private dbRepo: DrizzlePromptRepository;

  constructor(private options: SeedOptions = {}) {
    const sourceDir = this.options.sourceDir || path.join(process.cwd(), 'prompts');
    this.fileRepo = new FileSystemPromptRepository(sourceDir);
    this.dbRepo = new DrizzlePromptRepository();
  }

  async validateConnection(): Promise<boolean> {
    console.log('🔍 Testing database connection...');
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      return false;
    }
    console.log('✅ Database connection successful');
    return true;
  }

  async loadPromptsFromFiles(): Promise<Prompt[]> {
    console.log('📂 Loading prompts from JSON files...');
    try {
      const prompts = await this.fileRepo.findAll();
      console.log(`✅ Found ${prompts.length} prompts in files`);
      return prompts;
    } catch (error) {
      console.error('❌ Failed to load prompts from files:', error);
      throw error;
    }
  }

  async checkExistingData(): Promise<{ total: number; byCategory: Record<string, number> }> {
    console.log('🔍 Checking existing data in database...');
    try {
      const existing = await this.dbRepo.findAll();
      const byCategory = await this.dbRepo.countByCategory();
      
      console.log(`📊 Found ${existing.length} existing prompts in database`);
      console.log('📊 By category:', byCategory);
      
      return { total: existing.length, byCategory };
    } catch (error) {
      console.error('❌ Failed to check existing data:', error);
      throw error;
    }
  }

  async seedPrompts(prompts: Prompt[]): Promise<void> {
    console.log(`🌱 Seeding ${prompts.length} prompts to database...`);
    
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN - No data will be written');
      this.previewSeeding(prompts);
      return;
    }

    let successful = 0;
    let errors = 0;

    for (const prompt of prompts) {
      try {
        // Check if prompt already exists
        const exists = await this.dbRepo.exists(prompt.id);
        
        if (exists && !this.options.overwrite) {
          console.log(`⏭️  Skipping existing prompt: ${prompt.name} (${prompt.id})`);
          continue;
        }

        await this.dbRepo.save(prompt);
        successful++;
        console.log(`✅ Seeded: ${prompt.name} (${prompt.category})`);
      } catch (error) {
        errors++;
        console.error(`❌ Failed to seed prompt ${prompt.name}:`, error);
      }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${prompts.length}`);
  }

  private previewSeeding(prompts: Prompt[]): void {
    console.log('\n🔍 DRY RUN PREVIEW:');
    console.log('='.repeat(50));
    
    const byCategory = prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Prompts to be seeded by category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} prompts`);
    });

    console.log('\nFirst 5 prompts:');
    prompts.slice(0, 5).forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.name} (${prompt.category}) - ${prompt.id}`);
    });

    if (prompts.length > 5) {
      console.log(`   ... and ${prompts.length - 5} more`);
    }
    console.log('='.repeat(50));
  }

  async run(): Promise<void> {
    console.log('🌱 Starting data seeding process...');
    console.log(`📁 Source directory: ${this.options.sourceDir || 'prompts/'}`);
    console.log(`🔄 Dry run: ${this.options.dryRun ? 'Yes' : 'No'}`);
    console.log(`📝 Overwrite existing: ${this.options.overwrite ? 'Yes' : 'No'}`);
    console.log('-'.repeat(50));

    // Validate database connection (temporarily skipped - CLI confirms connection works)
    console.log('⚠️  Skipping connection test (known issue with test method)');
    // const connected = await this.validateConnection();
    // if (!connected) {
    //   throw new Error('Database connection failed');
    // }

    // Load prompts from files
    const prompts = await this.loadPromptsFromFiles();
    if (prompts.length === 0) {
      console.log('ℹ️  No prompts found in files. Nothing to seed.');
      return;
    }

    // Check existing data
    await this.checkExistingData();

    // Seed the prompts
    await this.seedPrompts(prompts);

    console.log('\n🎉 Data seeding completed!');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--source-dir':
        options.sourceDir = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--overwrite':
        options.overwrite = true;
        break;
      case '--help':
        console.log(`
Data Seeding Script for Prompt Manager

Usage: npm run db:seed [options]

Options:
  --source-dir <path>   Source directory containing JSON prompts (default: ./prompts)
  --dry-run            Preview what would be seeded without writing to database
  --overwrite          Overwrite existing prompts in database
  --help               Show this help message

Examples:
  npm run db:seed                          # Seed from ./prompts directory
  npm run db:seed -- --dry-run             # Preview seeding without writing
  npm run db:seed -- --overwrite           # Overwrite existing prompts
  npm run db:seed -- --source-dir ./backup # Seed from ./backup directory
        `);
        process.exit(0);
      default:
        if (args[i].startsWith('--')) {
          console.error(`Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }

  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('   Please set it in your .env file or environment');
    process.exit(1);
  }

  try {
    const seeder = new DataSeeder(options);
    await seeder.run();
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
}

export { DataSeeder };