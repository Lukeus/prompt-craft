import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as sqliteSchema from './sqliteSchema';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export class SQLiteConnection {
  private static instance: SQLiteConnection;
  private database: Database.Database;
  private db: ReturnType<typeof drizzle>;
  
  private constructor() {
    const dbPath = this.getDatabasePath();
    this.ensureDirectoryExists(path.dirname(dbPath));
    
    console.log(`Initializing SQLite database at: ${dbPath}`);
    
    this.database = new Database(dbPath);
    this.database.pragma('journal_mode = WAL'); // Enable WAL mode for better performance
    this.database.pragma('synchronous = NORMAL'); // Faster writes
    this.database.pragma('cache_size = 1000'); // Increase cache size
    this.database.pragma('temp_store = MEMORY'); // Use memory for temporary tables
    
    this.db = drizzle(this.database, { 
      schema: sqliteSchema,
      logger: process.env.NODE_ENV === 'development'
    });
    
    this.initializeTables();
    console.log('SQLite database initialized successfully');
  }
  
  public static getInstance(): SQLiteConnection {
    if (!SQLiteConnection.instance) {
      SQLiteConnection.instance = new SQLiteConnection();
    }
    return SQLiteConnection.instance;
  }
  
  public getDb() {
    return this.db;
  }
  
  public getRawDb(): Database.Database {
    return this.database;
  }
  
  private getDatabasePath(): string {
    try {
      // Use Electron's app.getPath if available
      const userDataPath = app.getPath('userData');
      const dbDir = path.join(userDataPath, 'databases');
      return path.join(dbDir, 'prompts.db');
    } catch (error) {
      // Fallback for non-Electron environments (development/testing)
      const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
      const dbDir = path.join(homeDir, '.prompt-craft');
      return path.join(dbDir, 'prompts.db');
    }
  }
  
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  private initializeTables(): void {
    try {
      // Create tables if they don't exist
      this.database.exec(`
        CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT NOT NULL DEFAULT '[]',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          version TEXT NOT NULL DEFAULT '1.0.0',
          author TEXT,
          variables TEXT,
          is_favorite INTEGER NOT NULL DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS prompts_category_idx ON prompts(category);
        CREATE INDEX IF NOT EXISTS prompts_name_idx ON prompts(name);
        CREATE INDEX IF NOT EXISTS prompts_author_idx ON prompts(author);
        CREATE INDEX IF NOT EXISTS prompts_updated_at_idx ON prompts(updated_at);
        
        -- Enable full-text search
        CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
          id,
          name,
          description,
          content,
          category,
          tags,
          content='prompts',
          content_rowid='rowid'
        );
        
        -- Triggers to keep FTS index in sync
        CREATE TRIGGER IF NOT EXISTS prompts_fts_insert AFTER INSERT ON prompts BEGIN
          INSERT INTO prompts_fts(rowid, id, name, description, content, category, tags)
          VALUES (NEW.rowid, NEW.id, NEW.name, NEW.description, NEW.content, NEW.category, NEW.tags);
        END;
        
        CREATE TRIGGER IF NOT EXISTS prompts_fts_update AFTER UPDATE ON prompts BEGIN
          UPDATE prompts_fts SET 
            name = NEW.name,
            description = NEW.description,
            content = NEW.content,
            category = NEW.category,
            tags = NEW.tags
          WHERE rowid = NEW.rowid;
        END;
        
        CREATE TRIGGER IF NOT EXISTS prompts_fts_delete AFTER DELETE ON prompts BEGIN
          DELETE FROM prompts_fts WHERE rowid = OLD.rowid;
        END;
      `);

      const columns = this.database.prepare("PRAGMA table_info('prompts')").all() as Array<{ name: string }>;
      const hasFavoriteColumn = columns.some(column => column.name === 'is_favorite');
      if (!hasFavoriteColumn) {
        this.database.exec("ALTER TABLE prompts ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;");
      }
    } catch (error) {
      console.error('Error initializing SQLite tables:', error);
      throw error;
    }
  }
  
  public async testConnection(): Promise<boolean> {
    try {
      const result = this.database.prepare('SELECT 1 as test').get() as { test: number } | undefined;
      return result !== undefined && result.test === 1;
    } catch (error) {
      console.error('SQLite connection test failed:', error);
      return false;
    }
  }
  
  public close(): void {
    try {
      this.database.close();
    } catch (error) {
      console.error('Error closing SQLite database:', error);
    }
  }
  
  public async vacuum(): Promise<void> {
    try {
      this.database.exec('VACUUM');
    } catch (error) {
      console.error('Error running VACUUM on SQLite database:', error);
      throw error;
    }
  }
  
  public getStats(): { size: number; pageCount: number; pageSize: number } {
    try {
      const pageCount = this.database.prepare('PRAGMA page_count').get() as { page_count: number };
      const pageSize = this.database.prepare('PRAGMA page_size').get() as { page_size: number };
      
      return {
        pageCount: pageCount.page_count,
        pageSize: pageSize.page_size,
        size: pageCount.page_count * pageSize.page_size
      };
    } catch (error) {
      console.error('Error getting SQLite database stats:', error);
      return { size: 0, pageCount: 0, pageSize: 0 };
    }
  }
}

// Export singleton instance functions
export const getSQLiteDatabase = () => SQLiteConnection.getInstance().getDb();
export const getSQLiteConnection = () => SQLiteConnection.getInstance();
export const testSQLiteConnection = () => SQLiteConnection.getInstance().testConnection();
export const closeSQLiteConnection = () => SQLiteConnection.getInstance().close();
