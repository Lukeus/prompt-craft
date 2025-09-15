import * as fs from 'fs/promises';
import * as path from 'path';
import { Prompt, PromptCategory } from '../../core/domain/entities/Prompt';
import { PromptRepository, PromptSearchCriteria } from '../../core/domain/repositories/PromptRepository';

interface UsageStats {
  favorites: string[];
  recents: Array<{ promptId: string; usedAt: string }>;
}

export class FileSystemPromptRepository implements PromptRepository {
  private prompts: Map<string, Prompt> = new Map();
  private initialized = false;
  private usageStats?: UsageStats;

  constructor(
    private readonly baseDirectory: string,
    private readonly usageStatsProvider?: () => UsageStats
  ) {}

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadAllPrompts();
      this.initialized = true;
    }
  }

  private async loadAllPrompts(): Promise<void> {
    this.prompts.clear();
    
    for (const category of Object.values(PromptCategory)) {
      await this.loadPromptsFromCategory(category);
    }
  }

  private async loadPromptsFromCategory(category: PromptCategory): Promise<void> {
    const categoryPath = path.join(this.baseDirectory, category);
    
    try {
      const files = await this.listJsonFiles(categoryPath);
      
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const promptData = JSON.parse(fileContent);
          const prompt = Prompt.fromJSON(promptData);
          this.prompts.set(prompt.id, prompt);
        } catch (error) {
          console.warn(`Failed to load prompt from ${filePath}:`, error);
        }
      }
    } catch (error) {
      // Category directory doesn't exist yet, that's ok
      console.info(`Category directory ${category} not found, skipping`);
    }
  }

  private async listJsonFiles(directory: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directory);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findById(id: string): Promise<Prompt | null> {
    await this.ensureInitialized();
    return this.prompts.get(id) || null;
  }

  async findAll(): Promise<Prompt[]> {
    await this.ensureInitialized();
    
    // Sort by usage patterns, then by updated date
    return Array.from(this.prompts.values())
      .sort((a, b) => {
        const usageScoreA = this.getUsageScore(a.id);
        const usageScoreB = this.getUsageScore(b.id);
        
        if (usageScoreB !== usageScoreA) {
          return usageScoreB - usageScoreA;
        }
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
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

  private calculateFuzzyScore(prompt: Prompt, query: string): number {
    if (!query) return 0;
    
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Exact matches get higher scores
    const nameExactMatch = prompt.name.toLowerCase() === queryLower;
    if (nameExactMatch) score += 100;
    
    const descExactMatch = prompt.description.toLowerCase() === queryLower;
    if (descExactMatch) score += 80;
    
    const tagExactMatch = prompt.tags.some(tag => tag.toLowerCase() === queryLower);
    if (tagExactMatch) score += 90;
    
    // Partial matches with position weighting
    const nameIndex = prompt.name.toLowerCase().indexOf(queryLower);
    if (nameIndex !== -1) {
      // Earlier matches score higher
      score += Math.max(50 - nameIndex * 2, 10);
    }
    
    const descIndex = prompt.description.toLowerCase().indexOf(queryLower);
    if (descIndex !== -1) {
      score += Math.max(30 - descIndex, 5);
    }
    
    // Tag partial matches
    prompt.tags.forEach(tag => {
      const tagIndex = tag.toLowerCase().indexOf(queryLower);
      if (tagIndex !== -1) {
        score += Math.max(40 - tagIndex, 8);
      }
    });
    
    // Content matches (lower weight)
    const contentIndex = prompt.content.toLowerCase().indexOf(queryLower);
    if (contentIndex !== -1) {
      score += Math.max(20 - Math.floor(contentIndex / 100), 2);
    }
    
    // Word boundary matches get bonus
    const wordBoundaryRegex = new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (wordBoundaryRegex.test(prompt.name)) score += 15;
    if (wordBoundaryRegex.test(prompt.description)) score += 10;
    
    // Length similarity bonus (prefer shorter matches)
    if (query.length >= 3) {
      const nameLengthRatio = queryLower.length / prompt.name.length;
      if (nameLengthRatio > 0.3) score += Math.floor(nameLengthRatio * 10);
    }
    
    return score;
  }

  async search(criteria: PromptSearchCriteria): Promise<Prompt[]> {
    await this.ensureInitialized();
    let results = Array.from(this.prompts.values());

    // Filter by category
    if (criteria.category) {
      results = results.filter(prompt => prompt.category === criteria.category);
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(prompt => 
        criteria.tags!.some(tag => prompt.tags.includes(tag))
      );
    }

    // Filter by author
    if (criteria.author) {
      results = results.filter(prompt => 
        prompt.author?.toLowerCase().includes(criteria.author!.toLowerCase())
      );
    }

    // Text search with fuzzy scoring
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      
      // Filter and score results
      const scoredResults = results
        .map(prompt => ({
          prompt,
          fuzzyScore: this.calculateFuzzyScore(prompt, criteria.query!),
          usageScore: this.getUsageScore(prompt.id),
          hasMatch: (
            prompt.name.toLowerCase().includes(query) ||
            prompt.description.toLowerCase().includes(query) ||
            prompt.content.toLowerCase().includes(query) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(query))
          )
        }))
        .filter(item => item.hasMatch)
        .sort((a, b) => {
          // Combined score: fuzzy relevance + usage patterns
          const totalScoreA = a.fuzzyScore + a.usageScore;
          const totalScoreB = b.fuzzyScore + b.usageScore;
          
          if (totalScoreB !== totalScoreA) {
            return totalScoreB - totalScoreA;
          }
          // Tie-breaker: updated date (newest first)
          return b.prompt.updatedAt.getTime() - a.prompt.updatedAt.getTime();
        });
      
      results = scoredResults.map(item => item.prompt);
    } else {
      // No query, just sort by updated date (newest first)
      results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    // Apply limit
    if (criteria.limit && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  async save(prompt: Prompt): Promise<void> {
    await this.ensureInitialized();
    
    // Update in-memory storage
    this.prompts.set(prompt.id, prompt);

    // Save to file
    const categoryPath = path.join(this.baseDirectory, prompt.category);
    await this.ensureDirectory(categoryPath);
    
    const fileName = `${this.slugify(prompt.name)}.json`;
    const filePath = path.join(categoryPath, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(prompt.toJSON(), null, 2), 'utf-8');
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const prompt = this.prompts.get(id);
    if (!prompt) {
      return false;
    }

    // Remove from memory
    this.prompts.delete(id);

    // Remove file
    try {
      const categoryPath = path.join(this.baseDirectory, prompt.category);
      const fileName = `${this.slugify(prompt.name)}.json`;
      const filePath = path.join(categoryPath, fileName);
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete prompt file:', error);
      }
    } catch (error) {
      console.warn('Failed to delete prompt file:', error);
    }

    return true;
  }

  async exists(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.prompts.has(id);
  }

  async findByCategory(category: PromptCategory): Promise<Prompt[]> {
    await this.ensureInitialized();
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.category === category)
      .sort((a, b) => {
        const usageScoreA = this.getUsageScore(a.id);
        const usageScoreB = this.getUsageScore(b.id);
        
        if (usageScoreB !== usageScoreA) {
          return usageScoreB - usageScoreA;
        }
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }

  async findByTags(tags: string[]): Promise<Prompt[]> {
    await this.ensureInitialized();
    return Array.from(this.prompts.values())
      .filter(prompt => tags.some(tag => prompt.tags.includes(tag)))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async countByCategory(): Promise<Record<string, number>> {
    await this.ensureInitialized();
    const counts: Record<string, number> = {
      work: 0,
      personal: 0,
      shared: 0
    };

    for (const prompt of this.prompts.values()) {
      counts[prompt.category] = (counts[prompt.category] || 0) + 1;
    }

    return counts;
  }
}
