import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Configure Neon for better performance in serverless environments
neonConfig.fetchConnectionCache = true;

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Timeout for new connections
    });

    this.db = drizzle(this.pool, { schema, logger: process.env.NODE_ENV === 'development' });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getDb() {
    return this.db;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.db.execute(sql`SELECT 1 as test`);
      return Array.isArray(result.rows) && result.rows.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance functions
export const getDatabase = () => DatabaseConnection.getInstance().getDb();
export const testDatabaseConnection = () => DatabaseConnection.getInstance().testConnection();
export const closeDatabaseConnection = () => DatabaseConnection.getInstance().close();

// Export the database connection for migration scripts
export const getDatabaseConnection = () => DatabaseConnection.getInstance();