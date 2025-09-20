"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptUseCases = void 0;
const Prompt_1 = require("../../domain/entities/Prompt");
class PromptUseCases {
    constructor(promptRepository, generateId = () => crypto.randomUUID()) {
        this.promptRepository = promptRepository;
        this.generateId = generateId;
    }
    async createPrompt(dto) {
        const now = new Date();
        const prompt = new Prompt_1.Prompt(this.generateId(), dto.name, dto.description, dto.content, dto.category, dto.tags || [], now, now, dto.version || '1.0.0', dto.author, dto.variables);
        await this.promptRepository.save(prompt);
        return prompt;
    }
    async updatePrompt(dto) {
        const existingPrompt = await this.promptRepository.findById(dto.id);
        if (!existingPrompt) {
            throw new Error(`Prompt with ID ${dto.id} not found`);
        }
        const updatedPrompt = existingPrompt.withUpdatedContent(dto.name, dto.description, dto.content, dto.tags, dto.author, dto.variables);
        await this.promptRepository.save(updatedPrompt);
        return updatedPrompt;
    }
    async deletePrompt(id) {
        const exists = await this.promptRepository.exists(id);
        if (!exists) {
            return false;
        }
        return await this.promptRepository.delete(id);
    }
    async getPromptById(id) {
        return await this.promptRepository.findById(id);
    }
    async getAllPrompts() {
        return await this.promptRepository.findAll();
    }
    async searchPrompts(criteria) {
        return await this.promptRepository.search(criteria);
    }
    async getPromptsByCategory(category) {
        return await this.promptRepository.findByCategory(category);
    }
    async getPromptsByTags(tags) {
        return await this.promptRepository.findByTags(tags);
    }
    async getCategoryStatistics() {
        const counts = await this.promptRepository.countByCategory();
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        return {
            total,
            ...counts
        };
    }
    async renderPrompt(dto) {
        const prompt = await this.promptRepository.findById(dto.id);
        if (!prompt) {
            throw new Error(`Prompt with ID ${dto.id} not found`);
        }
        const errors = prompt.validateVariables(dto.variableValues);
        const rendered = prompt.renderWithVariables(dto.variableValues);
        return {
            rendered,
            errors
        };
    }
    async validatePromptData(dto) {
        const errors = [];
        // Basic validation
        if ('name' in dto && (!dto.name || dto.name.trim().length === 0)) {
            errors.push('Prompt name is required');
        }
        if ('description' in dto && (!dto.description || dto.description.trim().length === 0)) {
            errors.push('Prompt description is required');
        }
        if ('content' in dto && (!dto.content || dto.content.trim().length === 0)) {
            errors.push('Prompt content is required');
        }
        // Validate variables
        if ('variables' in dto && dto.variables) {
            dto.variables.forEach((variable, index) => {
                if (!variable.name || variable.name.trim().length === 0) {
                    errors.push(`Variable ${index + 1}: name is required`);
                }
                if (!variable.description || variable.description.trim().length === 0) {
                    errors.push(`Variable ${index + 1}: description is required`);
                }
                if (!['string', 'number', 'boolean', 'array'].includes(variable.type)) {
                    errors.push(`Variable ${index + 1}: invalid type`);
                }
            });
        }
        return errors;
    }
}
exports.PromptUseCases = PromptUseCases;
