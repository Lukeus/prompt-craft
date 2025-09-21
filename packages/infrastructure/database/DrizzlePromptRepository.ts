import { eq, and, desc, ilike, or, inArray, sql, count, SQL } from 'drizzle-orm';
import { Prompt, PromptCategory } from '@core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '@core/domain/repositories/PromptRepository';
import { getDatabase } from './connection';
import { prompts, SelectPrompt, InsertPrompt } from './schema';

interface UsageStats {
  favorites: string[];
  recents: Array<{ promptId: string; usedAt: string }>;
}

export class DrizzlePromptRepository implements PromptRepository {
  private db = getDatabase();
  private usageStats?: UsageStats;

  constructor(private readonly usageStatsProvider?: () => UsageStats) {}

  private mapDbRowToPrompt(row: SelectPrompt): Prompt {
    return new Prompt(
      row.id,
      row.name,
      row.description,
      row.content,
      row.category,
      row.tags || [],
      new Date(row.createdAt),
      new Date(row.updatedAt),
      row.version,
      row.author || undefined,
      row.variables as any || undefined
    );
  }

  private mapPromptToDbRow(prompt: Prompt): InsertPrompt {
    return {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
      version: prompt.version,
      author: prompt.author || null,
      variables: prompt.variables || null,
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

      return row ? this.mapDbRowToPrompt(row) : null;
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

      const promptList = rows.map(row => this.mapDbRowToPrompt(row));

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

      // Filter by tags using array overlap
      if (criteria.tags && criteria.tags.length > 0) {
        conditions.push(sql`${prompts.tags} && ${criteria.tags}`);
      }

      // Filter by author
      if (criteria.author) {
        conditions.push(ilike(prompts.author, `%${criteria.author}%`));
      }

      // Text search using PostgreSQL's full-text search capabilities
      if (criteria.query) {
        const searchQuery = `%${criteria.query}%`;
        conditions.push(
          or(
            ilike(prompts.name, searchQuery),
            ilike(prompts.description, searchQuery),
            ilike(prompts.content, searchQuery),
            sql`EXISTS (
              SELECT 1 FROM unnest(${prompts.tags}) AS tag 
              WHERE tag ILIKE ${searchQuery}
            )`
          )
        );
      }

      // Build the query with proper typing
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
      const results = rows.map(row => this.mapDbRowToPrompt(row));

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

      // Check if any rows were affected
      return (result.rowCount ?? 0) > 0;
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

      const results = rows.map(row => this.mapDbRowToPrompt(row));

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
      const rows = await this.db
        .select()
        .from(prompts)
        .where(sql`${prompts.tags} && ${tags}`)
        .orderBy(desc(prompts.updatedAt));

      return rows.map(row => this.mapDbRowToPrompt(row));
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