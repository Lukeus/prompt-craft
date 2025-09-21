import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { PromptCategory } from '@core/domain/entities/Prompt';

export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull().$type<PromptCategory>(),
  tags: text('tags').notNull().default('[]'), // JSON string for tags array
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  version: text('version').notNull().default('1.0.0'),
  author: text('author'),
  variables: text('variables'), // JSON string for variables array
}, (table) => ({
  // Indexes for better query performance
  categoryIdx: index('prompts_category_idx').on(table.category),
  nameIdx: index('prompts_name_idx').on(table.name),
  authorIdx: index('prompts_author_idx').on(table.author),
  updatedAtIdx: index('prompts_updated_at_idx').on(table.updatedAt),
}));

export type InsertPrompt = typeof prompts.$inferInsert;
export type SelectPrompt = typeof prompts.$inferSelect;

// Helper types for converting between JSON and objects
export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
}

export interface SQLitePromptRow extends Omit<SelectPrompt, 'tags' | 'variables'> {
  tags: string; // JSON string
  variables: string | null; // JSON string
}

export interface PromptData extends Omit<SelectPrompt, 'tags' | 'variables'> {
  tags: string[];
  variables: PromptVariable[] | null;
}