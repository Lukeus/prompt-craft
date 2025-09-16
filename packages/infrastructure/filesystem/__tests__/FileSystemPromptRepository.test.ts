import { FileSystemPromptRepository } from '../FileSystemPromptRepository';
import { Prompt, PromptCategory } from '../../../core/domain/entities/Prompt';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FileSystemPromptRepository', () => {
  let repository: FileSystemPromptRepository;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-test-'));
    repository = new FileSystemPromptRepository(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }
  });

  const createTestPrompt = (overrides: Partial<{
    id: string;
    name: string;
    description: string;
    content: string;
    category: PromptCategory;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author: string;
    variables: any[];
  }> = {}) => {
    const defaults = {
      id: 'test-id',
      name: 'Test Prompt',
      description: 'A test prompt',
      content: 'Hello {{name}}',
      category: PromptCategory.WORK,
      tags: ['test'],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
      version: '1.0.0',
      author: 'Tester',
      variables: [{ name: 'name', description: 'User name', type: 'string', required: true }]
    };
    
    const merged = { ...defaults, ...overrides };
    return new Prompt(
      merged.id,
      merged.name,
      merged.description,
      merged.content,
      merged.category,
      merged.tags,
      merged.createdAt,
      merged.updatedAt,
      merged.version,
      merged.author,
      merged.variables
    );
  };

  describe('save and findById', () => {
    it('saves and retrieves a prompt correctly', async () => {
      const prompt = createTestPrompt();

      await repository.save(prompt);
      const retrieved = await repository.findById('test-id');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(prompt.id);
      expect(retrieved!.name).toBe(prompt.name);
      expect(retrieved!.content).toBe(prompt.content);
      expect(retrieved!.category).toBe(prompt.category);
      expect(retrieved!.tags).toEqual(prompt.tags);
    });

    it('creates category directory if it does not exist', async () => {
      const prompt = createTestPrompt();
      
      await repository.save(prompt);

      const categoryDir = path.join(testDir, prompt.category);
      const exists = await fs.access(categoryDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('saves prompt as JSON file with slugified name', async () => {
      const prompt = createTestPrompt({
        name: 'Complex Prompt Name!!!'
      });

      await repository.save(prompt);

      const expectedPath = path.join(testDir, prompt.category, 'complex-prompt-name.json');
      const exists = await fs.access(expectedPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const fileContent = await fs.readFile(expectedPath, 'utf-8');
      const savedData = JSON.parse(fileContent);
      expect(savedData.name).toBe('Complex Prompt Name!!!');
    });
  });

  describe('findAll', () => {
    it('returns empty array when no prompts exist', async () => {
      const prompts = await repository.findAll();
      expect(prompts).toEqual([]);
    });

    it('returns all prompts sorted by updatedAt', async () => {
      const prompt1 = createTestPrompt({
        id: 'id-1',
        name: 'First',
        updatedAt: new Date('2023-01-01T00:00:00Z')
      });
      const prompt2 = createTestPrompt({
        id: 'id-2',
        name: 'Second',
        updatedAt: new Date('2023-01-02T00:00:00Z')
      });

      await repository.save(prompt1);
      await repository.save(prompt2);

      const prompts = await repository.findAll();
      expect(prompts).toHaveLength(2);
      expect(prompts[0].name).toBe('Second'); // More recent first
      expect(prompts[1].name).toBe('First');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const prompts = [
        createTestPrompt({
          id: 'work-1',
          name: 'Code Review',
          description: 'Review TypeScript code',
          content: 'Please review this code',
          category: PromptCategory.WORK,
          tags: ['code', 'review'],
          author: 'Developer'
        }),
        createTestPrompt({
          id: 'personal-1',
          name: 'Creative Writing',
          description: 'Write stories',
          content: 'Write a creative story',
          category: PromptCategory.PERSONAL,
          tags: ['creative', 'writing'],
          author: 'Writer'
        }),
        createTestPrompt({
          id: 'work-2',
          name: 'Documentation',
          description: 'Create docs',
          content: 'Document the feature',
          category: PromptCategory.WORK,
          tags: ['docs'],
          author: 'Developer'
        })
      ];

      for (const prompt of prompts) {
        await repository.save(prompt);
      }
    });

    it('searches by query text', async () => {
      const results = await repository.search({ query: 'code' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Code Review');
    });

    it('searches by category', async () => {
      const results = await repository.search({ category: PromptCategory.WORK });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.name)).toContain('Code Review');
      expect(results.map(r => r.name)).toContain('Documentation');
    });

    it('searches by tags', async () => {
      const results = await repository.search({ tags: ['creative'] });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Creative Writing');
    });

    it('searches by author', async () => {
      const results = await repository.search({ author: 'Writer' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Creative Writing');
    });

    it('applies limit', async () => {
      const results = await repository.search({ limit: 2 });
      expect(results).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('deletes existing prompt', async () => {
      const prompt = createTestPrompt();
      await repository.save(prompt);

      const deleted = await repository.delete(prompt.id);
      expect(deleted).toBe(true);

      const retrieved = await repository.findById(prompt.id);
      expect(retrieved).toBeNull();
    });

    it('returns false for non-existent prompt', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('removes file from filesystem', async () => {
      const prompt = createTestPrompt();
      await repository.save(prompt);

      const filePath = path.join(testDir, prompt.category, 'test-prompt.json');
      let exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      await repository.delete(prompt.id);

      exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });
  });

  describe('countByCategory', () => {
    it('returns correct counts by category', async () => {
      const prompts = [
        createTestPrompt({ id: 'w1', category: PromptCategory.WORK }),
        createTestPrompt({ id: 'w2', category: PromptCategory.WORK }),
        createTestPrompt({ id: 'p1', category: PromptCategory.PERSONAL })
      ];

      for (const prompt of prompts) {
        await repository.save(prompt);
      }

      const counts = await repository.countByCategory();
      expect(counts.work).toBe(2);
      expect(counts.personal).toBe(1);
      expect(counts.shared).toBe(0);
    });
  });

  describe('error handling', () => {
    it('handles missing category directories gracefully', async () => {
      // This tests the initialization when category directories don't exist
      const prompts = await repository.findAll();
      expect(prompts).toEqual([]);
    });

    it('handles corrupted JSON files gracefully', async () => {
      // Create a corrupted JSON file
      const categoryDir = path.join(testDir, PromptCategory.WORK);
      await fs.mkdir(categoryDir, { recursive: true });
      await fs.writeFile(path.join(categoryDir, 'corrupted.json'), 'invalid json{', 'utf-8');

      // Should not throw, should just skip the corrupted file
      const prompts = await repository.findAll();
      expect(prompts).toEqual([]);
    });
  });
});
