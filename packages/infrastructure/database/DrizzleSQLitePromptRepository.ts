import { eq, and, desc, like, or, sql, count, SQL } from 'drizzle-orm';
import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../core/domain/repositories/PromptRepository';
import { getSQLiteDatabase } from './sqliteConnection';
import { prompts, SelectPrompt, InsertPrompt, PromptVariable, SQLitePromptRow, PromptData } from './sqliteSchema';

interface UsageStats {
  favorites: string[];
  recents: Array<{ promptId: string; usedAt: string }>;
}

export class DrizzleSQLitePromptRepository implements PromptRepository {
  private db = getSQLiteDatabase();
  private usageStats?: UsageStats;

  constructor(private readonly usageStatsProvider?: () => UsageStats) {}

  private mapDbRowToPrompt(row: SQLitePromptRow): Prompt {
    let tags: string[] = [];
    let variables: PromptVariable[] | undefined;

    try {
      tags = row.tags ? JSON.parse(row.tags) : [];
    } catch (error) {
      console.error('Error parsing tags JSON:', error);
      tags = [];
    }

    try {
      variables = row.variables ? JSON.parse(row.variables) : undefined;
    } catch (error) {
      console.error('Error parsing variables JSON:', error);
      variables = undefined;
    }

    return new Prompt(
      row.id,
      row.name,
      row.description,
      row.content,
      row.category,
      tags,
      new Date(row.createdAt),
      new Date(row.updatedAt),
      row.version,
      row.author || undefined,
      variables as any
    );
  }

  private mapPromptToDbRow(prompt: Prompt): InsertPrompt & { tags: string; variables: string | null } {
    return {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      tags: JSON.stringify(prompt.tags || []),
      createdAt: new Date(prompt.createdAt),
      updatedAt: new Date(prompt.updatedAt),
      version: prompt.version,
      author: prompt.author || null,
      variables: prompt.variables ? JSON.stringify(prompt.variables) : null,
    };
  }

  private getUsageScore(promptId: string): number {
    if (!this.usageStats) {
      this.usageStats = this.usageStatsProvider?.() || { favorites: [], recents: [] };
    }
    
    let score = 0;
    
    // Favorite bonus
    if (this.usageStats.favorites.includes(promptId)) {
      score += 50;
    }
    
    // Recent usage bonus (decays over time)
    const recentEntry = this.usageStats.recents.find(r => r.promptId === promptId);
    if (recentEntry) {
      const usedAt = new Date(recentEntry.usedAt);
      const daysSinceUse = (Date.now() - usedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // Recent usage score decays from 30 to 0 over 30 days
      if (daysSinceUse < 30) {
        score += Math.max(30 - daysSinceUse, 0);
      }
      
      // Frequency bonus based on position in recents list (more recent = higher)
      const position = this.usageStats.recents.findIndex(r => r.promptId === promptId);
      score += Math.max(10 - position, 0);
    }
    
    return score;
  }

  async findById(id: string): Promise<Prompt | null> {
    try {
      const [row] = await this.db
        .select()
        .from(prompts)
        .where(eq(prompts.id, id))
        .limit(1);

      return row ? this.mapDbRowToPrompt(row as SQLitePromptRow) : null;
    } catch (error) {
      console.error('Failed to find prompt by ID:', error);
      throw new Error(`Failed to find prompt with ID ${id}`);
    }
  }

  async findAll(): Promise<Prompt[]> {
    try {
      const rows = await this.db
        .select()
        .from(prompts)
        .orderBy(desc(prompts.updatedAt));

      const promptList = rows.map(row => this.mapDbRowToPrompt(row as SQLitePromptRow));

      // Apply usage-based sorting if usage stats are available
      if (this.usageStatsProvider) {
        promptList.sort((a, b) => {
          const usageScoreA = this.getUsageScore(a.id);
          const usageScoreB = this.getUsageScore(b.id);
          
          if (usageScoreB !== usageScoreA) {
            return usageScoreB - usageScoreA;
          }
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      }

      return promptList;
    } catch (error) {
      console.error('Failed to find all prompts:', error);
      throw new Error('Failed to retrieve prompts');
    }
  }

  async search(criteria: PromptSearchCriteria): Promise<Prompt[]> {
    try {
      const conditions: (SQL<unknown> | undefined)[] = [];

      // Filter by category
      if (criteria.category) {
        conditions.push(eq(prompts.category, criteria.category));
      }

      // Filter by tags - SQLite doesn't have array operators, so we use LIKE with JSON
      if (criteria.tags && criteria.tags.length > 0) {
        const tagConditions = criteria.tags.map(tag => 
          like(prompts.tags, `%"${tag}"%`)
        );
        conditions.push(or(...tagConditions));
      }

      // Filter by author
      if (criteria.author) {
        conditions.push(like(prompts.author, `%${criteria.author}%`));
      }

      // Text search - check if FTS is available, otherwise use LIKE
      if (criteria.query) {
        const searchQuery = `%${criteria.query}%`;
        
        // Try FTS first, fall back to LIKE searches
        try {
          conditions.push(
            sql`prompts.id IN (
              SELECT id FROM prompts_fts 
              WHERE prompts_fts MATCH ${criteria.query}
            )`
          );
        } catch (ftsError) {
          // Fallback to LIKE searches
          conditions.push(
            or(
              like(prompts.name, searchQuery),
              like(prompts.description, searchQuery),
              like(prompts.content, searchQuery),
              like(prompts.tags, searchQuery)
            )
          );
        }
      }

      // Build the query
      let query = this.db.select().from(prompts);
      
      // Apply conditions
      if (conditions.length > 0) {
        const validConditions = conditions.filter((c): c is SQL<unknown> => c !== undefined);
        if (validConditions.length > 0) {
          query = query.where(and(...validConditions)) as typeof query;
        }
      }

      // Order by updated date (newest first)
      query = query.orderBy(desc(prompts.updatedAt)) as typeof query;

      // Apply limit
      if (criteria.limit && criteria.limit > 0) {
        query = query.limit(criteria.limit) as typeof query;
      }

      const rows = await query;
      const results = rows.map(row => this.mapDbRowToPrompt(row as SQLitePromptRow));

      // Apply usage-based sorting if needed
      if (this.usageStatsProvider && !criteria.query) {
        results.sort((a, b) => {
          const usageScoreA = this.getUsageScore(a.id);
          const usageScoreB = this.getUsageScore(b.id);
          
          if (usageScoreB !== usageScoreA) {
            return usageScoreB - usageScoreA;
          }
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to search prompts:', error);
      throw new Error('Failed to search prompts');
    }
  }

  async save(prompt: Prompt): Promise<void> {
    try {
      const dbRow = this.mapPromptToDbRow(prompt);

      // SQLite doesn't have upsert with DO UPDATE, so we'll use INSERT OR REPLACE
      await this.db
        .insert(prompts)
        .values(dbRow)
        .onConflictDoUpdate({
          target: prompts.id,
          set: {
            name: dbRow.name,
            description: dbRow.description,
            content: dbRow.content,
            category: dbRow.category,
            tags: dbRow.tags,
            updatedAt: dbRow.updatedAt,
            version: dbRow.version,
            author: dbRow.author,
            variables: dbRow.variables,
          },
        });
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw new Error(`Failed to save prompt with ID ${prompt.id}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(prompts)
        .where(eq(prompts.id, id));

      // Better-sqlite3 returns { changes: number }
      return (result as any).changes > 0;
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      throw new Error(`Failed to delete prompt with ID ${id}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const [result] = await this.db
        .select({ count: count() })
        .from(prompts)
        .where(eq(prompts.id, id));

      return result.count > 0;
    } catch (error) {
      console.error('Failed to check if prompt exists:', error);
      throw new Error(`Failed to check existence of prompt with ID ${id}`);
    }
  }

  async findByCategory(category: PromptCategory): Promise<Prompt[]> {
    try {
      const rows = await this.db
        .select()
        .from(prompts)
        .where(eq(prompts.category, category))
        .orderBy(desc(prompts.updatedAt));

      const results = rows.map(row => this.mapDbRowToPrompt(row as SQLitePromptRow));

      // Apply usage-based sorting if available
      if (this.usageStatsProvider) {
        results.sort((a, b) => {
          const usageScoreA = this.getUsageScore(a.id);
          const usageScoreB = this.getUsageScore(b.id);
          
          if (usageScoreB !== usageScoreA) {
            return usageScoreB - usageScoreA;
          }
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to find prompts by category:', error);
      throw new Error(`Failed to find prompts for category ${category}`);
    }
  }

  async findByTags(tags: string[]): Promise<Prompt[]> {
    try {
      const tagConditions = tags.map(tag => like(prompts.tags, `%"${tag}"%`));
      
      const rows = await this.db
        .select()
        .from(prompts)
        .where(or(...tagConditions))
        .orderBy(desc(prompts.updatedAt));

      return rows.map(row => this.mapDbRowToPrompt(row as SQLitePromptRow));
    } catch (error) {
      console.error('Failed to find prompts by tags:', error);
      throw new Error(`Failed to find prompts for tags ${tags.join(', ')}`);
    }
  }

  async countByCategory(): Promise<Record<string, number>> {
    try {
      const rows = await this.db
        .select({
          category: prompts.category,
          count: count(),
        })
        .from(prompts)
        .groupBy(prompts.category);

      // Initialize counts with all categories
      const counts: Record<string, number> = {
        work: 0,
        personal: 0,
        shared: 0,
      };

      // Fill in actual counts
      for (const row of rows) {
        counts[row.category] = Number(row.count);
      }

      return counts;
    } catch (error) {
      console.error('Failed to count prompts by category:', error);
      throw new Error('Failed to get category counts');
    }
  }
}