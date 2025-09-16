#!/usr/bin/env ts-node

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DrizzlePromptRepository } from '../packages/infrastructure/database/DrizzlePromptRepository';
import { FileSystemPromptRepository } from '../packages/infrastructure/filesystem/FileSystemPromptRepository';
import { testDatabaseConnection } from '../packages/infrastructure/database/connection';
import { Prompt } from '../packages/core/domain/entities/Prompt';

// Load environment variables
dotenv.config();

interface ExportOptions {
  outputDir?: string;
  format?: 'json' | 'files';
  dryRun?: boolean;
}

class DataExporter {
  private dbRepo: DrizzlePromptRepository;
  private fileRepo: FileSystemPromptRepository;

  constructor(private options: ExportOptions = {}) {
    this.dbRepo = new DrizzlePromptRepository();
    const outputDir = this.options.outputDir || path.join(process.cwd(), 'export-backup');
    this.fileRepo = new FileSystemPromptRepository(outputDir);
  }

  async validateConnection(): Promise<boolean> {
    console.log('🔍 Testing database connection...');
    try {
      const isConnected = await testDatabaseConnection();
      if (!isConnected) {
        console.error('❌ Database connection failed');
        return false;
      }
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
  }

  async loadPromptsFromDatabase(): Promise<Prompt[]> {
    console.log('📂 Loading prompts from database...');
    try {
      const prompts = await this.dbRepo.findAll();
      console.log(`✅ Found ${prompts.length} prompts in database`);
      
      // Show breakdown by category
      const byCategory = prompts.reduce((acc, prompt) => {
        acc[prompt.category] = (acc[prompt.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('📊 Prompts by category:');
      Object.entries(byCategory).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} prompts`);
      });

      return prompts;
    } catch (error) {
      console.error('❌ Failed to load prompts from database:', error);
      throw error;
    }
  }

  async ensureOutputDirectory(): Promise<void> {
    const outputDir = this.options.outputDir || path.join(process.cwd(), 'export-backup');
    
    if (this.options.dryRun) {
      console.log(`🔍 Would create output directory: ${outputDir}`);
      return;
    }

    try {
      await fs.mkdir(outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${outputDir}`);
      
      // Create category subdirectories
      const categories = ['work', 'personal', 'shared'];
      for (const category of categories) {
        await fs.mkdir(path.join(outputDir, category), { recursive: true });
      }
    } catch (error) {
      console.error('❌ Failed to create output directory:', error);
      throw error;
    }
  }

  async exportAsFiles(prompts: Prompt[]): Promise<void> {
    const outputDir = this.options.outputDir || path.join(process.cwd(), 'export-backup');
    
    console.log(`💾 Exporting ${prompts.length} prompts as individual JSON files...`);
    
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN - No files will be written');
      this.previewExport(prompts, outputDir);
      return;
    }

    let successful = 0;
    let errors = 0;

    for (const prompt of prompts) {
      try {
        await this.fileRepo.save(prompt);
        successful++;
        console.log(`✅ Exported: ${prompt.name} (${prompt.category})`);
      } catch (error) {
        errors++;
        console.error(`❌ Failed to export prompt ${prompt.name}:`, error);
      }
    }

    console.log(`\n📊 Export Summary:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${prompts.length}`);
    console.log(`   📁 Output directory: ${outputDir}`);
  }

  async exportAsJson(prompts: Prompt[]): Promise<void> {
    const outputDir = this.options.outputDir || path.join(process.cwd(), 'export-backup');
    const outputFile = path.join(outputDir, 'prompts-export.json');

    console.log(`💾 Exporting ${prompts.length} prompts to single JSON file...`);
    
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN - No files will be written');
      console.log(`🔍 Would write to: ${outputFile}`);
      return;
    }

    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalPrompts: prompts.length,
        byCategory: prompts.reduce((acc, prompt) => {
          acc[prompt.category] = (acc[prompt.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        prompts: prompts
      };

      await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2), 'utf8');
      console.log(`✅ Exported all prompts to: ${outputFile}`);
    } catch (error) {
      console.error('❌ Failed to export JSON file:', error);
      throw error;
    }
  }

  private previewExport(prompts: Prompt[], outputDir: string): void {
    console.log('\n🔍 DRY RUN PREVIEW:');
    console.log('='.repeat(50));
    console.log(`Output directory: ${outputDir}`);
    console.log(`Export format: ${this.options.format || 'files'}`);
    
    const byCategory = prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nPrompts to be exported by category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} prompts`);
    });

    console.log('\nFirst 5 prompts:');
    prompts.slice(0, 5).forEach((prompt, index) => {
      const fileName = this.options.format === 'json' 
        ? 'prompts-export.json' 
        : `${prompt.category}/${prompt.id}.json`;
      console.log(`   ${index + 1}. ${prompt.name} → ${fileName}`);
    });

    if (prompts.length > 5) {
      console.log(`   ... and ${prompts.length - 5} more`);
    }
    console.log('='.repeat(50));
  }

  async run(): Promise<void> {
    console.log('📤 Starting data export process...');
    console.log(`📁 Output directory: ${this.options.outputDir || 'export-backup/'}`);
    console.log(`📄 Export format: ${this.options.format || 'files'}`);
    console.log(`🔄 Dry run: ${this.options.dryRun ? 'Yes' : 'No'}`);
    console.log('-'.repeat(50));

    // Load prompts from database
    const prompts = await this.loadPromptsFromDatabase();
    if (prompts.length === 0) {
      console.log('ℹ️  No prompts found in database. Nothing to export.');
      return;
    }

    // Ensure output directory exists
    await this.ensureOutputDirectory();

    // Export based on format
    if (this.options.format === 'json') {
      await this.exportAsJson(prompts);
    } else {
      await this.exportAsFiles(prompts);
    }

    console.log('\n🎉 Data export completed!');
    
    if (!this.options.dryRun) {
      const outputDir = this.options.outputDir || path.join(process.cwd(), 'export-backup');
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Copy exported data to your production environment`);
      console.log(`   2. Set up production DATABASE_URL`);
      console.log(`   3. Run migrations: npm run db:migrate`);
      console.log(`   4. Import data: npm run db:seed -- --source-dir ${outputDir}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options: ExportOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--format':
        const format = args[++i];
        if (format !== 'json' && format !== 'files') {
          console.error('❌ Invalid format. Use "json" or "files"');
          process.exit(1);
        }
        options.format = format as 'json' | 'files';
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        console.log(`
Data Export Script for Prompt Manager

Usage: npm run db:export [options]

Options:
  --output-dir <path>      Output directory for exported data (default: ./export-backup)
  --format <json|files>    Export format: 'json' for single file, 'files' for individual files (default: files)
  --dry-run               Preview export without writing files
  --help                  Show this help message

Examples:
  npm run db:export                              # Export as individual files to ./export-backup
  npm run db:export -- --dry-run                # Preview export without writing
  npm run db:export -- --format json            # Export as single JSON file
  npm run db:export -- --output-dir ./backup    # Export to custom directory
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
    const exporter = new DataExporter(options);
    await exporter.run();
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

// Run export if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Export script failed:', error);
    process.exit(1);
  });
}

export { DataExporter };