"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzlePromptRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const Prompt_1 = require("../../core/domain/entities/Prompt");
const connection_1 = require("./connection");
const schema_1 = require("./schema");
class DrizzlePromptRepository {
    constructor(usageStatsProvider) {
        this.usageStatsProvider = usageStatsProvider;
        this.db = (0, connection_1.getDatabase)();
    }
    mapDbRowToPrompt(row) {
        return new Prompt_1.Prompt(row.id, row.name, row.description, row.content, row.category, row.tags || [], new Date(row.createdAt), new Date(row.updatedAt), row.version, row.author || undefined, row.variables || undefined);
    }
    mapPromptToDbRow(prompt) {
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
    getUsageScore(promptId) {
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
    async findById(id) {
        try {
            const [row] = await this.db
                .select()
                .from(schema_1.prompts)
                .where((0, drizzle_orm_1.eq)(schema_1.prompts.id, id))
                .limit(1);
            return row ? this.mapDbRowToPrompt(row) : null;
        }
        catch (error) {
            console.error('Failed to find prompt by ID:', error);
            throw new Error(`Failed to find prompt with ID ${id}`);
        }
    }
    async findAll() {
        try {
            const rows = await this.db
                .select()
                .from(schema_1.prompts)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.prompts.updatedAt));
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
        }
        catch (error) {
            console.error('Failed to find all prompts:', error);
            throw new Error('Failed to retrieve prompts');
        }
    }
    async search(criteria) {
        try {
            let query = this.db.select().from(schema_1.prompts);
            const conditions = [];
            // Filter by category
            if (criteria.category) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.prompts.category, criteria.category));
            }
            // Filter by tags using array overlap
            if (criteria.tags && criteria.tags.length > 0) {
                conditions.push((0, drizzle_orm_1.sql) `${schema_1.prompts.tags} && ${criteria.tags}`);
            }
            // Filter by author
            if (criteria.author) {
                conditions.push((0, drizzle_orm_1.ilike)(schema_1.prompts.author, `%${criteria.author}%`));
            }
            // Text search using PostgreSQL's full-text search capabilities
            if (criteria.query) {
                const searchQuery = `%${criteria.query}%`;
                conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.prompts.name, searchQuery), (0, drizzle_orm_1.ilike)(schema_1.prompts.description, searchQuery), (0, drizzle_orm_1.ilike)(schema_1.prompts.content, searchQuery), (0, drizzle_orm_1.sql) `EXISTS (
              SELECT 1 FROM unnest(${schema_1.prompts.tags}) AS tag 
              WHERE tag ILIKE ${searchQuery}
            )`));
            }
            // Apply conditions
            if (conditions.length > 0) {
                query = query.where((0, drizzle_orm_1.and)(...conditions));
            }
            // Order by updated date (newest first) for now
            // In the future, we could implement PostgreSQL's ts_rank for better text search ranking
            query = query.orderBy((0, drizzle_orm_1.desc)(schema_1.prompts.updatedAt));
            // Apply limit
            if (criteria.limit && criteria.limit > 0) {
                query = query.limit(criteria.limit);
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
        }
        catch (error) {
            console.error('Failed to search prompts:', error);
            throw new Error('Failed to search prompts');
        }
    }
    async save(prompt) {
        try {
            const dbRow = this.mapPromptToDbRow(prompt);
            await this.db
                .insert(schema_1.prompts)
                .values(dbRow)
                .onConflictDoUpdate({
                target: schema_1.prompts.id,
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
        }
        catch (error) {
            console.error('Failed to save prompt:', error);
            throw new Error(`Failed to save prompt with ID ${prompt.id}`);
        }
    }
    async delete(id) {
        try {
            const result = await this.db
                .delete(schema_1.prompts)
                .where((0, drizzle_orm_1.eq)(schema_1.prompts.id, id));
            // Check if any rows were affected
            return result.rowCount !== undefined && result.rowCount > 0;
        }
        catch (error) {
            console.error('Failed to delete prompt:', error);
            throw new Error(`Failed to delete prompt with ID ${id}`);
        }
    }
    async exists(id) {
        try {
            const [result] = await this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.prompts)
                .where((0, drizzle_orm_1.eq)(schema_1.prompts.id, id));
            return result.count > 0;
        }
        catch (error) {
            console.error('Failed to check if prompt exists:', error);
            throw new Error(`Failed to check existence of prompt with ID ${id}`);
        }
    }
    async findByCategory(category) {
        try {
            const rows = await this.db
                .select()
                .from(schema_1.prompts)
                .where((0, drizzle_orm_1.eq)(schema_1.prompts.category, category))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.prompts.updatedAt));
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
        }
        catch (error) {
            console.error('Failed to find prompts by category:', error);
            throw new Error(`Failed to find prompts for category ${category}`);
        }
    }
    async findByTags(tags) {
        try {
            const rows = await this.db
                .select()
                .from(schema_1.prompts)
                .where((0, drizzle_orm_1.sql) `${schema_1.prompts.tags} && ${tags}`)
                .orderBy((0, drizzle_orm_1.desc)(schema_1.prompts.updatedAt));
            return rows.map(row => this.mapDbRowToPrompt(row));
        }
        catch (error) {
            console.error('Failed to find prompts by tags:', error);
            throw new Error(`Failed to find prompts for tags ${tags.join(', ')}`);
        }
    }
    async countByCategory() {
        try {
            const rows = await this.db
                .select({
                category: schema_1.prompts.category,
                count: (0, drizzle_orm_1.count)(),
            })
                .from(schema_1.prompts)
                .groupBy(schema_1.prompts.category);
            // Initialize counts with all categories
            const counts = {
                work: 0,
                personal: 0,
                shared: 0,
            };
            // Fill in actual counts
            for (const row of rows) {
                counts[row.category] = Number(row.count);
            }
            return counts;
        }
        catch (error) {
            console.error('Failed to count prompts by category:', error);
            throw new Error('Failed to get category counts');
        }
    }
}
exports.DrizzlePromptRepository = DrizzlePromptRepository;
//# sourceMappingURL=DrizzlePromptRepository.js.map