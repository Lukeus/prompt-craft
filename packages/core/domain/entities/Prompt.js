"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = exports.PromptCategory = void 0;
var PromptCategory;
(function (PromptCategory) {
    PromptCategory["WORK"] = "work";
    PromptCategory["PERSONAL"] = "personal";
    PromptCategory["SHARED"] = "shared";
})(PromptCategory || (exports.PromptCategory = PromptCategory = {}));
class Prompt {
    constructor(id, name, description, content, category, tags, createdAt, updatedAt, version, author, variables) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.content = content;
        this.category = category;
        this.tags = tags;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.version = version;
        this.author = author;
        this.variables = variables;
    }
    withUpdatedContent(name, description, content, tags, author, variables) {
        return new Prompt(this.id, name ?? this.name, description ?? this.description, content ?? this.content, this.category, tags ?? this.tags, this.createdAt, new Date(), // Update the updatedAt timestamp
        this.version, author ?? this.author, variables ?? this.variables);
    }
    renderWithVariables(variableValues) {
        let rendered = this.content;
        if (this.variables) {
            this.variables.forEach(variable => {
                const value = variableValues[variable.name] ?? variable.defaultValue ?? '';
                const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
                rendered = rendered.replace(regex, String(value));
            });
        }
        return rendered;
    }
    validateVariables(variableValues) {
        const errors = [];
        if (this.variables) {
            this.variables.forEach(variable => {
                const value = variableValues[variable.name];
                if (variable.required && (value === undefined || value === null || value === '')) {
                    errors.push(`Variable '${variable.name}' is required but not provided`);
                }
                if (value !== undefined && value !== null && value !== '') {
                    // Type validation
                    switch (variable.type) {
                        case 'number':
                            if (isNaN(Number(value))) {
                                errors.push(`Variable '${variable.name}' must be a number`);
                            }
                            break;
                        case 'boolean':
                            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                                errors.push(`Variable '${variable.name}' must be a boolean`);
                            }
                            break;
                        case 'array':
                            if (!Array.isArray(value) && typeof value !== 'string') {
                                errors.push(`Variable '${variable.name}' must be an array or string`);
                            }
                            break;
                    }
                }
            });
        }
        return errors;
    }
    validateConsistency() {
        const errors = [];
        const warnings = [];
        // Extract all placeholders from content using regex (more restrictive pattern for valid variable names)
        const placeholderRegex = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;
        const placeholdersInContent = new Set();
        let match;
        while ((match = placeholderRegex.exec(this.content)) !== null) {
            placeholdersInContent.add(match[1]);
        }
        // Get declared variable names
        const declaredVariables = new Set(this.variables?.map(v => v.name) || []);
        // Check for placeholders without variable declarations
        placeholdersInContent.forEach(placeholder => {
            if (!declaredVariables.has(placeholder)) {
                errors.push(`Placeholder '{{${placeholder}}}' found in content but no variable '${placeholder}' is declared`);
            }
        });
        // Check for declared variables not used in content
        if (this.variables) {
            this.variables.forEach(variable => {
                if (!placeholdersInContent.has(variable.name)) {
                    warnings.push(`Variable '${variable.name}' is declared but not used in content`);
                }
            });
        }
        return { errors, warnings };
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            content: this.content,
            category: this.category,
            tags: this.tags,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            version: this.version,
            author: this.author,
            variables: this.variables
        };
    }
    static fromJSON(data) {
        return new Prompt(data.id, data.name, data.description, data.content, data.category, data.tags || [], new Date(data.createdAt), new Date(data.updatedAt), data.version || '1.0.0', data.author, data.variables);
    }
}
exports.Prompt = Prompt;
//# sourceMappingURL=Prompt.js.map