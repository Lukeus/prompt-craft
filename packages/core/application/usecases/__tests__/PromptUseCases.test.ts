import { PromptUseCases } from '../PromptUseCases';
import { MockPromptRepository } from './mocks/MockPromptRepository';
import { Prompt, PromptCategory } from '../../../domain/entities/Prompt';

describe('PromptUseCases', () => {
  let mockRepository: MockPromptRepository;
  let promptUseCases: PromptUseCases;
  let idCounter = 0;
  const generateTestId = () => `test-id-${++idCounter}`;

  beforeEach(() => {
    mockRepository = new MockPromptRepository();
    promptUseCases = new PromptUseCases(mockRepository, generateTestId);
    idCounter = 0;
  });

  describe('createPrompt', () => {
    it('creates a new prompt successfully', async () => {
      const dto = {
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        category: PromptCategory.WORK,
        tags: ['test'],
        author: 'Tester',
        variables: [{ name: 'name', description: 'Name', type: 'string' as const, required: true }]
      };

      const created = await promptUseCases.createPrompt(dto);

      expect(created.id).toBe('test-id-1');
      expect(created.name).toBe(dto.name);
      expect(created.description).toBe(dto.description);
      expect(created.content).toBe(dto.content);
      expect(created.category).toBe(dto.category);
      expect(created.tags).toEqual(dto.tags);
      expect(created.author).toBe(dto.author);
      expect(created.variables).toEqual(dto.variables);

      // Verify it was saved to repository
      const saved = await mockRepository.findById('test-id-1');
      expect(saved).toEqual(created);
    });

    it('sets default values for optional fields', async () => {
      const dto = {
        name: 'Minimal Prompt',
        description: 'Minimal description',
        content: 'Hello world',
        category: PromptCategory.PERSONAL
      };

      const created = await promptUseCases.createPrompt(dto);

      expect(created.tags).toEqual([]);
      expect(created.version).toBe('1.0.0');
      expect(created.author).toBeUndefined();
      expect(created.variables).toBeUndefined();
    });
  });

  describe('updatePrompt', () => {
    let existingPrompt: Prompt;

    beforeEach(async () => {
      existingPrompt = await promptUseCases.createPrompt({
        name: 'Original',
        description: 'Original description',
        content: 'Original content',
        category: PromptCategory.WORK,
        tags: ['original'],
        author: 'Original Author'
      });
    });

    it('updates existing prompt successfully', async () => {
      // Add a small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await promptUseCases.updatePrompt({
        id: existingPrompt.id,
        name: 'Updated Name',
        content: 'Updated content',
        tags: ['updated', 'modified']
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.content).toBe('Updated content');
      expect(updated.tags).toEqual(['updated', 'modified']);
      expect(updated.description).toBe('Original description'); // unchanged
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(existingPrompt.updatedAt.getTime());
    });

    it('throws error when prompt not found', async () => {
      await expect(promptUseCases.updatePrompt({
        id: 'non-existent',
        name: 'New Name'
      })).rejects.toThrow('Prompt with ID non-existent not found');
    });
  });

  describe('deletePrompt', () => {
    it('deletes existing prompt', async () => {
      const created = await promptUseCases.createPrompt({
        name: 'To Delete',
        description: 'Will be deleted',
        content: 'Goodbye',
        category: PromptCategory.SHARED
      });

      const deleted = await promptUseCases.deletePrompt(created.id);
      expect(deleted).toBe(true);

      const found = await promptUseCases.getPromptById(created.id);
      expect(found).toBeNull();
    });

    it('returns false for non-existent prompt', async () => {
      const deleted = await promptUseCases.deletePrompt('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('searchPrompts', () => {
    beforeEach(async () => {
      // Create test data
      await Promise.all([
        promptUseCases.createPrompt({
          name: 'Code Review',
          description: 'Review TypeScript code',
          content: 'Please review this {{language}} code',
          category: PromptCategory.WORK,
          tags: ['code', 'review'],
          author: 'Developer'
        }),
        promptUseCases.createPrompt({
          name: 'Creative Writing',
          description: 'Write a creative story',
          content: 'Write a story about {{topic}}',
          category: PromptCategory.PERSONAL,
          tags: ['creative', 'writing'],
          author: 'Writer'
        }),
        promptUseCases.createPrompt({
          name: 'Documentation',
          description: 'Create technical documentation',
          content: 'Document the {{feature}} feature',
          category: PromptCategory.WORK,
          tags: ['docs', 'technical'],
          author: 'Developer'
        })
      ]);
    });

    it('searches by query text', async () => {
      const results = await promptUseCases.searchPrompts({ query: 'code' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Code Review');
    });

    it('searches by category', async () => {
      const results = await promptUseCases.searchPrompts({ category: PromptCategory.WORK });
      expect(results).toHaveLength(2);
      expect(results.map(r => r.name)).toContain('Code Review');
      expect(results.map(r => r.name)).toContain('Documentation');
    });

    it('searches by tags', async () => {
      const results = await promptUseCases.searchPrompts({ tags: ['creative'] });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Creative Writing');
    });

    it('searches by author', async () => {
      const results = await promptUseCases.searchPrompts({ author: 'Writer' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Creative Writing');
    });

    it('applies limit', async () => {
      const results = await promptUseCases.searchPrompts({ limit: 2 });
      expect(results).toHaveLength(2);
    });
  });

  describe('renderPrompt', () => {
    let promptWithVariables: Prompt;

    beforeEach(async () => {
      promptWithVariables = await promptUseCases.createPrompt({
        name: 'Variable Test',
        description: 'Tests variables',
        content: 'Hello {{name}}, count: {{count}}',
        category: PromptCategory.WORK,
        variables: [
          { name: 'name', description: 'User name', type: 'string', required: true },
          { name: 'count', description: 'Count value', type: 'number', required: true }
        ]
      });
    });

    it('renders prompt with valid variables', async () => {
      const result = await promptUseCases.renderPrompt({
        id: promptWithVariables.id,
        variableValues: { name: 'Alice', count: 5 }
      });

      expect(result.rendered).toContain('Hello Alice, count: 5');
      expect(result.errors).toHaveLength(0);
    });

    it('validates required variables', async () => {
      const result = await promptUseCases.renderPrompt({
        id: promptWithVariables.id,
        variableValues: { name: 'Bob' } // missing count
      });

      expect(result.errors).toContain("Variable 'count' is required but not provided");
    });

    it('throws error for non-existent prompt', async () => {
      await expect(promptUseCases.renderPrompt({
        id: 'non-existent',
        variableValues: {}
      })).rejects.toThrow('Prompt with ID non-existent not found');
    });
  });

  describe('getCategoryStatistics', () => {
    beforeEach(async () => {
      await Promise.all([
        promptUseCases.createPrompt({
          name: 'Work 1',
          description: 'Work prompt 1',
          content: 'Content 1',
          category: PromptCategory.WORK
        }),
        promptUseCases.createPrompt({
          name: 'Work 2',
          description: 'Work prompt 2',
          content: 'Content 2',
          category: PromptCategory.WORK
        }),
        promptUseCases.createPrompt({
          name: 'Personal 1',
          description: 'Personal prompt 1',
          content: 'Content 3',
          category: PromptCategory.PERSONAL
        })
      ]);
    });

    it('returns correct category statistics', async () => {
      const stats = await promptUseCases.getCategoryStatistics();

      expect(stats.total).toBe(3);
      expect(stats.work).toBe(2);
      expect(stats.personal).toBe(1);
      expect(stats.shared).toBe(0);
    });
  });

  describe('validatePromptData', () => {
    it('validates required fields for create', async () => {
      const dto = {
        name: '',
        description: '',
        content: '',
        category: PromptCategory.WORK
      };

      const errors = await promptUseCases.validatePromptData(dto);

      expect(errors).toContain('Prompt name is required');
      expect(errors).toContain('Prompt description is required');
      expect(errors).toContain('Prompt content is required');
    });

    it('validates variable data', async () => {
      const dto = {
        name: 'Valid Name',
        description: 'Valid description',
        content: 'Valid content',
        category: PromptCategory.WORK,
        variables: [
          { name: '', description: '', type: 'invalid' as any, required: true },
          { name: 'valid', description: 'valid desc', type: 'string' as const, required: false }
        ]
      };

      const errors = await promptUseCases.validatePromptData(dto);

      expect(errors).toContain('Variable 1: name is required');
      expect(errors).toContain('Variable 1: description is required');
      expect(errors).toContain('Variable 1: invalid type');
    });

    it('returns empty array for valid data', async () => {
      const dto = {
        name: 'Valid Name',
        description: 'Valid description',
        content: 'Valid content',
        category: PromptCategory.WORK
      };

      const errors = await promptUseCases.validatePromptData(dto);
      expect(errors).toEqual([]);
    });
  });
});
