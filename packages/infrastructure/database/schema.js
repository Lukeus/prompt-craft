"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompts = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.prompts = (0, pg_core_1.pgTable)('prompts', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    category: (0, pg_core_1.text)('category').notNull().$type(),
    tags: (0, pg_core_1.text)('tags').array().notNull().default('{}'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull(),
    version: (0, pg_core_1.text)('version').notNull().default('1.0.0'),
    author: (0, pg_core_1.text)('author'),
    variables: (0, pg_core_1.jsonb)('variables').$type(),
}, (table) => ({
    // Indexes for better query performance
    categoryIdx: (0, pg_core_1.index)('prompts_category_idx').on(table.category),
    nameIdx: (0, pg_core_1.index)('prompts_name_idx').on(table.name),
    tagsIdx: (0, pg_core_1.index)('prompts_tags_idx').using('gin', table.tags),
    authorIdx: (0, pg_core_1.index)('prompts_author_idx').on(table.author),
    updatedAtIdx: (0, pg_core_1.index)('prompts_updated_at_idx').on(table.updatedAt),
    // Full-text search index for content and description
    contentSearchIdx: (0, pg_core_1.index)('prompts_content_search_idx').using('gin', table.content, table.description, table.name),
}));
//# sourceMappingURL=schema.js.map