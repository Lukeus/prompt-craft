"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
exports.getContainer = getContainer;
exports.resetContainer = resetContainer;
const PromptUseCases_1 = require("../application/usecases/PromptUseCases");
class Container {
    constructor(config = {}) {
        this.config = config;
        this.promptRepository = null;
        this.promptUseCases = null;
    }
    getPromptRepository() {
        if (!this.promptRepository) {
            if (this.config.promptRepository) {
                this.promptRepository = this.config.promptRepository;
            }
            else {
                throw new Error('PromptRepository must be provided in Container config');
            }
        }
        return this.promptRepository;
    }
    getPromptUseCases() {
        if (!this.promptUseCases) {
            const generateId = this.config.generateId || (() => {
                // Simple ID generation fallback
                return Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);
            });
            this.promptUseCases = new PromptUseCases_1.PromptUseCases(this.getPromptRepository(), generateId);
        }
        return this.promptUseCases;
    }
    // Method to override repositories for testing
    setPromptRepository(repository) {
        this.promptRepository = repository;
        this.promptUseCases = null; // Reset use cases to pick up new repository
    }
}
exports.Container = Container;
// Global container instance
let globalContainer = null;
function getContainer(config) {
    if (!globalContainer || config) {
        globalContainer = new Container(config);
    }
    return globalContainer;
}
function resetContainer() {
    globalContainer = null;
}
