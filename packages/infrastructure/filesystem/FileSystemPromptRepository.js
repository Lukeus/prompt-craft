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
    constructor(baseDirectory) {
        this.baseDirectory = baseDirectory;
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
        return Array.from(this.prompts.values())
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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
        // Text search
        if (criteria.query) {
            const query = criteria.query.toLowerCase();
            results = results.filter(prompt => prompt.name.toLowerCase().includes(query) ||
                prompt.description.toLowerCase().includes(query) ||
                prompt.content.toLowerCase().includes(query) ||
                prompt.tags.some(tag => tag.toLowerCase().includes(query)));
        }
        // Sort by updated date (newest first)
        results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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