import { pgTable, text, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { PromptCategory } from '@core/domain/entities/Prompt';

export const prompts = pgTable('prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull().$type<PromptCategory>(),
  tags: text('tags').array().notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  version: text('version').notNull().default('1.0.0'),
  author: text('author'),
  variables: jsonb('variables').$type<Array<{
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    defaultValue?: any;
  }>>(),
  isFavorite: boolean('is_favorite').notNull().default(false),
}, (table) => ({
  // Indexes for better query performance
  categoryIdx: index('prompts_category_idx').on(table.category),
  nameIdx: index('prompts_name_idx').on(table.name),
  tagsIdx: index('prompts_tags_idx').using('gin', table.tags),
  authorIdx: index('prompts_author_idx').on(table.author),
  updatedAtIdx: index('prompts_updated_at_idx').on(table.updatedAt),
  // Full-text search index for content and description using tsvector
  contentSearchIdx: index('prompts_content_search_idx').using('gin', sql`to_tsvector('english', ${table.content} || ' ' || ${table.description} || ' ' || ${table.name})`),
}));

export type InsertPrompt = typeof prompts.$inferInsert;
export type SelectPrompt = typeof prompts.$inferSelect;
