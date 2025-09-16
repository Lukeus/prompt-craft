#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { getDatabase, testDatabaseConnection } from '../packages/infrastructure/database/connection';
import { prompts } from '../packages/infrastructure/database/schema';

// Load environment variables
dotenv.config();

class DatabaseReset {
  private db = getDatabase();

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

  async getPromptCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: 'count(*)' as any })
        .from(prompts);
      return Number(result[0].count) || 0;
    } catch (error) {
      console.warn('⚠️  Could not get prompt count:', error);
      return -1;
    }
  }

  async confirmReset(promptCount: number): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const message = promptCount > 0
        ? `This will delete all ${promptCount} prompts from the database. Are you sure? (yes/no): `
        : 'This will reset the database schema. Are you sure? (yes/no): ';

      rl.question(message, (answer) => {
        rl.close();
        const confirmed = answer.toLowerCase().trim() === 'yes';
        resolve(confirmed);
      });
    });
  }

  async resetDatabase(): Promise<void> {
    console.log('🗑️  Deleting all prompts...');
    try {
      const result = await this.db.delete(prompts);
      const deletedCount = result.rowCount || 0;
      console.log(`✅ Deleted ${deletedCount} prompts from database`);
    } catch (error) {
      console.error('❌ Failed to delete prompts:', error);
      throw error;
    }
  }

  async run(forceConfirm: boolean = false): Promise<void> {
    console.log('🔄 Database Reset Script');
    console.log('-'.repeat(50));

    // Validate database connection
    const connected = await this.validateConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get current prompt count
    const promptCount = await this.getPromptCount();
    if (promptCount > 0) {
      console.log(`📊 Current database contains ${promptCount} prompts`);
    } else if (promptCount === 0) {
      console.log('📊 Database is already empty');
    }

    // Confirm reset operation
    if (!forceConfirm) {
      const confirmed = await this.confirmReset(promptCount);
      if (!confirmed) {
        console.log('❌ Reset cancelled');
        return;
      }
    } else {
      console.log('⚠️  Force mode - skipping confirmation');
    }

    // Perform reset
    await this.resetDatabase();

    console.log('\n🎉 Database reset completed!');
    console.log('💡 You can now run `npm run db:seed` to populate with fresh data');
  }
}

async function main() {
  const args = process.argv.slice(2);
  let forceConfirm = false;

  // Parse command line arguments
  for (const arg of args) {
    switch (arg) {
      case '--force':
        forceConfirm = true;
        break;
      case '--help':
        console.log(`
Database Reset Script for Prompt Manager

Usage: npm run db:reset [options]

Options:
  --force              Skip confirmation prompt
  --help               Show this help message

Examples:
  npm run db:reset                   # Reset with confirmation
  npm run db:reset -- --force        # Reset without confirmation

⚠️  WARNING: This operation will delete all prompts from the database!
        `);
        process.exit(0);
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
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
    const reset = new DatabaseReset();
    await reset.run(forceConfirm);
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  }
}

// Run reset if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Reset script failed:', error);
    process.exit(1);
  });
}

export { DatabaseReset };