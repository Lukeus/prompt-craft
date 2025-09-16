"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemPromptRepository = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const Prompt_1 = require("../../core/domain/entities/Prompt");
class FileSystemPromptRepository {
    constructor(baseDirectory, usageStatsProvider) {
        this.baseDirectory = baseDirectory;
        this.usageStatsProvider = usageStatsProvider;
        this.prompts = new Map();
        this.initialized = false;
    }
    async ensureInitialized() {
        if (!this.initialized) {
            await this.loadAllPrompts();
            this.initialized = true;
        }
    }
    async loadAllPrompts() {
        this.prompts.clear();
        for (const category of Object.values(Prompt_1.PromptCategory)) {
            await this.loadPromptsFromCategory(category);
        }
    }
    async loadPromptsFromCategory(category) {
        const categoryPath = path.join(this.baseDirectory, category);
        try {
            const files = await this.listJsonFiles(categoryPath);
            for (const file of files) {
                const filePath = path.join(categoryPath, file);
                try {
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    const promptData = JSON.parse(fileContent);
                    const prompt = Prompt_1.Prompt.fromJSON(promptData);
                    this.prompts.set(prompt.id, prompt);
                }
                catch (error) {
                    console.warn(`Failed to load prompt from ${filePath}:`, error);
                }
            }
        }
        catch (error) {
            // Category directory doesn't exist yet, that's ok
            console.info(`Category directory ${category} not found, skipping`);
        }
    }
    async listJsonFiles(directory) {
        try {
            const files = await fs.readdir(directory);
            return files.filter(file => file.endsWith('.json'));
        }
        catch (error) {
            return [];
        }
    }
    async ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        }
        catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async findById(id) {
        await this.ensureInitialized();
        return this.prompts.get(id) || null;
    }
    async findAll() {
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
    calculateFuzzyScore(prompt, query) {
        if (!query)
            return 0;
        const queryLower = query.toLowerCase();
        let score = 0;
        // Exact matches get higher scores
        const nameExactMatch = prompt.name.toLowerCase() === queryLower;
        if (nameExactMatch)
            score += 100;
        const descExactMatch = prompt.description.toLowerCase() === queryLower;
        if (descExactMatch)
            score += 80;
        const tagExactMatch = prompt.tags.some(tag => tag.toLowerCase() === queryLower);
        if (tagExactMatch)
            score += 90;
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
        if (wordBoundaryRegex.test(prompt.name))
            score += 15;
        if (wordBoundaryRegex.test(prompt.description))
            score += 10;
        // Length similarity bonus (prefer shorter matches)
        if (query.length >= 3) {
            const nameLengthRatio = queryLower.length / prompt.name.length;
            if (nameLengthRatio > 0.3)
                score += Math.floor(nameLengthRatio * 10);
        }
        return score;
    }
    async search(criteria) {
        await this.ensureInitialized();
        let results = Array.from(this.prompts.values());
        // Filter by category
        if (criteria.category) {
            results = results.filter(prompt => prompt.category === criteria.category);
        }
        // Filter by tags
        if (criteria.tags && criteria.tags.length > 0) {
            results = results.filter(prompt => criteria.tags.some(tag => prompt.tags.includes(tag)));
        }
        // Filter by author
        if (criteria.author) {
            results = results.filter(prompt => prompt.author?.toLowerCase().includes(criteria.author.toLowerCase()));
        }
        // Text search with fuzzy scoring
        if (criteria.query) {
            const query = criteria.query.toLowerCase();
            // Filter and score results
            const scoredResults = results
                .map(prompt => ({
                prompt,
                fuzzyScore: this.calculateFuzzyScore(prompt, criteria.query),
                usageScore: this.getUsageScore(prompt.id),
                hasMatch: (prompt.name.toLowerCase().includes(query) ||
                    prompt.description.toLowerCase().includes(query) ||
                    prompt.content.toLowerCase().includes(query) ||
                    prompt.tags.some(tag => tag.toLowerCase().includes(query)))
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
        }
        else {
            // No query, just sort by updated date (newest first)
            results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        }
        // Apply limit
        if (criteria.limit && criteria.limit > 0) {
            results = results.slice(0, criteria.limit);
        }
        return results;
    }
    async save(prompt) {
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
    async delete(id) {
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
            }
            catch (error) {
                console.warn('Failed to delete prompt file:', error);
            }
        }
        catch (error) {
            console.warn('Failed to delete prompt file:', error);
        }
        return true;
    }
    async exists(id) {
        await this.ensureInitialized();
        return this.prompts.has(id);
    }
    async findByCategory(category) {
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
    async findByTags(tags) {
        await this.ensureInitialized();
        return Array.from(this.prompts.values())
            .filter(prompt => tags.some(tag => prompt.tags.includes(tag)))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    async countByCategory() {
        await this.ensureInitialized();
        const counts = {
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
exports.FileSystemPromptRepository = FileSystemPromptRepository;
//# sourceMappingURL=FileSystemPromptRepository.js.map